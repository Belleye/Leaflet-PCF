import type { Feature, FeatureCollection, Geometry } from "geojson";

export const equipmentTypes = ["haul-truck", "loader", "water-cart", "grader", "dozer", "crusher"] as const;
export type EquipmentType = typeof equipmentTypes[number];
export interface Asset {
    id: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    status: string;
    imageKey?: string;
    htmlKey?: string;
    html?: string;
    fields?: Record<string, string | number | boolean | null>;
    fuelPercent?: number | null;
    imageUrl?: string;
}
export type Roads = FeatureCollection<Geometry>;
export interface Parsed<T> { value: T; issues: string[] }

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function coordinate(lat: unknown, lng: unknown): boolean {
    return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
        typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
export function safeImageUrl(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
    } catch { return undefined; }
}
export function parseAssets(json: string): Parsed<Asset[]> {
    const issues: string[] = [];
    let input: unknown;
    try { input = JSON.parse(json); } catch { return { value: [], issues: ["Equipment JSON is invalid. Supply a JSON array."] }; }
    if (!Array.isArray(input)) return { value: [], issues: ["Equipment JSON must be an array."] };
    const value: Asset[] = [];
    const ids = new Set<string>();
    input.forEach((item: unknown, i: number) => {
        const row = `Equipment ${i + 1}`;
        if (!record(item) || typeof item.id !== "string" || !item.id.trim() ||
            typeof item.name !== "string" || !item.name.trim() || !coordinate(item.latitude, item.longitude)) {
            issues.push(`${row}: requires a nonempty string id/name and valid numeric latitude/longitude.`);
            return;
        }
        if (ids.has(item.id)) { issues.push(`${row}: duplicate ID ${item.id}.`); return; }
        const fuel = item.fuelPercent;
        const validFuel = typeof fuel === "number" && Number.isFinite(fuel) && fuel >= 0 && fuel <= 100;
        if (fuel != null && !validFuel) issues.push(`${row}: fuelPercent must be 0â€“100; showing unknown fuel.`);
        const imageUrl = safeImageUrl(item.imageUrl);
        if (item.imageUrl && !imageUrl) issues.push(`${row}: imageUrl must use HTTPS or a PNG/JPEG/WebP data URL.`);
        const fields = record(item.fields) ? Object.fromEntries(Object.entries(item.fields).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value))) as Asset["fields"] : undefined;
        ids.add(item.id);
        value.push({ id: item.id, name: item.name, latitude: item.latitude as number, longitude: item.longitude as number,
            type: typeof item.type === "string" ? item.type : "marker", status: typeof item.status === "string" ? item.status : "", fuelPercent: validFuel ? fuel as number : null,
            ...(typeof item.imageKey === "string" ? { imageKey: item.imageKey } : {}), ...(typeof item.htmlKey === "string" ? { htmlKey: item.htmlKey } : {}),
            ...(typeof item.html === "string" && item.html.trim() ? { html: item.html } : {}), ...(fields ? { fields } : {}),
            ...(imageUrl ? { imageUrl } : {}) });
    });
    return { value, issues };
}
export function parseImageCatalog(json: string): Parsed<Record<string, string>> {
    const value: Record<string, string> = Object.create(null) as Record<string, string>;
    if (!json.trim()) return { value, issues: [] };
    let input: unknown;
    try { input = JSON.parse(json); } catch { return { value, issues: ["Image catalogue JSON is invalid."] }; }
    if (!Array.isArray(input)) return { value, issues: ["Image catalogue must be an array of imageKey and imageUrl records."] };
    const issues: string[] = [];
    input.forEach((entry: unknown, i: number) => {
        if (!record(entry) || typeof entry.imageKey !== "string" || !entry.imageKey.trim() || !safeImageUrl(entry.imageUrl)) {
            issues.push(`Image ${i + 1}: requires an imageKey and valid HTTPS or raster data imageUrl.`); return;
        }
        if (Object.prototype.hasOwnProperty.call(value, entry.imageKey)) { issues.push(`Image ${i + 1}: duplicate imageKey.`); return; }
        value[entry.imageKey] = safeImageUrl(entry.imageUrl)!;
    });
    return { value, issues };
}
export function parseHtmlCatalog(json: string): Parsed<Record<string, string>> {
    const value: Record<string, string> = Object.create(null) as Record<string, string>;
    if (!json.trim()) return { value, issues: [] };
    let input: unknown;
    try { input = JSON.parse(json); } catch { return { value, issues: ["HTML catalogue JSON is invalid."] }; }
    if (!Array.isArray(input)) return { value, issues: ["HTML catalogue must be an array of htmlKey and html records."] };
    const issues: string[] = [];
    input.forEach((entry: unknown, i: number) => {
        if (!record(entry) || typeof entry.htmlKey !== "string" || !entry.htmlKey.trim() || typeof entry.html !== "string" || !entry.html.trim()) {
            issues.push(`HTML template ${i + 1}: requires an htmlKey and nonempty html.`); return;
        }
        if (Object.prototype.hasOwnProperty.call(value, entry.htmlKey)) { issues.push(`HTML template ${i + 1}: duplicate htmlKey.`); return; }
        value[entry.htmlKey] = entry.html;
    });
    return { value, issues };
}
function position(value: unknown): boolean {
    return Array.isArray(value) && value.length >= 2 && coordinate(value[1], value[0]) &&
        value.slice(2).every((v: unknown) => typeof v === "number" && Number.isFinite(v));
}
function line(value: unknown): boolean { return Array.isArray(value) && value.length >= 2 && value.every(position); }
function ring(value: unknown): boolean {
    return Array.isArray(value) && value.length >= 4 && value.every(position) &&
        value[0].length === value[value.length - 1].length && value[0].every((v: number, i: number) => v === value[value.length - 1][i]);
}
function polygon(value: unknown): boolean { return Array.isArray(value) && value.length > 0 && value.every(ring); }
function geometry(value: unknown): value is Geometry {
    if (!record(value)) return false;
    const c = value.coordinates;
    switch (value.type) {
        case "Point": return position(c);
        case "MultiPoint": return Array.isArray(c) && c.length > 0 && c.every(position);
        case "LineString": return line(c);
        case "MultiLineString": return Array.isArray(c) && c.length > 0 && c.every(line);
        case "Polygon": return polygon(c);
        case "MultiPolygon": return Array.isArray(c) && c.length > 0 && c.every(polygon);
        case "GeometryCollection": return Array.isArray(value.geometries) && value.geometries.every(geometry);
        default: return false;
    }
}
export function parseRoads(json: string): Parsed<Roads> {
    const value: Roads = { type: "FeatureCollection", features: [] };
    let input: unknown;
    try { input = JSON.parse(json); } catch { return { value, issues: ["GeoJSON shapes input is invalid JSON."] }; }
    const entries = record(input) && input.type === "FeatureCollection" && Array.isArray(input.features) ? input.features : [input];
    const issues: string[] = [];
    entries.forEach((entry: unknown, i: number) => {
        if (!record(entry)) { issues.push(`Shape ${i + 1}: invalid GeoJSON object.`); return; }
        const isFeature = entry.type === "Feature";
        const geom = isFeature ? entry.geometry : entry;
        if (isFeature && geom === null) return; // GeoJSON permits unlocated features.
        if (!geometry(geom)) { issues.push(`Shape ${i + 1}: invalid or unsupported geometry or coordinates.`); return; }
        const properties = isFeature && record(entry.properties) ? entry.properties : {};
        const feature: Feature<Geometry> = { type: "Feature", geometry: geom, properties };
        if (isFeature && (typeof entry.id === "string" || typeof entry.id === "number")) feature.id = entry.id;
        value.features.push(feature);
    });
    return { value, issues };
}
