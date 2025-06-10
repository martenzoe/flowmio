import { useState, useEffect } from "react";

const structure = [
  {
    label: "Firmenname",
    placeholder: "Welcher Name eignet sich für ein Unternehmen in der Branche xyz?",
  },
  {
    label: "Zielgruppe",
    placeholder: "Welche Zielgruppe gibt es in der Branche xyz?",
  },
  {
    label: "Vision/Mission",
    placeholder: "Definiere eine Vision für ein Unternehmen im Bereich xyz.",
  },
  {
    label: "Firmenfarben",
    placeholder: "Welche Farben eignen sich für ein Unternehmen der Branche xyz.",
  },
  {
    label: "Firmenschriften",
    placeholder:
      "Welche Schriftarten eignen sich für ein Unternehmen der Branche xyz.",
  },
  {
    label: "Firmenlogo",
    placeholder: "Ein Firmenlogo kannst du ganz einfach mit Canva.com erstellen.",
  },
  {
    label: "Geschäftsausstattung und -materialien",
    placeholder:
      "Welche Geschäftsausstattung sollte ich in der Branche xyz mit meiner Corporate Identity ausstatten?",
  },
];

export default function CITable({ value = {}, onChange }) {
  const [fields, setFields] = useState(value);

  useEffect(() => {
    setFields(value);
  }, [value]);

  const handleChange = (key, val) => {
    const updated = { ...fields, [key]: val };
    setFields(updated);
    onChange(updated);
  };

  return (
    <div className="border rounded-xl divide-y">
      {structure.map((row, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-4 p-4 items-start">
          <div className="font-medium text-sm text-gray-700">{row.label}</div>
          <textarea
            rows="3"
            value={fields[row.label] || ""}
            onChange={(e) => handleChange(row.label, e.target.value)}
            placeholder={row.placeholder}
            className="w-full border rounded-xl px-3 py-2 text-sm placeholder-gray-400"
          />
        </div>
      ))}
    </div>
  );
}
