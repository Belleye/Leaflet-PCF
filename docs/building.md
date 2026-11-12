# Build a Canvas app with the map

After [importing the solution](importing.md), add the **Leaflet map** code component to a Canvas app. This guide uses `MineMap` as the control name.

## Start with the demo

1. In Power Apps Studio, choose **Insert → Get more components → Code**, import **Leaflet map**, and add it to a screen.
2. Give the control a usable map area, for example `Width = Parent.Width` and `Height = 600`. At least 400 × 400 is recommended.
3. Set `UseDemoData`, `ShowBasemap`, and `ShowLabels` to `true`. Leave `AssetsJson` and `RoadsGeoJson` blank to show the bundled demo. Select a marker and bind a label to `MineMap.SelectedAssetId`.

## Supply data and handle selection

Create a collection in a behavior formula such as the screen's `OnVisible`:

```powerfx
ClearCollect(
    colEquipment,
    {id: "demo-ht-01", name: "HT-01", type: "haul-truck", latitude: -32.06949, longitude: 116.02949, status: "operating", fuelPercent: 76},
    {id: "demo-ld-01", name: "LD-01", type: "loader", latitude: -32.07028, longitude: 116.02825, status: "idle", fuelPercent: 32}
);
Set(varEquipmentJson, JSON(colEquipment, JSONFormat.Compact))
```

Set `MineMap.AssetsJson = varEquipmentJson`. Set `UseDemoData = false` when supplying your own equipment and roads. JSON serialization belongs in a behavior formula; refresh the variable when filters/data change.

For example, a dropdown with `["all", "haul-truck", "loader", "water-cart", "grader", "dozer", "crusher"]` as its items can use this `OnChange`:

```powerfx
Set(
    varEquipmentJson,
    JSON(
        Filter(colEquipment, ddEquipmentType.Selected.Value = "all" || type = ddEquipmentType.Selected.Value),
        JSONFormat.Compact
    )
)
```

Set the PCF's **OnChange** formula to receive selections:

```powerfx
Set(varSelectedAssetId, MineMap.SelectedAssetId);
Set(
    varSelectedAsset,
    If(IsBlank(varSelectedAssetId), Blank(), LookUp(colEquipment, id = varSelectedAssetId))
)
```

Bind your app's detail controls to `varSelectedAsset`. For a future Dataverse GUID key, compare with `GUID(varSelectedAssetId)` in the nonblank branch. No PCF Web API or connector is required.

| Output | Meaning |
| --- | --- |
| `SelectedAssetId` | ID selected inside the PCF; empty when cleared or excluded by the next input. |
| `SelectedAssetJson` | Validated selected record as JSON; empty when cleared. Can also be consumed with `ParseJSON`. |
| `SelectionVersion` | Increases for each selection, including a second tap on the same marker, clearing, and a selected record changing in the supplied data. |
| `ValidationMessage` | Input problems or empty text. Validation changes also notify the host, so OnChange handlers should not assume every notification is a marker tap. |

The PCF calls `notifyOutputChanged()` and returns outputs through `getOutputs()`. Selection is entirely inside the PCF. If app filtering removes the selected record, the PCF clears the selection and notifies the app. If its supplied attributes change, the selected output refreshes. Ordinary host re-renders do not emit selection callbacks. Demo IDs are local fictional identifiers, not Dataverse records.


For a more complete fictional mining example, see [Canvas app wiring](../samples/canvas-app-wiring.md). For all properties and data formats, see the [control reference](control-reference.md).

## Canvas app YAML

The [Screen1 YAML](../samples/screen1.pa.yaml) is the supplied example screen. It includes the map, equipment details panel, marker templates, roads and an optional Mapbox token dialog. Its control is named `LeafletMap1`; it is a separate, fuller example from the `MineMap` formulas above.

1. Import the code component into the app as described above. Upload the six PNG files in [samples/images](../samples/images/) as app media named `haul-truck`, `loader`, `water-cart`, `grader`, `dozer` and `crusher`.
2. Set **App.OnStart** to the formula below, then run it to initialise the collections and image catalogue.
3. Use the [screen YAML](../samples/screen1.pa.yaml) to recreate the example screen in Studio. The supplied YAML uses `LabelPosition: ="above"`; change this to `="top"`, a supported value. Set `UseDemoData` to `false` on the map when using the supplied data.

```powerfx
ClearCollect(colEquipment,{id:"HT-01",name:"HT-01",type:"Haul truck",latitude:-32.06949,longitude:116.02949,status:"operating",fuelPercent:76,speedKph:31},{id:"HT-02",name:"HT-02",type:"Haul truck",latitude:-32.07033,longitude:116.03064,status:"operating",fuelPercent:18,speedKph:14},{id:"HT-03",name:"HT-03",type:"Haul truck",latitude:-32.06914,longitude:116.03196,status:"idle",fuelPercent:53,speedKph:0},{id:"LD-01",name:"LD-01",type:"Loader",latitude:-32.07028,longitude:116.02822,status:"operating",fuelPercent:62,speedKph:8},{id:"WC-01",name:"WC-01",type:"Water cart",latitude:-32.07118,longitude:116.02902,status:"operating",fuelPercent:34,speedKph:22},{id:"GR-01",name:"GR-01",type:"Grader",latitude:-32.07166,longitude:116.03092,status:"idle",fuelPercent:87,speedKph:0},{id:"DZ-01",name:"DZ-01",type:"Dozer",latitude:-32.07192,longitude:116.02880,status:"maintenance",fuelPercent:0,speedKph:0},{id:"CR-01",name:"CR-01",type:"Crusher",latitude:-32.07230,longitude:116.03163,status:"operating",fuelPercent:68,speedKph:0});ClearCollect(colMovementHistory,{assetId:"HT-01",latitude:-32.06972,longitude:116.02922,speedKph:28,recordedAt:"10:40"},{assetId:"HT-01",latitude:-32.06994,longitude:116.02896,speedKph:0,recordedAt:"10:38"},{assetId:"HT-02",latitude:-32.07060,longitude:116.03060,speedKph:18,recordedAt:"10:39"});Set(varPanelDismissedFor,"");
Set(
    varImageCatalogJson,
    JSON(
        Table(
            {imageKey: "haul-truck", imageUrl: 'haul-truck'},
            {imageKey: "loader", imageUrl: loader},
            {imageKey: "water-cart", imageUrl: 'water-cart'},
            {imageKey: "grader", imageUrl: grader},
            {imageKey: "dozer", imageUrl: dozer},
            {imageKey: "crusher", imageUrl: crusher}
        ),
        JSONFormat.IncludeBinaryData
    )
)
```

The movement history collection is sample app data; the map does not implement tracking or playback. The Mapbox dialog is optional and accepts a public token. The supplied YAML mentions a trial offer; check current provider terms independently. See the [control reference](control-reference.md#custom-tile-providers) for Mapbox attribution and data-source requirements.
