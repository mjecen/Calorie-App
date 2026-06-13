import { Edit3, Image, Trash2 } from "lucide-react";

export function MealItem({ meal, onDelete, onEdit }) {
  return (
    <article className="flex items-center gap-3 rounded-[18px] border border-line bg-panel p-4 shadow-card">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e7edf3] text-muted">
        {meal.photo ? (
          <img
            src={meal.photo}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Image className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-calorie">
          {meal.type}
        </p>
        <h3 className="mt-1 text-[15px] font-bold leading-snug text-ink">
          {meal.name}
        </h3>
        {meal.description && meal.description !== meal.name ? (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">
            {meal.description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-base font-extrabold">{meal.calories} cal</p>
        <p className="mt-1 text-sm text-muted">{meal.protein}g protein</p>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => onEdit(meal)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-canvas"
          aria-label={`Edit ${meal.name}`}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(meal.id)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
          aria-label={`Delete ${meal.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
