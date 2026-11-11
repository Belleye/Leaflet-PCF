# Canvas app wiring for the Leaflet PCF demo

This is the complete fictional mining demo configuration for a Canvas app. The values match the project sample files. Add the PCF to a screen and use its property formulas below. The control name used here is `LeafletMap1`.

## App.OnStart

Paste this into `App.OnStart`. It creates the realistic equipment collection, movement history, roads, image/HTML inputs, and the selectable public tile providers.

```powerfx
ClearCollect(
    colEquipment,
    {id:"demo-ht-01",name:"HT-01",type:"haul-truck",latitude:-32.06949,longitude:116.02949,status:"operating",fuelPercent:76,fields:{speedKph:31,operator:"A. Parker",assignment:"Main haul circuit"}},
    {id:"demo-ht-02",name:"HT-02",type:"haul-truck",latitude:-32.07033,longitude:116.03064,status:"operating",fuelPercent:18,fields:{speedKph:14,operator:"J. Nguyen",assignment:"Loading spur"}},
    {id:"demo-ht-03",name:"HT-03",type:"haul-truck",latitude:-32.06914,longitude:116.03196,status:"idle",fuelPercent:53,fields:{speedKph:0,operator:"M. Smith",assignment:"Standby"}},
    {id:"demo-ld-01",name:"LD-01",type:"loader",latitude:-32.07028,longitude:116.02825,status:"operating",fuelPercent:62,fields:{speedKph:8,operator:"R. Taylor",assignment:"Loading bay A"}},
    {id:"demo-wc-01",name:"WC-01",type:"water-cart",latitude:-32.0689186,longitude:116.0304656,status:"operating",fuelPercent:34,fields:{speedKph:22,operator:"S. Morgan",assignment:"Dust suppression"}},
    {id:"demo-gr-01",name:"GR-01",type:"grader",latitude:-32.07123,longitude:116.03076,status:"idle",fuelPercent:87,fields:{speedKph:0,operator:"K. Jones",assignment:"Road maintenance"}},
    {id:"demo-dz-01",name:"DZ-01",type:"dozer",latitude:-32.07128,longitude:116.02915,status:"maintenance",fuelPercent:Blank(),fields:{speedKph:0,operator:"Workshop crew",assignment:"Scheduled service"}},
    {id:"demo-cr-01",name:"CR-01",type:"crusher",latitude:-32.0723,longitude:116.03163,status:"operating",fuelPercent:Blank(),fields:{speedKph:0,operator:"Plant crew",assignment:"Primary crushing"}}
);
ClearCollect(
    colMovementHistory,
    {assetId:"demo-ht-01",latitude:-32.06972,longitude:116.02922,speedKph:28,recordedAt:"11/11/2026 10:40:00"},
    {assetId:"demo-ht-01",latitude:-32.06994,longitude:116.02896,speedKph:0,recordedAt:"11/11/2026 10:38:00"},
    {assetId:"demo-ht-02",latitude:-32.0706,longitude:116.0306,speedKph:18,recordedAt:"11/11/2026 10:39:00"},
    {assetId:"demo-ht-02",latitude:-32.07033,longitude:116.03064,speedKph:14,recordedAt:"11/11/2026 10:41:00"},
    {assetId:"demo-ht-03",latitude:-32.06914,longitude:116.03196,speedKph:0,recordedAt:"11/11/2026 10:40:00"},
    {assetId:"demo-ld-01",latitude:-32.07028,longitude:116.02825,speedKph:8,recordedAt:"11/11/2026 10:41:00"},
    {assetId:"demo-wc-01",latitude:-32.0689186,longitude:116.0304656,speedKph:22,recordedAt:"11/11/2026 10:41:00"},
    {assetId:"demo-gr-01",latitude:-32.07123,longitude:116.03076,speedKph:0,recordedAt:"11/11/2026 10:41:00"}
);
Set(varRoadsGeoJson, "{""type"":""FeatureCollection"",""features"":[{""type"":""Feature"",""properties"":{""name"":""Main haul road"",""status"":""open""},""geometry"":{""type"":""LineString"",""coordinates"":[[116.0288187,-32.0700533],[116.0290329,-32.0700022],[116.0288522,-32.0697413],[116.0294949,-32.069486],[116.0299635,-32.0693158],[116.0304656,-32.0689186],[116.0313895,-32.0685953],[116.0320456,-32.0685385],[116.0323134,-32.0685783],[116.0324004,-32.0687655],[116.0323469,-32.0689357],[116.0319586,-32.0691399],[116.03151,-32.0693271],[116.0310146,-32.0696051],[116.0307401,-32.0699228],[116.0306397,-32.0703256],[116.0305861,-32.0706944],[116.0305593,-32.0710007],[116.0307602,-32.0712276],[116.0310882,-32.0714432],[116.0317309,-32.0719481],[116.0317142,-32.0721392],[116.0316284,-32.0722969]]}},{""type"":""Feature"",""properties"":{""name"":""Loading spur (fictional)"",""status"":""open""},""geometry"":{""type"":""LineString"",""coordinates"":[[116.0288187,-32.0700533],[116.02854,-32.07019],[116.02825,-32.07028],[116.02795,-32.07036]]}},{""type"":""Feature"",""properties"":{""name"":""Workshop access (fictional)"",""status"":""restricted""},""geometry"":{""type"":""LineString"",""coordinates"":[[116.0305861,-32.0706944],[116.02996,-32.07085],[116.02949,-32.07106],[116.02915,-32.07128]]}}]}");
Set(varImageCatalogJson, "[]");
Set(varMarkerHtmlTemplate, "");
Set(varHtmlCatalogJson, "[]");
ClearCollect(
    colTileProviders,
    {name:"EOX satellite",url:"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg",attribution:"EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016), CC BY 4.0",maxNativeZoom:14,tileSize:256,zoomOffset:0},
    {name:"NASA GIBS",url:"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg",attribution:"NASA GIBS / EOSDIS - MODIS Terra true colour",maxNativeZoom:9,tileSize:256,zoomOffset:0}
);
Set(varCustomTileProvidersJson, JSON(colTileProviders, JSONFormat.Compact));
Set(varMapTitle, "Mine operations demo");
Set(varTypeFilter, "All");
Set(varStatusFilter, "All");
Set(varDismissedAssetId, "");
Set(varDismissedSelectionVersion, -1);
Set(varEquipmentJson, JSON(colEquipment, JSONFormat.Compact));
```

