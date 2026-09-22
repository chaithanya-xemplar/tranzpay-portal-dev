import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Modal from "../../design-system/dialog/Modal";
import { ivrFormSchema, type IvrFormValues } from "../../schemas/ivrSchema";
import { useSaveIvrAccount } from "../../services/ivr/ivrApi";
import type { IvrAccount } from "./IvrAccountsPage";
import { useToast } from "../../design-system/toast/ToastContext";

interface Props {
  open: boolean;
  onClose: () => void;
  ivr: IvrAccount;
}

export default function EditIvrModal({ open, onClose, ivr }: Props) {
  const { toast } = useToast();
  const saveMutation = useSaveIvrAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ivrFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
    defaultValues: {
      status: "Pending",
      allowAch: false,
      phone: "",
      callRate: 0,
      minuteRate: 0,
      smsRate: 0,
      monthlyFee: 0,
    },
  });

  // Prepopulate on open
  useEffect(() => {
    if (!open) return;

    reset({
      status: ivr.status ?? "Pending",
      allowAch: ivr.allowAch === "Yes",
      phone: ivr.phone ?? "",
      callRate: ivr.callRate ?? 0,
      minuteRate: ivr.minuteRate ?? 0,
      smsRate: ivr.smsRate ?? 0,
      monthlyFee: ivr.monthlyFee ?? 0,
    });
  }, [open, ivr, reset]);

  const onSubmit = async (values: IvrFormValues) => {
    await saveMutation.mutateAsync({ ivr, values });

    toast({
      variant: "success",
      title: "Saved successfully",
    });

    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Account Details">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 text-sm text-medium-grey"
      >
        {/* STATUS */}
        <div>
          <div className="font-semibold text-sm pb-2">Status</div>
          <div className="flex gap-6">
            {["Pending", "Active", "In-Active"].map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={s}
                  {...register("status")}
                  className="accent-primary"
                />
                {s}
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="error-base">{errors.status.message}</p>
          )}
        </div>

        {/* ACH */}
        <div>
          <div className="font-semibold text-sm pb-2">ACH Settings</div>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              {...register("allowAch")}
              className="accent-primary"
            />
            Allow ACH (Is an ACH payment allowed?)
          </label>
        </div>

        {/* PHONE */}
        <div>
          <label className="label-base">Phone</label>
          <input
            readOnly
            {...register("phone")}
            className="input-base-form"
          />
          {/* {errors.phone && (
            <p className="mt-1 text-xs text-red-500">
              {errors.phone.message}
            </p>
          )} */}
        </div>
          <div className="font-semibold text-sm text-primary">Find A New Number</div>
        <div>

        </div>

        {/* RATES */}
        <div className="grid grid-cols-2 gap-4">
          {["callRate", "minuteRate", "smsRate", "monthlyFee"].map((field) => (
            <div key={field}>
              <label className="label-base">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type="number"
                step="0.01"
                {...register(field as keyof IvrFormValues)}
                className={`input-base-form ${
                  errors[field as keyof IvrFormValues] ? "error" : ""
                }`}
              />
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-primary_light1 bg-primary_light2 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Close
          </button>
        </div>
      </form>
    </Modal>
  );
}
