import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ImageUp } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

const structure = [
  { label: "Firmenname", placeholder: "Welcher Name eignet sich für ein Unternehmen in der Branche xyz?" },
  { label: "Zielgruppe", placeholder: "Welche Zielgruppe gibt es in der Branche xyz?" },
  { label: "Vision/Mission", placeholder: "Definiere eine Vision für ein Unternehmen im Bereich xyz." },
  { label: "Firmenfarben", placeholder: "Welche Farben eignen sich für ein Unternehmen der Branche xyz." },
  { label: "Firmenschriften", placeholder: "Welche Schriftarten eignen sich für ein Unternehmen der Branche xyz." },
  { label: "Firmenlogo", placeholder: "" },
  { label: "Geschäftsausstattung und -materialien", placeholder: "Welche Geschäftsausstattung sollte ich in der Branche xyz mit meiner Corporate Identity ausstatten?" },
];

export default function CITable({ value = {}, onChange }) {
  const { user } = useCurrentUser();
  const [fields, setFields] = useState(value);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFields(value);
  }, [value]);

  const handleChange = (key, val) => {
    const updated = { ...fields, [key]: val };
    setFields(updated);
    onChange(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const fileExt = file.name.split(".").pop().toLowerCase();
    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const path = `${user.id}/logo-${Date.now()}-${safeName}`;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    const { data, error: urlError } = await supabase.storage
      .from("logos")
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (urlError || !data?.signedUrl) {
      console.error("URL error:", urlError);
      setUploading(false);
      return;
    }

    handleChange("Firmenlogo", data.signedUrl);
    setUploading(false);
  };

  return (
    <div className="border rounded-xl divide-y">
      {structure.map((row, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-4 p-4 items-start">
          <div className="font-medium text-sm text-gray-700">{row.label}</div>
          {row.label === "Firmenlogo" ? (
            <div className="space-y-2">
              {fields["Firmenlogo"] && (
                <img
                  src={fields["Firmenlogo"]}
                  alt="Logo-Vorschau"
                  className="w-32 h-32 object-contain border rounded"
                />
              )}
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl border border-gray-300 cursor-pointer text-sm hover:bg-gray-200 transition w-fit">
                <ImageUp className="w-4 h-4" />
                <span>{uploading ? "Wird hochgeladen..." : "Logo hochladen"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">Optimale Größe: 500×500 px, Format: PNG, JPG, WEBP</p>
            </div>
          ) : (
            <textarea
              rows="3"
              value={fields[row.label] || ""}
              onChange={(e) => handleChange(row.label, e.target.value)}
              placeholder={row.placeholder}
              className="w-full border rounded-xl px-3 py-2 text-sm placeholder-gray-400"
            />
          )}
        </div>
      ))}
    </div>
  );
}
