import * as L from "leaflet";
import { Asset, parseAssets, parseRoads, parseImageCatalog, parseHtmlCatalog } from "./data";
import { parseTileProviders } from "./tileProviders";
import { markerContent, assetLabel } from "./equipment";
import demoAssets from "../samples/equipment.json";
import demoRoads from "../samples/roads.geo.json";

export interface MapOptions {
    assetsJson: string; roadsJson: string; useDemoData: boolean;
    showBasemap: boolean; showLabels: boolean; labelPosition: string; labelOffsetX: number; labelOffsetY: number; title: string; imagesJson: string; markerTemplate: string; htmlCatalogJson: string; customTileProvidersJson: string;
}
function text(tag: string, className: string, content = ""): HTMLElement {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = content;
    return el;
}

// GeoJSON properties are untrusted: accept bounded values and CSS colours, never arbitrary CSS.
function shapeStyle(feature?: GeoJSON.Feature): L.PathOptions {
    const p = feature?.properties ?? {};
    const nested = p.style && typeof p.style === "object" && !Array.isArray(p.style) ? p.style : {};
    const get = (...keys: string[]): unknown => {
        for (const key of keys) { if (nested[key] != null) return nested[key]; if (p[key] != null) return p[key]; }
        return undefined;
    };
    const number = (value: unknown, fallback: number, min: number, max: number): number =>
        typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
    const color = (value: unknown, fallback: string): string =>
        typeof value === "string" && /^(#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|[a-zA-Z]{1,24})$/.test(value) && CSS.supports("color", value) ? value : fallback;
    const point = feature?.geometry?.type === "Point" || feature?.geometry?.type === "MultiPoint";
    const restricted = p.status === "restricted";
    const stroke = color(get("color", "stroke"), restricted ? "#c68131" : "#56786b");
    const dash = get("dashArray", "stroke-dasharray");
    const cap = get("lineCap"), join = get("lineJoin");
    return {
        color: stroke, weight: number(get("weight", "stroke-width"), point ? 3 : 7, 0, 50),
        opacity: number(get("opacity", "stroke-opacity"), point ? 1 : 0.85, 0, 1),
        fillColor: color(get("fillColor", "fill"), point ? "#fdfef9" : stroke),
        fillOpacity: number(get("fillOpacity", "fill-opacity"), point ? 1 : 0.2, 0, 1),
        dashArray: typeof dash === "string" && /^[0-9., ]{1,80}$/.test(dash) ? dash : restricted && !point ? "8 8" : undefined,
        lineCap: cap === "butt" || cap === "square" || cap === "round" ? cap : "round",
        lineJoin: join === "miter" || join === "bevel" || join === "round" ? join : "round",
    };
}
function pointRadius(feature: GeoJSON.Feature): number {
    const p = feature.properties ?? {};
    const r = p.style?.radius ?? p.radius;
    return typeof r === "number" && Number.isFinite(r) && r >= 1 && r <= 100 ? r : 7;
}

export class MapView {
    private readonly root = text("section", "mine-map");
    private readonly surface = text("div", "mine-map__surface");
    private readonly message = text("div", "mine-map__message");
    private readonly tileMessage = text("div", "mine-map__tile-message");
    private readonly empty = text("div", "mine-map__empty", "No records to display.");
    private readonly map: L.Map;
    private readonly roads: L.GeoJSON;
    private readonly markers = L.layerGroup();
    private readonly tileLayer: L.TileLayer;
    private readonly mapboxLogo = document.createElement("a");
    private readonly basemapButton = document.createElement("button");
    private basemapStyle = "street";
    private customLayers: { id: string; name: string; layer: L.TileLayer; isMapbox: boolean }[] = [];
    private customConfig: string | undefined;
    private customIssues: string[] = [];
    private readonly layersMenu = document.createElement("div");
    private readonly markerById = new Map<string, L.Marker>();
    private assets: Asset[] = [];
    private images: Record<string, string> = {};
    private template = "";
    private htmlTemplates: Record<string, string> = {};
    private selectedId = "";
    private previousData = "";
    private previousLabels: boolean | undefined;
    private basemap = false;
    private observer?: ResizeObserver;
    private resizeFrame = 0;
    private destroyed = false;
    private tileFailed = false;
    private hasFitted = false;

    constructor(container: HTMLElement, private readonly onSelect: (asset: Asset | undefined) => void,
        private readonly onValidation: (message: string) => void) {
        this.root.setAttribute("aria-label", "Location map");
        const stage = text("div", "mine-map__stage");
        this.surface.setAttribute("aria-label", "Pan and zoom the map. Tab to a marker and press Enter to select.");
        this.message.setAttribute("role", "status");
        this.message.hidden = true;
        this.tileMessage.setAttribute("role", "status");
        this.tileMessage.hidden = true;
        this.empty.hidden = true;
        const controls = text("div", "mine-map__controls");
        const reset = document.createElement("button");
        reset.type = "button";
        reset.className = "mine-map__icon-button";
        reset.setAttribute("aria-label", "Reset view");
        reset.title = "Reset view";
        reset.append(this.controlIcon("M20 11a8 8 0 1 1-2.3-5.7M20 3v5h-5"));
        reset.addEventListener("click", () => this.fit());
        const chooser = document.createElement("div");
        chooser.className = "mine-map__layer-chooser";
        this.basemapButton.type = "button";
        this.basemapButton.className = "mine-map__icon-button";
        this.basemapButton.setAttribute("aria-label", "Choose map layer");
        this.basemapButton.title = "Choose map layer";
        this.basemapButton.setAttribute("aria-expanded", "false");
        this.basemapButton.setAttribute("aria-haspopup", "true");
        this.basemapButton.append(this.controlIcon("M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"));
        this.layersMenu.className = "mine-map__layers-menu";
        this.layersMenu.hidden = true;
        this.basemapButton.addEventListener("click", () => {
            this.layersMenu.hidden = !this.layersMenu.hidden;
            this.basemapButton.setAttribute("aria-expanded", String(!this.layersMenu.hidden));
        });
        chooser.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !this.layersMenu.hidden) {
                event.stopPropagation();
                this.layersMenu.hidden = true;
                this.basemapButton.setAttribute("aria-expanded", "false");
                this.basemapButton.focus();
            }
        });
        chooser.append(this.basemapButton, this.layersMenu);
        this.mapboxLogo.className = "mine-map__mapbox-logo";
        this.mapboxLogo.href = "https://www.mapbox.com/";
        this.mapboxLogo.target = "_blank";
        this.mapboxLogo.rel = "noopener noreferrer";
        this.mapboxLogo.setAttribute("aria-label", "Mapbox");
        this.mapboxLogo.hidden = true;
        controls.append(reset, chooser);
        L.DomEvent.disableClickPropagation(controls);
        L.DomEvent.disableScrollPropagation(controls);
        stage.append(this.surface, this.empty, this.tileMessage, controls, this.mapboxLogo);
        this.root.append(this.message, stage);
        container.append(this.root);
        this.map = L.map(this.surface, { center: [-32.0702, 116.0307], zoom: 17, zoomControl: true,
            attributionControl: true, scrollWheelZoom: true, zoomSnap: 0.25, minZoom: 2, maxZoom: 20 });
        this.map.attributionControl.setPrefix(false);
        this.map.on("moveend zoomend", () => this.updateMapboxFeedback());
        this.basemapButton.disabled = true;
        this.map.on("click", () => {
            this.layersMenu.hidden = true;
            this.basemapButton.setAttribute("aria-expanded", "false");
            if (this.selectedId) this.select(undefined);
        });
        this.map.on("keydown", (event: L.LeafletKeyboardEvent) => {
            if (event.originalEvent.key === "Escape" && this.selectedId) this.select(undefined);
        });
        this.tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 20, maxNativeZoom: 19, detectRetina: false,
            referrerPolicy: "strict-origin-when-cross-origin",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        });
        this.tileLayer.on("tileerror", () => { this.tileFailed = true; this.updateTileMessage(); });
        this.tileLayer.on("loading", () => { this.tileFailed = false; });
        this.tileLayer.on("load", () => this.updateTileMessage());
        this.roads = L.geoJSON(undefined, {
            style: shapeStyle,
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, { ...shapeStyle(feature), radius: pointRadius(feature) }),
            onEachFeature: (feature, layer) => {
                const p = feature.properties ?? {};
                const content = typeof p.tooltip === "string" ? p.tooltip : [p.name, p.status].filter((v) => typeof v === "string" && v).join(" · ");
                if (!content) return;
                const label = document.createElement("span");
                label.textContent = content;
                layer.bindTooltip(label, { sticky: true });
            },
        }).addTo(this.map);
        this.markers.addTo(this.map);
        if (typeof ResizeObserver !== "undefined") {
            this.observer = new ResizeObserver(() => this.scheduleResize());
            this.observer.observe(this.surface);
        }
    }

    public update(options: MapOptions): void {
        if (this.destroyed) return;
        const assetsDemo = options.useDemoData && !options.assetsJson.trim();
        const roadsDemo = options.useDemoData && !options.roadsJson.trim();
        if (options.customTileProvidersJson !== this.customConfig) {
            this.updateCustomProviders(options.customTileProvidersJson);
        }
        if (options.showBasemap !== this.basemap) {
            this.basemap = options.showBasemap;
            this.refreshBasemap();
            this.root.classList.toggle("mine-map--basemap", this.basemap);
            this.updateTileMessage();
        }
        const assetSource = assetsDemo ? JSON.stringify(demoAssets) : options.assetsJson.trim() || "[]";
        const roadSource = roadsDemo ? JSON.stringify(demoRoads) : options.roadsJson.trim() || '{"type":"FeatureCollection","features":[]}';
        const dataKey = JSON.stringify([assetSource, roadSource, options.imagesJson, options.markerTemplate, options.htmlCatalogJson, options.customTileProvidersJson, options.labelPosition, options.labelOffsetX, options.labelOffsetY]);
        if (dataKey === this.previousData && options.showLabels === this.previousLabels) return;
        const dataChanged = dataKey !== this.previousData;
        this.previousData = dataKey;
        this.previousLabels = options.showLabels;
        const parsedAssets = parseAssets(assetSource);
        const parsedRoads = parseRoads(roadSource);
        const parsedImages = parseImageCatalog(options.imagesJson);
        const parsedHtml = parseHtmlCatalog(options.htmlCatalogJson);
        this.htmlTemplates = parsedHtml.value;
        this.images = parsedImages.value;
        this.template = options.markerTemplate;
        const validation = [...parsedAssets.issues, ...parsedRoads.issues, ...parsedImages.issues, ...parsedHtml.issues, ...this.customIssues,
            ...parsedAssets.value.filter((asset) => !asset.html && asset.htmlKey && !Object.prototype.hasOwnProperty.call(parsedHtml.value, asset.htmlKey))
                .map((asset) => `Marker ${asset.id}: HTML key ${asset.htmlKey} was not found; using the default template or marker.`)].join(" ");
        this.message.textContent = validation;
        this.message.hidden = !validation;
        this.onValidation(validation);
        const oldSelection = this.assets.find((a) => a.id === this.selectedId);
        this.assets = parsedAssets.value;
        this.roads.clearLayers().addData(parsedRoads.value);
        this.renderMarkers(options);
        this.empty.hidden = this.assets.length !== 0 || this.roads.getBounds().isValid();
        if (this.selectedId) {
            const next = this.assets.find((a) => a.id === this.selectedId);
            if (JSON.stringify(next) !== JSON.stringify(oldSelection)) this.select(next);
        }
        if (dataChanged || !this.hasFitted) this.fit();
        this.scheduleResize();
    }

    private renderMarkers(options: MapOptions): void {
        this.markers.clearLayers();
        this.markerById.clear();
        this.assets.forEach((asset) => {
            const label = assetLabel(asset);
            const marker = L.marker([asset.latitude, asset.longitude], {
                icon: this.icon(asset), title: label, alt: label, keyboard: true, draggable: false,
                bubblingMouseEvents: false, riseOnHover: true,
            });
            marker.on("click", () => this.select(this.assets.find((a) => a.id === asset.id)));
            if (options.showLabels) {
                const tooltip = text("span", "", asset.name);
                const direction = (["bottom", "top", "left", "right"] as const).find((v) => v === options.labelPosition?.toLowerCase()) ?? "bottom";
                const base = { bottom: [0, 40], top: [0, -40], left: [-40, 0], right: [40, 0] }[direction];
                const x = Number.isFinite(options.labelOffsetX) ? options.labelOffsetX : 0;
                const y = Number.isFinite(options.labelOffsetY) ? options.labelOffsetY : 0;
                marker.bindTooltip(tooltip, { permanent: true, direction, offset: [base[0] + x, base[1] + y], className: "mine-map__label" });
            }
            marker.addTo(this.markers);
            marker.getElement()?.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    this.select(this.assets.find((a) => a.id === asset.id));
                }
            });
            this.markerById.set(asset.id, marker);
            this.decorateMarker(asset, marker);
        });
    }
    private templateFor(asset: Asset): string {
        return asset.html || (asset.htmlKey ? this.htmlTemplates[asset.htmlKey] : undefined) || this.template;
    }
    private icon(asset: Asset): L.DivIcon {
        return L.divIcon({ html: markerContent(asset, this.selectedId === asset.id, this.templateFor(asset), this.images),
            className: "mine-map__marker", iconSize: [72, 72], iconAnchor: [36, 36] });
    }
    private decorateMarker(asset: Asset, marker: L.Marker): void {
        const element = marker.getElement();
        element?.setAttribute("aria-label", assetLabel(asset));
        element?.setAttribute("aria-pressed", String(asset.id === this.selectedId));
        marker.setZIndexOffset(asset.id === this.selectedId ? 1000 : 0);
    }
    private select(asset: Asset | undefined): void {
        const previousId = this.selectedId;
        this.selectedId = asset?.id ?? "";
        this.assets.filter((a) => a.id === previousId || a.id === this.selectedId).forEach((a) => {
            const marker = this.markerById.get(a.id);
            if (marker) {
                // Keep the outer marker element and its keyboard focus when selecting.
                marker.getElement()?.replaceChildren(markerContent(a, a.id === this.selectedId, this.templateFor(a), this.images));
                this.decorateMarker(a, marker);
            }
        });
        this.onSelect(asset);
    }
    private controlIcon(path: string): SVGSVGElement {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
        shape.setAttribute("d", path);
        svg.append(shape);
        return svg;
    }
    private updateCustomProviders(json: string): void {
        this.customConfig = json;
        this.customLayers.forEach(({ layer }) => layer.remove());
        const result = parseTileProviders(json);
        this.customIssues = result.issues;
        this.customLayers = result.providers.map((provider) => {
            const attribution = provider.attribution.replace(/[&<>"']/g, (c) =>
                ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
            const isMapbox = new URL(provider.url.replace(/\{[zxy]\}/g, "0")).hostname === "api.mapbox.com";
            const credits = isMapbox
                ? `${attribution} | &copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://www.maxar.com/" target="_blank" rel="noopener noreferrer">Maxar</a> <a class="mine-map__mapbox-feedback" href="https://apps.mapbox.com/feedback/" target="_blank" rel="noopener noreferrer">Improve this map</a>`
                : attribution;
            const layer = L.tileLayer(provider.url, { maxZoom: 22, maxNativeZoom: provider.maxNativeZoom,
                tileSize: provider.tileSize, zoomOffset: provider.zoomOffset, attribution: credits });
            layer.on("tileerror", () => { this.tileFailed = true; this.updateTileMessage(); });
            layer.on("loading", () => { this.tileFailed = false; });
            layer.on("load", () => this.updateTileMessage());
            return { id: `custom:${provider.name}`, name: provider.name, layer, isMapbox };
        });
        if (this.basemapStyle.startsWith("custom:") && !this.customLayers.some((entry) => entry.id === this.basemapStyle)) this.basemapStyle = "street";
        this.refreshBasemap();
    }
    private refreshBasemap(): void {
        this.tileLayer.remove();
        this.customLayers.forEach(({ layer }) => layer.remove());
        this.tileFailed = false;
        this.basemapButton.disabled = !this.basemap;
        if (!this.basemap) this.layersMenu.hidden = true;
        this.basemapButton.setAttribute("aria-expanded", String(!this.layersMenu.hidden));
        const layers = [
            { id: "street", name: "Street map", layer: this.tileLayer },
            ...this.customLayers,
        ];
        const activeLayer = layers.find((option) => option.id === this.basemapStyle);
        console.info("[LeafletMap] Map layer state", { id: this.basemapStyle, name: activeLayer?.name ?? "unknown", basemapEnabled: this.basemap });
        this.layersMenu.replaceChildren();
        layers.forEach((option) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "mine-map__layer-option";
            button.textContent = option.name;
            button.setAttribute("aria-pressed", String(option.id === this.basemapStyle));
            button.addEventListener("click", () => {
                console.info("[LeafletMap] Map layer changed", { id: option.id, name: option.name });
                this.basemapStyle = option.id;
                this.layersMenu.hidden = true;
                this.refreshBasemap();
                this.basemapButton.focus();
            });
            this.layersMenu.append(button);
        });
        if (this.basemap) activeLayer?.layer.addTo(this.map);
        const showMapboxAttribution = this.basemap && this.customLayers.some((option) => option.id === this.basemapStyle && option.isMapbox);
        this.mapboxLogo.hidden = !showMapboxAttribution;
        console.info("[LeafletMap] Mapbox attribution visibility", { shouldShow: showMapboxAttribution, logoHidden: this.mapboxLogo.hidden, layerId: this.basemapStyle, basemapEnabled: this.basemap });
        this.updateMapboxFeedback();
        this.updateTileMessage();
    }
    private updateMapboxFeedback(): void {
        const link = this.surface.querySelector<HTMLAnchorElement>(".mine-map__mapbox-feedback");
        if (!link) return;
        const center = this.map.getCenter();
        link.href = `https://apps.mapbox.com/feedback/#/${center.lng}/${center.lat}/${this.map.getZoom()}`;
    }
    private updateTileMessage(): void {
        this.tileMessage.hidden = !this.basemap || !this.tileFailed;
        this.tileMessage.textContent = "Basemap tiles could not load. Map data remains available.";
    }
    public fit(): void {
        const bounds = this.roads.getBounds();
        this.assets.forEach((asset) => bounds.extend([asset.latitude, asset.longitude]));
        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [65, 75], maxZoom: 18, animate: false });
            this.hasFitted = true;
        }
    }
    private scheduleResize(): void {
        if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = requestAnimationFrame(() => {
            this.resizeFrame = 0;
            if (!this.destroyed) {
                this.map.invalidateSize({ pan: false });
                if (!this.hasFitted) this.fit();
            }
        });
    }
    public resize(width: number, height: number): void {
        this.root.style.width = width > 0 ? `${width}px` : "100%";
        this.root.style.height = height > 0 ? `${height}px` : "100%";
        this.scheduleResize();
    }
    public destroy(): void {
        this.destroyed = true;
        if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
        this.observer?.disconnect();
        this.map.remove();
        this.root.remove();
    }
}
