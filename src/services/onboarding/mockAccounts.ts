import type { AccountSelection } from "../../pages/onboarding/model/types";

// Placeholder accounts for the Account step type-ahead. When the real
// endpoint lands, replace the queryFn in onboardingApi.ts — components never
// import this file directly.
export const MOCK_ACCOUNTS: AccountSelection[] = [
  {
    id: "ACC-10001",
    name: "Atlas Holdings Group",
    contact: {
      firstName: "Renee",
      lastName: "Park",
      title: "Account Owner",
      email: "renee.park@example.com",
      phone: "8435550101",
    },
    address: { line1: "100 Demo Plaza", line2: "", city: "Charleston", state: "SC", zip: "29401" },
  },
  {
    id: "ACC-10002",
    name: "Coastline Wellness Group",
    contact: {
      firstName: "Alice",
      lastName: "Hawkins",
      title: "Managing Member",
      email: "alice.hawkins@example.com",
      phone: "8435550102",
    },
    address: { line1: "22 Harbor Way", line2: "Suite 4", city: "Mount Pleasant", state: "SC", zip: "29464" },
  },
  {
    id: "ACC-10003",
    name: "Bluepeak Ventures",
    contact: {
      firstName: "Marcus",
      lastName: "Nguyen",
      title: "CFO",
      email: "marcus.nguyen@example.com",
      phone: "3035550103",
    },
    address: { line1: "700 Summit Blvd", line2: "", city: "Denver", state: "CO", zip: "80202" },
  },
  {
    id: "ACC-10004",
    name: "Harborview Medical Partners",
    contact: {
      firstName: "Dana",
      lastName: "Whitfield",
      title: "Practice Administrator",
      email: "dana.whitfield@example.com",
      phone: "2065550104",
    },
    address: { line1: "410 Pike St", line2: "", city: "Seattle", state: "WA", zip: "98101" },
  },
  {
    id: "ACC-10005",
    name: "Sundial Hospitality",
    contact: {
      firstName: "Priya",
      lastName: "Raman",
      title: "Account Owner",
      email: "priya.raman@example.com",
      phone: "4805550105",
    },
    address: { line1: "9 Desert Bloom Rd", line2: "", city: "Scottsdale", state: "AZ", zip: "85251" },
  },
  {
    id: "ACC-10006",
    name: "Ironwood Logistics",
    contact: {
      firstName: "Caleb",
      lastName: "Stone",
      title: "Operations Director",
      email: "caleb.stone@example.com",
      phone: "6155550106",
    },
    address: { line1: "1550 Freight Ln", line2: "", city: "Nashville", state: "TN", zip: "37203" },
  },
  {
    id: "ACC-10007",
    name: "Lakeshore Community Credit",
    contact: {
      firstName: "Maria",
      lastName: "Delgado",
      title: "Branch Manager",
      email: "maria.delgado@example.com",
      phone: "3125550107",
    },
    address: { line1: "88 Lakeshore Dr", line2: "Floor 2", city: "Chicago", state: "IL", zip: "60601" },
  },
  {
    id: "ACC-10008",
    name: "Pinefield Insurance Group",
    contact: {
      firstName: "Tom",
      lastName: "Ellery",
      title: "Account Owner",
      email: "tom.ellery@example.com",
      phone: "9195550108",
    },
    address: { line1: "300 Pinefield Pkwy", line2: "", city: "Raleigh", state: "NC", zip: "27601" },
  },
];
