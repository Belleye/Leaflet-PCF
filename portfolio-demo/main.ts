import { LeafletMap } from "../LeafletMap";
import type { IInputs } from "../LeafletMap/generated/ManifestTypes";
import type { Asset } from "../LeafletMap/data";
import "../LeafletMap/css/leaflet.css";
import "../LeafletMap/css/LeafletMap.css";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<nav class="portfolio-nav" aria-label="Portfolio navigation"><a href="../">← <span>Back to portfolio</span></a><span class="nav-label">APP DEMO</span></nav>
<main class="app-frame"><header class="app-header"><h1>Leaflet Demo</h1><button id="mapbox-button" type="button">Mapbox API Key</button></header><section class="map-frame" aria-label="Interactive equipment map"><div id="map"></div><aside id="asset-details" class="asset-details" aria-labelledby="details-title" hidden><div class="details-heading"><h2 id="details-title">Equipment details</h2><button id="close-details" type="button" aria-label="Close equipment details">✕</button></div><h3 id="asset-name"></h3><p id="asset-type"></p><p id="asset-status"></p><p id="asset-fuel"></p><p id="asset-speed"></p></aside></section></main>
<p class="demo-note">Interactive demo · Sample equipment data</p>
<dialog id="mapbox-dialog"><form method="dialog"><div class="dialog-head"><h2>Mapbox API Key</h2><button class="close" aria-label="Close">×</button></div><p>Add a Mapbox public access token to enable the satellite layer for this session.</p><label for="token">Public access token</label><input id="token" type="password" placeholder="pk.…" autocomplete="off"><p class="privacy">The token stays in this page’s memory and is sent to Mapbox when its tiles are requested.</p><div class="dialog-actions"><button value="cancel" class="secondary">Cancel</button><button id="apply-token" value="apply">Add layer</button></div></form></dialog>`;
const host = document.querySelector<HTMLDivElement>("#map")!;
const dialog = document.querySelector<HTMLDialogElement>("#mapbox-dialog")!;
let providers = "";
const control = new LeafletMap();
function context(): ComponentFramework.Context<IInputs> {
  return { parameters: { AssetsJson: { raw: "" }, RoadsGeoJson: { raw: "" }, UseDemoData: { raw: true }, ShowBasemap: { raw: true }, ShowLabels: { raw: true }, MapTitle: { raw: "" }, CustomTileProvidersJson: { raw: providers } }, mode: { allocatedWidth: host.clientWidth, allocatedHeight: host.clientHeight, trackContainerResize: () => undefined } } as unknown as ComponentFramework.Context<IInputs>;
}
const details = document.querySelector<HTMLElement>("#asset-details")!;
function showSelection(): void {
  const json = control.getOutputs().SelectedAssetJson;
  if (!json) { details.hidden = true; return; }
  const asset = JSON.parse(json) as Asset;
  document.querySelector<HTMLElement>("#asset-name")!.textContent = asset.name;
  document.querySelector<HTMLElement>("#asset-type")!.textContent = `Type: ${asset.type}`;
  document.querySelector<HTMLElement>("#asset-status")!.textContent = `Status: ${asset.status}`;
  document.querySelector<HTMLElement>("#asset-fuel")!.textContent = `Fuel: ${asset.fuelPercent == null ? "Not available" : `${asset.fuelPercent}%`}`;
  const speed = asset.fields?.speedKph;
  document.querySelector<HTMLElement>("#asset-speed")!.textContent = `Speed: ${typeof speed === "number" ? `${speed} km/h` : "Not available"}`;
  details.hidden = false;
}
control.init(context(), showSelection, {}, host);
document.querySelector<HTMLButtonElement>("#close-details")!.addEventListener("click", () => { details.hidden = true; });
new ResizeObserver(() => control.updateView(context())).observe(host);
document.querySelector<HTMLButtonElement>("#mapbox-button")!.addEventListener("click", () => dialog.showModal());
dialog.addEventListener("close", () => {
  if (dialog.returnValue !== "apply") return;
  const token = document.querySelector<HTMLInputElement>("#token")!.value.trim();
  if (!token) return;
  providers = JSON.stringify([{ name: "Mapbox satellite", url: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token={apiKey}", apiKey: token, attribution: "© Mapbox © OpenStreetMap contributors", maxNativeZoom: 19 }]);
  control.updateView(context());
});
