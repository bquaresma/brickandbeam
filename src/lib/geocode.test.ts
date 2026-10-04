import { describe, expect, it } from "vitest";

import { parseLatLng } from "./geocode";

describe("parseLatLng", () => {
  it("parses coordinates with or without spaces", () => {
    expect(parseLatLng("40.4812,-79.9610")).toEqual({ lat: 40.4812, lng: -79.961 });
    expect(parseLatLng(" 40.4812 , -79.9610 ")).toEqual({ lat: 40.4812, lng: -79.961 });
  });

  it("rejects addresses and out-of-range values", () => {
    expect(parseLatLng("325 44th Street")).toBeNull();
    expect(parseLatLng("95,10")).toBeNull();
    expect(parseLatLng("10,190")).toBeNull();
  });
});
