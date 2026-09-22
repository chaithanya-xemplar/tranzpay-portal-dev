import { Checkbox } from "../../../../../design-system";
import { VIEW_CONTROL_FIELDS, VIEW_SURFACES } from "../../../model/constants";
import type { ViewControlField, ViewControls, ViewSurface } from "../../../model/types";

interface ViewControlMatrixProps {
  value: ViewControls;
  onChange: (next: ViewControls) => void;
}

/** 12-field × 4-surface checkbox matrix with per-column Select all/Clear. */
export default function ViewControlMatrix({ value, onChange }: ViewControlMatrixProps) {
  const setCell = (surface: ViewSurface, field: ViewControlField, checked: boolean) => {
    onChange({ ...value, [surface]: { ...value[surface], [field]: checked } });
  };

  const setColumn = (surface: ViewSurface, checked: boolean) => {
    const column = { ...value[surface] };
    for (const f of VIEW_CONTROL_FIELDS) column[f.key] = checked;
    onChange({ ...value, [surface]: column });
  };

  const columnAllOn = (surface: ViewSurface) =>
    VIEW_CONTROL_FIELDS.every((f) => value[surface][f.key]);

  return (
    <div className="border border-divider rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-divider2 border-b border-divider">
            <th className="text-left text-xs font-bold text-medium-grey px-4 py-2.5">Field</th>
            {VIEW_SURFACES.map((s) => (
              <th key={s.key} className="text-center px-3 py-2.5 w-24">
                <span className="block text-xs font-bold text-medium-grey">{s.label}</span>
                <span className="block text-[10px] font-normal text-light-grey">{s.helper}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VIEW_CONTROL_FIELDS.map((field) => (
            <tr key={field.key} className="border-b border-divider">
              <td className="px-4 py-2 text-dark-grey">{field.label}</td>
              {VIEW_SURFACES.map((s) => (
                <td key={s.key} className="px-3 py-2 text-center">
                  <span className="inline-flex justify-center">
                    <Checkbox
                      checked={value[s.key][field.key]}
                      onChange={(checked) => setCell(s.key, field.key, checked)}
                      aria-label={`${field.label} — ${s.label}`}
                    />
                  </span>
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-divider2/50">
            <td className="px-4 py-2 text-xs font-bold text-medium-grey">All</td>
            {VIEW_SURFACES.map((s) => {
              const on = columnAllOn(s.key);
              return (
                <td key={s.key} className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => setColumn(s.key, !on)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {on ? "Clear" : "Select all"}
                  </button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
