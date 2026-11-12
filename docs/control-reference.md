# Control reference

Details of the inputs, outputs, marker appearance and basemaps for the [Leaflet map](../README.md).

## Inputs

| Property | Type | Behavior |
| --- | --- | --- |
| `AssetsJson` | Text (JSON) | Array of equipment already filtered by Power Apps. `[]` displays no equipment, even in demo mode. |
| `RoadsGeoJson` (GeoJSON shapes) | Text (GeoJSON) | Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollection, Feature, or FeatureCollection. An empty FeatureCollection displays no shapes. The internal property name is retained for compatibility. |
| `UseDemoData` | Boolean | Defaults to true in Canvas. Uses a bundled sample for each blank JSON input. Set false for app-supplied data. |
| `ShowBasemap` | Boolean | Defaults to true. Allows OpenStreetMap and configured custom providers; false uses a local schematic background and disables switching. |
| `ShowLabels` | Boolean | Defaults to true. Displays marker names. |
| `LabelPosition` | Text | `bottom` (default), `top`, `left`, or `right`. |
| `LabelOffsetX`, `LabelOffsetY` | Whole numbers | Pixel adjustments from the default position; positive X moves right and positive Y moves down. |
| `MapTitle` | Text | Legacy compatibility property; no title is displayed. |
| `ImageCatalogJson` | Text (JSON) | Shared array of `{imageKey, imageUrl}` image records. |
| `MarkerHtmlTemplate` | Text (HTML) | Optional default template for markers without an HTML key. |
| `HtmlCatalogJson` | Text (JSON) | Shared array of `{htmlKey, html}` templates for individual markers. |
| `CustomTileProvidersJson` | Text (JSON) | Optional array of custom raster tile providers shown in the layer menu. |

See [samples/equipment.json](../samples/equipment.json) and [samples/roads.geo.json](../samples/roads.geo.json).

```json
{
  "id": "asset-001",
  "name": "HT-01",
  "type": "haul-truck",
  "latitude": -32.06949,
  "longitude": 116.02949,
  "status": "operating",
  "fuelPercent": 76
}
```

`id` is a stable nonempty string; GUIDs can be used. `type` and `status` are optional strings and can represent any use case. The built-in illustrations and fuel gauges apply to the six demo types: `haul-truck`, `loader`, `water-cart`, `grader`, `dozer`, `crusher`. Other types use a generic image or initial marker. Coordinates are numeric WGS84 degrees, not strings. Equipment latitude/longitude are named fields; GeoJSON positions are **[longitude, latitude]**.

Fuel is 0â€“100: red â‰¤20, amber >20â€“40, green >40. Missing/null/invalid fuel displays a dashed unknown gauge and `â€”`. Status appears in the marker's accessible name; a small green/amber/red indicator represents operating/idle/maintenance. Invalid records and duplicate IDs are skipped and reported through `ValidationMessage`; malformed JSON displays no features from that input. Other valid records/roads remain visible.

`imageUrl` is optional. Bundled illustrations work without image hosting. HTTPS PNG/image links and PNG/JPEG/WebP base64 data images are supported; a failed image falls back to the illustration. HTTPS images must be reachable without custom authorization headers. For another external image host, add that domain to the manifest's `external-service-usage` declaration and rebuild. SVG data images are not accepted. Selected-record JSON contains the normalised marker fields, including `fields`.

Road properties: optional `name`, and `status` of `open` or `restricted` (dashed amber). Other status values render as open. Reset view fits the supplied roads and visible equipment; fitting also runs on input data changes. The map supports mouse-wheel zoom, touch pan/pinch zoom and keyboard navigation; zoom buttons have 44px targets. Tab to a marker and press Enter or Space; Escape or a map-background tap clears selection.

## Generic markers, shared images, and HTML templates

