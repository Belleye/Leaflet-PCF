import { test, expect } from "@playwright/test";
import exampleTileProviders from "../../samples/tile-providers.json";
test.beforeEach(async ({ page }) => {
    // Deterministic local checks, with no requests to the public tile server.
    await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
    await page.route("https://tiles.maps.eox.at/**", (route) => route.abort());
    await page.route("https://gibs.earthdata.nasa.gov/**", (route) => route.abort());
    await page.goto("/");
    await page.locator("#basemap").uncheck();
});

test("Mapbox attribution follows the active layer and map view", async ({ page }) => {
    await page.route("https://api.mapbox.com/**", (route) => route.abort());
    await page.evaluate(() => window.preview.setTileProviders(JSON.stringify([{
        name: "Mapbox", url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}?access_token={apiKey}",
        apiKey: "example", attribution: "Satellite imagery", tileSize: 512, zoomOffset: -1,
    }])));
    await page.locator("#basemap").check();
    const logo = page.locator(".mine-map__mapbox-logo");
    await expect(logo).toBeHidden();
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "Mapbox", exact: true }).click();
    await expect(logo).toBeVisible();
    const attribution = page.locator(".leaflet-control-attribution");
    await expect(attribution.getByRole("link", { name: "OpenStreetMap" })).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
    await expect(attribution.getByRole("link", { name: "Maxar" })).toHaveAttribute("href", "https://www.maxar.com/");
    const feedback = attribution.getByRole("link", { name: "Improve this map" });
    const before = await feedback.getAttribute("href");
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect(feedback).not.toHaveAttribute("href", before!);
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "Street map" }).click();
    await expect(logo).toBeHidden();
    await expect(feedback).toHaveCount(0);
});

test("reset fits the data and basemap switch preserves selection", async ({ page }) => {
    const marker = page.getByRole("button", { name: /^HT-01, Haul truck/ });
    await marker.click();
    const before = await marker.boundingBox();
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(async () => {
        const zoomed = await marker.boundingBox();
        return Math.abs(zoomed!.x - before!.x) + Math.abs(zoomed!.y - before!.y);
    }).toBeGreaterThan(5);
    await expect(page.locator(".leaflet-map-pane")).not.toHaveClass(/leaflet-zoom-anim/);
    await page.getByRole("button", { name: "Reset view" }).click();
    await expect.poll(async () => {
        const reset = await marker.boundingBox();
        return Math.abs(reset!.x - before!.x) + Math.abs(reset!.y - before!.y);
    }).toBeLessThan(3);
    await expect(page.getByRole("button", { name: "Choose map layer" })).toBeDisabled();
    await page.locator("#basemap").check();
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await expect(page.getByRole("button", { name: "EOX satellite" })).toHaveCount(0);
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.evaluate((providers) => window.preview.setTileProviders(JSON.stringify(providers)), exampleTileProviders);
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "EOX satellite" }).click();
    await expect(page.locator(".leaflet-control-attribution")).toContainText("EOxCloudless");
    await expect(page.locator("#selected-id")).toHaveText("demo-ht-01");
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "NASA GIBS" }).click();
    await expect(page.locator(".leaflet-control-attribution")).toContainText("NASA GIBS");
    await expect(page.locator("#selected-id")).toHaveText("demo-ht-01");
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "Street map" }).click();
    await expect(page.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap");
    await expect(page.locator("#selected-id")).toHaveText("demo-ht-01");
});
test("renders demo roads and equipment; publishes callback outputs and clears", async ({ page }) => {
    await expect(page.locator(".mine-map__marker")).toHaveCount(8);
    await expect(page.locator(".mine-map__header, .mine-map__footer, .mine-map__demo")).toHaveCount(0);
    await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(3);
    const marker = page.getByRole("button", { name: /^HT-01, Haul truck/ });
    await marker.click();
    await expect(page.locator("#selected-id")).toHaveText("demo-ht-01");
    await expect(marker).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#callback-count")).toHaveText("1 selection callbacks");
    await marker.click();
    await expect(page.locator("#callback-count")).toHaveText("2 selection callbacks");
    await page.keyboard.press("Escape");
    await expect(page.locator("#selected-id")).toHaveText("No selection");
    await expect(page.locator("#callback-count")).toHaveText("3 selection callbacks");
});
test("Canvas filtering removes selected records and preserves explicit empty inputs", async ({ page }) => {
    await page.getByRole("button", { name: /^HT-01, Haul truck/ }).click();
    await page.locator("#type").selectOption("loader");
    await expect(page.locator(".mine-map__marker")).toHaveCount(1);
    await expect(page.locator("#selected-id")).toHaveText("No selection");
    await page.evaluate(() => window.preview.setAssets("[]"));
    await expect(page.locator(".mine-map__marker")).toHaveCount(0);
    await expect(page.locator(".mine-map__empty")).toBeHidden();
    await page.evaluate(() => window.preview.setRoads('{"type":"FeatureCollection","features":[]}'));
    await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
    await expect(page.locator(".mine-map__empty")).toBeVisible();
});
test("keyboard selection, safe labels, and selected-record refresh", async ({ page }) => {
    const marker = page.getByRole("button", { name: /^HT-01, Haul truck/ });
    await marker.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#selected-id")).toHaveText("demo-ht-01");
    await expect(marker).toBeFocused();
    await page.evaluate(() => window.preview.setAssets(JSON.stringify([{ id: "demo-ht-01", name: '<img src=x onerror="window.pwned=true">', type: "haul-truck", latitude: -32.06949, longitude: 116.02949, status: "idle", fuelPercent: 5 }])));
    await expect(page.locator("#selected-name")).toHaveText('<img src=x onerror="window.pwned=true">');
    await expect(page.locator(".mine-map__label img")).toHaveCount(0);
    const outputs = await page.evaluate(() => window.preview.outputs());
    expect(JSON.parse(outputs.SelectedAssetJson!).fuelPercent).toBe(5);
    expect(outputs.SelectionVersion).toBe(2);
});
test("malformed input reports validation and can recover; teardown removes map", async ({ page }) => {
    await page.evaluate(() => window.preview.setAssets("{"));
    await expect(page.locator(".mine-map__message")).toContainText("Equipment JSON is invalid");
    expect((await page.evaluate(() => window.preview.outputs())).ValidationMessage).toContain("Equipment JSON is invalid");
    await page.evaluate(() => window.preview.setAssets("[]"));
    await expect(page.locator(".mine-map__message")).toBeHidden();
    await page.evaluate(() => window.preview.destroy());
    await expect(page.locator(".mine-map")).toHaveCount(0);
});
test("layout fits the allocated host and touch selection works", async ({ page }, testInfo) => {
    const host = await page.locator("#control-host").boundingBox();
    const map = await page.locator(".mine-map").boundingBox();
    expect(map!.width).toBeLessThanOrEqual(host!.width + 1);
    expect(map!.height).toBeLessThanOrEqual(host!.height + 1);
    const marker = page.getByRole("button", { name: /^WC-01, Water cart/ });
    if (testInfo.project.name === "tablet") await marker.tap();
    else await marker.click();
    await expect(page.locator("#selected-id")).toHaveText("demo-wc-01");
    await page.screenshot({ path: `artifacts/${testInfo.project.name}-preview.png`, fullPage: true });
});

