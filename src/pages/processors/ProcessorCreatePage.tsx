import GlobalProcessorConfigForm from "../../components/processor/GlobalProcessorConfigForm";
import { useCreateProcessor } from "../../services/processors/processorsApi";
import { useNavigate } from "react-router-dom";

const ProcessorCreatePage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateProcessor();

  return (
    <GlobalProcessorConfigForm
      mode="create"
      onCreate={async (values) => {
        await createMutation.mutateAsync(values);
        navigate("/processors");
      }}
    />
  );
};

export default ProcessorCreatePage;
