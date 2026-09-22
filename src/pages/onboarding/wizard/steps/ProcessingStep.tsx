import { useState } from "react";
import clsx from "clsx";
import {
  Button,
  Field,
  Icon,
  Input,
  PriorityList,
  SegmentToggle,
  Select,
  TimePicker,
  Toggle,
} from "../../../../design-system";
import { useToast } from "../../../../design-system/toast/ToastContext";
import { formatIntegerInput } from "../../../../utils/formatters";
import { BATCH_HOURS, BATCH_MINUTES, PROCESSOR_CATALOG, processorLabel, processorRails } from "../../model/constants";
import { createProcessorEntry } from "../../model/defaults";
import type {
  OnboardingMerchant,
  ProcessingConfig,
  ProcessorEntry,
  RailConfig,
} from "../../model/types";
import ProcessorEditor from "../components/ProcessorEditor";
import StepSection from "../components/StepSection";
import type { StepProps } from "../stepProps";

type Rail = "cc" | "ach";

const RAIL_LABELS: Record<Rail, string> = { cc: "Credit Card", ach: "ACH" };
const BATCH_CLOSE_TIME_HELPER =
  "Entered in PT. Reports display in each user's own time zone.";
const RAIL_CONFIGURATION_TITLES: Record<Rail, string> = {
  cc: "Credit Card Configuration",
  ach: "ACH Configuration",
};

