import type { FC } from "react";
import TrendBadge from "../../design-system/TrendBadge";

interface StatCardProps {
  title: string;
  amount: string;
  change: string;
  image: string;
  positive?: boolean;
}

const StatCard: FC<StatCardProps> = ({ title, amount, change, image, positive = true }) => {
  return (
    <div className="flex justify-between items-center overflow-hidden">
      {/* Text Section */}
      <div className="space-y-1">
        <p className="text-[10px] text-light-grey">{title}</p>
        <p className="text-lg font-bold text-dark-grey">{amount}</p>
        <TrendBadge className="inline-flex" value={change} positive={positive}/>
      </div>

      {/* Right Circular Image touching the edge */}
      <img
        src={image}
        alt="stat icon"
        className="w-[68px] h-auto rounded-full object-cover ml-auto"
      />
    </div>
  );
};

export default StatCard;
