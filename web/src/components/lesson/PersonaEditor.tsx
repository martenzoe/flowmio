import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import InfoCallout from "./InfoCallout";

const USER_UPLOADS_BUCKET = "user_uploads";

export type Persona = {
  id: string;
  name: string;
  age?: string;
  role?: string;
  goals?: string;
  pains?: string;
  motivations?: string;
  image_url?: string;
};

type ModuleRow = { id: string; slug: string; title: string };
type Lesson = { id: string; slug: string; title: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm mb-3">
      <div className="mb-1 font-medium">{label}</div>
      <input
        type="text"
        className="w-full rounded-xl border border-slate-200/70 px-3 py-2 shadow-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function UploadDrop({
  imageUrl,
  onPick,
  note,
}: {
  imageUrl?: string;
  onPick: (file: File) => void;
  note?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 relative min-h-[260px] flex items-center justify-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Persona"
          className="max-h-60 object-contain rounded-lg"
        />
      ) : (
        <div className="text-center text-sm text-slate-500">
          <div className="text-blue-600 mb-1">⬆ Upload Feld:</div>
          <div>Lade hier ein Bild von deiner Persona hoch</div>
          {note && <div className="mt-2 text-xs opacity-70">{note}</div>}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-3 right-3 rounded-lg bg-white px-3 py-1.5 text-sm shadow border hover:brightness-105"
      >
        Bild wählen
      </button>
    </div>
  );
}

function PersonaForm({
  p,
  onChange,
  onUpload,
}: {
  p: Persona;
  onChange: (next: Persona) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Field
          label="Name"
          value={p.name}
          onChange={(v) => onChange({ ...p, name: v })}
          placeholder="z. B. Maria Schmidt"
        />
        <Field
          label="Alter"
          value={p.age}
          onChange={(v) => onChange({ ...p, age: v })}
          placeholder="z. B. 34"
        />
        <Field
          label="Beruf"
          value={p.role}
          onChange={(v) => onChange({ ...p, role: v })}
          placeholder="z. B. Marketing Managerin"
        />
        <Field
          label="Ziele"
          value={p.goals}
          onChange={(v) => onChange({ ...p, goals: v })}
          placeholder="Was möchte diese Person erreichen?"
        />
        <Field
          label="Probleme"
          value={p.pains}
          onChange={(v) => onChange({ ...p, pains: v })}
          placeholder="Welche Herausforderungen hat diese Person?"
        />
        <Field
          label="Motivationen"
          value={p.motivations}
          onChange={(v) => onChange({ ...p, motivations: v })}
          placeholder="Was treibt diese Person an?"
        />
      </div>

      <div className="flex flex-col gap-3">
        <UploadDrop
          imageUrl={p.image_url}
          onPick={onUpload}
          note="Optional – ein Symbolfoto hilft, sich die Persona besser vorzustellen."
        />
        <div className="rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
          Flowmioo: „Voilà – dein Lieblingskunde hat jetzt ein Gesicht.
          Wenn du für ihn entwickelst, bist du auf dem richtigen Weg!“
        </div>
      </div>
    </div>
  );
}

export default function PersonaEditor({
  moduleRow,
  lesson,
  onNext,
  showNext = true,
}: {
  moduleRow: ModuleRow;
  lesson: Lesson;
  onNext?: () => void;
  showNext?: boolean;
}) {
  const [personas, setPersonas] = useState<Persona[]>([
    { id: uid(), name: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

  // Laden
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_lesson_responses")
        .select("data_json")
        .eq("user_id", u.user.id)
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      const arr: Persona[] = data?.data_json?.personas;
      if (Array.isArray(arr) && arr.length) {
        setPersonas(
          arr.map((x) => ({
            id: x.id || uid(),
            name: x.name ?? "",
            age: x.age ?? "",
            role: x.role ?? "",
            goals: x.goals ?? "",
            pains: x.pains ?? "",
            motivations: x.motivations ?? "",
            image_url: x.image_url ?? "",
          }))
        );
      }
      loadedRef.current = true;
    })();
  }, [lesson.id]);

  // Autosave (debounced)
  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => {
      void save();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personas]);

  async function save(next?: Persona[]) {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("user_lesson_responses").upsert(
        {
          user_id: u.user.id,
          lesson_id: lesson.id,
          data_json: { personas: next ?? personas },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );
    } finally {
      setSaving(false);
    }
  }

  function updatePersona(id: string, patch: Partial<Persona>) {
    setPersonas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  async function handleUpload(id: string, file: File) {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        // Fallback: lokale Vorschau
        updatePersona(id, { image_url: URL.createObjectURL(file) });
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${u.user.id}/personas/${lesson.id}/${Date.now()}-${uid()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(USER_UPLOADS_BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) {
        // Fallback: lokale Vorschau, damit UX nicht bricht
        updatePersona(id, { image_url: URL.createObjectURL(file) });
        return;
      }
      const { data: pub } = supabase.storage
        .from(USER_UPLOADS_BUCKET)
        .getPublicUrl(path);
      updatePersona(id, { image_url: pub.publicUrl });
    } catch {
      updatePersona(id, { image_url: URL.createObjectURL(file) });
    }
  }

  const header = useMemo(
    () => (
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[15px] font-semibold">
          Kapitel 3: Interaktives Persona-Template
        </div>
        {saving && (
          <div className="text-xs text-slate-500">Speichere…</div>
        )}
      </div>
    ),
    [saving]
  );

  return (
    <div>
      {header}

      <div className="rounded-2xl border p-4 shadow-sm bg-white">
        <div className="grid gap-6">
          {personas.map((p, idx) => (
            <div key={p.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{`Deine Persona${personas.length > 1 ? ` #${idx + 1}` : ""}`}</div>
                {personas.length > 1 && (
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      const next = personas.filter((x) => x.id !== p.id);
                      setPersonas(next);
                      void save(next);
                    }}
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <PersonaForm
                p={p}
                onChange={(next) => updatePersona(p.id, next)}
                onUpload={(file) => handleUpload(p.id, file)}
              />
              <div className="h-px bg-slate-200" />
            </div>
          ))}

          <button
            className="text-sm text-blue-600 hover:underline self-start"
            onClick={() =>
              setPersonas((prev) => [...prev, { id: uid(), name: "" }])
            }
          >
            + Weitere Persona hinzufügen
          </button>

          <InfoCallout
            text="Tipp: Gib jeder Persona einen prägnanten Namen (z. B. „Mia, die Zeitknappe“) und notiere 3 wörtliche Zitate aus echten Gesprächen."
          />
        </div>
      </div>

      {showNext && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => onNext?.()}
            className="btn btn-primary"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