When using Studio preview after changing `OnStart`, run **App > Run OnStart** (or close/reopen Preview) so the collections and variables are initialized.

## Bind every PCF input

Set these properties on `LeafletMap1` in the formula bar:

| PCF property | Formula | Purpose |
| --- | --- | --- |
| `AssetsJson` | `varEquipmentJson` | Equipment records filtered by Power Apps. Each record carries `fuelPercent` and a nested `fields` object with speed, operator, and assignment. |
| `RoadsGeoJson` | `varRoadsGeoJson` | Sample haul roads and restricted workshop access. |
| `UseDemoData` | `false` | Uses only the app-supplied equipment and roads. |
| `ShowBasemap` | `true` | Shows OpenStreetMap and the supplied provider choices. |
| `ShowLabels` | `true` | Shows each equipment name beside its marker. |
| `MapTitle` | `varMapTitle` | Legacy input retained for compatibility; the control intentionally renders no title. |
| `ImageCatalogJson` | `varImageCatalogJson` | `[]` for this demo; built-in mine equipment illustrations are used. |
| `MarkerHtmlTemplate` | `varMarkerHtmlTemplate` | Empty string keeps the built-in marker art and fuel gauges. |
| `HtmlCatalogJson` | `varHtmlCatalogJson` | `[]` because the demo uses the built-in marker design. |
| `CustomTileProvidersJson` | `varCustomTileProvidersJson` | Adds the EOX Satellite and NASA GIBS choices to the map layer menu. OSM stays built in. |

All ten inputs are bound. The image and HTML parameters are intentionally empty to preserve the PCF's built-in fuel-gauge design. The sample provider list is in `samples/tile-providers.json`; a Mapbox example using a maker-supplied public token is in the repository README. Do not paste a private token into a shared sample file.

The standalone values are also available under `samples/pcf-inputs/`, with each filename matching the PCF input expression exactly (the file extension indicates the value format): `AssetsJson.json`, `RoadsGeoJson.json`, `UseDemoData.txt`, `ShowBasemap.txt`, `ShowLabels.txt`, `MapTitle.txt`, `ImageCatalogJson.json`, `MarkerHtmlTemplate.html`, `HtmlCatalogJson.json`, and `CustomTileProvidersJson.json`.

