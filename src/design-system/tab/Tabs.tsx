export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-light-grey mb-4">
      <div className="flex ">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`pb-2 px-5 text-sm font-bold text-medium-grey transition-colors ${
                isActive
                  ? "text-primary border-b-2 border-primary"
                  : "text-medium-grey hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}