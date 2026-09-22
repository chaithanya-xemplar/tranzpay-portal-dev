// src/components/table/ConfirmableStatusToggle.tsx
import { useState } from "react";
import ConfirmDialog from "../../design-system/dialog/ConfirmDialog";
import StatusToggle from "./StatusToggle";

interface ConfirmableStatusToggleProps {
  active: boolean;
  id: number | string;
  name: string;          // display name: username / company / merchant name etc.
  entityLabel: string;   // e.g. "corp account", "merchant", "producer"
  isLoading?: boolean;
  onConfirm: (nextStatus: boolean) => void;
}

const ConfirmableStatusToggle = ({
  active,
//   id,
//   name,
//   entityLabel,
  isLoading = false,
  onConfirm,
}: ConfirmableStatusToggleProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleConfirm = () => {
    const nextStatus = !active;
    onConfirm(nextStatus);
    closeDialog();
  };

  return (
    <>
      <StatusToggle active={active} onChange={openDialog} />

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="Alert"
        description={`Are you sure you want to ${active ? "disable" : "enable"} this item?`}
        confirmLabel="Yes"
        cancelLabel="No"
        onClose={closeDialog}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  );
};

export default ConfirmableStatusToggle;
