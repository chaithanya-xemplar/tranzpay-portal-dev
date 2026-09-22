import { Button, Field, Icon, SecretInput } from "../../../../design-system";
import { generateApiKey } from "../../model/defaults";

interface ApiKeyFieldProps {
  apiKey: string;
  onChange: (apiKey: string) => void;
}

/**
 * Placeholder API key management. A real credential is issued server-side on
 * provisioning; this value is a stand-in the operator can hand off.
 */
export default function ApiKeyField({ apiKey, onChange }: ApiKeyFieldProps) {
  return (
    <div className="space-y-2">
      <Field label="API Key">
        <div className="flex flex-col sm:flex-row gap-3">
          <SecretInput
            value={apiKey}
            readOnly
            placeholder="No key generated yet"
            leftIcon={<Icon name="key" size={16} />}
            className="flex-1"
          />
          <Button
            variant="outline"
            icon="key"
            iconPosition="left"
            onClick={() => onChange(generateApiKey())}
            className="h-11 sm:w-45"
          >
            {apiKey ? "Regenerate Key" : "Generate Key"}
          </Button>
        </div>
      </Field>
      <p className="text-xs text-light-grey">
        Key is masked. Regenerating invalidates the previous key.
      </p>
    </div>
  );
}
