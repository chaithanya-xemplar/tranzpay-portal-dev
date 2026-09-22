import type { FC } from "react";
import debitIcon from "../../assets/icon-debit-arrow-down.svg";
import creditIcon from "../../assets/icon-credit-arrow-up.svg";
import Button from "../../design-system/Button";

interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: string;
  type: "inbound" | "outbound";
}

const transactions: Transaction[] = [
  {
    id: 1,
    name: "Sophia Martinez",
    date: "05/09/2025",
    amount: "$150.33",
    type: "outbound",
  },
  {
    id: 2,
    name: "Christian Williams",
    date: "05/07/2025",
    amount: "$200.17",
    type: "inbound",
  },
  {
    id: 3,
    name: "John Wright",
    date: "05/06/2025",
    amount: "$119.72",
    type: "outbound",
  },
  {
    id: 4,
    name: "Daniel Lee",
    date: "04/22/2025",
    amount: "$985.66",
    type: "outbound",
  },
];

const RecentTransactions: FC = () => {
  return (
    <div className="bg-white w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center mb-4">
        <h2 className="text-base font-bold text-dark-grey mr-2">Recent Transactions</h2>
        <span className="text-xs font-bold bg-error-bg text-error px-2 py-0.5 rounded-b">0 Today</span>
      </div>

      {/* Transaction List */}
      <ul className="divide-y divide-dashed divide-grey-200">
        {transactions.map((txn) => (
          <li key={txn.id} className="flex justify-between items-center py-3 border-divider">
            {/* Left */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full ${
                  txn.type === "inbound" ? "bg-error-bg" : "bg-success-bg"
                }`}
              >
                <img
                  src={txn.type === "inbound" ? debitIcon : creditIcon}
                  alt="direction"
                  className="w-3 h-3"
                />
              </div>
              <div className="flex items-center text-sm text-medium-grey font-semibold">
                <span className="mr-2">{txn.name}</span>
                <span className="block text-[10px] text-medium-grey">{txn.date}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-sm font-semibold text-medium-grey">{txn.amount}</div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-4 text-center">
        <Button
            variant="outline"
            icon="chevron-right"
            iconPosition="right"
            className="mx-auto text-xs font-semibold"
            > View All</Button>
      </div>
    </div>
  );
};

export default RecentTransactions;
