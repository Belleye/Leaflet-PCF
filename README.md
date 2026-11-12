# Mine Operations Map PCF

A read-only [Leaflet](https://leafletjs.com/) map component for **Power Apps Canvas apps on desktop and tablet**. Display equipment or other locations alongside GeoJSON shapes, customise markers and basemaps, and use selection outputs to connect the map to your app. The included mining data is fictional.

## Features

- **Markers for any location:** supply JSON records with coordinates and optional status, fuel, images and additional fields. Six equipment types have built-in illustrations and fuel gauges; other records use a generic image or initial.
- **GeoJSON overlays:** display points, lines, polygons and collections, with per-feature colours, line styles, fills and tooltips. Restricted roads have a distinct default style.
- **Custom marker appearance:** use shared image and HTML catalogues, a default HTML template, or a template on an individual record. Configure label visibility, direction and offsets.
- **Basemap choices:** use OpenStreetMap, add compatible raster tile providers, or turn off online tiles for a schematic background.
- **Interactive navigation:** pan, zoom and reset the view to fit supplied markers and shapes. Mouse, touch and keyboard interactions are supported.
- **Canvas app integration:** receive the selected record and validation messages as output properties. Filter data and build details panels in Power Apps.
- **Built-in demo:** explore the map using fictional equipment and roads before connecting your own data.

The component displays data supplied by the app. It does not provide playback, coordinate editing, live location tracking, routing or data writes.

## Get started

- [Import the solution](docs/importing.md) into Power Apps. A release ZIP is coming soon.
- [Build a Canvas app](docs/building.md) using the map, sample data and Power Fx formulas.
- [Control reference](docs/control-reference.md): inputs, outputs, markers, shapes and basemaps.

For contributors: [project context](CONTEXT.md), [architecture](docs/architecture.md), [development and delivery](docs/development.md), and [architectural decisions](docs/adr/README.md). Leaflet licensing details are in [third-party notices](THIRD-PARTY-NOTICES.txt).
