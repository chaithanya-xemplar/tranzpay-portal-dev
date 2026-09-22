import { useParams, Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";

import GenericTable from "../../../components/table/GenericTable";
import Button from "../../../design-system/Button";
import Icon from "../../../components/Icon/Icon";

/* ---------------- TYPES ---------------- */

export interface ProcessorAccount extends Record<string, unknown> {
  paymentProcessorCompanyId: number;
  merchantId: number; 
  processorName: string;
  abbrev: string;
  ach: boolean;
  cc: boolean;
  baseUrl: string;
  groupId?: string;
  tppIds?: string[];
}

/* ---------------- TABLE COLUMNS ---------------- */

const buildProcessorColumns = (): ColumnDef<ProcessorAccount>[] => [
  {
    accessorKey: "paymentProcessorCompanyId",
    header: "ID",
  },

  {
    accessorKey: "processorName",
    header: "Processor Name",
    cell: ({ row }) => {
      const name = row.original.processorName;
      const merchantId = row.original.merchantId;
      const processorId = row.original.paymentProcessorCompanyId;

      return (
        <Link
          to={`/merchants/${merchantId}/processors/${processorId}`}
          className="font-semibold text-primary hover:underline"
        >
          {name}
        </Link>
      );
    },
  },
  {
    accessorKey: "ach",
    header: "ACH",
    cell: ({ row }) =>
      row.original.ach ? (
        <Icon name="check-green"size={16} />
      ) : (
        <span className="text-gray-400">--</span>
      ),
  },

  {
    accessorKey: "cc",
    header: "CC",
    cell: ({ row }) =>
      row.original.cc ? (
        <Icon name="check-green" size={16} />
      ) : (
        <span className="text-gray-400">--</span>
      ),
  },

  {
    accessorKey: "baseUrl",
    header: "Base Url",
    cell: ({ row }) => row.original.baseUrl || "--",
  },
];

/* ---------------- MAIN COMPONENT ---------------- */

export default function MerchantProcessorList() {
  const { id } = useParams();
  const merchantId = Number(id);

  const columns = buildProcessorColumns();

  return (
    <div>
      <GenericTable<ProcessorAccount>
        queryKey={["merchant-processors", merchantId]}
        url={`/api/v1/Merchant/${merchantId}/GetPaymentProcessors`}
        title="List of Processors"
        customColumns={columns}
        hiddenColumns={["merchantId", "achConfig", "ccConfig"]}
        showStatusFilter
        statusFilterLabel="status"
      />

      {/* Add New Processor Button */}
      <div className="flex justify-center mt-6">
        <Link to={`/merchants/${merchantId}/processors/create`}>
          <Button
            variant="outline"
            className="cursor-pointer border text-sm font-semibold"
            icon="plus"
            iconPosition="left"
          >
            Add New Processor
          </Button>
        </Link>
      </div>
    </div>
  );
}
