import { Beef, Flame } from "lucide-react";
import { Card } from "./Card.jsx";

const icons = {
  calories: Flame,
  protein: Beef
};

export function ProgressCard({
  kind,
  label,
  value,
  target,
  remaining,
  remainingLabel
}) {
  const Icon = icons[kind];
  const colorClass = kind === "calories" ? "bg-calorie" : "bg-protein";
  const textClass = kind === "calories" ? "text-calorie" : "text-protein";
  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas">
            <Icon className={`h-5 w-5 ${textClass}`} strokeWidth={2.2} />
          </span>
          <h2 className="text-base font-bold">{label}</h2>
        </div>
        <p className="text-sm text-muted">
          {value} / {target}
          {kind === "protein" ? "g" : ""}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e2e8ef]">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 flex items-end justify-between">
        <p className="text-sm text-muted">{remainingLabel}</p>
        <p className="text-2xl font-extrabold tracking-normal">
          {remaining}
          {kind === "protein" ? "g" : ""}
        </p>
      </div>
    </Card>
  );
}
