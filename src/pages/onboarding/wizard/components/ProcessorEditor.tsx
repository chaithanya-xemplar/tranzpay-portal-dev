import { Field, Icon, Input, SecretInput, Select } from "../../../../design-system";
import type { ProcessorCatalogEntry } from "../../model/constants";
import type { ProcessorCode, ProcessorEntry } from "../../model/types";

interface ProcessorEditorProps {
  processor: ProcessorEntry;
  catalog: ProcessorCatalogEntry[];
  onUpdate: (updates: Partial<ProcessorEntry>) => void;
}

export default function ProcessorEditor({ processor, catalog, onUpdate }: ProcessorEditorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <div className="lg:col-span-3">
        <Select
          label="Processor"
          placeholder="Select a processor"
          options={catalog.map((c) => ({ label: c.label, value: c.code }))}
          value={processor.processorCode}
          onChange={(code) => onUpdate({ processorCode: code as ProcessorCode | "" })}
          required
        />
      </div>
      <div className="lg:col-span-3">
        <Input
          label="Base URL"
          placeholder="https://secure.nmi.com/api"
          value={processor.baseUrl}
          onChange={(e) => onUpdate({ baseUrl: e.target.value })}
        />
      </div>
      <div className="lg:col-span-2">
        <Input
          label="Processor MID"
          placeholder="1234567890"
          value={processor.mid}
          onChange={(e) => onUpdate({ mid: e.target.value })}
          leftIcon={<Icon name="key" />}
        />
      </div>
      <div className="lg:col-span-2">
        <Input
          label="Username"
          autoComplete="off"
          value={processor.username}
          onChange={(e) => onUpdate({ username: e.target.value })}
        />
      </div>
      <div className="md:col-span-2 lg:col-span-2">
        <Field
          label="Password / API Key"
        >
          <SecretInput
            value={processor.password}
            onChange={(password) =>
              onUpdate({ password, passwordSet: password.length > 0 || processor.passwordSet })
            }
            placeholder={processor.passwordSet && !processor.password ? "•••••••• (saved)" : ""}
          />
        </Field>
      </div>
    </div>
  );
}
