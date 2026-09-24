import { useNavigate, useParams } from "react-router-dom";
import GlobalProcessorConfigForm from "../../components/processor/GlobalProcessorConfigForm";
import ProcessorAdditionalUrlsSection from "../../components/processor/ProcessorAdditionalUrlsSection";
import ErrorBoundaryPage from "../../components/ErrorBoundaryPage";

import {
  useProcessorDetails,
  mapProcessorApiToFormValues,
} from "../../services/processors/processorsApi";

const ProcessorDetailsPage = () => {
  const { id } = useParams();
  const processorId = Number(id);
  const navigate = useNavigate();

  /* ✅ Fetch Processor */
  const { data, isLoading, isFetching, isError, error, refetch } =
    useProcessorDetails(processorId);

  if (isLoading || isFetching) return <p>Loading...</p>;

  if (isError || !data) {
    return (
      <ErrorBoundaryPage
        error={error}
        title="Failed to load processor"
        onReload={() => refetch()}
        onSecondaryClick={() => navigate("/processors")}
        secondaryActionLabel="Back to Processors"
      />
    );
  }

  return (
    <>
      <GlobalProcessorConfigForm
        processor={data}
        defaultValues={mapProcessorApiToFormValues(data)}
      />
      <ProcessorAdditionalUrlsSection processorId={data.id} />
    </>
  );
};

export default ProcessorDetailsPage;
