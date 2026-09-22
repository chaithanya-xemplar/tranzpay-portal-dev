import { useParams } from "react-router-dom";
import GlobalProcessorConfigForm from "../../components/processor/GlobalProcessorConfigForm";

import {
  useProcessorDetails,
  mapProcessorApiToFormValues,
} from "../../services/processors/processorsApi";
import ProcessorAdditionalUrlsSection from "../../components/processor/ProcessorAdditionalUrlsSection";

const ProcessorDetailsPage = () => {
  const { id } = useParams();
  const processorId = Number(id);

  /* ✅ Fetch Processor */
  const { data, isLoading, isFetching } = useProcessorDetails(processorId);

  if (isLoading || isFetching) return <p>Loading...</p>;
  if (!data) return <p>Processor Not Found</p>;

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
