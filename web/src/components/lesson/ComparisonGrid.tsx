// src/components/lesson/ComparisonGrid.tsx
import React from "react";

export type Choice = "left" | "right";
export type CompareRow = { id: string; left: string; right: string; tip?: string };
export type CompareValue = Record<string, Choice>;

export default function ComparisonGrid({
  rows,
  value,
  onChange,
}: {
  rows: CompareRow[];
  value: CompareValue;
  onChange: (rowId: string, choice: Choice) => void;
}) {
  const total = rows.length;
  const rightChosen = rows.filter((r) => value[r.id] === "right").length;
  const pctRight = total ? Math.round((rightChosen / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-sm flex items-center justify-between">
        <div className="opacity-70">
          Dein aktueller Fokus: <strong>{pctRight}% Unternehmer</strong>
        </div>
        <div className="text-xs opacity-60">Ziel: Schritt für Schritt nach rechts 😉</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Header label="Selbstständiger" />
        <Header label="Unternehmer" />
        {rows.map((r) => {
          const sel = value[r.id];
          const leftActive = sel === "left";
          const rightActive = sel === "right";
          return (
            <React.Fragment key={r.id}>
              <Card
                role="button"
                aria-pressed={leftActive}
                onClick={() => onChange(r.id, "left")}
                className={`${leftActive ? "ring-2 ring-red-500/60 bg-red-50" : "hover:bg-red-50/50"}`}
                icon="❌"
                text={r.left}
              />
              <Card
                role="button"
                aria-pressed={rightActive}
                onClick={() => onChange(r.id, "right")}
                className={`${rightActive ? "ring-2 ring-emerald-500/60 bg-emerald-50" : "hover:bg-emerald-50/50"}`}
                icon="✅"
                text={r.right}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Header({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200/70 p-3 text-center font-medium sticky top-0">
      {label}
    </div>
  );
}

function Card({
  icon,
  text,
  className = "",
  ...rest
}: {
  icon: string;
  text: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition cursor-pointer ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl leading-none">{icon}</div>
        <div className="text-sm opacity-90">{text}</div>
      </div>
    </div>
  );
}
