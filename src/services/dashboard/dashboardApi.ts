// src/services/dashboard/dashboardApi.ts

import { useQuery } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { AxiosResponse } from "axios";
import { mapDashboardTilesToStatCards, mapTransactionCountsToChart, mapTransactionsPerHour } from "./dashboard.mapper";
import type { DashboardTile, TransactionCount, TransactionsPerHour } from "./dashboard.mapper";

/* ------------------------------------------------------------------ */
/* Generic API response                                                */
/* ------------------------------------------------------------------ */

export interface ApiResponse<T = unknown> {
  success: boolean;
  count?: number;
  data?: T;
  request?: Record<string, unknown> | null;
}

export interface DashboardApiData {
  dashboardTiles: DashboardTile[];
  transactionCounts: TransactionCount[];
  transactionsPerHour: TransactionsPerHour[];
}

export type DashboardApiResponse = ApiResponse<DashboardApiData>;


/* ------------------------------------------------------------------ */
/* Raw API call                                                        */
/* ------------------------------------------------------------------ */

export const getDashboard = async (): Promise<DashboardApiData> => {
  const { data }: AxiosResponse<DashboardApiResponse> =
    await portalClient.get("/api/v1/GetDashboardTransactions");

  if (!data?.data) {
    throw new Error("Invalid dashboard response");
  }

  return data.data;
};



/* ------------------------------------------------------------------ */
/* React Query Hook                                                    */
/* ------------------------------------------------------------------ */

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    staleTime: 60_000,

    queryFn: async () => {
      const apiData = await getDashboard();

      return {
        statCards: mapDashboardTilesToStatCards(
          apiData.dashboardTiles
        ),
        inboundOutboundData: mapTransactionCountsToChart(
          apiData.transactionCounts
        ),
        transactionsPerHour: mapTransactionsPerHour(
          apiData.transactionsPerHour
        ),
        dashboardTiles: apiData.dashboardTiles,
      };
    },
  });