test("generic markers resolve catalogue images and render safe templates", async ({ page }) => {
    await page.evaluate(() => {
        window.preview.setAssets(JSON.stringify([{ id: "site-1", name: "Clinic <img src=x onerror=alert(1)>", latitude: -32.07, longitude: 116.03, imageKey: "clinic", fields: { capacity: 12, note: "<b>unsafe</b>" } }]));
        window.preview.setImages(JSON.stringify([{ imageKey: "clinic", imageUrl: "data:image/png;base64,iVBORw0KGgo=" }]));
        window.preview.setTemplate('<div class="card"><img src="{{imageUrl}}" alt=""><strong>{{name}}</strong><span>{{capacity}}</span><span>{{note}}</span><img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script></div>');
    });
    const marker = page.locator(".custom-marker");
    await expect(marker.locator("strong")).toHaveText("Clinic <img src=x onerror=alert(1)>");
    await expect(marker.locator("span").first()).toHaveText("12");
    await expect(marker.locator("span").last()).toHaveText("<b>unsafe</b>");
    await expect(marker.locator("strong img, span b, script")).toHaveCount(0);
    await expect(marker.locator("img").first()).toHaveAttribute("src", /^data:image\/png;base64,/);
    await expect(marker.locator("img").last()).not.toHaveAttribute("onerror");
    await marker.click();
    expect((await page.evaluate(() => window.preview.outputs())).SelectedAssetId).toBe("site-1");
    await page.evaluate(() => window.preview.setTemplate(""));
    await expect(page.locator(".generic-marker img")).toHaveAttribute("src", /^data:image\/png;base64,/);
});