A generic record requires only `id`, `name`, `latitude`, and `longitude`. `type`, `status`, `imageKey`, `imageUrl`, `htmlKey`, `html`, and `fuelPercent` are optional. Put additional text, numeric, Boolean, or null values in a `fields` object. An `imageUrl` on the record takes precedence over its `imageKey`; an unknown key falls back to an initial. For example:

```json
[{"id":"clinic-1","name":"North clinic","latitude":-32.07,"longitude":116.03,"type":"clinic","imageKey":"clinic","fields":{"capacity":12,"statusLabel":"Open"}}]
```

Supply a separate `ImageCatalogJson` array, e.g. `[{"imageKey":"clinic","imageUrl":"https://example.com/clinic.png"}]`. A catalogue entry can instead contain a PNG/JPEG/WebP data URL. Keys are case-sensitive and must be unique. The PCF reads the catalogue once and does not embed its image data in each marker record or selected output.

For Canvas app media, upload an image named `ClinicImage`, then use a behavior formula like this to create the catalogue JSON:

```powerfx
ClearCollect(colMarkerImages, {imageKey: "clinic", imageUrl: ClinicImage});
Set(varImageCatalogJson, JSON(colMarkerImages, JSONFormat.IncludeBinaryData))
```

Set `ImageCatalogJson` to `varImageCatalogJson`; put `imageKey: "clinic"` in the marker JSON supplied through `AssetsJson`. `JSONFormat.IncludeBinaryData` can increase payload size. Power Apps can serialize an image as a data URL or preserve an HTTPS reference, depending on its source. Test this in the target Canvas app, including authenticated image sources. The PCF cannot attach custom authentication headers to image requests.

Set `MarkerHtmlTemplate` to a default maker-authored layout, or set `HtmlCatalogJson` to a JSON array such as:

```json
[{"htmlKey":"clinic","html":"<strong>{{name}}</strong>"},{"htmlKey":"depot","html":"<div>{{name}} - {{status}}</div>"}]
```

Assign `htmlKey` on each record to select its layout, or set `html` on the record to supply its own maker-provided template directly. The order is nonempty record `html`, matching `htmlKey`, default `MarkerHtmlTemplate`, then built-in marker. Empty or whitespace-only `html` is ignored. An unresolved key is reported in `ValidationMessage` unless direct HTML overrides it; the default template or built-in marker is used. Keys are case-sensitive. The selected record JSON includes the original `html` and `htmlKey` when provided; the original HTML is untrusted data, while rendering uses the same sanitisation and placeholder handling as catalogue templates. For a richer layout, use HTML such as:

```html
<div style="background:white;border-radius:8px;padding:6px;text-align:center">
  <img src="{{imageUrl}}" alt="" style="width:42px;height:42px;object-fit:contain">
  <strong>{{name}}</strong><br><span>{{statusLabel}}</span>
</div>
```

The PCF replaces placeholders in **text nodes** from `id`, `name`, `type`, `status`, `fuelPercent`, `latitude`, `longitude` and the scalar entries in `fields`. Built-in field names take precedence. `{{imageUrl}}` is supported only as the entire `src` of an `img`; it resolves through the record or catalogue and is restricted to HTTPS or raster data URLs. Other attribute placeholders are removed. HTML is sanitised to a small set of presentational tags and attributes; scripts, event handlers, links, forms and arbitrary embedded elements are removed. Template styles and static image URLs are maker-authored. Use unique keys, concise images, and a template sized to roughly 72 × 72 pixels for predictable marker interaction. With no template, generic markers use the resolved image or their initial; the existing mine demo retains its gauges.

## Custom tile providers

Set `CustomTileProvidersJson` to an array of providers. Each becomes an option in the layers menu. OpenStreetMap is always built in; EOX and NASA appear only when supplied in the array. See [samples/tile-providers.json](../samples/tile-providers.json) for ready-to-use EOX and NASA entries. The example hostnames below are placeholders and need to be replaced with real tile services:

