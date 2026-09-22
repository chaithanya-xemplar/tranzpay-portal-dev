import { Modal, Button } from "../../design-system";
import { formatMsAsMinSec } from "../../utils/formatters";

interface Props {
  open: boolean;
  msRemaining: number;
  onLogInAgain: () => void;
  onDismiss: () => void;
}

const SessionExpiryModal = ({ open, msRemaining, onLogInAgain, onDismiss }: Props) => (
  <Modal
    open={open}
    onClose={onDismiss}
    title="Session expiring"
    size="sm"
    showClose={false}
  >
    <p className="text-sm text-dark-grey">
      Your session expires in{" "}
      <span className="font-semibold tabular-nums">{formatMsAsMinSec(msRemaining)}</span>.
      You&apos;ll be signed out automatically.
    </p>
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="ghost" onClick={onDismiss}>
        Dismiss
      </Button>
      {/* Becomes "Stay signed in" → attemptRefresh() once the refresh backend ships */}
      <Button onClick={onLogInAgain}>Log in again</Button>
    </div>
  </Modal>
);

export default SessionExpiryModal;
