import { calculateOcrSuccess } from "./DashboardPage";

describe("calculateOcrSuccess", () => {
  it("uses only completed and failed OCR attempts", () => {
    expect(calculateOcrSuccess(8, 2)).toBe(80);
  });

  it("returns zero when no OCR has completed", () => {
    expect(calculateOcrSuccess(0, 0)).toBe(0);
  });
});