export default function ProcessingStep({ session, patch, fieldErrors }: StepProps) {
  const { merchants } = session;
  const [selectedId, setSelectedId] = useState<string | null>(merchants[0]?.id ?? null);
  const [editingProcessorId, setEditingProcessorId] = useState<string | null>(null);
  const { toast } = useToast();
  const touched = session.visitedSteps.includes("processing");

  const merchant = merchants.find((m) => m.id === selectedId) ?? merchants[0] ?? null;
  const merchantIndex = merchant ? merchants.findIndex((m) => m.id === merchant.id) : -1;

  if (!merchant) {
    return (
      <>
      {/* <Alert variant="warning">
        Add a merchant in Step 4 before configuring processing.
      </Alert> */}
      <div className="rounded-lg border border-primary_light1/40 bg-gradient-to-br from-blue-50 to-white px-8 py-4 text-xs leading-6 text-dark-grey">
        <strong>No merchants yet.</strong><br/>
        Add at least one merchant on the previous step to configure processing.
      </div>
      </>
    );
  }

  const processing = merchant.processing;
  const err = (path: string) =>
    touched ? fieldErrors[`merchants.${merchantIndex}.processing.${path}`] : undefined;

  const updateProcessing = (updates: Partial<ProcessingConfig>) => {
    patch((d) => ({
      ...d,
      merchants: d.merchants.map((m): OnboardingMerchant =>
        m.id === merchant.id ? { ...m, processing: { ...m.processing, ...updates } } : m
      ),
    }));
  };

  const updateRail = (rail: Rail, updates: Partial<RailConfig>) => {
    updateProcessing({ [rail]: { ...processing[rail], ...updates } } as Partial<ProcessingConfig>);
  };

  const updateProcessor = (id: string, updates: Partial<ProcessorEntry>) => {
    updateProcessing({
      processors: processing.processors.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  /** Keep priority arrays consistent: a processor appears in a rail's order iff its rail flag is on. */
  const syncPriority = (processors: ProcessorEntry[], priority: ProcessingConfig["priority"]) => {
    const next = { ...priority };
    for (const rail of ["cc", "ach"] as const) {
      const railIds = processors.filter((p) => p.rails[rail]).map((p) => p.id);
      next[rail] = [...next[rail].filter((id) => railIds.includes(id)), ...railIds.filter((id) => !next[rail].includes(id))];
    }
    return next;
  };

  const toggleProcessorRail = (processor: ProcessorEntry, rail: Rail) => {
    const turningOn = !processor.rails[rail];
    if (turningOn) {
      if (!processor.processorCode) {
        toast({ variant: "warning", title: "Select a processor first", description: "Pick the processor before enabling rails." });
        return;
      }
      if (!processorRails(processor.processorCode)[rail]) {
        toast({
          variant: "warning",
          title: `${processorLabel(processor.processorCode)} does not support ${RAIL_LABELS[rail]}`,
        });
        return;
      }
    }
    const rails = { ...processor.rails, [rail]: turningOn };
    const enabled = rails.cc || rails.ach ? processor.enabled : false;
    const processors = processing.processors.map((p) =>
      p.id === processor.id ? { ...p, rails, enabled } : p
    );
    updateProcessing({ processors, priority: syncPriority(processors, processing.priority) });
  };

  const toggleProcessorEnabled = (processor: ProcessorEntry, enabled: boolean) => {
    if (enabled && !processor.rails.cc && !processor.rails.ach) {
      toast({ variant: "warning", title: "Enable at least one rail", description: "Turn on CC or ACH support before activating this processor." });
      return;
    }
    updateProcessor(processor.id, { enabled });
  };

  const addProcessor = () => {
    const entry = createProcessorEntry();
    updateProcessing({ processors: [...processing.processors, entry] });
    setEditingProcessorId(entry.id);
  };

  const removeProcessor = (id: string) => {
    const processors = processing.processors.filter((p) => p.id !== id);
    updateProcessing({ processors, priority: syncPriority(processors, processing.priority) });
    if (editingProcessorId === id) setEditingProcessorId(null);
  };

  const reorderRail = (rail: Rail, from: number, to: number) => {
    const order = [...processing.priority[rail]];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    updateProcessing({ priority: { ...processing.priority, [rail]: order } });
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <StepSection title="Merchant" >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Configure processing for"
            options={merchants.map((m, i) => ({ label: m.dba || `Merchant ${i + 1}`, value: m.id }))}
            value={merchant.id}
            onChange={(id) => {
              setSelectedId(id);
              setEditingProcessorId(null);
            }}
          />
          <Field
            label="MID"
            error={err("mid")}
            helper="Required while CC processing is enabled."
            required
          >
            <Input
              placeholder="1234567890"
              value={processing.mid}
              onChange={(e) => updateProcessing({ mid: e.target.value })}
              leftIcon={<Icon name="key" />}
            />
          </Field>
        </div>
      </StepSection>

      <StepSection title="Payment Types">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["cc", "ach"] as const).map((rail) => {
            const config = processing[rail];
            const enabledCount = processing.processors.filter((p) => p.enabled && p.rails[rail]).length;
            return (
              <div
                key={rail}
                className={clsx(
                  "flex items-start justify-between gap-3 border rounded-lg p-4",
                  config.enabled ? "border-primary bg-primary_light2" : "border-divider"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon name={rail === "cc" ? "card" : "bank"} size={18} className="text-primary mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-medium-grey">
                      {RAIL_LABELS[rail]} Processing
                    </h3>
                    <p className="text-xs text-light-grey mt-1">
                      {config.enabled
                        ? `${enabledCount} enabled processor${enabledCount === 1 ? "" : "s"} — settings below`
                        : "Disabled"}
                    </p>
                  </div>
                </div>
                <Toggle checked={config.enabled} onChange={(enabled) => updateRail(rail, { enabled })} />
              </div>
            );
          })}
        </div>
        {err("") && <p className="error-base mt-2">{err("")}</p>}
      </StepSection>

      {(["cc", "ach"] as const).map((rail) => {
        const config = processing[rail];
        if (!config.enabled) return null;
        const railProcessors = processing.priority[rail]
          .map((id) => processing.processors.find((processor) => processor.id === id))
          .filter((processor): processor is ProcessorEntry => Boolean(processor));
        const railLabel = rail === "cc" ? "Card (CC)" : "ACH";
        const merchantLabel = merchant.dba || "this merchant";
        return (
          <StepSection
            key={rail}
            title={
              <span className="inline-flex items-center gap-2">
                <Icon name={rail === "cc" ? "card" : "bank"} size={13} />
                {RAIL_CONFIGURATION_TITLES[rail]}
              </span>
            }
          >
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-grey">
                  <Icon name="info" size={13} className="text-medium-grey" />
                  Batch Close & Pricing
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Field
                    label={`${railLabel} Batch Close Time — PT*`}
                    helper={BATCH_CLOSE_TIME_HELPER}
                  >
                    <TimePicker
                      value={config.batchClose}
                      onChange={(batchClose) => updateRail(rail, { batchClose })}
                      hours={BATCH_HOURS}
                      minutes={BATCH_MINUTES}
                    />
                  </Field>
                  <Field
                    label="Pricing"
                    helper="Traditional — merchant absorbs cost. Convenience — fee added on top of each transaction."
                  >
                    <div className="space-y-3">
                      <SegmentToggle
                        size="sm"
                        options={[
                          { label: "Traditional", value: "traditional" },
                          { label: "Convenience", value: "convenience" },
                        ]}
                        value={config.pricing.model}
                        onChange={(model) => updateRail(rail, { pricing: { ...config.pricing, model } })}
                      />
                      {config.pricing.model === "convenience" && (
                        <div className="flex flex-wrap items-center gap-3">
                          <SegmentToggle
                            size="sm"
                            options={[
                              { label: "%", value: "percent" },
                              { label: "$", value: "flat" },
                            ]}
                            value={config.pricing.format}
                            onChange={(format) =>
                              updateRail(rail, {
                                pricing: {
                                  ...config.pricing,
                                  format,
                                  value:
                                    format === "percent"
                                      ? formatIntegerInput(config.pricing.value)
                                      : config.pricing.value,
                                },
                              })
                            }
                          />
                          <Input
                            placeholder={config.pricing.format === "percent" ? "3" : "2.50"}
                            inputMode={config.pricing.format === "percent" ? "numeric" : "decimal"}
                            containerClassName="w-24"
                            value={config.pricing.value}
                            onChange={(event) =>
                              updateRail(rail, {
                                pricing: {
                                  ...config.pricing,
                                  value:
                                    config.pricing.format === "percent"
                                      ? formatIntegerInput(event.target.value)
                                      : event.target.value,
                                },
                              })
                            }
                          />
                          {config.pricing.value && (
                            <span className="text-xs text-light-grey">
                              = {config.pricing.format === "percent" ? `${config.pricing.value}%` : `$${config.pricing.value}`} fee per transaction
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              <div className="border-t border-divider pt-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-grey">
                  <Icon name="layers" size={13} className="text-medium-grey" />
                  Processor Priority
                </div>
                <p className="text-xs text-light-grey mt-2">
                  Drag to set the order of preference for {merchantLabel}. The{" "}
                  <span className="font-semibold text-medium-grey">topmost enabled</span>{" "}
                  processor is the primary/default; the rest are fallbacks in order.
                </p>
                {railProcessors.length > 0 ? (
                  <PriorityList
                    className="mt-3"
                    primaryLabel="PRIMARY"
                    items={railProcessors.map((processor) => ({
                      id: processor.id,
                      label: processorLabel(processor.processorCode),
                      meta: processor.mid ? (
                        <span className="font-mono text-[11px] text-light-grey">MID {processor.mid}</span>
                      ) : undefined,
                      disabled: !processor.enabled,
                      trailing: (
                        <Toggle
                          checked={processor.enabled}
                          onChange={(enabled) => toggleProcessorEnabled(processor, enabled)}
                        />
                      ),
                    }))}
                    onReorder={(from, to) => reorderRail(rail, from, to)}
                  />
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-divider px-4 py-3 text-xs text-light-grey">
                    <Icon name="info" size={14} />
                    No {rail === "cc" ? "CC" : "ACH"}-capable processors yet. Turn {rail.toUpperCase()} on for a processor in the grid above.
                  </div>
                )}
                {err(`processors.${rail}`) && <p className="error-base mt-2">{err(`processors.${rail}`)}</p>}
              </div>
            </div>
          </StepSection>
        );
      })}

      <StepSection
        title="Processors"
        subtitle={
          <>
            Click the <strong>ACH</strong> / <strong>CC</strong> cells to turn each rail on or off per processor for test.
            Disabled processors stay in the list and keep their priority.
          </>
        }
        action={
          <Button size="sm"  icon="plus" iconPosition="left" className=" bg-primary rounded-md " onClick={addProcessor}>
            Add Processor
          </Button>
        }
      >
        {processing.processors.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 h-[124px] px-4 py-9 text-center text-sm text-medium-grey">
            <Icon name="card" size={26} className="text-medium-grey" />
            <span>No processors yet. Add one to start accepting payments.</span>
          </div>
        ) : (
          <div className="border border-divider rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-divider2 border-b border-divider">
                  {["ID", "Processor", "ACH", "CC", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-medium-grey px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processing.processors.map((p) => {
                  const editing = editingProcessorId === p.id;
                  return (
                    <ProcessorRowGroup
                      key={p.id}
                      processor={p}
                      editing={editing}
                      onToggleEdit={() => setEditingProcessorId(editing ? null : p.id)}
                      onRemove={() => removeProcessor(p.id)}
                      onToggleRail={(rail) => toggleProcessorRail(p, rail)}
                      onToggleEnabled={(enabled) => toggleProcessorEnabled(p, enabled)}
                      onUpdate={(updates) => {
                        // Changing the processor resets rail support to its capabilities.
                        if (updates.processorCode !== undefined) {
                          const rails = processorRails(updates.processorCode);
                          const processors = processing.processors.map((entry) =>
                            entry.id === p.id ? { ...entry, ...updates, rails: { ...rails } } : entry
                          );
                          updateProcessing({ processors, priority: syncPriority(processors, processing.priority) });
                        } else {
                          updateProcessor(p.id, updates);
                        }
                      }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </StepSection>
    </div>
  );
}

interface ProcessorRowGroupProps {
  processor: ProcessorEntry;
  editing: boolean;
  onToggleEdit: () => void;
  onRemove: () => void;
  onToggleRail: (rail: Rail) => void;
  onToggleEnabled: (enabled: boolean) => void;
  onUpdate: (updates: Partial<ProcessorEntry>) => void;
}

function ProcessorRowGroup({
  processor,
  editing,
  onToggleEdit,
  onRemove,
  onToggleRail,
  onToggleEnabled,
  onUpdate,
}: ProcessorRowGroupProps) {
  return (
    <>
      <tr className={clsx("border-b border-divider last:border-b-0", !processor.enabled && "opacity-70")}>
        <td className="px-4 py-2.5 font-mono text-xs text-primary">
          {processor.id}
        </td>
        <td className="px-4 py-2.5 font-semibold text-dark-grey">
          {processor.processorCode ? processorLabel(processor.processorCode) : "New processor"}
        </td>
        {(["ach", "cc"] as const).map((rail) => (
          <td key={rail} className="px-4 py-2.5">
            <button
              type="button"
              onClick={() => onToggleRail(rail)}
              className={clsx(
                "w-7 h-7 rounded-md flex items-center justify-center transition",
                processor.rails[rail]
                  ? "text-success"
                  : "text-light-grey hover:bg-divider2"
              )}
              title={`Toggle ${rail.toUpperCase()} support`}
            >
              {processor.rails[rail] ? <Icon name="check-green" size={13} /> : <span className="text-xs">--</span>}
            </button>
          </td>
        ))}
        <td className="px-4 py-2.5">
          <Toggle
            checked={processor.enabled}
            onChange={onToggleEnabled}
            label={processor.enabled ? "On" : "Off"}
          />
        </td>
        <td className="px-4 py-2.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={onToggleEdit}
              className="p-1.5 rounded text-light-grey hover:text-primary hover:bg-primary_light2 transition"
              title={editing ? "Collapse" : "Edit"}
            >
              <Icon name={editing ? "chevron-up" : "edit"} size={15} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded text-light-grey hover:text-error hover:bg-error-bg transition"
              title="Delete"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-b border-divider last:border-b-0">
          <td colSpan={6} className="px-4 py-4 bg-divider2/40">
            <ProcessorEditor processor={processor} catalog={PROCESSOR_CATALOG} onUpdate={onUpdate} />
          </td>
        </tr>
      )}
    </>
  );
}
