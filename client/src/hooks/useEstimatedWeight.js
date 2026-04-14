import { useState, useEffect } from "react";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { calcStepsCalories, calcTDEE, formatDateStr, daysSince } from "../utils/calculations";

export function useEstimatedWeight(profile, bmr, activeObjective) {
  const [estWeight, setEstWeight] = useState(null);
  const [dayData, setDayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !activeObjective || !profile || !bmr) {
      setEstWeight(null);
      setDayData([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const daysElapsed = daysSince(activeObjective.startDate);
    const numDays = Math.max(1, Math.min(daysElapsed + 1, 14));

    const dates = Array.from({ length: numDays }, (_, i) => {
      const d = new Date(activeObjective.startDate);
      d.setDate(d.getDate() + i);
      return formatDateStr(d);
    });

    const activitiesPromise = getDocs(query(
      collection(db, "users", uid, "activities"),
      where("date", ">=", dates[0]),
      where("date", "<=", dates[dates.length - 1])
    )).then((snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const a = d.data();
        map[a.date] = (map[a.date] || 0) + (a.caloriesBurned || 0);
      });
      return map;
    }).catch(() => ({}));

    Promise.all([
      activitiesPromise,
      ...dates.map((date) =>
        getDocs(query(collection(db, "users", uid, "meals"), where("date", "==", date)))
          .then((snap) => ({ date, eaten: snap.docs.reduce((s, d) => s + (d.data().kcal || 0), 0) }))
      ),
      ...dates.map((date) =>
        getDoc(doc(db, "users", uid, "dailyLogs", date))
          .then((snap) => ({ date, steps: snap.exists() ? (snap.data().steps || 0) : 0 }))
      ),
    ]).then(([activityMap, ...rest]) => {
      const mealMap = {};
      const stepsMap = {};
      rest.forEach((r) => {
        if ("eaten" in r) mealMap[r.date] = r.eaten;
        if ("steps" in r) stepsMap[r.date] = r.steps;
      });

      const budget = Math.max(1200, calcTDEE(bmr, profile.activityLevel) - 500);
      const days = dates.map((date) => {
        const eaten = mealMap[date] || 0;
        const stepsKcal = calcStepsCalories(stepsMap[date] || 0, profile.weight);
        const activityKcal = activityMap[date] || 0;
        const burned = bmr + stepsKcal + activityKcal;
        const effectiveEaten = eaten > 0 ? eaten : budget;
        const deficit = burned - effectiveEaten;
        return { date, eaten, burned, deficit, logged: eaten > 0 };
      });

      const totalDeficit = days.reduce((s, d) => s + d.deficit, 0);
      const lostKg = totalDeficit / 7700;
      const estimated = Math.max(
        activeObjective.targetWeight,
        parseFloat((activeObjective.startWeight - lostKg).toFixed(2))
      );

      setDayData(days);
      setEstWeight(estimated);
      setLoading(false);
    });
  }, [uid, profile, bmr, activeObjective]);

  return { estWeight, dayData, loading };
}
