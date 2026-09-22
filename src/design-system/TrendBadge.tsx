import type { FC } from "react"
import arrowUp from "../assets/icon-trending-up.svg"
import arrowDown from "../assets/icon-trending-down.svg"

interface TrendBadgeProps {
  value: string;
  positive: boolean;
  className?: string;
  arrowSize?: string; // Optional override
}

const TrendBadge: FC<TrendBadgeProps> = ({
  value,
  positive,
  className = "",
  arrowSize = "w-3 h-3",
}) => {
  return (
    <span
      className={`flex justify-center items-center text-[10px] font-bold px-1 py-0.5 rounded-md ${
        positive
          ? "bg-success-bg text-success"
          : "bg-error-bg text-error"
      } ${className}`}
    >
      <img
        src={positive ? arrowUp : arrowDown}
        alt={positive ? "up" : "down"}
        className={`${arrowSize} mr-1`}
      />
      {value}
    </span>
  );
};

export default TrendBadge;
