import { useState } from "react";
import type { Row } from "@tanstack/react-table";
import ConfirmDialog from "../../design-system/dialog/ConfirmDialog";
import { useUpdateBlacklistStatus } from "../../services/blacklisted-accounts/blacklistedAccountsApi";
import { useToast } from "../../design-system/toast/ToastContext";
import lockIcon from "../../assets/icon-lock.svg";
import unlockIcon from "../../assets/icon-unlock.svg";
import type { BlacklistedAccount } from "./BlacklistedAccountsPage";

interface Props {
  row: Row<BlacklistedAccount>;
}

export default function BlockToggleActionCell({ row }: Props) {
  const bankAccountBlacklistId = row.original
  .bankAccountBlacklistedId as number;

  const producerId = row.original.producerId as number;
  const released = row.original.released as boolean;
  const { accountNumber } = row.original;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isBlocked = !released;

  const mutation = useUpdateBlacklistStatus();
  const { toast } = useToast();

  const isUnblock = isBlocked; // if blocked → show unblock

  const handleConfirm = () => {
    if (producerId == null || bankAccountBlacklistId == null) {
      toast({
        variant: "error",
        title: "Invalid data",
        description: "Missing required account details",
      });
      setIsDialogOpen(false);
      return;
    }
    mutation.mutate(
      {
        bankAccountBlacklistId,
        producerId,
        release: isUnblock,
      },
      {
        onSuccess: (res) => {
          toast({
            variant: "success",
            title: isUnblock ? "Unblocked" : "Blocked",
            description:
              res?.data?.message ||
              `Bank account ${isUnblock ? "unblocked" : "blocked"} successfully`,
          });
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast({
            variant: "error",
            title: "Failed",
            description:
              error?.response?.data?.message ||
              (error as Error).message,
          });
          setIsDialogOpen(false);
        },
      }
    );
  };

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        disabled={mutation.isPending}
        className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold
          ${isUnblock
            ? "border border-error/20 bg-error-bg text-error hover:bg-red-200" : 
            "border border-green-200 bg-success-bg text-success hover:bg-green-200"
          }`}
      >
        <img src={isUnblock ? lockIcon : unlockIcon} />
        <span>{isUnblock ? "Unblock" : "Block"}</span>
      </button>

      <ConfirmDialog
        isOpen={isDialogOpen}
        title={`${isUnblock ? "Unblock" : "Block"} Bank Account`}
        description={`Are you sure you want to ${
          isUnblock ? "unblock" : "block"
        } account ${accountNumber}?`}
        confirmLabel={`Yes, ${isUnblock ? "Unblock" : "Block"}`}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onClose={() => setIsDialogOpen(false)}
        isLoading={mutation.isPending}
      />
    </>
  );
}