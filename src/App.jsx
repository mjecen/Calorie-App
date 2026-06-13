import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Dumbbell,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  User
} from "lucide-react";
import { Card } from "./components/Card.jsx";
import { MealItem } from "./components/MealItem.jsx";
import { ProgressCard } from "./components/ProgressCard.jsx";
import { Shell } from "./components/Shell.jsx";
import { defaultSettings, meals as seedMeals } from "./data/mockData.js";
import {
  clearRemoteDay,
  deleteRemoteMeal,
  loadRemoteState,
  saveRemoteMeal,
  saveRemoteSettings
} from "./lib/appData.js";
import { isSupabaseConfigured } from "./lib/supabaseClient.js";

const STORAGE_KEY = "calorie-tracker-state-v1";
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

const emptyMealForm = {
  name: "",
  description: "",
  calories: "",
  protein: "",
  type: "Breakfast",
  photo: ""
};

const emptyEstimate = {
  confidence: "",
  assumptions: [],
  itemsDetected: []
};

function normalizeMeal(meal) {
  return {
    ...meal,
    name: meal.name || meal.description || "Untitled meal",
    description: meal.name ? meal.description || "" : "",
    calories: Number(meal.calories || 0),
    protein: Number(meal.protein || 0),
    photo: meal.photo || ""
  };
}

function loadStoredState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        meals: seedMeals.map((meal) => ({ ...meal, date: getTodayKey() })),
        settings: defaultSettings
      };
    }

    const parsed = JSON.parse(stored);
    return {
      meals: Array.isArray(parsed.meals)
        ? parsed.meals.map(normalizeMeal)
        : seedMeals.map(normalizeMeal),
      settings: { ...defaultSettings, ...(parsed.settings || {}) }
    };
  } catch {
    return {
      meals: seedMeals.map((meal) => ({ ...meal, date: getTodayKey() })),
      settings: defaultSettings
    };
  }
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateHeading(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function sumMeals(meals) {
  return meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + Number(meal.calories || 0),
      protein: sum.protein + Number(meal.protein || 0)
    }),
    { calories: 0, protein: 0 }
  );
}

function PageHeader({ title, eyebrow }) {
  return (
    <header className="border-b border-line px-5 pb-5 pt-6">
      <h1 className="text-2xl font-extrabold tracking-normal">{title}</h1>
      {eyebrow ? <p className="mt-8 text-sm text-muted">{eyebrow}</p> : null}
    </header>
  );
}