## Power Apps filtering

For example, give `ddType.Items` the table `[{Value:"All"},{Value:"haul-truck"},{Value:"loader"},{Value:"water-cart"},{Value:"grader"},{Value:"dozer"},{Value:"crusher"}]`; give `ddStatus.Items` the table `[{Value:"All"},{Value:"operating"},{Value:"idle"},{Value:"maintenance"}]`. On both dropdowns' `OnChange`:

```powerfx
Set(varTypeFilter, ddType.Selected.Value);
Set(varStatusFilter, ddStatus.Selected.Value);
Set(
    varEquipmentJson,
    JSON(
        Filter(
            colEquipment,
            (varTypeFilter = "All" || type = varTypeFilter) &&
            (varStatusFilter = "All" || status = varStatusFilter)
        ),
        JSONFormat.Compact
    )
)
```

## Selection output and details panel

The PCF itself selects a marker and updates its output properties. Use labels in the Canvas app for details; for example:

- Selected asset ID: `LeafletMap1.SelectedAssetId`
- Name: `If(IsBlank(LeafletMap1.SelectedAssetJson), "", Text(ParseJSON(LeafletMap1.SelectedAssetJson).name))`
- Type: `If(IsBlank(LeafletMap1.SelectedAssetJson), "", Text(ParseJSON(LeafletMap1.SelectedAssetJson).type))`
- Status: `If(IsBlank(LeafletMap1.SelectedAssetJson), "", Text(ParseJSON(LeafletMap1.SelectedAssetJson).status))`
- Fuel: `If(IsBlank(LeafletMap1.SelectedAssetJson), "Unknown", Text(ParseJSON(LeafletMap1.SelectedAssetJson).fuelPercent) & "%")`
- Speed: `If(IsBlank(LeafletMap1.SelectedAssetJson), "", Text(ParseJSON(LeafletMap1.SelectedAssetJson).fields.speedKph) & " km/h")`
- Operator: `If(IsBlank(LeafletMap1.SelectedAssetJson), "", Text(ParseJSON(LeafletMap1.SelectedAssetJson).fields.operator))`
- Assignment: `If(IsBlank(LeafletMap1.SelectedAssetJson), "", Text(ParseJSON(LeafletMap1.SelectedAssetJson).fields.assignment))`
- Callback counter: `LeafletMap1.SelectionVersion`
- Input issue label: `LeafletMap1.ValidationMessage`

For a side panel container, set `Visible` to:

```powerfx
!IsBlank(LeafletMap1.SelectedAssetId) &&
(LeafletMap1.SelectionVersion > varDismissedSelectionVersion || LeafletMap1.SelectedAssetId <> varDismissedAssetId)
```

Add a close icon/button inside it with `OnSelect`:

```powerfx
Set(varDismissedAssetId, LeafletMap1.SelectedAssetId);
Set(varDismissedSelectionVersion, LeafletMap1.SelectionVersion)
```

This closes the panel for the current selection. Selecting another asset—or selecting the same marker again—increments the PCF selection version and makes it visible again. Set the detail labels' `Text` to the formulas above. A right-side container can be placed as a sibling overlay beside/on top of the map and sized responsively for tablet.

## Data and image files

- `samples/equipment.json`: the same eight equipment records used in `colEquipment`.
- `samples/movement-history.json`: fictional position/speed snapshots. Playback is not implemented yet; the Canvas collection is ready for a later playback feature.
- `samples/roads.geo.json`: road GeoJSON supplied to the map.
- `samples/tile-providers.json`: EOX Satellite and NASA GIBS configurations.
- `samples/images/*.svg`: editable copies of the six built-in equipment illustrations. The running PCF currently renders these vector drawings inline from `LeafletMap/equipment.ts`; they are not external image requests and need no media hosting. They are saved in the project so they can be reused or modified. The image catalogue stays `[]` unless you later add maker-hosted PNG/JPEG/WebP assets or Power Apps media data URLs.

`canvas-app-inputs.json` provides all raw PCF values in one object; `pcf-inputs/` provides each value as an individual file named for its exact PCF property.

