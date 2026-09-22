import { useState, useRef, useEffect, useMemo } from "react";
import {
  Button,
  Input,
  TextArea,
  Select,
  Checkbox,
  Radio,
  Toggle,
  Modal,
  Drawer,
  Badge,
  Tooltip,
  Card,
  FieldError,
  Field,
  Pill,
  SectionTitle,
  Collapse,
  ToggleRow,
  Icon,
  AddressBlock,
  PersonFields,
  Combobox,
  RichText,
  LogoUpload,
  GatewayTable,
  Alert,
  Spinner,
  Skeleton,
  EmptyState,
  Avatar,
  Breadcrumb,
  WizardShell,
  SegmentToggle,
  TimePicker,
  SecretInput,
  PriorityList,
} from "../../design-system";
import type { WizardStep } from "../../design-system";
import type { SelectOption, GatewayColumn, TimeValue, PriorityItem } from "../../design-system";

// ── Data ────────────────────────────────────────────────
const selectOptions: SelectOption[] = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { label: "Option C", value: "c" },
];

const comboOptions = [
  { label: "Alabama", value: "AL" }, { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" }, { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" }, { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" }, { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" }, { label: "Georgia", value: "GA" },
];

interface GatewayRow { id: number; name: string; type: string; status: string }
const initialGatewayRows: GatewayRow[] = [
  { id: 1, name: "Stripe", type: "Credit Card", status: "Active" },
  { id: 2, name: "PayPal", type: "Digital Wallet", status: "Active" },
  { id: 3, name: "Dwolla", type: "ACH", status: "Inactive" },
];

const iconNames = [
  "chevron-down", "chevron-up", "chevron-left", "chevron-right",
  "x", "check", "search", "plus", "minus", "edit",
  "trash", "save", "upload", "download", "alert-circle",
  "info", "warning", "check-circle", "eye", "eye-off",
  "lock", "unlock", "mail", "phone", "map-pin",
  "building", "user", "users", "settings", "refresh",
  "filter", "sort", "arrow-up", "arrow-down",
  "more-horizontal", "more-vertical", "file", "image",
  "bold", "italic", "underline", "list",
  "copy", "key", "shield", "grip", "bank", "card", "layers",
] as const;

const wizardSteps: WizardStep[] = [
  {
    id: "details",
    title: "Details",
    description: "Basic information",
    children: [
      { id: "general", title: "General Info" },
      { id: "contact", title: "Contact Info" },
    ],
  },
  { id: "processing", title: "Processing", description: "Gateway & fees" },
  { id: "reporting", title: "Reporting", description: "Statements & exports" },
  {
    id: "compliance",
    title: "Compliance",
    description: "Documents & verification",
    children: [
      { id: "docs", title: "Documents" },
      { id: "signatures", title: "Signatures" },
    ],
  },
  { id: "review", title: "Review", description: "Final review & activate" },
];

const sections = [
  { id: "button", label: "Button", group: "Inputs" },
  { id: "input", label: "Input", group: "Inputs" },
  { id: "textarea", label: "TextArea", group: "Inputs" },
  { id: "select", label: "Select", group: "Inputs" },
  { id: "checkbox", label: "Checkbox", group: "Selection" },
  { id: "radio", label: "Radio", group: "Selection" },
  { id: "toggle", label: "Toggle", group: "Selection" },
  { id: "toggle-row", label: "ToggleRow", group: "Selection" },
  { id: "combobox", label: "Combobox", group: "Inputs" },
  { id: "badge", label: "Badge", group: "Display" },
  { id: "pill", label: "Pill", group: "Display" },
  { id: "field", label: "Field", group: "Layout" },
  { id: "section-title", label: "SectionTitle", group: "Layout" },
  { id: "collapse", label: "Collapse", group: "Layout" },
  { id: "icon", label: "Icon", group: "Display" },
  { id: "tooltip", label: "Tooltip", group: "Overlay" },
  { id: "modal", label: "Modal", group: "Overlay" },
  { id: "drawer", label: "Drawer", group: "Overlay" },
  { id: "field-error", label: "FieldError", group: "Feedback" },
  { id: "address", label: "AddressBlock", group: "Composites" },
  { id: "person", label: "PersonFields", group: "Composites" },
  { id: "richtext", label: "RichText", group: "Composites" },
  { id: "logo", label: "LogoUpload", group: "Composites" },
  { id: "gateway", label: "GatewayTable", group: "Composites" },
  { id: "segment-toggle", label: "SegmentToggle", group: "Selection" },
  { id: "time-picker", label: "TimePicker", group: "Inputs" },
  { id: "secret-input", label: "SecretInput", group: "Inputs" },
  { id: "priority-list", label: "PriorityList", group: "Composites" },
  { id: "alert", label: "Alert", group: "Feedback" },
  { id: "spinner", label: "Spinner", group: "Feedback" },
  { id: "skeleton", label: "Skeleton", group: "Feedback" },
  { id: "empty-state", label: "EmptyState", group: "Feedback" },
  { id: "avatar", label: "Avatar", group: "Display" },
  { id: "breadcrumb", label: "Breadcrumb", group: "Display" },
  { id: "wizard", label: "WizardShell", group: "Composites" },
];

