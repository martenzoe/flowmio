// src/components/SidebarNav.tsx
import { Link } from "react-router-dom";
import type { Phase, ModuleRow, Lesson } from "../hooks/useLessonData";

export default function SidebarNav({
  phase,
  moduleRow,
  intro,
  chapters,
  activeLessonSlug,
}: {
  phase: Phase | null;
  moduleRow: ModuleRow;
  intro: Lesson | null;
  chapters: Lesson[];
  activeLessonSlug?: string;
}) {
  return (
    <aside className="hidden lg:block sticky top-16 self-start">
      <div className="sidebar-box">
        <Link
          to={phase ? `/app/academy/${phase.slug}` : "/app/academy"}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Zurück zur Phase
        </Link>
        <h2 className="text-[17px] font-semibold mt-2 leading-tight">{moduleRow.title}</h2>

        <nav className="mt-3 space-y-2">
          <Link to={`/app/modules/${moduleRow.slug}`} className="nav-item">
            <div className="font-medium">Einführungsseite & Lernziele</div>
            {intro?.title && <div className="text-xs text-gray-500 mt-0.5">{intro.title}</div>}
          </Link>
          {chapters.map((c, idx) => {
            const active = c.slug === activeLessonSlug;
            return (
              <Link
                key={c.id}
                to={`/app/modules/${moduleRow.slug}/lesson/${c.slug}`}
                className={`nav-item ${active ? "nav-item-active font-medium" : ""}`}
              >
                <div className="text-[11px] opacity-60">{`Kapitel ${idx + 1}`}</div>
                <div className="text-sm font-medium leading-tight">{c.title}</div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
