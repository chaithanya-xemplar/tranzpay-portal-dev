import type { ReactNode } from "react";
import { Card, DividerTitle } from "../../../../design-system";

interface StepSectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

/** Card wrapper used by every wizard step section. */
export default function StepSection({ title, subtitle, action, children }: StepSectionProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="min-w-0">
          <DividerTitle title={title} action={action} />
          {subtitle && <p className="text-xs text-light-grey mt-1 pl-7">{subtitle}</p>}
        </div>
      </div>
      <Card className="p-4">
        {children}
      </Card>
    </div>
  );
}