function TodayPage({
  meals,
  settings,
  todayLabel,
  onAdd,
  onClearDay,
  onDeleteMeal,
  onEditMeal
}) {
  const totals = useMemo(() => sumMeals(meals), [meals]);
  const caloriePercent = Math.round((totals.calories / settings.calories) * 100);
  const caloriesRemaining = Math.max(settings.calories - totals.calories, 0);
  const proteinRemaining = Math.max(settings.protein - totals.protein, 0);

  return (
    <>
      <PageHeader title="Today" eyebrow={todayLabel} />

      <div className="space-y-4 px-5 py-5">
        <Card className="p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
            Today Summary
          </p>

          <div className="mt-4 space-y-1">
            <p className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold">{totals.calories}</span>
              <span className="text-base text-muted">Calories</span>
            </p>
            <p className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-protein">
                {totals.protein}g
              </span>
              <span className="text-base text-muted">Protein</span>
            </p>
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
            <p className="text-sm leading-relaxed text-muted">
              Goal:
              <br />
              <span className="font-medium">
                {settings.calories} Calories / {settings.protein}g Protein
              </span>
            </p>
            <p className="text-right">
              <span className="block text-2xl font-extrabold text-calorie">
                {Number.isFinite(caloriePercent) ? caloriePercent : 0}%
              </span>
              <span className="text-xs text-muted">Complete</span>
            </p>
          </div>
        </Card>

        <ProgressCard
          kind="calories"
          label="Calories"
          value={totals.calories}
          target={settings.calories}
          remaining={caloriesRemaining}
          remainingLabel="Remaining"
        />

        <ProgressCard
          kind="protein"
          label="Protein"
          value={totals.protein}
          target={settings.protein}
          remaining={proteinRemaining}
          remainingLabel="Remaining"
        />

        <section className="pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
              Today's Meals
            </h2>
            <button
              type="button"
              onClick={onClearDay}
              className="flex items-center gap-1.5 text-xs font-bold text-red-600"
              disabled={meals.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear day
            </button>
          </div>

          <div className="space-y-3">
            {meals.length ? (
              meals.map((meal) => (
                <MealItem
                  key={meal.id}
                  meal={meal}
                  onDelete={onDeleteMeal}
                  onEdit={onEditMeal}
                />
              ))
            ) : (
              <Card className="p-5 text-sm text-muted">
                No meals saved for today.
              </Card>
            )}
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="fixed bottom-[5rem] right-[max(1.25rem,calc((100vw-720px)/2+1.25rem))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-calorie text-white shadow-fab"
        aria-label="Add meal"
      >
        <Plus className="h-8 w-8" />
      </button>
    </>
  );
}

function EstimateDetails({ estimate }) {
  const confidenceClass =
    estimate.confidence === "high"
      ? "bg-green-50 text-calorie"
      : estimate.confidence === "medium"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-red-50 text-red-700";
  const isUnclear = estimate.confidence === "low";

  return (
    <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold">OpenAI estimate</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${confidenceClass}`}
        >
          {estimate.confidence} confidence
        </span>
      </div>

      {isUnclear ? (
        <p className="mt-2 text-sm font-bold text-red-700">
          Photo may be unclear. Manually adjust the values before saving.
        </p>
      ) : null}

      {estimate.assumptions.length ? (
        <div className="mt-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
            Assumptions
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {estimate.assumptions.map((assumption) => (
              <li key={assumption}>- {assumption}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {estimate.itemsDetected.length ? (
        <div className="mt-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
            Items detected
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {estimate.itemsDetected.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddMealPage({ editingMeal, onCancelEdit, onSaveMeal }) {
  const [form, setForm] = useState(emptyMealForm);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [estimateResult, setEstimateResult] = useState(emptyEstimate);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm(
      editingMeal
        ? {
            name: editingMeal.name,
            description: editingMeal.description || "",
            calories: String(editingMeal.calories),
            protein: String(editingMeal.protein),
            type: editingMeal.type,
            photo: editingMeal.photo || ""
          }
        : emptyMealForm
    );
    setEstimateError("");
    setEstimateResult(emptyEstimate);
  }, [editingMeal]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateField("photo", String(reader.result || ""));
    reader.readAsDataURL(file);
    setEstimateError("");
    setEstimateResult(emptyEstimate);
  }

  function removePhoto() {
    updateField("photo", "");
    setEstimateError("");
    setEstimateResult(emptyEstimate);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function estimateFromPhoto() {
    if (!form.photo || isEstimating) return;

    setIsEstimating(true);
    setEstimateError("");
    setEstimateResult(emptyEstimate);

    try {
      const response = await fetch("/api/estimate-calories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: form.photo })
      });
      const estimate = await response.json();

      if (!response.ok) {
        throw new Error(estimate.error || "Could not estimate this photo.");
      }

      setForm((current) => ({
        ...current,
        name: estimate.mealName || current.name,
        description: estimate.description || current.description,
        calories: String(estimate.estimatedCalories ?? current.calories),
        protein: String(estimate.estimatedProtein ?? current.protein)
      }));
      setEstimateResult({
        confidence: estimate.confidence || "low",
        assumptions: Array.isArray(estimate.assumptions)
          ? estimate.assumptions
          : [],
        itemsDetected: Array.isArray(estimate.itemsDetected)
          ? estimate.itemsDetected
          : []
      });
    } catch (error) {
      setEstimateError(error.message || "Could not estimate this photo.");
    } finally {
      setIsEstimating(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) return;

    onSaveMeal({
      id: editingMeal?.id || `meal-${Date.now()}`,
      date: editingMeal?.date || getTodayKey(),
      name: cleanName,
      description: form.description.trim(),
      type: form.type,
      calories: Math.max(Number(form.calories || 0), 0),
      protein: Math.max(Number(form.protein || 0), 0),
      photo: form.photo
    });

    setForm(emptyMealForm);
  }

  return (
    <>
      <PageHeader
        title={editingMeal ? "Edit Meal" : "Add Meal"}
        eyebrow={editingMeal ? "Update saved meal" : "Log a meal or snack"}
      />
      <div className="space-y-4 px-5 py-5">
        <Card className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold">Meal name</span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-calorie"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Meal name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">Description</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-calorie"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Food items, portion notes, or manual adjustments"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold">Calories</span>
                <input
                  type="number"
                  min="0"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-calorie"
                  value={form.calories}
                  onChange={(event) =>
                    updateField("calories", event.target.value)
                  }
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold">Protein</span>
                <input
                  type="number"
                  min="0"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-protein"
                  value={form.protein}
                  onChange={(event) =>
                    updateField("protein", event.target.value)
                  }
                  placeholder="0"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold">Meal type</span>
              <select
                className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-calorie"
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
              >
                {mealTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-sm font-bold">Photo preview</span>
              <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line bg-white p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-canvas text-muted">
                  <Camera className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-extrabold">Choose photo</span>
                  <span className="mt-1 block text-sm text-muted">
                    Shows a local preview only
                  </span>
                </span>
              </label>
            </div>

            {form.photo ? (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <img
                  src={form.photo}
                  alt=""
                  className="h-44 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 p-3">
                  <p className="text-sm font-bold">Preview ready</p>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="border-t border-line p-3">
                  <button
                    type="button"
                    onClick={estimateFromPhoto}
                    disabled={isEstimating}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-protein font-extrabold text-white disabled:opacity-70"
                  >
                    {isEstimating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    {isEstimating ? "Estimating..." : "Estimate with OpenAI"}
                  </button>
                  {estimateResult.confidence ? (
                    <EstimateDetails estimate={estimateResult} />
                  ) : null}
                  {estimateError ? (
                    <p className="mt-2 text-sm text-red-600">
                      {estimateError}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No photo selected.</p>
            )}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-calorie font-extrabold text-white"
            >
              <Save className="h-5 w-5" />
              {editingMeal ? "Update Meal" : "Save Meal"}
            </button>
            {editingMeal ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="h-12 w-full rounded-xl border border-line bg-white font-extrabold text-muted"
              >
                Cancel Edit
              </button>
            ) : null}
          </form>
        </Card>
      </div>
    </>
  );
}

function HistoryPage({ meals, onEditMeal, onDeleteMeal }) {
  const groups = useMemo(() => {
    const grouped = meals.reduce((map, meal) => {
      map[meal.date] = [...(map[meal.date] || []), meal];
      return map;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, groupMeals]) => ({
        date,
        meals: groupMeals,
        totals: sumMeals(groupMeals)
      }));
  }, [meals]);

  return (
    <>
      <PageHeader title="History" eyebrow="Saved meals by date" />
      <div className="space-y-5 px-5 py-5">
        {groups.length ? (
          groups.map((group) => (
            <section key={group.date} className="space-y-3">
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-calorie">
                      <CalendarDays className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="font-extrabold">
                        {formatDateHeading(group.date)}
                      </h2>
                      <p className="text-sm text-muted">
                        {group.meals.length} meal
                        {group.meals.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{group.totals.calories} cal</p>
                    <p className="text-sm text-muted">
                      {group.totals.protein}g protein
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                {group.meals.map((meal) => (
                  <MealItem
                    key={meal.id}
                    meal={meal}
                    onEdit={onEditMeal}
                    onDelete={onDeleteMeal}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <Card className="p-5 text-sm text-muted">No saved meals yet.</Card>
        )}
      </div>
    </>
  );
}

function SettingsPage({ settings, dataStatus, dataError, onSaveSettings }) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSaveSettings({
      calories: Math.max(Number(form.calories || 0), 0),
      protein: Math.max(Number(form.protein || 0), 0),
      bodyWeight: Math.max(Number(form.bodyWeight || 0), 0),
      goal: form.goal
    });
  }

  return (
    <>
      <PageHeader title="Settings" eyebrow="Daily targets" />
      <div className="space-y-4 px-5 py-5">
        <Card className="p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
            Data Source
          </p>
          <h2 className="mt-2 font-extrabold">{dataStatus}</h2>
          {dataError ? (
            <p className="mt-2 text-sm text-red-600">{dataError}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Meal and settings changes are saved automatically.
            </p>
          )}
        </Card>

        <Card className="divide-y divide-line">
          <SettingRow
            icon={Target}
            label="Calorie target"
            value={`${settings.calories} cal`}
          />
          <SettingRow
            icon={Dumbbell}
            label="Protein target"
            value={`${settings.protein}g`}
          />
          <SettingRow
            icon={User}
            label="Body weight"
            value={`${settings.bodyWeight} lb`}
          />
          <SettingRow icon={Target} label="Goal" value={settings.goal} />
        </Card>

        <Card className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold">Calories</span>
                <input
                  type="number"
                  min="0"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-calorie"
                  value={form.calories}
                  onChange={(event) =>
                    updateField("calories", event.target.value)
                  }
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold">Protein</span>
                <input
                  type="number"
                  min="0"
                  className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-protein"
                  value={form.protein}
                  onChange={(event) =>
                    updateField("protein", event.target.value)
                  }
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold">Body weight</span>
              <input
                type="number"
                min="0"
                className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-calorie"
                value={form.bodyWeight}
                onChange={(event) =>
                  updateField("bodyWeight", event.target.value)
                }
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">Goal</span>
              <select
                className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-calorie"
                value={form.goal}
                onChange={(event) => updateField("goal", event.target.value)}
              >
                <option>Lose fat</option>
                <option>Maintain weight</option>
                <option>Build muscle</option>
              </select>
            </label>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-calorie font-extrabold text-white"
            >
              <Save className="h-5 w-5" />
              Save Settings
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}

function SettingRow({ icon: Icon, label, value }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 p-5 text-left"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-calorie">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-extrabold">{label}</span>
          <span className="text-sm text-muted">{value}</span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
    </button>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("today");
  const [editingMeal, setEditingMeal] = useState(null);
  const [{ meals, settings }, setAppState] = useState(loadStoredState);
  const [dataStatus, setDataStatus] = useState(
    isSupabaseConfigured ? "Connecting to Supabase" : "Local browser storage"
  );
  const [dataError, setDataError] = useState("");
  const todayKey = getTodayKey();
  const todayLabel = formatDateHeading(todayKey);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let isMounted = true;

    async function loadFromSupabase() {
      try {
        const remoteState = await loadRemoteState(defaultSettings);
        if (!isMounted) return;
        setAppState(remoteState);
        setDataStatus("Supabase database");
        setDataError("");
      } catch (error) {
        if (!isMounted) return;
        setDataStatus("Local fallback");
        setDataError(error.message || "Could not connect to Supabase.");
      }
    }

    loadFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meals, settings }));
  }, [meals, settings]);

  const todayMeals = useMemo(
    () => meals.filter((meal) => meal.date === todayKey),
    [meals]
  );

  function navigate(page) {
    if (page === "add") {
      setEditingMeal(null);
    }
    setActivePage(page);
  }

  async function syncToSupabase(action) {
    if (!isSupabaseConfigured) return;

    try {
      await action();
      setDataStatus("Supabase database");
      setDataError("");
    } catch (error) {
      setDataStatus("Local fallback");
      setDataError(error.message || "Latest change was saved locally only.");
    }
  }

  function saveMeal(nextMeal) {
    setAppState((current) => {
      const exists = current.meals.some((meal) => meal.id === nextMeal.id);
      return {
        ...current,
        meals: exists
          ? current.meals.map((meal) =>
              meal.id === nextMeal.id ? nextMeal : meal
            )
          : [nextMeal, ...current.meals]
      };
    });
    syncToSupabase(() => saveRemoteMeal(nextMeal));
    setEditingMeal(null);
    setActivePage("today");
  }

  function editMeal(meal) {
    setEditingMeal(meal);
    setActivePage("add");
  }

  function deleteMeal(mealId) {
    setAppState((current) => ({
      ...current,
      meals: current.meals.filter((meal) => meal.id !== mealId)
    }));
    if (editingMeal?.id === mealId) {
      setEditingMeal(null);
    }
    syncToSupabase(() => deleteRemoteMeal(mealId));
  }

  function clearDay() {
    const shouldClear = window.confirm("Clear all meals saved for today?");
    if (!shouldClear) return;

    setAppState((current) => ({
      ...current,
      meals: current.meals.filter((meal) => meal.date !== todayKey)
    }));
    syncToSupabase(() => clearRemoteDay(todayKey, todayMeals));
  }

  function saveSettings(nextSettings) {
    setAppState((current) => ({ ...current, settings: nextSettings }));
    syncToSupabase(() => saveRemoteSettings(nextSettings));
  }

  const pages = {
    today: (
      <TodayPage
        meals={todayMeals}
        settings={settings}
        todayLabel={todayLabel}
        onAdd={() => {
          setEditingMeal(null);
          setActivePage("add");
        }}
        onClearDay={clearDay}
        onDeleteMeal={deleteMeal}
        onEditMeal={editMeal}
      />
    ),
    add: (
      <AddMealPage
        editingMeal={editingMeal}
        onCancelEdit={() => {
          setEditingMeal(null);
          setActivePage("today");
        }}
        onSaveMeal={saveMeal}
      />
    ),
    history: (
      <HistoryPage
        meals={meals}
        onEditMeal={editMeal}
        onDeleteMeal={deleteMeal}
      />
    ),
    settings: (
      <SettingsPage
        settings={settings}
        dataStatus={dataStatus}
        dataError={dataError}
        onSaveSettings={saveSettings}
      />
    )
  };

  return (
    <Shell activePage={activePage} onNavigate={navigate}>
      {pages[activePage]}
    </Shell>
  );
}
