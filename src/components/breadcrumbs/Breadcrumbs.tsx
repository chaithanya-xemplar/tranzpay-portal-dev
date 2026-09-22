import { Breadcrumb } from "../../design-system";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";

export default function Breadcrumbs() {
  const items = useBreadcrumbs();
  if (!items) return null;
  return <Breadcrumb items={items} className="mb-3" />;
}
