import { useState, useEffect } from "react";
import { Plus, Trash } from "lucide-react";

export default function EditableTable({ columns, data = [], onChange }) {
  const [rows, setRows] = useState(data);

  useEffect(() => {
    setRows(data); // wichtig beim Re-Render durch Supabase-Laden
  }, [data]);

  const updateCell = (rowIndex, colIndex, value) => {
    const updated = [...rows];
    updated[rowIndex][colIndex] = value;
    setRows(updated);
    onChange(updated);
  };

  const addRow = () => {
    const newRow = Array(columns.length).fill("");
    const updated = [...rows, newRow];
    setRows(updated);
    onChange(updated);
  };

  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    onChange(updated);
  };

  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-3 py-2 font-medium">
                {col}
              </th>
            ))}
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {columns.map((_, colIndex) => (
                <td key={colIndex} className="px-3 py-2">
                  <input
                    type="text"
                    value={row[colIndex] || ""}
                    onChange={(e) =>
                      updateCell(rowIndex, colIndex, e.target.value)
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => removeRow(rowIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2">
        <button
          onClick={addRow}
          className="text-sm text-[#84C7AE] flex items-center gap-2 hover:underline"
        >
          <Plus className="w-4 h-4" />
          Zeile hinzufügen
        </button>
      </div>
    </div>
  );
}
