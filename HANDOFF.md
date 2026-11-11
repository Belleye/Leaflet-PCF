# Leaflet PCF project handoff

Updated: 2026-11-11

## Project goal

Build a reusable, read-only Leaflet PCF for Canvas apps on desktop and tablet. The map visualizes locations, optional roads, markers, and selection outputs. The host Canvas app owns filtering and record details. The current illustrative dataset is a fictional mine operation; the control should remain usable for other domains.

## Current build/package status

- PCF source is under `LeafletMap/`; local Canvas-style sandbox is `npm run dev` (`http://127.0.0.1:5173`).
- Existing solution packages are `solution/bin/Release/solution.zip` and `solution/bin/Release/solution_managed.zip` (both last written 2026-11-11 11:55 local time).
- Those packages were produced before the demo equipment sample was enriched with speed/operator/assignment fields at 12:24. Rebuild and repackage before importing if the updated bundled sample matters. The Canvas wiring docs and individual input files are reference material and are not included in the PCF package.
- No build-status document or retained successful-build log was found. Package files exist, but do not treat their presence as proof that the current source has been built or validated.
- No test or build was run for this handoff note.

## Implemented PCF behavior

- Read-only Leaflet control with OpenStreetMap built in, optional custom raster XYZ providers, road GeoJSON, marker labels, fuel gauges, status cues, reset-to-data-bounds, and marker selection outputs.
- Custom marker image catalogue and HTML templates are supported. Inline marker HTML can be supplied on a record; external image URLs must satisfy the parser's HTTPS/data-image rules.
- Mapbox tile style was exercised separately in `testMapbox.html`. Never copy the temporary token from conversation history into source or a shared handoff.
- PCF input names are declared in `LeafletMap/ControlManifest.Input.xml`; outputs are `SelectedAssetId`, `SelectedAssetJson`, `SelectionVersion`, and `ValidationMessage`.
- Filter/playback editing and map coordinate writes are out of scope. Movement history is only sample data for a future playback feature.

## Generated demo inputs and media

- `samples/equipment.json` contains eight fictional assets with coordinates, fuel, speed, operator, and assignment.
- `samples/roads.geo.json`, `samples/tile-providers.json`, and `samples/movement-history.json` provide the map roads, EOX/NASA tile choices, and fictional movement snapshots.
- `samples/canvas-app-inputs.json` contains the raw values for all ten PCF inputs.
- `samples/pcf-inputs/` contains individually named files matching each input expression: `AssetsJson`, `RoadsGeoJson`, `UseDemoData`, `ShowBasemap`, `ShowLabels`, `MapTitle`, `ImageCatalogJson`, `MarkerHtmlTemplate`, `HtmlCatalogJson`, and `CustomTileProvidersJson` (with format extensions).
- `samples/canvas-app-wiring.md` documents Canvas `App.OnStart`, PCF property bindings, host filtering, output-bound detail labels, and side-panel close/reopen formulas.
- `samples/images/` has editable SVG copies of six built-in equipment drawings. The live PCF generates the same vector artwork inline from `LeafletMap/equipment.ts`; it does not load these SVG files as external images. The image catalogue remains `[]` to preserve built-in gauges.

## Canvas app handoff / open work

- Canvas app `Mine Operations Map` is open in Power Apps Studio in Belleye (default). The user previously authorized publishing to Belleye. Do not assume the latest requested demo wiring was published.
- A demo collection/OnStart formula was entered during earlier Studio work; verify it in Studio before relying on it. The PCF's ten input properties were not successfully bound to the generated collection/config, and no side-panel controls or close button were added. The app therefore is not yet the requested full working host-side demo.
- Previous attempts to select the PCF in Studio failed, so the live control inputs and screen layout still need to be finished. Use `samples/canvas-app-wiring.md` for the intended formulas and layout behavior.
- To finish: verify/fix `App.OnStart`, bind all ten inputs, add host filters if desired, add the tablet-responsive asset details panel and close button, then preview marker selection, filter-clears-selection behavior, reset, and tile selection. Save and publish only after confirming the user still wants that.

## Key design notes

- `AssetsJson` is a JSON array; extra scalar metadata belongs under each record's `fields` object so it appears in `SelectedAssetJson`.
- `RoadsGeoJson` expects a Feature, FeatureCollection, LineString, or MultiLineString.
- Leave `MarkerHtmlTemplate` empty and `HtmlCatalogJson` as `[]` for the mine demo so built-in equipment illustrations and fuel gauges remain active.
- `UseDemoData=false` with supplied equipment and roads; `ShowBasemap=true`; `ShowLabels=true`.
- The custom tile input is an array of providers with `name`, XYZ `url`, `attribution`, and optional zoom/tile settings. Do not include secrets in source or sample JSON.

