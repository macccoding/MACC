type HealthAutoExportPayload = {
  data?: {
    metrics?: Array<{
      name: string;
      data?: Array<{
        qty?: number;
        date?: string;
      }>;
    }>;
  };
  [key: string]: unknown;
};

type MappedHealth = {
  steps: number | null;
  calories: number | null;
  heartRate: number | null;
  sleep: number | null;
  data: {
    distance?: number;
    exerciseMinutes?: number;
    standHours?: number;
    weight?: number;
    bodyFat?: number;
    bmi?: number;
  };
};

const FIELD_MAP: Record<string, string> = {
  step_count: "steps",
  steps: "steps",
  active_energy: "calories",
  activeCalories: "calories",
  active_calories: "calories",
  resting_heart_rate: "heartRate",
  restingHeartRate: "heartRate",
  sleep_analysis: "sleep",
  sleepHours: "sleep",
  sleep_hours: "sleep",
  walking_running_distance: "data.distance",
  distanceWalking: "data.distance",
  distance_walking: "data.distance",
  exercise_time: "data.exerciseMinutes",
  exerciseMinutes: "data.exerciseMinutes",
  exercise_minutes: "data.exerciseMinutes",
  stand_hour: "data.standHours",
  standHours: "data.standHours",
  stand_hours: "data.standHours",
  weight: "data.weight",
  body_mass: "data.weight",
  bodyFat: "data.bodyFat",
  body_fat_percentage: "data.bodyFat",
  body_fat: "data.bodyFat",
  bmi: "data.bmi",
  body_mass_index: "data.bmi",
};

export function mapHealthPayload(payload: HealthAutoExportPayload): MappedHealth {
  const result: MappedHealth = {
    steps: null,
    calories: null,
    heartRate: null,
    sleep: null,
    data: {},
  };

  // Handle structured metrics array (Health Auto Export format)
  if (payload.data?.metrics && Array.isArray(payload.data.metrics)) {
    for (const metric of payload.data.metrics) {
      const target = FIELD_MAP[metric.name];
      if (!target) continue;
      const entry = metric.data?.[0];
      if (!entry) continue;

      // sleep_analysis sends { asleep, totalSleep, inBed, ... } instead of qty
      if (metric.name === "sleep_analysis") {
        const sleepVal =
          (entry as Record<string, unknown>).asleep ??
          (entry as Record<string, unknown>).totalSleep ??
          entry.qty ??
          null;
        if (sleepVal !== null && typeof sleepVal === "number") {
          setMappedValue(result, target, sleepVal);
        }
        continue;
      }

      // heart_rate sends { Min, Avg, Max } — use Avg (resting)
      if (metric.name === "resting_heart_rate" || metric.name === "heart_rate") {
        const hrVal =
          (entry as Record<string, unknown>).Avg ?? entry.qty ?? null;
        if (hrVal !== null && typeof hrVal === "number") {
          setMappedValue(result, target, hrVal);
        }
        continue;
      }

      const value = entry.qty ?? null;
      if (value === null) continue;
      setMappedValue(result, target, value);
    }
    return result;
  }

  // Handle flat key-value format
  for (const [key, value] of Object.entries(payload)) {
    const target = FIELD_MAP[key];
    if (!target || typeof value !== "number") continue;
    setMappedValue(result, target, value);
  }

  return result;
}

function setMappedValue(result: MappedHealth, target: string, value: number) {
  if (target.startsWith("data.")) {
    const dataKey = target.slice(5) as keyof MappedHealth["data"];
    result.data[dataKey] = value;
  } else {
    const key = target as keyof Omit<MappedHealth, "data">;
    if (key === "steps" || key === "calories" || key === "heartRate") {
      (result as Record<string, unknown>)[key] = Math.round(value);
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }
}
