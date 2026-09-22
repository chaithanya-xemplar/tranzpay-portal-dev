import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { BreadcrumbItem } from "../design-system";
import {
  interpolatePath,
  resolveBreadcrumbTrail,
  type CrumbEntity,
} from "../components/breadcrumbs/breadcrumb.config";
import { useGetMerchant } from "../services/merchants/merchantApi";
import { useGetCorp } from "../services/corps/corpApi";
import { useGetProducer } from "../services/producers/producerApi";
import { useProcessorDetails } from "../services/processors/processorsApi";
import { useGetMerchantProcessor } from "../pages/merchants/processors/merchantProcessor.api";

const LOADING_LABEL = "…";

interface MerchantProcessorResponse {
  data?: { identifier?: string }[];
}

export function useBreadcrumbs(): BreadcrumbItem[] | null {
  const { pathname, state } = useLocation();
  const trail = useMemo(() => resolveBreadcrumbTrail(pathname), [pathname]);
  const params = trail?.params ?? {};

  const needs = (entity: CrumbEntity): boolean =>
    trail?.specs.some((spec) => spec.entity === entity) ?? false;
  // NaN keeps the query disabled (all entity hooks guard with Number.isFinite/!!id)
  const idFor = (entity: CrumbEntity, key = "id"): number =>
    needs(entity) && params[key] !== undefined ? Number(params[key]) : NaN;

  const corpQuery = useGetCorp(idFor("corp"));
  const merchantQuery = useGetMerchant(idFor("merchant"));
  const producerQuery = useGetProducer(idFor("producer"));
  const processorQuery = useProcessorDetails(idFor("processor"));
  const merchantProcessorQuery = useGetMerchantProcessor(
    idFor("merchantProcessor"),
    idFor("merchantProcessor", "processorId")
  );

  if (!trail) return null;

  const entityLabel = (entity: CrumbEntity): string => {
    switch (entity) {
      case "corp":
        return corpQuery.data?.companyName ?? LOADING_LABEL;
      case "merchant":
        return merchantQuery.data?.companyName ?? LOADING_LABEL;
      case "producer":
        return producerQuery.data?.companyName ?? LOADING_LABEL;
      case "processor":
        return processorQuery.data?.processor ?? LOADING_LABEL;
      case "merchantProcessor": {
        const response = merchantProcessorQuery.data as
          | MerchantProcessorResponse
          | undefined;
        return response?.data?.[0]?.identifier ?? "Processor";
      }
      case "user": {
        const routeState = state as { userName?: string } | null;
        return routeState?.userName ?? `User ${params.userId ?? ""}`;
      }
    }
  };

  return [
    { label: "Dashboard", to: "/" },
    ...trail.specs.map((spec) => ({
      label: spec.entity ? entityLabel(spec.entity) : spec.label ?? "",
      to: spec.to ? interpolatePath(spec.to, params) : undefined,
    })),
  ];
}
