import { buildExportFilename, triggerDownload } from "./download";

describe("buildExportFilename", () => {
  it("slugs the table title and stamps the day", () => {
    expect(
      buildExportFilename("Corp Account List", "csv", new Date("2026-09-21T10:00:00Z"))
    ).toBe("corp-account-list_2026-09-21.csv");
  });

  it("collapses punctuation and trims stray separators", () => {
    expect(
      buildExportFilename("List of Blacklisted / Bank Accounts!", "csv", new Date("2026-01-02T00:00:00Z"))
    ).toBe("list-of-blacklisted-bank-accounts_2026-01-02.csv");
  });

  it("falls back to 'export' when the title slugs to nothing", () => {
    expect(buildExportFilename("—", "csv", new Date("2026-01-02T00:00:00Z"))).toBe(
      "export_2026-01-02.csv"
    );
  });
});

describe("triggerDownload", () => {
  const createObjectURL = vi.fn(() => "blob:mock");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("clicks a temporary link and cleans up after itself", () => {
    const click = vi.fn();
    const anchor = document.createElement("a");
    anchor.click = click;
    const createElement = vi
      .spyOn(document, "createElement")
      .mockReturnValueOnce(anchor);

    triggerDownload(new Blob(["x"]), "report.csv");

    expect(anchor.download).toBe("report.csv");
    expect(anchor.href).toContain("blob:mock");
    expect(click).toHaveBeenCalledOnce();
    expect(document.body.contains(anchor)).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");

    createElement.mockRestore();
  });
});
