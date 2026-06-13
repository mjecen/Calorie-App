import { CalendarClock, Home, PlusCircle, Settings } from "lucide-react";

const navItems = [
  { id: "today", label: "Today", icon: Home },
  { id: "add", label: "Add", icon: PlusCircle },
  { id: "history", label: "History", icon: CalendarClock },
  { id: "settings", label: "Settings", icon: Settings }
];

export function Shell({ activePage, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto min-h-screen w-full max-w-[720px] pb-28">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-[720px] grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  isActive ? "text-calorie" : "text-muted"
                }`}
                aria-label={item.label}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
