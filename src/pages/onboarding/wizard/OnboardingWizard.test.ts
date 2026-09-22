/// <reference types="vitest/globals" />

import {
  createDefaultProfile,
  createEmptySession,
  createMerchant,
  createParentCompany,
  createPrincipal,
  createProcessorEntry,
  createUser,
} from "../model/defaults";
import { buildOnboardingDisplayJson, buildOnboardingRequestBody } from "./onboardingRequest";

describe("buildOnboardingRequestBody", () => {
  it("maps the onboarding session into the API request body shape", () => {
    const session = createEmptySession("Troy Phoenix");
    session.id = "Session-Guid";
    session.currentStepId = "processing";
    session.visitedSteps = [
      "account",
      "merchants",
      "company",
      "owners",
      "processing",
      "profiles",
      "users",
      "review",
    ];
    session.account.mode = "new";
    session.account.newAccount = {
      name: "Test Account",
      contact: {
        firstName: "John",
        lastName: "Doe",
        title: "Manager",
        email: "john.doe@example.com",
        phone: "123-456-7890",
      },
      address: {
        line1: "123 Main St",
        line2: "Apt 4B",
        city: "Anytown",
        state: "CA",
        zip: "12345",
      },
    };
    session.company = {
      legalName: "Test Company LLC",
      alias: "TestCo",
      federalTaxId: "111111111",
      businessStartDate: "2026-07-01",
      website: "https://example.com",
      mccCode: "8099",
      timezone: "America/Los_Angeles",
      mailingAddress: {
        line1: "500 Market St",
        line2: "",
        city: "San Francisco",
        state: "CA",
        zip: "94105",
      },
      csPhone: "555-111-2222",
      csEmail: "support@example.com",
      logo: null,
    };

    const parent = createParentCompany();
    parent.fullName = "Internal-only Parent Name";
    parent.name = "Parent Holdings";
    parent.ein = "123456789";
    parent.contactEmail = "ops@example.com";

    const principal = createPrincipal();
    principal.fullName = "Renee Park";
    principal.ownershipPct = "50";
    principal.ssn = "";
    principal.ssnLast4 = "6789";
    principal.ssnProvided = true;
    principal.contactEmail = "renee@example.com";
    principal.contactPhone = "555-333-4444";
    session.owners = [parent, principal];

    const merchant = createMerchant("Coastline Wellness", "coastline");
    merchant.id = "mer_123";
    merchant.processing.mid = "111111111";
    const processor = createProcessorEntry();
    processor.username = "gateway-user";
    processor.password = "secret";
    processor.passwordSet = true;
    merchant.processing.processors = [processor];
    session.merchants = [merchant];
    session.profiles = [createDefaultProfile(merchant)];
    session.users = [
      createUser({
        firstName: "Pat",
        lastName: "Lee",
        email: "pat@example.com",
        templateId: "payments-specialist",
        active: true,
      }),
    ];

    const requestBody = buildOnboardingRequestBody(session);
    const requestJson = JSON.parse(requestBody.RequestJson);

    expect(requestBody).toEqual({
      IsSave: false,
      RequestJson: expect.any(String),
    });
    expect(requestJson.Account.Mode).toBe("create");
    expect(requestJson.Account.Account).toMatchObject({
      Id: "",
      Name: "Test Account",
      Contact: {
        FirstName: "John",
        LastName: "Doe",
        Title: "Manager",
        Email: "john.doe@example.com",
        Phone: "123-456-7890",
      },
      Address: {
        Line1: "123 Main St",
        Line2: "Apt 4B",
        City: "Anytown",
        State: "CA",
        Zip: "12345",
      },
    });
    expect(requestJson.Company).toMatchObject({
      LegalName: "Test Company LLC",
      CsPhone: "555-111-2222",
      CsEmail: "support@example.com",
      MailingAddress: { Line1: "500 Market St" },
    });
    expect(requestJson.Owners.Parents[0]).toMatchObject({
      Kind: "parentCompany",
      Name: "Parent Holdings",
      ContactEmail: "ops@example.com",
    });
    expect(requestJson.Owners.Parents[0]).not.toHaveProperty("FullName");
    expect(requestJson.Owners.Principals[0]).toMatchObject({
      Kind: "principal",
      FullName: "Renee Park",
      FirstName: "Renee",
      LastName: "Park",
      Ssn: "",
      SsnLast4: "6789",
      SsnProvided: true,
      Email: "renee@example.com",
      ContactEmail: "renee@example.com",
      Phone: "555-333-4444",
      ContactPhone: "555-333-4444",
    });
    expect(requestJson.Merchants[0]).toMatchObject({
      Id: "mer_123",
      Dba: "Coastline Wellness",
      Processing: {
        Mid: "111111111",
        Processors: [
          expect.objectContaining({
            Username: "gateway-user",
            Password: "",
            PasswordSet: true,
          }),
        ],
      },
    });
    expect(requestJson.Merchants[0]).not.toHaveProperty("Advanced");
    expect(requestJson.Profiles[0]).toMatchObject({ MerchantId: "mer_123", Active: true });
    expect(requestJson.Users[0]).toMatchObject({
      FirstName: "Pat",
      LastName: "Lee",
      Email: "pat@example.com",
    });
  });

  it("formats the drawer JSON with an expanded RequestJson object", () => {
    const session = createEmptySession("Troy Phoenix");
    session.id = "Session-Guid";
    session.company.legalName = "Test Company LLC";

    const displayedJson = buildOnboardingDisplayJson(session);
    const parsed = JSON.parse(displayedJson);

    expect(parsed).toEqual({
      IsSave: false,
      RequestJson: expect.objectContaining({
        SessionId: "Session-Guid",
        Company: expect.objectContaining({
          LegalName: "Test Company LLC",
        }),
      }),
    });
    expect(displayedJson).toContain('"RequestJson": {');
    expect(displayedJson).not.toContain('"{\\"SessionId\\"');
  });
});
