import { supabase } from "./supabaseClient.js";

const SETTINGS_ID = "default";
const PHOTO_CACHE_KEY = "calorie-tracker-photo-previews-v1";

function getPhotoCache() {
  try {
    return JSON.parse(localStorage.getItem(PHOTO_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setPhotoCache(cache) {
  localStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify(cache));
}

function cacheMealPhoto(meal) {
  const cache = getPhotoCache();
  if (meal.photo) {
    cache[meal.id] = meal.photo;
  } else {
    delete cache[meal.id];
  }
  setPhotoCache(cache);
}

function removeMealPhoto(mealId) {
  const cache = getPhotoCache();
  delete cache[mealId];
  setPhotoCache(cache);
}

function removePhotosForMeals(meals) {
  const cache = getPhotoCache();
  meals.forEach((meal) => {
    delete cache[meal.id];
  });
  setPhotoCache(cache);
}

function toMeal(row) {
  const photoCache = getPhotoCache();
  return {
    id: row.id,
    date: row.meal_date,
    type: row.meal_type,
    name: row.meal_name || row.description,
    description: row.meal_name ? row.description || "" : "",
    calories: row.calories,
    protein: row.protein,
    photo: photoCache[row.id] || ""
  };
}

function fromMeal(meal) {
  return {
    id: meal.id,
    meal_date: meal.date,
    meal_type: meal.type,
    meal_name: meal.name,
    description: meal.description || "",
    calories: meal.calories,
    protein: meal.protein
  };
}

function toSettings(row, defaults) {
  if (!row) return defaults;
  return {
    calories: row.calories_target,
    protein: row.protein_target,
    bodyWeight: row.body_weight,
    goal: row.goal
  };
}

function fromSettings(settings) {
  return {
    id: SETTINGS_ID,
    calories_target: settings.calories,
    protein_target: settings.protein,
    body_weight: settings.bodyWeight,
    goal: settings.goal
  };
}

function assertSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
}

export async function loadRemoteState(defaultSettings) {
  assertSupabase();

  const [mealsResult, settingsResult] = await Promise.all([
    supabase.from("meals").select("*").order("meal_date", { ascending: false }),
    supabase
      .from("app_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle()
  ]);

  if (mealsResult.error) throw mealsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    meals: (mealsResult.data || []).map(toMeal),
    settings: toSettings(settingsResult.data, defaultSettings)
  };
}

export async function saveRemoteMeal(meal) {
  assertSupabase();
  cacheMealPhoto(meal);
  const { error } = await supabase.from("meals").upsert(fromMeal(meal));
  if (error) throw error;
}

export async function deleteRemoteMeal(mealId) {
  assertSupabase();
  removeMealPhoto(mealId);
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) throw error;
}

export async function clearRemoteDay(date, removedMeals) {
  assertSupabase();
  removePhotosForMeals(removedMeals);
  const { error } = await supabase.from("meals").delete().eq("meal_date", date);
  if (error) throw error;
}

export async function saveRemoteSettings(settings) {
  assertSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert(fromSettings(settings));
  if (error) throw error;
}
