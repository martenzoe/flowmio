// src/components/lesson/QuizQuestion.tsx
import React from "react";

// akzeptiert beide Varianten, damit DB und Code robust bleiben
export type QuizOption = { key: string; text?: string; label?: string };

export default function QuizQuestion({
  lead,
  scenario,
  options,
  selected,
  onSelect,
  correctKey,
  explanation,
}: {
  lead?: string;
  scenario: string;
  options: QuizOption[];
  selected?: string | null;
  onSelect: (key: string) => void;
  correctKey: string;
  explanation?: string;
}) {
  const isCorrect = selected === correctKey;

  // wörtliche "\n" -> echte Umbrüche
  const normalize = (s?: string) => (s ?? "").replace(/\\n/g, "\n");

  return (
    <div className="space-y-5">
      {lead && (
        <p className="text-sm opacity-80">{lead}</p>
      )}

      {/* Szenario */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
        <div className="text-sm font-medium mb-1">Szenario:</div>
        <div className="text-sm opacity-80 whitespace-pre-line">
          {normalize(scenario)}
        </div>
      </div>

      {/* Optionen */}
      <div className="space-y-2">
        {options.map((o) => {
          const active = selected === o.key;
          const isRight = o.key === correctKey;
          const text = o.label ?? o.text ?? "";
          return (
            <label
              key={o.key}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition
                ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <input
                type="radio"
                className="h-4 w-4"
                checked={active}
                onChange={() => onSelect(o.key)}
              />
              <span className="text-sm">{text}</span>

              {active && isRight && (
                <span className="ml-auto text-xs rounded-md px-2 py-0.5 bg-emerald-100 text-emerald-700">
                  Richtig
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Erklärung: nur zeigen, wenn richtig */}
      {isCorrect && explanation && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm whitespace-pre-line">
          {normalize(explanation)}
        </div>
      )}
    </div>
  );
}
