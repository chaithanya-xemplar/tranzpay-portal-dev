import type { FC } from "react";
import tickMark from "../../assets/icon-check-mark.svg";
import transactionIcon from "../../assets/icon-check-mark.svg";
import merchantIcon from "../../assets/icon-check-mark.svg";
import loginIcon from "../../assets/icon-check-mark.svg";

interface ActivityItem {
  id: number;
  icon: string;
  text: string;
  timestamp: string;
}

const activityData: ActivityItem[] = [ 
  {
    id: 1,
    icon: tickMark,
    text: "New User: alice.h@tranzpay.com",
    timestamp: "2 mins ago",
  },
  {
    id: 2,
    icon: transactionIcon,
    text: "Transaction: #TXN-03042 completed",
    timestamp: "5 mins ago",
  },
  {
    id: 3,
    icon: merchantIcon,
    text: "Merchant created: QwikMart",
    timestamp: "18 mins ago",
  },
  {
    id: 4,
    icon: transactionIcon,
    text: "Transaction: #TXN-03042 completed",
    timestamp: "5 mins ago",
  },
  {
    id: 5,
    icon: loginIcon,
    text: "New login: john.d@tranzpay.com",
    timestamp: "5 mins ago",
  },
];

const RecentActivity: FC = () => {
  return (
    <div className="bg-white rounded-lg p-4 w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-center pb-0.5">
        <h2 className="text-base font-bold text-dark-grey">Recent Activity</h2>
        {/* <button className="text-grey-400 hover:text-grey-600 text-sm">•••</button> */}
      </div>

      {/* Timeline */}
      <div className="relative">
        {activityData.map((activity, index) => (
          <div key={activity.id} className="relative pl-8">
            {/* Vertical Line (except for last item) */}
            {index !== activityData.length - 1 && (
              <div className="absolute left-2.5 top-5 h-full w-px bg-grey-200"></div>
            )}

            {/* Icon */}
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center z-10">
                <img
                    src={activity.icon}
                    alt="icon"
                    className="w-2.5 h-2.5"
                />
            </div>

            {/* Text */}
            <div className="flex flex-col mt-4">
              <span className="text-sm font-semibold text-medium-grey">{activity.text}</span>
              <span className="text-[10px] text-light-grey">{activity.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
