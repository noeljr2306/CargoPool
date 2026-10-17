const { pickBestMatch } = require("../src/services/hsCodeService");

describe("pickBestMatch", () => {
  const mappings = [
    { keyword: "hibiscus", hsCode: "0603.90" },
    { keyword: "dried hibiscus", hsCode: "1211.90" },
    { keyword: "shea butter", hsCode: "1515.90" },
  ];

  it("prefers the longer, more specific keyword when multiple match", () => {
    expect(pickBestMatch(mappings, "Dried hibiscus flowers, bulk")).toBe(
      "1211.90",
    );
  });

  it("matches case-insensitively", () => {
    expect(pickBestMatch(mappings, "SHEA BUTTER for export")).toBe("1515.90");
  });

  it("returns null when nothing matches", () => {
    expect(pickBestMatch(mappings, "Assorted electronics")).toBeNull();
  });
});