const groups = ["Inputs", "Selection", "Display", "Layout", "Overlay", "Feedback", "Composites"];

export default function DesignSystemPage() {
  // ── State ──
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("button");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState("1");
  const [toggleChecked, setToggleChecked] = useState(false);
  const [toggleRow1, setToggleRow1] = useState(true);
  const [toggleRow2, setToggleRow2] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const [comboValue, setComboValue] = useState("");
  const [richTextValue, setRichTextValue] = useState("");
  const [logoValue, setLogoValue] = useState<string | null>(null);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", state: "", zip: "" });
  const [person, setPerson] = useState({ firstName: "", lastName: "", title: "", email: "", phone: "" });
  const [gatewayRows, setGatewayRows] = useState<GatewayRow[]>(initialGatewayRows);
  const [segmentValue, setSegmentValue] = useState<"existing" | "new">("existing");
  const [pricingValue, setPricingValue] = useState<"traditional" | "convenience">("traditional");
  const [timeValue, setTimeValue] = useState<TimeValue>({ hour: "11", minute: "30", meridiem: "PM" });
  const [secretValue, setSecretValue] = useState("sk_pending_h29XkQ81mZtA4bWc");
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([
    { id: "p1", label: "PXP", meta: <Pill variant="info">CC + ACH</Pill> },
    { id: "p2", label: "NMI", meta: <Pill variant="info">CC</Pill> },
    { id: "p3", label: "TSYS", meta: <Pill variant="info">CC</Pill>, disabled: true },
  ]);

  // Wizard state
  const wizardStepIds = wizardSteps.flatMap((s) => s.children ? [s.id, ...s.children.map((c) => c.id)] : [s.id]);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [wizardStatus, setWizardStatus] = useState<Record<string, "idle" | "active" | "complete" | "error">>(() =>
    Object.fromEntries(wizardStepIds.map((id, i) => [id, i === 0 ? "active" : "idle"]))
  );
  const [wizardSaving, setWizardSaving] = useState(false);
  const [wizardSavedAt, setWizardSavedAt] = useState<Date | null>(null);
  const currentWizardStepId = wizardStepIds[wizardStepIndex];
  const isLastWizardStep = wizardStepIndex === wizardStepIds.length - 1;

  const goWizardStep = (stepId: string) => {
    const idx = wizardStepIds.indexOf(stepId);
    if (idx >= 0) {
      setWizardStepIndex(idx);
      setWizardStatus((prev) => {
        const next = { ...prev };
        // Mark current as complete if moving forward past it
        wizardStepIds.forEach((id, i) => {
          if (i < idx && next[id] === "active") next[id] = "complete";
        });
        next[currentWizardStepId] = prev[currentWizardStepId] === "complete" ? "complete" : "complete";
        next[stepId] = "active";
        return next;
      });
    }
  };

  const wizardNext = () => {
    if (wizardStepIndex < wizardStepIds.length - 1) {
      goWizardStep(wizardStepIds[wizardStepIndex + 1]);
    }
  };

  const wizardBack = () => {
    if (wizardStepIndex > 0) {
      setWizardStepIndex((i) => i - 1);
      setWizardStatus((prev) => {
        const next = { ...prev };
        next[wizardStepIds[wizardStepIndex]] = "idle";
        next[wizardStepIds[wizardStepIndex - 1]] = "active";
        return next;
      });
    }
  };

  const wizardSimulateSave = () => {
    setWizardSaving(true);
    setTimeout(() => {
      setWizardSaving(false);
      setWizardSavedAt(new Date());
    }, 1500);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Intersection Observer for active section ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // ── Scroll to section ──
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Filter sections by search ──
  const filteredSections = useMemo(() => {
    if (!search) return sections;
    const q = search.toLowerCase();
    return sections.filter((s) => s.label.toLowerCase().includes(q) || s.group.toLowerCase().includes(q));
  }, [search]);

  // ── Handlers ──
  const handleAddressChange = (field: keyof typeof address, value: string) =>
    setAddress((p) => ({ ...p, [field]: value }));
  const handlePersonChange = (field: keyof typeof person, value: string) =>
    setPerson((p) => ({ ...p, [field]: value }));

  const gatewayColumns: GatewayColumn<GatewayRow>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "type", header: "Type", render: (r) => r.type },
    {
      key: "status",
      header: "Status",
      render: (r) => <Pill variant={r.status === "Active" ? "success" : "warning"}>{r.status}</Pill>,
    },
  ];

  return (
    <div className="flex gap-6 pb-10 relative">
      {/* ── Sidebar TOC ── */}
      <aside
        className={`shrink-0 transition-all duration-300 ${
          sidebarOpen ? "w-56" : "w-0 overflow-hidden"
        }`}
      >
        <div className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin space-y-6">
          {/* Search */}
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-light-grey pointer-events-none" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs border border-divider rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Groups */}
          {groups.map((group) => {
            const groupSections = filteredSections.filter((s) => s.group === group);
            if (groupSections.length === 0) return null;
            return (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-light-grey mb-1.5">{group}</p>
                <div className="flex flex-col gap-0.5">
                  {groupSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-md transition ${
                        activeSection === s.id
                          ? "bg-primary_light2 text-primary font-semibold"
                          : "text-medium-grey hover:bg-divider2"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen((p) => !p)}
        className="shrink-0 self-start mt-1 p-1.5 rounded-md text-light-grey hover:text-dark-grey hover:bg-divider2 transition"
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Icon name={sidebarOpen ? "chevron-left" : "chevron-right"} size={16} />
      </button>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 space-y-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-primary_light2 rounded-xl px-6 py-8">
          <h1 className="text-3xl font-bold text-dark-grey">Design System</h1>
          <p className="text-sm text-light-grey mt-1">
            {sections.length} components · Presentational &bull; Controlled &bull; Reusable
          </p>
        </div>

        <article id="button" ref={(el) => { sectionRefs.current["button"] = el; }}>
          <Section title="Button" subtitle="Variants, sizes, loading & icon states">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">Variants</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">Sizes</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button loading>Loading</Button>
                <Button loading variant="outline">Loading</Button>
                <Button loading variant="danger">Loading</Button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button disabled>Disabled</Button>
                <Button disabled variant="outline">Disabled</Button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button icon="plus">Icon Right</Button>
                <Button icon="plus" iconPosition="left" variant="outline">Icon Left</Button>
              </div>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* INPUT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="input" ref={(el) => { sectionRefs.current["input"] = el; }}>
          <Section title="Input" subtitle="Text entry with label, error, icon & disabled states">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <Input label="Default" placeholder="Placeholder" />
              <Input label="With Error" placeholder="Bad value" error="This field is required" />
              <Input label="With Icon" placeholder="Search..." leftIcon={<Icon name="search" />} />
              <Input label="Disabled" disabled defaultValue="Disabled value" />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TEXTAREA */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="textarea" ref={(el) => { sectionRefs.current["textarea"] = el; }}>
          <Section title="TextArea" subtitle="Multi-line text input">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <TextArea label="Description" placeholder="Enter text..." rows={4} />
              <TextArea label="With Error" error="Must be at least 10 characters" rows={4} />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SELECT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="select" ref={(el) => { sectionRefs.current["select"] = el; }}>
          <Section title="Select" subtitle="Dropdown menu">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <Select label="Choose Option" options={selectOptions} placeholder="Select..." onChange={setSelectValue} value={selectValue} />
              <Select label="With Error" options={selectOptions} error="Please select an option" />
              <Select label="Disabled" options={selectOptions} disabled />
            </div>
            <p className="text-xs text-light-grey mt-1">Selected: <span className="font-mono">{selectValue || "(none)"}</span></p>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* CHECKBOX */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="checkbox" ref={(el) => { sectionRefs.current["checkbox"] = el; }}>
          <Section title="Checkbox" subtitle="Boolean toggle with label">
            <div className="flex flex-col gap-2">
              <Checkbox label="Unchecked" checked={checkboxChecked} onChange={setCheckboxChecked} />
              <Checkbox label="Checked" checked={true} onChange={() => {}} />
              <Checkbox label="Disabled" checked={false} disabled />
              <Checkbox label="Disabled & Checked" checked={true} disabled />
            </div>
            <p className="text-xs text-light-grey mt-1">State: <span className="font-mono">{checkboxChecked ? "checked" : "unchecked"}</span></p>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* RADIO */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="radio" ref={(el) => { sectionRefs.current["radio"] = el; }}>
          <Section title="Radio" subtitle="Single-select from a group">
            <div className="flex flex-col gap-2">
              <Radio name="rg" label="Option 1" value="1" checked={radioValue === "1"} onChange={setRadioValue} />
              <Radio name="rg" label="Option 2" value="2" checked={radioValue === "2"} onChange={setRadioValue} />
              <Radio name="rg" label="Option 3 (disabled)" value="3" checked={radioValue === "3"} onChange={setRadioValue} disabled />
            </div>
            <p className="text-xs text-light-grey mt-1">Selected: <span className="font-mono">{radioValue}</span></p>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TOGGLE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="toggle" ref={(el) => { sectionRefs.current["toggle"] = el; }}>
          <Section title="Toggle" subtitle="Switch control">
            <div className="flex flex-col gap-2">
              <Toggle label="Notifications" checked={toggleChecked} onChange={setToggleChecked} />
              <Toggle label="Enabled" checked={true} onChange={() => {}} />
              <Toggle label="Disabled" checked={false} disabled />
            </div>
            <p className="text-xs text-light-grey mt-1">State: <span className="font-mono">{toggleChecked ? "on" : "off"}</span></p>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TOGGLE ROW */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="toggle-row" ref={(el) => { sectionRefs.current["toggle-row"] = el; }}>
          <Section title="ToggleRow" subtitle="Labeled settings row with toggle">
            <div className="max-w-lg space-y-2">
              <ToggleRow label="Email Notifications" description="Receive email alerts" checked={toggleRow1} onChange={setToggleRow1} />
              <ToggleRow label="Two-Factor Auth" description="Add extra security" checked={toggleRow2} onChange={setToggleRow2} />
              <ToggleRow label="Legacy Mode" description="No longer available" checked={false} onChange={setToggleRow2} disabled />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* COMBOBOX */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="combobox" ref={(el) => { sectionRefs.current["combobox"] = el; }}>
          <Section title="Combobox" subtitle="Type-ahead with filtering & empty state">
            <div className="max-w-xs">
              <Combobox label="Select State" options={comboOptions} value={comboValue} onChange={setComboValue} placeholder="Type to search..." />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* BADGE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="badge" ref={(el) => { sectionRefs.current["badge"] = el; }}>
          <Section title="Badge" subtitle="Inline status indicator">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge>Default</Badge>
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="error">Failed</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* PILL */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="pill" ref={(el) => { sectionRefs.current["pill"] = el; }}>
          <Section title="Pill" subtitle="Rounded status badge">
            <div className="flex flex-wrap gap-3 items-center">
              <Pill variant="success">Active</Pill>
              <Pill variant="warning">Pending</Pill>
              <Pill variant="error">Failed</Pill>
              <Pill variant="info">Info</Pill>
              <Pill variant="neutral">Neutral</Pill>
              <Pill variant="primary">Primary</Pill>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* FIELD */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="field" ref={(el) => { sectionRefs.current["field"] = el; }}>
          <Section title="Field" subtitle="Label/required/error/helper wrapper">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <Field label="Standard" id="f1"><input id="f1" className="input-base-form" placeholder="Wrapped input" /></Field>
              <Field label="Required" required id="f2"><input id="f2" className="input-base-form" placeholder="Required field" /></Field>
              <Field label="With Error" error="This field has an error" id="f3"><input id="f3" className="input-base-form error" placeholder="Error state" /></Field>
              <Field label="With Helper" helper="Helper text for guidance" id="f4"><input id="f4" className="input-base-form" placeholder="Helper below" /></Field>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION TITLE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="section-title" ref={(el) => { sectionRefs.current["section-title"] = el; }}>
          <Section title="SectionTitle" subtitle="Section heading with optional subtitle & action">
            <div className="space-y-4">
              <SectionTitle title="Basic Section" />
              <SectionTitle title="With Subtitle" subtitle="Additional context" />
              <SectionTitle title="With Action" subtitle="Button on the right" action={<Button size="sm">Edit</Button>} />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* COLLAPSE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="collapse" ref={(el) => { sectionRefs.current["collapse"] = el; }}>
          <Section title="Collapse" subtitle="Expand/collapse accordion">
            <div className="max-w-lg space-y-2">
              <Collapse title="Expandable Section">
                <p className="text-sm text-medium-grey">Click the header to toggle visibility. Useful for grouping optional settings.</p>
              </Collapse>
              <Collapse title="Another Section" defaultOpen={false}>
                <p className="text-sm text-medium-grey">This one starts collapsed.</p>
              </Collapse>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ICON */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="icon" ref={(el) => { sectionRefs.current["icon"] = el; }}>
          <Section title="Icon" subtitle={`${iconNames.length} SVG icons — usage: <Icon name="..." />`}>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
              {iconNames.map((name) => (
                <div key={name} className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-divider hover:border-primary_light1 hover:shadow-sm transition">
                  <Icon name={name} size={18} className="text-dark-grey" />
                  <span className="text-[9px] text-light-grey text-center leading-tight">{name}</span>
                </div>
              ))}
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TOOLTIP */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="tooltip" ref={(el) => { sectionRefs.current["tooltip"] = el; }}>
          <Section title="Tooltip" subtitle="Hover tooltip with 4 positions">
            <div className="flex flex-wrap gap-16 items-center pt-6">
              <Tooltip content="Top tooltip" position="top"><Button size="sm" variant="outline">Hover Top</Button></Tooltip>
              <Tooltip content="Bottom tooltip" position="bottom"><Button size="sm" variant="outline">Hover Bottom</Button></Tooltip>
              <Tooltip content="Left tooltip" position="left"><Button size="sm" variant="outline">Hover Left</Button></Tooltip>
              <Tooltip content="Right tooltip" position="right"><Button size="sm" variant="outline">Hover Right</Button></Tooltip>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* MODAL */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="modal" ref={(el) => { sectionRefs.current["modal"] = el; }}>
          <Section title="Modal" subtitle="Dialog with backdrop, focus trap & Escape dismiss">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal Title">
              <p className="text-sm text-medium-grey mb-4">Modal body content goes here.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Confirm</Button>
              </div>
            </Modal>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* DRAWER */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="drawer" ref={(el) => { sectionRefs.current["drawer"] = el; }}>
          <Section title="Drawer" subtitle="Slide-in panel with backdrop">
            <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Drawer Title">
              <p className="text-sm text-medium-grey">Drawer content goes here.</p>
            </Drawer>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* FIELD ERROR */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="field-error" ref={(el) => { sectionRefs.current["field-error"] = el; }}>
          <Section title="FieldError" subtitle="Conditional error message — renders nothing when empty">
            <div className="flex flex-col gap-2 max-w-xs">
              <FieldError message="This is an inline error message" />
              <FieldError message="" />
              <p className="text-xs text-light-grey">(empty message renders nothing — no layout shift)</p>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ADDRESS BLOCK */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="address" ref={(el) => { sectionRefs.current["address"] = el; }}>
          <Section title="AddressBlock" subtitle="line1/line2/city/state/zip grid">
            <AddressBlock values={address} onChange={handleAddressChange} />
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* PERSON FIELDS */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="person" ref={(el) => { sectionRefs.current["person"] = el; }}>
          <Section title="PersonFields" subtitle="name/title/email/phone grid">
            <PersonFields values={person} onChange={handlePersonChange} />
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* RICH TEXT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="richtext" ref={(el) => { sectionRefs.current["richtext"] = el; }}>
          <Section title="RichText" subtitle="Minimal WYSIWYG editor">
            <div className="max-w-lg">
              <RichText label="Description" value={richTextValue} onChange={setRichTextValue} />
              <details className="mt-2">
                <summary className="text-xs text-light-grey cursor-pointer hover:text-medium-grey">Show HTML output</summary>
                <pre className="text-xs text-medium-grey mt-1 p-2 bg-divider2 rounded max-h-32 overflow-auto">{richTextValue || "(empty)"}</pre>
              </details>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* LOGO UPLOAD */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="logo" ref={(el) => { sectionRefs.current["logo"] = el; }}>
          <Section title="LogoUpload" subtitle="Drag-drop, JPG/PNG/GIF, ≤1MB, preview">
            <div className="max-w-xs">
              <LogoUpload label="Company Logo" value={logoValue} onChange={setLogoValue} />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* GATEWAY TABLE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="gateway" ref={(el) => { sectionRefs.current["gateway"] = el; }}>
          <Section title="GatewayTable" subtitle="Editable table with drag-and-drop reordering">
            <GatewayTable<GatewayRow>
              columns={gatewayColumns}
              rows={gatewayRows}
              onAdd={() => {
                setGatewayRows((prev) => [...prev, { id: Date.now(), name: "New Gateway", type: "ACH", status: "Inactive" }]);
              }}
              onEdit={(row, i) => {
                const name = prompt("Edit name:", row.name);
                if (name) setGatewayRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, name } : r)));
              }}
              onDelete={(_, i) => setGatewayRows((prev) => prev.filter((_, idx) => idx !== i))}
              onReorder={(from, to) =>
                setGatewayRows((prev) => {
                  const next = [...prev];
                  const [m] = next.splice(from, 1);
                  next.splice(to, 0, m);
                  return next;
                })
              }
            />
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SEGMENT TOGGLE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="segment-toggle" ref={(el) => { sectionRefs.current["segment-toggle"] = el; }}>
          <Section title="SegmentToggle" subtitle="Segmented control for mutually exclusive options">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <SegmentToggle
                  options={[
                    { label: "Select existing", value: "existing" },
                    { label: "Create new", value: "new" },
                  ]}
                  value={segmentValue}
                  onChange={setSegmentValue}
                />
                <SegmentToggle
                  size="sm"
                  options={[
                    { label: "Traditional", value: "traditional" },
                    { label: "Convenience", value: "convenience" },
                  ]}
                  value={pricingValue}
                  onChange={setPricingValue}
                />
              </div>
              <p className="text-xs text-light-grey">Selected: {segmentValue} · {pricingValue}</p>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TIME PICKER */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="time-picker" ref={(el) => { sectionRefs.current["time-picker"] = el; }}>
          <Section title="TimePicker" subtitle="Hour / minute / AM-PM selects with optional timezone suffix">
            <div className="space-y-4">
              <TimePicker value={timeValue} onChange={setTimeValue} suffix="PT" />
              <TimePicker value={timeValue} onChange={setTimeValue} disabled />
              <p className="text-xs text-light-grey">
                Value: {timeValue.hour}:{timeValue.minute} {timeValue.meridiem}
              </p>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECRET INPUT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="secret-input" ref={(el) => { sectionRefs.current["secret-input"] = el; }}>
          <Section title="SecretInput" subtitle="Masked input with eye toggle — SSNs, passwords, API keys">
            <div className="space-y-4 max-w-sm">
              <Field label="API Key" id="ds-secret">
                <SecretInput id="ds-secret" value={secretValue} onChange={setSecretValue} />
              </Field>
              <Field label="Read-only" id="ds-secret-ro">
                <SecretInput id="ds-secret-ro" value="sk_pending_readonly0000" readOnly />
              </Field>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* PRIORITY LIST */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="priority-list" ref={(el) => { sectionRefs.current["priority-list"] = el; }}>
          <Section title="PriorityList" subtitle="Drag-to-reorder ranked list — topmost enabled item is primary">
            <div className="max-w-md">
              <PriorityList
                items={priorityItems}
                onReorder={(from, to) =>
                  setPriorityItems((prev) => {
                    const next = [...prev];
                    const [m] = next.splice(from, 1);
                    next.splice(to, 0, m);
                    return next;
                  })
                }
              />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ALERT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="alert" ref={(el) => { sectionRefs.current["alert"] = el; }}>
          <Section title="Alert" subtitle="Inline notification banners with dismiss">
            <div className="space-y-3 max-w-lg">
              <Alert variant="success">Payment processed successfully.</Alert>
              <Alert variant="error">Transaction failed. Please try again.</Alert>
              <Alert variant="warning">Your session will expire in 5 minutes.</Alert>
              <Alert variant="info" onDismiss={() => {}}>New update available. Click to refresh.</Alert>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SPINNER */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="spinner" ref={(el) => { sectionRefs.current["spinner"] = el; }}>
          <Section title="Spinner" subtitle="Loading indicator — sm / md / lg">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <Spinner size="sm" />
                <span className="text-[10px] text-light-grey">sm</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Spinner size="md" />
                <span className="text-[10px] text-light-grey">md</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Spinner size="lg" />
                <span className="text-[10px] text-light-grey">lg</span>
              </div>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SKELETON */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="skeleton" ref={(el) => { sectionRefs.current["skeleton"] = el; }}>
          <Section title="Skeleton" subtitle="Content placeholders during loading">
            <div className="space-y-6 max-w-lg">
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">Text (3 lines)</p>
                <Skeleton variant="text" lines={3} />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton variant="circle" width="3rem" />
                <div className="flex-1">
                  <Skeleton variant="text" lines={2} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">Card</p>
                <Skeleton variant="card" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">Table row</p>
                <Skeleton variant="table-row" />
                <Skeleton variant="table-row" />
                <Skeleton variant="table-row" />
              </div>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* EMPTY STATE */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="empty-state" ref={(el) => { sectionRefs.current["empty-state"] = el; }}>
          <Section title="EmptyState" subtitle="Reusable empty state with icon, text & action">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <EmptyState
                title="No transactions yet"
                description="Transactions will appear here once they are processed."
                icon="file"
              />
              <EmptyState
                title="No results found"
                description="Try adjusting your search or filters."
                icon="search"
                action={<Button size="sm" variant="outline">Clear Filters</Button>}
              />
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* AVATAR */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="avatar" ref={(el) => { sectionRefs.current["avatar"] = el; }}>
          <Section title="Avatar" subtitle="User avatar with image, initials or fallback icon">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">Sizes</p>
                <div className="flex items-center gap-4">
                  <Avatar size="sm" name="Alice Johnson" />
                  <Avatar size="md" name="Bob Smith" />
                  <Avatar size="lg" name="Carol Williams" />
                  <Avatar size="xl" name="Dave Brown" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider mb-2">With image / initials / fallback</p>
                <div className="flex items-center gap-4">
                  <Avatar size="md" name="John Doe" />
                  <Avatar size="md" name="Jane Miller" />
                  <Avatar size="md" />
                  <Avatar size="md" name="Robert" />
                </div>
              </div>
            </div>
          </Section>
        </article>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* BREADCRUMB */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="breadcrumb" ref={(el) => { sectionRefs.current["breadcrumb"] = el; }}>
          <Section title="Breadcrumb" subtitle="Navigation breadcrumb trail">
            <div className="space-y-3">
              <Breadcrumb items={[{ label: "Home" }, { label: "Settings" }, { label: "Profile" }]} />
              <Breadcrumb
                items={[
                  { label: "Merchants", to: "/merchants" },
                  { label: "Acme Corp", to: "/merchants" },
                  { label: "Processors" },
                ]}
              />
            </div>
          </Section>
        </article>
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* WIZARD SHELL */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <article id="wizard" ref={(el) => { sectionRefs.current["wizard"] = el; }}>
          <Section title="WizardShell" subtitle="Multi-step wizard with stepper, header, footer & auto-save">
            <div className="h-[500px] border border-divider rounded-xl overflow-hidden">
              <WizardShell
                steps={wizardSteps}
                currentStepId={currentWizardStepId}
                stepStatus={wizardStatus}
                onStepChange={goWizardStep}
                onClose={() => alert("Close wizard")}
                onSaveExit={() => { wizardSimulateSave(); alert("Saved & exited — draft resumable"); }}
                onNext={wizardNext}
                onBack={wizardBack}
                onActivate={isLastWizardStep ? () => alert("Activated!") : undefined}
                isLastStep={isLastWizardStep}
                isSaving={wizardSaving}
                savedAt={wizardSavedAt}
                showJsonButton
                onToggleJson={() => {
                  navigator.clipboard?.writeText(JSON.stringify({ step: currentWizardStepId, status: wizardStatus }, null, 2));
                  alert("Step data copied to clipboard");
                }}
              >
                <div className="max-w-xl">
                  <p className="text-sm font-semibold text-dark-grey mb-1">
                    Step: <span className="font-mono text-primary">{currentWizardStepId}</span>
                  </p>
                  <p className="text-xs text-light-grey mb-4">
                    Index {wizardStepIndex + 1} of {wizardStepIds.length}
                  </p>

                  {currentWizardStepId === "general" && (
                    <div className="space-y-3">
                      <Input label="Company Name" placeholder="Acme Corp" />
                      <Input label="Website" placeholder="https://acme.com" />
                    </div>
                  )}
                  {currentWizardStepId === "contact" && (
                    <PersonFields
                      values={{ firstName: "", lastName: "", title: "", email: "", phone: "" }}
                      onChange={() => {}}
                    />
                  )}
                  {currentWizardStepId === "details" && (
                    <p className="text-sm text-medium-grey">Select a sub-step from the sidebar.</p>
                  )}
                  {currentWizardStepId === "processing" && (
                    <div className="space-y-3">
                      <p className="text-sm text-medium-grey">Configure payment gateways and fee structures.</p>
                      <Select label="Default Gateway" options={[{ label: "Stripe", value: "stripe" }, { label: "PayPal", value: "paypal" }]} placeholder="Select..." />
                    </div>
                  )}
                  {currentWizardStepId === "reporting" && (
                    <div className="space-y-3">
                      <ToggleRow label="Monthly Statements" description="Auto-generate monthly reports" checked={false} onChange={() => {}} />
                      <ToggleRow label="Email Exports" description="Send CSV exports via email" checked={true} onChange={() => {}} />
                    </div>
                  )}
                  {currentWizardStepId === "compliance" && (
                    <p className="text-sm text-medium-grey">Select a sub-step from the sidebar.</p>
                  )}
                  {currentWizardStepId === "docs" && (
                    <LogoUpload label="Upload W-9 Form" value={null} onChange={() => {}} />
                  )}
                  {currentWizardStepId === "signatures" && (
                    <div className="space-y-3">
                      <p className="text-sm text-medium-grey">Authorized signatory details.</p>
                      <PersonFields values={{ firstName: "Jane", lastName: "Doe", title: "CFO", email: "jane@acme.com", phone: "" }} onChange={() => {}} />
                    </div>
                  )}
                  {currentWizardStepId === "review" && (
                    <div className="space-y-3">
                      <Alert variant="info">Review all information before activating.</Alert>
                      <div className="bg-white border border-divider rounded-lg p-4 text-sm text-medium-grey">
                        All steps are complete. Click Activate to finish.
                      </div>
                    </div>
                  )}
                </div>
              </WizardShell>
            </div>
          </Section>
        </article>
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 border border-divider shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-baseline gap-2 mb-4 pb-3 border-b border-divider">
        <h2 className="text-base font-bold text-dark-grey">{title}</h2>
        {subtitle && <span className="text-[11px] text-light-grey hidden sm:inline">{subtitle}</span>}
      </div>
      {children}
    </Card>
  );
}