```json
[
  {"name":"My tile provider","url":"https://tiles.example.com/{z}/{x}/{y}.png?key={apiKey}","apiKey":"YOUR_PUBLIC_PROVIDER_TOKEN","attribution":"© My tile provider","maxNativeZoom":19},
  {"name":"Self-hosted map","url":"https://maps.example.internal/tiles/{z}/{x}/{y}.png","attribution":"© My organisation","maxNativeZoom":17}
]
```

`name`, `url`, and `attribution` are required. URL templates must use `{z}`, `{x}`, and `{y}`. If the template includes `{apiKey}`, provide `apiKey`; it is URL-encoded before insertion. `maxNativeZoom` is optional (default 18, range 0–22); `tileSize` is optional (256 or 512, default 256) and `zoomOffset` is optional (-1 to 1, default 0); beyond it Leaflet enlarges the highest available tiles. This supports XYZ raster image services, including free, keyed, and self-hosted servers. WMTS URLs can work when their addressing matches XYZ; vector tiles, TMS-flipped rows, custom request headers, and provider-specific authentication flows are not implemented. For multiple providers include multiple records with distinct names. `ShowBasemap=false` disables the layers menu.

For the Mapbox Satellite + Roads style, use this entry with your own public, URL-restricted token:

```json
{"name":"Mapbox Satellite + Roads","url":"https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token={apiKey}","apiKey":"YOUR_PUBLIC_TOKEN","attribution":"© Mapbox © OpenStreetMap contributors","tileSize":512,"zoomOffset":-1,"maxNativeZoom":19}
```

This style uses Mapbox's **Styles / Static Tiles API**, which can have different availability and billing from the Raster Tiles API. When an `api.mapbox.com` layer is active, the control displays the Mapbox logo and links for Mapbox, OpenStreetMap, Maxar, and map feedback. The feedback link follows the current map center and zoom. The supplied attribution is also displayed as plain text. Check the [Mapbox attribution guidance](https://docs.mapbox.com/help/dive-deeper/attribution/) and the attribution required by the specific style and its data sources before publishing.

Keys passed to a Canvas PCF are visible to the app user in client-side configuration or network requests: use only public, domain-restricted browser tokens and do not put secrets in these properties. Apply the provider's own key restrictions, attribution, terms, and usage limits. The browser must be able to reach the provider; self-hosted tiles may need VPN/network access. A secure Power Apps page normally blocks insecure HTTP tile requests as mixed content, so use HTTPS for deployed apps. HTTPS tiles must use trusted certificates; a localhost HTTP provider is intended for local development only.

Custom provider domains are not automatically inserted into the PCF manifest: add the intended domains to `external-service-usage` in `LeafletMap/ControlManifest.Input.xml`, increment the version and rebuild before distributing a configuration that uses them. The control already declares external services and remains a premium component. The supplied attribution field is plain text; apart from the Mapbox handling above, provider-specific logos and linked or dynamic attribution must be addressed separately.

## Basemap and attribution

