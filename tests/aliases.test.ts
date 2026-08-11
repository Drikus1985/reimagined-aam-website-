import { describe, expect, it } from "vitest";
import { expandQuery } from "@/lib/aliases";

describe("expandQuery — specialist terminology and typo tolerance", () => {
  it("expands SBC to small block chevy", () => {
    expect(expandQuery("SBC intake").toLowerCase()).toContain("small block chevy");
  });
  it("expands displacement numbers to engine families", () => {
    expect(expandQuery("302 rebuild kit").toLowerCase()).toContain("ford windsor");
    expect(expandQuery("350 cam").toLowerCase()).toContain("small block chevy");
  });
  it("maps common misspellings", () => {
    expect(expandQuery("distributer").toLowerCase()).toContain("distributor");
    expect(expandQuery("carby jets").toLowerCase()).toContain("carburettor");
  });
  it("maps nicknames", () => {
    expect(expandQuery("stang brakes").toLowerCase()).toContain("mustang");
    expect(expandQuery("vette wheels").toLowerCase()).toContain("corvette");
  });
  it("does not expand mid-word matches", () => {
    // "described" contains no whole-word alias term and must pass through untouched
    expect(expandQuery("described")).toBe("described");
  });
  it("leaves unknown queries unchanged", () => {
    expect(expandQuery("blue widget")).toBe("blue widget");
  });
});