test("individual records use their keyed HTML layouts and report unknown keys", async ({ page }) => {
    await page.evaluate(() => {
        window.preview.setAssets(JSON.stringify([
            {id:"a",name:"Clinic",latitude:-32.069,longitude:116.029,htmlKey:"clinic",fields:{detail:"Open"}},
            {id:"b",name:"Depot",latitude:-32.071,longitude:116.031,htmlKey:"depot",fields:{detail:"Active"}},
            {id:"c",name:"Unknown",latitude:-32.072,longitude:116.032,htmlKey:"missing"}]));
        window.preview.setHtmlCatalog(JSON.stringify([
            {htmlKey:"clinic",html:'<div class="clinic">{{name}}: {{detail}}</div>'},
            {htmlKey:"depot",html:'<div class="depot"><strong>{{name}}</strong></div>'}]));
    });
    await expect(page.locator('.custom-marker .clinic')).toHaveText('Clinic: Open');
    await expect(page.locator('.custom-marker .depot strong')).toHaveText('Depot');
    await expect(page.locator('.generic-marker')).toHaveCount(1);
    await expect(page.locator('.mine-map__message')).toContainText('HTML key missing was not found');
    await page.getByRole('button',{name:'Depot'}).click();
    expect((await page.evaluate(() => window.preview.outputs())).SelectedAssetId).toBe('b');
});

test("per-record HTML takes precedence and is sanitised", async ({ page }) => {
    await page.evaluate(() => {
        window.preview.setTemplate('<div class="default">Default {{name}}</div>');
        window.preview.setHtmlCatalog(JSON.stringify([{htmlKey:"card", html:'<div class="catalogue">Catalogue {{name}}</div>'}]));
        window.preview.setAssets(JSON.stringify([
            {id:"a",name:'<img src=x onerror=alert(1)>',latitude:-32.069,longitude:116.029,htmlKey:"card",html:'<div class="direct"><strong>{{name}}</strong><img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script></div>'},
            {id:"b",name:"Keyed",latitude:-32.071,longitude:116.031,htmlKey:"card"},
            {id:"c",name:"Fallback",latitude:-32.072,longitude:116.032,htmlKey:"unknown"}]));
    });
    await expect(page.locator('.direct strong')).toHaveText('<img src=x onerror=alert(1)>');
    await expect(page.locator('.direct strong img, .direct script, .direct [onerror]')).toHaveCount(0);
    await expect(page.locator('.catalogue')).toHaveText('Catalogue Keyed');
    await expect(page.locator('.custom-marker .default')).toHaveText('Default Fallback');
    await expect(page.locator('.mine-map__message')).toContainText('HTML key unknown was not found');
    await page.locator('.direct').click();
    const outputs = await page.evaluate(() => window.preview.outputs());
    expect(outputs.SelectedAssetId).toBe('a');
    expect(JSON.parse(outputs.SelectedAssetJson!).html).toContain('class="direct"');
    await expect(page.locator('.direct strong img, .direct script')).toHaveCount(0);
});

test("custom providers load from configuration and switch without leaking keys", async ({ page }) => {
    const urls: string[] = [];
    await page.route("https://tiles.example.test/**", (route) => { urls.push(route.request().url()); return route.abort(); });
    await page.evaluate(() => window.preview.setTileProviders(JSON.stringify([
        {name:"Hosted tiles",url:"https://tiles.example.test/{z}/{x}/{y}.png?key={apiKey}",apiKey:"demo & key",attribution:"Example <provider>",maxNativeZoom:14},
        {name:"Self hosted",url:"http://localhost:9999/{z}/{x}/{y}.png",attribution:"Local tiles"}
    ])));
    await page.locator("#basemap").check();
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "Hosted tiles" }).click();
    await expect.poll(() => urls.length).toBeGreaterThan(0);
    expect(urls[0]).toContain("key=demo%20%26%20key");
    await expect(page.locator(".leaflet-control-attribution")).toContainText("Example <provider>");
    await expect(page.locator(".leaflet-control-attribution provider")).toHaveCount(0);
    await expect(page.locator(".mine-map")).not.toContainText("demo & key");
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await expect(page.getByRole("button", { name: "Self hosted" })).toBeVisible();
    await page.evaluate(() => window.preview.setTileProviders(JSON.stringify([{name:"Bad",url:"https://example.test/no-coordinates",attribution:"Example"}])));
    await expect(page.locator(".mine-map__message")).toContainText("URL must include");
    await expect(page.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap");
});

