import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import Card from "../../design-system/Card";

import {
  useProcessorUrls,
  useCreateProcessorUrl,
  useUpdateProcessorUrl,
  useDeleteProcessorUrl,
  type ProcessorUrl,
} from "../../services/processors/processorsApi";
import Button from "../../design-system/Button";

/* ✅ Zod Schema */
const urlSchema = z.object({
  urlType: z.string().min(1, "URL Type is required"),
  url: z.string().min(1, "URL is required").url("Must be valid URL"),
});

type FormErrors = {
  urlType?: string;
  url?: string;
};

interface Props {
  processorId: number;
}

const ProcessorAdditionalUrlsSection = ({ processorId }: Props) => {
  /* ================= STATES ================= */

  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [urlType, setUrlType] = useState("");
  const [url, setUrl] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedUrl, setSelectedUrl] = useState<ProcessorUrl | null>(null);

  /* ================= API ================= */

  const { data: urls = [] } = useProcessorUrls(processorId);

  const createMutation = useCreateProcessorUrl(processorId);
  const updateMutation = useUpdateProcessorUrl(processorId);
  const deleteMutation = useDeleteProcessorUrl(processorId);

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  /* ================= HANDLERS ================= */

  const resetForm = () => {
    setUrlType("");
    setUrl("");
    setErrors({});
    setSelectedUrl(null);
  };

  const handleAddNew = () => {
    resetForm();
    setOpenFormModal(true);
  };

  const handleEdit = (item: ProcessorUrl) => {
    setSelectedUrl(item);
    setUrlType(item.urlType || "");
    setUrl(item.url || "");
    setErrors({});
    setOpenFormModal(true);
  };

  const handleDelete = (item: ProcessorUrl) => {
    setSelectedUrl(item);
    setOpenDeleteModal(true);
  };

  const handleCloseForm = () => {
    setOpenFormModal(false);
    resetForm();
  };

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const parsed = urlSchema.safeParse({ urlType, url });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      setErrors({
        urlType: fieldErrors.urlType?.[0],
        url: fieldErrors.url?.[0],
      });

      return false;
    }

    setErrors({});
    return true;
  };

  /* ================= SAVE ================= */

  const handleSave = () => {
    if (!validateForm()) return;

    if (selectedUrl) {
      updateMutation.mutate(
        {
          ...selectedUrl,
          urlType,
          url,
          status: true,
        },
        {
          onSuccess: handleCloseForm,
        }
      );
    } else {
      createMutation.mutate(
        { urlType, url },
        {
          onSuccess: handleCloseForm,
        }
      );
    }
  };

  /* ================= RENDER ================= */

  return (
    <Card className="mt-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-dark-grey text-sm">
          Additional URLs
        </h2>
      </div>

      {/* URL LIST */}
      {urls.length === 0 ? (
        <p className="mt-4 text-sm text-gray">
          No additional URLs added yet.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {urls.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 rounded-sm border border-divider flex items-center gap-4">
                <div className="font-semibold w-[200px] text-medium-grey px-10 py-2.5 border-divider bg-gray-100">
                  {item.urlType || "NA"}
                </div>

                <div className="text-sm text-light-grey break-all">
                  {item.url || "NA"}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-medium-grey border border-divider rounded-sm p-2.5 hover:text-primary hover:border-primary"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => handleDelete(item)}
                  className="text-medium-grey border border-divider rounded-sm p-2.5 hover:text-error hover:border-error"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD BUTTON */}
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer border text-sm font-semibold mt-4"
        icon="plus"
        iconPosition="left"
        onClick={handleAddNew}
      >
        Add URL
      </Button>

      {/* ================= FORM MODAL ================= */}
      {openFormModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="font-bold text-dark-grey">
              {selectedUrl ? "Edit URL" : "Add URL"}
            </h3>

            {/* URL TYPE */}
            <input
              placeholder="URL Type"
              value={urlType}
              onChange={(e) => {
                setUrlType(e.target.value);
                if (errors.urlType)
                  setErrors((prev) => ({ ...prev, urlType: undefined }));
              }}
              className={`input-base-form mt-3 ${
                errors.urlType ? "border-error" : ""
              }`}
            />
            {errors.urlType && (
              <p className="text-error text-xs mt-1">
                {errors.urlType}
              </p>
            )}

            {/* URL */}
            <input
              placeholder="https://..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url)
                  setErrors((prev) => ({ ...prev, url: undefined }));
              }}
              className={`input-base-form mt-3 ${
                errors.url ? "border-error" : ""
              }`}
            />
            {errors.url && (
              <p className="text-error text-xs mt-1">
                {errors.url}
              </p>
            )}

            {/* ACTIONS */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={handleCloseForm}
                className="rounded-lg w-20 px-4 py-2 text-sm text-primary border border-primary_light1 bg-primary_light2"
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg w-20 font-semibold bg-primary px-4 py-2 text-sm text-white"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {openDeleteModal && selectedUrl && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-error">
              Confirm Delete
            </h3>

            <p className="mt-3 text-sm text-gray-600">
              Remove URL:
              <span className="font-semibold ml-1">
                {selectedUrl.url}
              </span>
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="rounded-lg w-20 px-4 py-2 text-sm text-primary border border-primary_light1 bg-primary_light2"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  deleteMutation.mutate(selectedUrl, {
                    onSuccess: () => setOpenDeleteModal(false),
                  })
                }
                disabled={deleteMutation.isPending}
                className="rounded-lg w-20 font-semibold bg-error px-4 py-2 text-sm text-white"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProcessorAdditionalUrlsSection;
