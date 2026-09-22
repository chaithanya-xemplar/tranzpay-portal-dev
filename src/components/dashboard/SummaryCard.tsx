import type { FC } from "react";
import TrendBadge from "../../design-system/TrendBadge";

interface SummaryCardProps {
  image?: string;

  salesTodayAmount: string;
  salesTodayChange: string;
  salesTodayPositive: boolean;

  salesWeekAmount: string;
  salesWeekChange: string;
  salesWeekPositive: boolean;
}

const SummaryCard: FC<SummaryCardProps> = ({
  image,
  salesTodayAmount,
  salesTodayChange,
  salesTodayPositive,
  salesWeekAmount,
  salesWeekChange,
  salesWeekPositive,
}) => {
  return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-blue-400 to-blue-700 text-white shadow w-full">
      
      <img
        src={image}
        alt="User"
        className="w-14 h-14 rounded-full border-2 border-white flex-shrink-0"
      />

      <div className="flex flex-1 justify-evenly items-center gap-4">

        {/* Sales Today */}
        <div className="flex flex-col">
          <span className="text-[10px] text-white/80">Sales Today</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              {salesTodayAmount ?? "NA"}
            </span>
            { 
              salesTodayChange !=="N/A" ?
                <TrendBadge value={salesTodayChange} positive={salesTodayPositive} /> : ""
            }
          </div>
        </div>

        {/* Sales This Week */}
        <div className="flex flex-col">
          <span className="text-[10px] text-white/80">Sales This Week</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              {salesWeekAmount ?? "NA"}
            </span>
            {
              salesWeekChange !=="N/A" ? 
                <TrendBadge value={salesWeekChange} positive={salesWeekPositive} /> : ""
            }
          </div>
        </div>

      </div>
    </div>
  );
};

export default SummaryCard;