# Project context

This is a read-only Leaflet map control for Power Apps Canvas apps on desktop and tablet. The fictional mine operation is sample content; generic location records and GeoJSON shapes are supported. The host app supplies data, filters it and presents record details. The control displays that data and publishes selection and validation outputs. It has no persistence, connector, Dataverse query, routing, coordinate editing, tracking or playback implementation.

## Domain language

| Term | Meaning and source |
| --- | --- |
| Host | Canvas app, or the simulated host in [preview/main.ts](preview/main.ts). Owns data retrieval, filtering and details UI. |
| Marker record / asset | A normalised [Asset](LeafletMap/data.ts) with stable nonempty string `id`, nonempty `name` and numeric WGS84 `latitude`/`longitude`. “Equipment” describes the six illustrated demo types, not every supported record. |
| Shapes / roads | GeoJSON accepted by `parseRoads`, normalised to a FeatureCollection. `RoadsGeoJson` and the internal `Roads` type retain legacy names; points, lines, polygons and geometry collections are supported. GeoJSON positions use `[longitude, latitude]`. |
| Selection | One marker selected inside `MapView`, identified by asset ID. Shapes do not publish asset selections. There is no host input for setting selection. |
| Selection version | Counter incremented by the adapter on every selection callback, including repeated selection, clearing and selected-record changes. Validation-only notifications do not increment it. |
| Validation message | Aggregated input issues. Valid entries survive alongside invalid ones; malformed JSON empties the affected input. Tile-load failures use a separate on-map message. |
| Catalogue | Case-sensitive shared mapping from `imageKey` or `htmlKey` to image URL or marker template. Catalogue data is not copied into each selected record. |
| Marker template | Maker-authored HTML, sanitised before display. Precedence: nonblank record `html`, matching `htmlKey`, shared template, built-in marker. Scalar `fields` values can fill text placeholders. |
| Basemap / tile provider | Online raster XYZ imagery beneath the data. OpenStreetMap is built in; other providers are configured by the host. |
| Demo mode | For each blank data input independently, use the corresponding bundled sample. Explicit `[]` or an empty FeatureCollection stays empty. |
| Solution | Power Platform import package wrapping the PCF control; separate from the npm package and local Vite preview. |

## Constraints to preserve

- The [manifest](LeafletMap/ControlManifest.Input.xml) is the public property contract. Keep `RoadsGeoJson` and legacy no-op `MapTitle` compatible with existing formulas.
- Extra selected-record metadata belongs in scalar `fields`. Unknown top-level record properties are dropped; selected HTML remains original untrusted text, even though its rendered form is sanitised.
- Host notifications can represent validation changes as well as selections. Do not treat every `OnChange` as a marker click.
- Inputs, public tile tokens and network requests are visible to clients. There is no server-side secret storage or custom request-header integration.
- `ShowBasemap=false` removes tiles, not all possible network activity: external marker images and maker-authored template styles may still reference resources.
- No supported asset-count limit or performance budget has been established. Current updates rebuild marker and shape layers; the demo is not a scale benchmark.

See [architecture](docs/architecture.md), [observed decisions](docs/adr/README.md), and [development](docs/development.md). Historical [HANDOFF.md](HANDOFF.md) contains time-specific environment information; it is not evidence of current deployment state.
