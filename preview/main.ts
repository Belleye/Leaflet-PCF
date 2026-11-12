import { LocationMap } from "../LeafletMap";
import type { IInputs, IOutputs } from "../LeafletMap/generated/ManifestTypes";
import { equipmentTypes, Asset } from "../LeafletMap/data";
import { typeLabels } from "../LeafletMap/equipment";
import equipment from "../samples/equipment.json";
import "../LeafletMap/css/leaflet.css";
import "../LeafletMap/css/LeafletMap.css";
import "./preview.css";

// This shell plays the role of a Canvas app. Filtering and record details are outside the PCF.
const app = document.getElementById("app")!;
app.innerHTML = `<header class="preview-header"><div class="preview-brand"><span class="preview-logo">M</span><div><strong>FIELDWORK</strong><span>Operations workspace</span></div></div><span class="preview-tag">CANVAS APP SIMULATION</span></header>
<main class="preview-main"><div class="preview-intro"><div><p class="preview-kicker">MINE OPERATIONS / EQUIPMENT</p><h1>A clearer view of the site.</h1><p>Equipment, fuel and road access in one place.</p></div><span class="preview-date">FICTIONAL DATA<br>Reference site Â· Western Australia</span></div>
<div class="preview-filters"><label>Equipment type<select id="type"><option value="all">All equipment</option></select></label><label>Operational status<select id="status"><option value="all">All statuses</option><option value="operating">Operating</option><option value="idle">Idle</option><option value="maintenance">Maintenance</option></select></label><label class="preview-checkbox"><input id="basemap" type="checkbox" checked> OpenStreetMap basemap</label><span>Filters belong to the Canvas app</span></div>
<div class="preview-layout"><div id="control-host"></div><aside class="preview-details"><p class="preview-kicker">SELECTED EQUIPMENT</p><h2 id="selected-name">Your site, in focus.</h2><p id="selected-hint">Select an equipment marker to see its record here. This panel represents the host Power Apps screen.</p><dl id="record-details"></dl><div class="preview-output"><p class="preview-kicker">PCF SELECTION OUTPUT</p><code id="selected-id">No selection</code><small id="callback-count">0 selection callbacks</small></div></aside></div>
<footer class="preview-footer">Illustrative equipment and operational data. Roads include a user-supplied sample segment and fictional spurs. Read-only visualization.</footer></main>`;
const host = document.getElementById("control-host") as HTMLDivElement;
const type = document.getElementById("type") as HTMLSelectElement;
const status = document.getElementById("status") as HTMLSelectElement;
const basemap = document.getElementById("basemap") as HTMLInputElement;
equipmentTypes.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = typeLabels[value];
    type.append(option);
});
let suppliedAssets: string | undefined;
let suppliedRoads: string | undefined;
let suppliedImages = "";
let suppliedTemplate = "";
let suppliedHtmlCatalog = "";
let suppliedTileProviders = "";
let labelPosition = "bottom", labelOffsetX = 0, labelOffsetY = 0;
let outputs: IOutputs = {};
const control = new LocationMap();
function input(): ComponentFramework.Context<IInputs> {
    const filtered = equipment.filter((asset) => (type.value === "all" || asset.type === type.value) &&
        (status.value === "all" || asset.status === status.value));
    return {
        parameters: {
            AssetsJson: { raw: suppliedAssets ?? (type.value === "all" && status.value === "all" ? "" : JSON.stringify(filtered)) },
            RoadsGeoJson: { raw: suppliedRoads ?? "" }, UseDemoData: { raw: true },
            ImageCatalogJson: { raw: suppliedImages }, MarkerHtmlTemplate: { raw: suppliedTemplate }, HtmlCatalogJson: { raw: suppliedHtmlCatalog }, CustomTileProvidersJson: { raw: suppliedTileProviders },
            LabelPosition: { raw: labelPosition }, LabelOffsetX: { raw: labelOffsetX }, LabelOffsetY: { raw: labelOffsetY },
            ShowBasemap: { raw: basemap.checked }, ShowLabels: { raw: true }, MapTitle: { raw: "Mine operations" },
        },
        mode: { allocatedWidth: host.clientWidth, allocatedHeight: host.clientHeight, trackContainerResize: () => undefined },
    } as unknown as ComponentFramework.Context<IInputs>;
}
function receive(): void {
    outputs = control.getOutputs();
    const record = outputs.SelectedAssetJson ? JSON.parse(outputs.SelectedAssetJson) as Asset : undefined;
    document.getElementById("selected-name")!.textContent = record?.name ?? "Your site, in focus.";
    document.getElementById("selected-hint")!.textContent = record ? `${typeLabels[record.type as keyof typeof typeLabels] ?? record.type} Â· ${record.status}` : "Select an equipment marker to see its record here. This panel represents the host Power Apps screen.";
    document.getElementById("selected-id")!.textContent = outputs.SelectedAssetId || "No selection";
    document.getElementById("callback-count")!.textContent = `${outputs.SelectionVersion ?? 0} selection callbacks`;
    const details = document.getElementById("record-details")!;
    details.replaceChildren();
    if (record) {
        [["Fuel level", record.fuelPercent == null ? "Not available" : `${record.fuelPercent}%`], ["Latitude", record.latitude.toFixed(6)], ["Longitude", record.longitude.toFixed(6)]].forEach(([key, value]) => {
            const dt = document.createElement("dt"); dt.textContent = key;
            const dd = document.createElement("dd"); dd.textContent = value;
            details.append(dt, dd);
        });
    }
}
control.init(input(), receive, {}, host);
function update(): void { control.updateView(input()); }
type.addEventListener("change", () => { suppliedAssets = undefined; update(); });
status.addEventListener("change", () => { suppliedAssets = undefined; update(); });
basemap.addEventListener("change", update);
const observer = new ResizeObserver(update);
observer.observe(host);
// Expose the host-side boundary for browser regression checks, never shipped in the PCF bundle.
declare global {
    interface Window { preview: { setAssets: (json: string) => void; setRoads: (json: string) => void;
        setImages: (json: string) => void; setTemplate: (html: string) => void; setHtmlCatalog: (json: string) => void; setTileProviders: (json: string) => void;
        setLabelOptions: (position: string, x: number, y: number) => void; outputs: () => IOutputs; destroy: () => void; refresh: () => void } }
}
window.preview = {
    setLabelOptions: (position, x, y) => { labelPosition = position; labelOffsetX = x; labelOffsetY = y; update(); },
    setAssets: (json) => { suppliedAssets = json; update(); },
    setRoads: (json) => { suppliedRoads = json; update(); },
    setTileProviders: (json) => { suppliedTileProviders = json; update(); },
    setHtmlCatalog: (json) => { suppliedHtmlCatalog = json; update(); },
    setImages: (json) => { suppliedImages = json; update(); }, setTemplate: (html) => { suppliedTemplate = html; update(); }, outputs: () => outputs,
    destroy: () => { observer.disconnect(); control.destroy(); }, refresh: update,
};
