import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import GenericTable from "../../components/table/GenericTable";
import Button from "../../design-system/Button";
import Icon from "../../components/Icon/Icon";


/* ✅ Row type for table */
export interface ProcessorAccount extends Record<string, unknown> {
  id: number;
  processor: string;
  abbrev: string;
  ach: boolean;
  cc: boolean;
  baseUrl: string;
  groupId?: string;
  tppIds?: string[];
}

export function ProcessorsListPage() {
  /* ✅ Custom Columns */
  const processorColumns: ColumnDef<ProcessorAccount>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },

    {
      accessorKey: "processor",
      header: "Processor Name",
      cell: ({ row }) => {
        const processorId = row.original.id;
        const processorName = row.original.processor;

        return (
          <Link
            to={`/processors/${processorId}`}
            className="font-semibold text-primary hover:underline"
          >
            {processorName || "-"}
          </Link>
        );
      },
    },

    {
      accessorKey: "abbreviation",
      header: "Identifier",
    },

    {
      accessorKey: "ach",
      header: "ACH",
      cell: ({ row }) =>
        row.original.ach ? (
          <span><Icon name="check-green" size={16} /></span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },

    {
      accessorKey: "cc",
      header: "CC",
      cell: ({ row }) =>
        row.original.cc ? (
          <span><Icon name="check-green" size={16} /></span>
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

  return (
    <div >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-bold">Processors List</div>
        <div>
          <Link to="/processors/create">
            <Button
              variant="outline"
              className="cursor-pointer border text-sm font-semibold"
              icon="plus"
              iconPosition="left"
            >
              New Processor
            </Button>
          </Link>
        </div>
      </div>

      {/* ✅ Table */}
      <GenericTable<ProcessorAccount>
        queryKey={["processors"]}
        url="/api/v1/GetPaymentProcessorCompanies"
        title="Processors"
        customColumns={processorColumns}
        hiddenColumns={["groupId", "tppIds"]}
        showStatusFilter
        statusFilterLabel="status"
      />
    </div>
  );
}

export default ProcessorsListPage;
