import type { FC } from "react";

interface ActionItem {
  title: string;
  subtitle: string;
  variant?: "warning" | "danger" | "neutral";
}

const bgColorMap: Record<string, string> = {
  warning: "bg-warning-bg",
  danger: "bg-error-bg",
  neutral: "bg-neutral-bg",
};

const ActionItems: FC = () => {
  const items: ActionItem[] = [
    { title: "Review user K.Smith", subtitle: "Pending", variant: "danger" },
    { title: "Assign merchant onboarding", subtitle: "Due Today", variant: "warning" },
    { title: "Resolve payment issue", subtitle: "Pending", variant: "danger" },
    { title: "Update user profiles", subtitle: "Backlog", variant: "neutral" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-dark-grey">Action Items</h2>
        {/* <button className="text-grey-400 text-xl">⋯</button> */}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item} + ${index}`}
            className={`pr-2 pl-3.5 py-2 rounded-md ${bgColorMap[item.variant || "neutral"]}`}
          >
            <p className="text-sm font-semibold text-medium-grey">{item.title}</p>
            <p className="text-[10px] text-medium-grey">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionItems;