test("512-pixel style tiles use the configured zoom offset", async ({ page }) => {
    const urls: string[] = [];
    await page.route("https://styles.example.test/**", (route) => { urls.push(route.request().url()); return route.abort(); });
    await page.evaluate(() => window.preview.setTileProviders(JSON.stringify([{
        name: "Satellite and roads", url: "https://styles.example.test/tiles/512/{z}/{x}/{y}@2x?access_token={apiKey}",
        apiKey: "test-key", attribution: "Example tiles", tileSize: 512, zoomOffset: -1, maxNativeZoom: 19,
    }])));
    await page.locator("#basemap").check();
    await page.getByRole("button", { name: "Choose map layer" }).click();
    await page.getByRole("button", { name: "Satellite and roads" }).click();
    await expect.poll(() => urls.length).toBeGreaterThan(0);
    expect(urls[0]).toMatch(/\/tiles\/512\/\d+\/\d+\/\d+@2x\?access_token=test-key$/);
    const tiles = page.locator('.leaflet-tile-container img');
    await expect(tiles.first()).toHaveCSS('width', '512px');
    await expect(page.locator('.mine-map__message')).toBeHidden();
});

test("renders mixed shapes and positions custom marker labels", async ({ page }) => {
    await page.evaluate(() => {
        window.preview.setRoads(JSON.stringify({ type: "FeatureCollection", features: [
            { type: "Feature", properties: { name: "Zone" }, geometry: { type: "Polygon", coordinates: [[[116.029, -32.070], [116.031, -32.070], [116.031, -32.071], [116.029, -32.070]]] } },
            { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [116.03, -32.07] } },
        ] }));
        window.preview.setTemplate("<div style='width:48px;height:48px;background:red'></div>");
    });
    await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(2);
    const marker = page.getByRole("button", { name: /^HT-01, Haul truck/ });
    const child = marker.locator(".custom-marker > div");
    const markerBox = await marker.boundingBox(), childBox = await child.boundingBox();
    expect(Math.abs((childBox!.x + childBox!.width / 2) - (markerBox!.x + markerBox!.width / 2))).toBeLessThan(1);
    await page.evaluate(() => window.preview.setLabelOptions("right", 7, 3));
    await expect(page.locator(".mine-map__label").first()).toHaveClass(/leaflet-tooltip-right/);
    await expect(page.locator(".mine-map__message")).toBeHidden();
});

test("built-in fuel gauge matches a 48 pixel custom marker while retaining its content", async ({ page }) => {
    const gauge = page.getByRole("button", { name: /^HT-01, Haul truck/ }).locator(".mine-marker");
    await expect(gauge.locator(".mine-marker__fuel")).toHaveText("76%");
    await expect(gauge.locator(".mine-marker__equipment svg")).toHaveCount(1);
    const box = await gauge.boundingBox();
    expect(box!.width).toBeCloseTo(48, 0);
    expect(box!.height).toBeCloseTo(48, 0);
});

test("styles GeoJSON features independently and falls back on invalid values", async ({ page }) => {
    await page.evaluate(() => window.preview.setRoads(JSON.stringify({ type: "FeatureCollection", features: [
        { type: "Feature", properties: { name: "Red road", color: "#e53935", weight: 5, opacity: 0.9, dashArray: "4 6" }, geometry: { type: "LineString", coordinates: [[116.029, -32.07], [116.03, -32.071]] } },
        { type: "Feature", properties: { style: { color: "#123456", fillColor: "#00ff00", fillOpacity: 0.4 } }, geometry: { type: "Polygon", coordinates: [[[116.029, -32.07], [116.031, -32.07], [116.031, -32.071], [116.029, -32.07]]] } },
        { type: "Feature", properties: { radius: 12, color: "blue", fillColor: "red", fillOpacity: 0.6, tooltip: "Workshop" }, geometry: { type: "Point", coordinates: [116.03, -32.07] } },
        { type: "Feature", properties: { color: "url(javascript:bad)", weight: -1, status: "restricted" }, geometry: { type: "LineString", coordinates: [[116.03, -32.07], [116.031, -32.071]] } },
    ] })));
    const shapes = page.locator(".leaflet-overlay-pane path");
    await expect(shapes).toHaveCount(4);
    await expect(shapes.nth(0)).toHaveAttribute("stroke", "#e53935");
    await expect(shapes.nth(0)).toHaveAttribute("stroke-width", "5");
    await expect(shapes.nth(0)).toHaveAttribute("stroke-dasharray", "4 6");
    await expect(shapes.nth(1)).toHaveAttribute("fill", "#00ff00");
    await expect(shapes.nth(1)).toHaveAttribute("fill-opacity", "0.4");
    await expect(shapes.nth(2)).toHaveAttribute("stroke", "blue");
    await expect(shapes.nth(2)).toHaveAttribute("fill", "red");
    await expect(shapes.nth(2)).toHaveAttribute("d", /a12,12/);
    await expect(shapes.nth(3)).toHaveAttribute("stroke", "#c68131");
    await expect(shapes.nth(3)).toHaveAttribute("stroke-width", "7");
    await expect(shapes.nth(3)).toHaveAttribute("stroke-dasharray", "8 8");
});
