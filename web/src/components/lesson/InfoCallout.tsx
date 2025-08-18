import React from "react";

export type InfoCalloutProps = {
  title?: string;
  text?: string;          // normaler Fließtext (Zeilenumbrüche erlaubt)
  bullets?: string[];     // Aufzählung
  footer?: string[];      // hervorgehobene Abschlusszeilen (fett)
};

export default function InfoCallout({ title, text, bullets, footer }: InfoCalloutProps) {
  return (
    <div className="mt-3 rounded-xl bg-slate-100 border border-slate-200 p-3 text-sm">
      {title && <div className="font-medium mb-1">{title}</div>}
      {text && <p className="opacity-80 whitespace-pre-line">{text}</p>}
      {bullets?.length ? (
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="opacity-80">{b}</li>
          ))}
        </ul>
      ) : null}
      {footer?.length ? (
        <div className="mt-2 space-y-1">
          {footer.map((f, i) => (
            <div key={i} className="font-semibold">{f}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
