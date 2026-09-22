import { formatCurrency,formatWithSuffix } from "../../utils/formatters";
import { DASHBOARD_ICON_MAP } from "../../constants/constants";


export interface DashboardTile {
  title: string;
  icon: string;
  amount: number;
  lossOrGain: number;
}

export interface TransactionCount {
  monthName: string;
  inboundCount: number;
  outboundCount: number;
}

export interface TransactionsPerHour {
  hour: string;
  transactionsCount: number;
}


export interface StatCardUI {
  title: string;
  amount: string;
  change: string;
  positive: boolean;
  image: string;
}

export interface InboundOutboundUI {
  month: string;
  Inbound: number;
  Outbound: number;
}

export interface TransactionsPerHourUI {
  hour: string;
  value: number;
};

const formatHour = (hour: string) => {
  const [h] = hour.split(":").map(Number);

  const period = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 === 0 ? 12 : h % 12;

  return `${formattedHour} ${period}`;
};

export const mapTransactionsPerHour = (
  data: TransactionsPerHour[] = []
): TransactionsPerHourUI[] => {
  return data
            .sort((a, b) => {
                return parseInt(a.hour) - parseInt(b.hour); // 00–23 safe
            })
            .map((item) => ({
                hour: formatHour(item.hour),
                value: item.transactionsCount,
            }))
};

/* ------------------------------------------------------------------ */
/* Mapping:  StatCards - API -> UI                                                  */
/* ------------------------------------------------------------------ */

/* ----- StatCards ----- */

export const mapDashboardTilesToStatCards = (
  tiles: DashboardTile[] = []
): StatCardUI[] => {
  return tiles
    // 🔥 REMOVE these two
    .filter(
      (tile) =>
        tile.title !== "Today Sale" &&
        tile.title !== "This Week"
    )
    .map((tile) => ({
      title: tile.title,
      amount: formatCurrency(tile.amount, {
        currency: "USD",
      }),
      change: formatWithSuffix(tile.lossOrGain, "%", {
        maximumFractionDigits: 1,
      }),
      positive: tile.lossOrGain >= 0,
      image:
        DASHBOARD_ICON_MAP[tile.title] ||
        DASHBOARD_ICON_MAP["Sales This Month"],
    }));
};

/* ----- InboundOutboundChart ----- */

export const mapTransactionCountsToChart = (
  counts: TransactionCount[] = []
): InboundOutboundUI[] => {
  return counts.map((item) => ({
    month: item.monthName,
    Inbound: item.inboundCount,
    Outbound: item.outboundCount,
  }));
};