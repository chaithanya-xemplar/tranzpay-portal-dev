import { stringifyCellValue, toCsvBlob, toCsvContent } from "./csv";

describe("toCsvContent", () => {
  it("writes a header row and CRLF-separated data rows", () => {
    expect(
      toCsvContent(["Name", "Email"], [["Acme", "ops@example.test"]])
    ).toBe("Name,Email\r\nAcme,ops@example.test");
  });

  it("quotes cells containing a comma, a quote or a newline", () => {
    expect(
      toCsvContent(["A"], [['say "hi"'], ["one,two"], ["line\nbreak"]])
    ).toBe('A\r\n"say ""hi"""\r\n"one,two"\r\n"line\nbreak"');
  });

  it("neutralises values a spreadsheet would run as a formula", () => {
    expect(toCsvContent(["A"], [["=1+1"], ["+x"], ["-x"], ["@x"]])).toBe(
      "A\r\n'=1+1\r\n'+x\r\n'-x\r\n'@x"
    );
  });

  it("quotes a formula-guarded cell that also needs escaping", () => {
    expect(toCsvContent(["A"], [['=HYPERLINK("x")']])).toBe(
      "A\r\n\"'=HYPERLINK(\"\"x\"\")\""
    );
  });

  it("emits a header-only file when there are no rows", () => {
    expect(toCsvContent(["A", "B"], [])).toBe("A,B");
  });
});

describe("toCsvBlob", () => {
  it("prefixes a BOM so Excel reads it as UTF-8", async () => {
    const blob = toCsvBlob(["Name"], [["Café"]]);

    expect(blob.type).toBe("text/csv;charset=utf-8;");
    // `Blob.text()` decodes and drops the BOM, so check the bytes.
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toBe("Name\r\nCafé");
  });
});

describe("stringifyCellValue", () => {
  it("renders nullish values as an empty cell", () => {
    expect(stringifyCellValue(null)).toBe("");
    expect(stringifyCellValue(undefined)).toBe("");
  });

  it("serialises objects so a nested payload stays in one column", () => {
    expect(stringifyCellValue({ a: 1 })).toBe('{"a":1}');
  });

  it("passes primitives straight through", () => {
    expect(stringifyCellValue(0)).toBe("0");
    expect(stringifyCellValue(false)).toBe("false");
    expect(stringifyCellValue("text")).toBe("text");
  });
});
