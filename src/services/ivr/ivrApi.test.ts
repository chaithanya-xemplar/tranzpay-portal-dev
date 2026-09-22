// src/services/ivr/ivrApi.test.ts

import { describe, it, expect } from "vitest";
import type { IvrFormValues } from "../../schemas/ivrSchema";
import type { IvrAccount } from "../../pages/ivr/IvrAccountsPage";
import { mapFormToApiPayload } from "./ivrApi";

const mockIvr: IvrAccount = {
  id: 21,
  producerId: 7,
  merchantId: 14,
  companyName: "Demo IVR Co",
  phone: "5555550100",
  status: "Pending",
  allowAch: "No",
  callRate: 0.1,
  minuteRate: 0.2,
  smsRate: 0.05,
  monthlyFee: 25,
};

const mockForm: IvrFormValues = {
  status: "Active",
  allowAch: true,
  phone: "5555550199",
  callRate: 0.5,
  minuteRate: 0.75,
  smsRate: 0.15,
  monthlyFee: 30,
};

describe("mapFormToApiPayload", () => {
  it("merges IVR identity fields with form status and rates", () => {
    expect(mapFormToApiPayload(mockIvr, mockForm)).toEqual({
      id: 21,
      producerId: 7,
      merchantId: 14,
      companyName: "Demo IVR Co",
      phone: "5555550100", // identity phone from the IVR record, not the form
      status: "Active",
      allowAch: "Yes",
      callRate: 0.5,
      minuteRate: 0.75,
      smsRate: 0.15,
      monthlyFee: 30,
    });
  });

  it('converts allowAch true to "Yes"', () => {
    expect(
      mapFormToApiPayload(mockIvr, { ...mockForm, allowAch: true }).allowAch
    ).toBe("Yes");
  });

  it('converts allowAch false to "No"', () => {
    expect(
      mapFormToApiPayload(mockIvr, { ...mockForm, allowAch: false }).allowAch
    ).toBe("No");
  });
});
