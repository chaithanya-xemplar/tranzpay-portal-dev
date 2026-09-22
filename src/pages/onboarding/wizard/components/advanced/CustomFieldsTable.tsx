import { Checkbox, Input } from "../../../../../design-system";
import type { CustomFieldDef } from "../../../model/types";

interface CustomFieldsTableProps {
  fields: CustomFieldDef[];
  onChange: (next: CustomFieldDef[]) => void;
}

/** Fixed 4-slot custom-field grid (English / Spanish / Required), per rail. */
export default function CustomFieldsTable({ fields, onChange }: CustomFieldsTableProps) {
  const update = (index: number, patch: Partial<CustomFieldDef>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  return (
    <div className="border border-divider rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-divider2 border-b border-divider">
            <th className="text-left text-xs font-bold text-medium-grey px-4 py-2.5 w-10">#</th>
            <th className="text-left text-xs font-bold text-medium-grey px-3 py-2.5">
              Label (English)
            </th>
            <th className="text-left text-xs font-bold text-medium-grey px-3 py-2.5">
              Label (Español)
            </th>
            <th className="text-center text-xs font-bold text-medium-grey px-3 py-2.5 w-20">
              Required
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, i) => (
            <tr key={i} className="border-b border-divider last:border-b-0">
              <td className="px-4 py-2 text-medium-grey">{i + 1}</td>
              <td className="px-3 py-2">
                <Input
                  value={field.en}
                  placeholder={`Custom Field ${i + 1}`}
                  onChange={(e) => update(i, { en: e.target.value })}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  value={field.es}
                  placeholder={`Campo personalizado ${i + 1}`}
                  onChange={(e) => update(i, { es: e.target.value })}
                />
              </td>
              <td className="px-3 py-2 text-center">
                <span className="inline-flex justify-center">
                  <Checkbox
                    checked={field.required}
                    onChange={(required) => update(i, { required })}
                    aria-label={`Custom field ${i + 1} required`}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
