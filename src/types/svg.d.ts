declare module "*.svg?react" {
  import type { SVGProps } from "react";
  const Component: React.FC<SVGProps<SVGSVGElement>>;
  export default Component;
}
