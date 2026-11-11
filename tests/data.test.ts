import { describe, expect, it } from "vitest";
import { parseAssets, parseRoads, safeImageUrl } from "../LeafletMap/data";
import { fuelTone } from "../LeafletMap/equipment";
import assets from "../samples/equipment.json";
import roads from "../samples/roads.geo.json";

describe("equipment input boundary", () => {
    it("loads all six equipment types and permits unknown fuel", () => {
        const parsed = parseAssets(JSON.stringify(assets));
        expect(parsed.issues).toEqual([]);
        expect(parsed.value).toHaveLength(8);
        expect(new Set(parsed.value.map((a) => a.type)).size).toBe(6);
        expect(parsed.value.find((a) => a.type === "crusher")?.fuelPercent).toBeNull();
    });
    it("keeps an explicitly empty filter result empty", () => expect(parseAssets("[]").value).toEqual([]));
    it.each(["{", "{}", "null", "42"])("rejects nonarrays: %s", (source) => {
        expect(parseAssets(source).issues.length).toBeGreaterThan(0);
        expect(parseAssets(source).value).toEqual([]);
    });
    it("skips invalid coordinates and duplicate IDs while keeping valid records", () => {
        const result = parseAssets(JSON.stringify([assets[0], assets[0], { ...assets[1], latitude: 100 },
            { ...assets[2], longitude: "116.0" }, assets[3]]));
        expect(result.value.map((a) => a.id)).toEqual([assets[0].id, assets[3].id]);
        expect(result.issues).toHaveLength(3);
    });
    it.each([-1, 101, "76"])("reports invalid fuel and shows unknown: %s", (fuelPercent) => {
        const result = parseAssets(JSON.stringify([{ ...assets[0], fuelPercent }]));
        expect(result.value[0].fuelPercent).toBeNull();
        expect(result.issues).toHaveLength(1);
    });
    it("accepts generic record types and statuses", () => {
        const result = parseAssets(JSON.stringify([{ ...assets[0], type: "clinic", status: "open" }, { id: "c2", name: "Place", latitude: -32, longitude: 116 }]));
        expect(result.issues).toEqual([]);
        expect(result.value.map((a) => a.type)).toEqual(["clinic", "marker"]);
    });
    it("removes untrusted properties from the selected-record contract", () => {
        const result = parseAssets(JSON.stringify([{ ...assets[0], extra: "<script>" }]));
        expect(result.value[0]).not.toHaveProperty("extra");
    });
});
describe("road input boundary", () => {
    it("loads the supplied sample plus fictional spurs", () => {
        expect(parseRoads(JSON.stringify(roads)).value.features).toHaveLength(3);
        expect(parseRoads(JSON.stringify(roads)).issues).toEqual([]);
    });
    it("accepts an individual feature and a raw MultiLineString", () => {
        expect(parseRoads(JSON.stringify(roads.features[0])).value.features).toHaveLength(1);
        expect(parseRoads(JSON.stringify({ type: "MultiLineString", coordinates: [[[116, -32], [117, -33]]] })).issues).toEqual([]);
    });
    it("ignores bad geometries and validates longitude/latitude ordering", () => {
        const result = parseRoads(JSON.stringify({ type: "FeatureCollection", features: [roads.features[0],
            { type: "Point", coordinates: [116, -32] }, { type: "LineString", coordinates: [[-32, 116], [-33, 117]] }] }));
        expect(result.value.features).toHaveLength(2);
        expect(result.issues).toHaveLength(1);
    });
    it.each([
        { type: "Point", coordinates: [116, -32] },
        { type: "MultiPoint", coordinates: [[116, -32], [117, -33]] },
        { type: "Polygon", coordinates: [[[116, -32], [117, -32], [117, -33], [116, -32]]] },
        { type: "MultiPolygon", coordinates: [[[[116, -32], [117, -32], [117, -33], [116, -32]]]] },
        { type: "GeometryCollection", geometries: [{ type: "Point", coordinates: [116, -32] }, { type: "LineString", coordinates: [[116, -32], [117, -33]] }] },
    ])("accepts $type geometries", (shape) => expect(parseRoads(JSON.stringify(shape)).issues).toEqual([]));
    it("rejects unclosed polygon rings and preserves valid feature properties", () => {
        const result = parseRoads(JSON.stringify({ type: "FeatureCollection", features: [
            { type: "Feature", properties: { name: "Pit", category: "work" }, geometry: { type: "Point", coordinates: [116, -32] } },
            { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[116, -32], [117, -32], [117, -33], [116, -33]]] } },
        ] }));
        expect(result.value.features[0].properties).toEqual({ name: "Pit", category: "work" });
        expect(result.issues).toHaveLength(1);
    });
    it.each(["null", "{", '{"type":"LineString","coordinates":[]}', '{"type":"MultiLineString","coordinates":[]}'])("handles malformed roads: %s", (source) => {
        expect(parseRoads(source).issues.length).toBeGreaterThan(0);
        expect(parseRoads(source).value.features).toEqual([]);
    });
});
describe("marker presentation", () => {
    it.each([[0, "low"], [20, "low"], [21, "warning"], [40, "warning"], [41, "normal"], [100, "normal"], [null, "unknown"]])("uses the correct fuel threshold for %s", (fuel, tone) => {
        expect(fuelTone(fuel as number | null)).toBe(tone);
    });
    it.each(["javascript:alert(1)", "http://example.com/image.png", "data:image/svg+xml,<svg/>", "https://user:password@example.com/a.png", "/relative.png"])("rejects unsafe images: %s", (url) => expect(safeImageUrl(url)).toBeUndefined());
    it("allows HTTPS and raster data images", () => {
        expect(safeImageUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
        expect(safeImageUrl("data:image/png;base64,AAAA")).toBeDefined();
    });
});
