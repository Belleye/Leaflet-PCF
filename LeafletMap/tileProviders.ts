export interface CustomTileProvider {
    name: string;
    url: string;
    attribution: string;
    maxNativeZoom: number;
    tileSize: number;
    zoomOffset: number;
}

export function parseTileProviders(json: string): { providers: CustomTileProvider[]; issues: string[] } {
    const providers: CustomTileProvider[] = [];
    const issues: string[] = [];
    if (!json.trim()) return { providers, issues };
    let input: unknown;
    try { input = JSON.parse(json); } catch { return { providers, issues: ["Custom tile providers JSON is invalid."] }; }
    if (!Array.isArray(input)) return { providers, issues: ["Custom tile providers must be a JSON array."] };
    const names = new Set<string>();
    input.forEach((entry: unknown, index: number) => {
        const prefix = `Tile provider ${index + 1}`;
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) { issues.push(`${prefix}: expected an object.`); return; }
        const item = entry as Record<string, unknown>;
        if (typeof item.name !== "string" || !item.name.trim() || typeof item.url !== "string" ||
            typeof item.attribution !== "string" || !item.attribution.trim()) {
            issues.push(`${prefix}: name, URL template and attribution are required.`); return;
        }
        const name = item.name.trim();
        if (names.has(name.toLowerCase())) { issues.push(`${prefix}: duplicate name.`); return; }
        if (!["{z}", "{x}", "{y}"].every((token) => (item.url as string).includes(token))) {
            issues.push(`${prefix}: URL must include {z}, {x} and {y}.`); return;
        }
        if (item.url.includes("{apiKey}") && (typeof item.apiKey !== "string" || !item.apiKey)) {
            issues.push(`${prefix}: an API key is required for the URL template.`); return;
        }
        const url = item.url.replace(/\{apiKey\}/g, () => encodeURIComponent(typeof item.apiKey === "string" ? item.apiKey : ""));
        const unknown = url.replace(/\{[zxy]\}/g, "0");
        try {
            const parsed = new URL(unknown);
            if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || /[{}]/.test(unknown)) throw new Error();
        } catch { issues.push(`${prefix}: invalid HTTP(S) URL template or unsupported placeholder.`); return; }
        const zoom = item.maxNativeZoom == null ? 18 : item.maxNativeZoom;
        if (typeof zoom !== "number" || !Number.isInteger(zoom) || zoom < 0 || zoom > 22) {
            issues.push(`${prefix}: maxNativeZoom must be an integer from 0 to 22.`); return;
        }
        const tileSize = item.tileSize == null ? 256 : item.tileSize;
        const zoomOffset = item.zoomOffset == null ? 0 : item.zoomOffset;
        if ((tileSize !== 256 && tileSize !== 512) || typeof zoomOffset !== "number" || !Number.isInteger(zoomOffset) || zoomOffset < -1 || zoomOffset > 1) {
            issues.push(`${prefix}: tileSize must be 256 or 512 and zoomOffset must be -1, 0 or 1.`); return;
        }
        names.add(name.toLowerCase());
        providers.push({ name, url, attribution: item.attribution, maxNativeZoom: zoom, tileSize, zoomOffset });
    });
    return { providers, issues };
}
