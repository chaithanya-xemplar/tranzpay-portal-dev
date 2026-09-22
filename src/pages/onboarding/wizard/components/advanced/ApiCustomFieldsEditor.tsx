import { Button, Icon, Input } from "../../../../../design-system";
import { API_CUSTOM_FIELD_FIRST_SLOT, API_CUSTOM_FIELD_MAX } from "../../../model/constants";

interface ApiCustomFieldsEditorProps {
  fields: string[];
  onChange: (next: string[]) => void;
}

/** API-only custom fields occupying slots CustomField5–CustomField20. */
export default function ApiCustomFieldsEditor({ fields, onChange }: ApiCustomFieldsEditorProps) {
  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-light-grey">
          <Icon name="info" size={15} /> No API custom fields configured.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((value, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs font-mono font-semibold text-medium-grey">
                CustomField{i + API_CUSTOM_FIELD_FIRST_SLOT}
              </span>
              <Input
                value={value}
                placeholder="Your field name (e.g. PolicyDate)"
                containerClassName="flex-1"
                onChange={(e) => onChange(fields.map((f, j) => (j === i ? e.target.value : f)))}
              />
              <button
                type="button"
                title="Remove this field"
                onClick={() => onChange(fields.filter((_, j) => j !== i))}
                className="p-1.5 rounded text-light-grey hover:text-error hover:bg-error-bg transition"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      {fields.length < API_CUSTOM_FIELD_MAX ? (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon="plus" iconPosition="left" onClick={() => onChange([...fields, ""])}>
            Add Custom Field
          </Button>
          <span className="text-xs text-light-grey">
            {fields.length}/{API_CUSTOM_FIELD_MAX} used
          </span>
        </div>
      ) : (
        <p className="text-xs text-medium-grey">
          All {API_CUSTOM_FIELD_MAX} API custom field slots are in use.
        </p>
      )}
    </div>
  );
}