The street basemap uses `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with visible attribution, ordinary browser caching and no prefetch/offline tile download. Tile delivery is best-effort. Confirm host networking/referrer behavior and the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) for deployment. Turning off `ShowBasemap` removes the tile layer; bundled demo markers and roads continue to work. The layers button opens a menu containing OpenStreetMap and the custom providers supplied by the host. The optional sample array includes EOX Sentinel-2 cloudless 2016 and NASA GIBS MODIS Terra true-colour imagery. NASA GIBS uses the latest available daily image and has approximately 250 m native resolution (zoom 9), so it is useful for regional context rather than site-level detail. Tiles are enlarged at higher zoom. The EOX imagery is 2016 imagery. EOX allows free commercial use of this 2016 layer with attribution and reasonable traffic; its public service has no uptime guarantee. The imagery is from 2016, approximately 10 m resolution and available to zoom level 14; tiles are enlarged at higher zoom, so it will not show fine equipment or roads. See the [EOX usage FAQ](https://cloudless.eox.at/documentation/faq). For custom providers, see the configuration below; the provider domain must also be listed in the component manifest before deployment.

The manifest declares external service usage for `tile.openstreetmap.org`, `tiles.maps.eox.at`, `gibs.earthdata.nasa.gov` and `api.mapbox.com`. Microsoft classifies components using external services as premium; see [external service usage](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/external-service-usage). The declaration stays in this package when the basemap is disabled.

`ShowBasemap=false` disables tile requests, not every possible network request. Configured HTTPS marker images and resources referenced by maker-authored template styles can still load. The manifest's schematic-background description should be read with that scope.

The original road segment came from the PRD's GeoJSON sample. Added spurs, equipment, fuel and operating status are fictional and do not represent actual mine roads or conditions. Movement histories and playback are deferred.

Leaflet is distributed under the BSD 2-Clause license; see [THIRD-PARTY-NOTICES.txt](../THIRD-PARTY-NOTICES.txt).


### GeoJSON shapes and marker alignment

The existing `RoadsGeoJson` expression appears as **GeoJSON shapes** in Studio. It accepts all standard GeoJSON geometry types, features, and feature collections; longitude precedes latitude. Polygon rings must be closed. Invalid features are skipped and reported through `ValidationMessage`. Unlocated features (`geometry: null`) are skipped. Points are rendered as circle markers; lines retain the existing road styling and restricted status treatment; polygons use the same stroke with a translucent fill. Shape bounds participate in Reset view. The input retains its internal name to avoid breaking existing Canvas formulas.

Custom marker content is centered within a 72 × 72 pixel marker area. `LabelPosition` selects the label direction, and `LabelOffsetX`/`LabelOffsetY` adjust its position from the default 40-pixel offset. Existing templates that supplied their own 72-pixel wrapper remain centered. The label settings are map-wide.


### Styling GeoJSON features

Feature `properties` can contain styling directly or inside `properties.style` (nested values take precedence):

| Property | Applies to | Accepted values |
| --- | --- | --- |
| `color` (`stroke`) | All shapes | Named CSS colour or 3, 4, 6, or 8 digit hex colour |
| `weight` (`stroke-width`) | All | Number 0–50 pixels |
| `opacity` (`stroke-opacity`) | All | Number 0–1 |
| `fillColor` (`fill`) | Polygons and points | Named CSS colour or hex colour |
| `fillOpacity` (`fill-opacity`) | Polygons and points | Number 0–1 |
| `dashArray` (`stroke-dasharray`) | All | String of pixel lengths such as `"8 4"` |
| `lineCap` / `lineJoin` | Lines and polygon outlines | `round`, `butt`, or `square` for caps; `round`, `bevel`, or `miter` for joins |
| `radius` | Points and MultiPoints | Number 1–100 pixels |
| `tooltip` | Features | Plain text shown on hover; otherwise name and status are shown |

Invalid style values fall back to defaults. A restricted feature retains its amber dashed default unless overridden. GeoJSON properties are data and tooltip text is not interpreted as HTML. The standard GeoJSON format does not prescribe these styling properties; these are PCF conventions.

```json
{"type":"FeatureCollection","features":[
  {"type":"Feature","properties":{"name":"Haul road","color":"#e53935","weight":5,"opacity":0.9,"dashArray":"8 4"},"geometry":{"type":"LineString","coordinates":[[116.029,-32.070],[116.031,-32.071]]}},
  {"type":"Feature","properties":{"name":"Work zone","style":{"color":"#2563eb","fillColor":"#60a5fa","fillOpacity":0.3}},"geometry":{"type":"Polygon","coordinates":[[[116.029,-32.070],[116.031,-32.070],[116.031,-32.071],[116.029,-32.070]]]}},
  {"type":"Feature","properties":{"tooltip":"Workshop","radius":10,"color":"#7c2d12","fillColor":"#fbbf24","fillOpacity":0.8},"geometry":{"type":"Point","coordinates":[116.030,-32.070]}}
]}
```
