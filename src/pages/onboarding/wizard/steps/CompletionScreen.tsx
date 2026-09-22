import { Button, Icon } from "../../../../design-system";
import type { ActivationResult, OnboardingSession } from "../../model/types";
import CopyField from "../components/CopyField";

interface CompletionScreenProps {
  session: OnboardingSession;
  result: ActivationResult;
  onClose: () => void;
}

export default function CompletionScreen({ result, onClose }: CompletionScreenProps) {
  return (
    <div className="h-full bg-white rounded-xl border border-divider flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-lg text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-success-bg text-success">
            <Icon name="check-circle" size={34} />
          </span>
          <h2 className="text-2xl font-bold text-dark-grey">Onboarding Complete</h2>
          <p className="text-sm text-light-grey">
            {result.companyName} is activated and pending provisioning. Hand off the details below —
            live credentials are issued once provisioning completes.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <CopyField label="Merchant ID (pending)" value={result.merchantId} />
          <CopyField label="Processing Profile GUID" value={result.profileGuid} />
          <CopyField
            label="Primary User"
            value={`${result.primaryUserName} <${result.primaryUserEmail}>`}
          />
          {result.apiKey && <CopyField label="API Key (pending)" value={result.apiKey} masked />}
        </div>

        <Button onClick={onClose}>Back to Onboarding</Button>
      </div>
    </div>
  );
}
