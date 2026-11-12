import { LocationMap } from "../LeafletMap";
import type { IInputs } from "../LeafletMap/generated/ManifestTypes";
import "../LeafletMap/css/leaflet.css";
import "../LeafletMap/css/LeafletMap.css";

const host = document.getElementById("sandbox") as HTMLDivElement;
const control = new LocationMap();
function context(): ComponentFramework.Context<IInputs> {
    return {
        parameters: { AssetsJson: { raw: "" }, RoadsGeoJson: { raw: "" }, UseDemoData: { raw: true },
            ShowBasemap: { raw: true }, ShowLabels: { raw: true }, MapTitle: { raw: "" } },
        mode: { allocatedWidth: host.clientWidth, allocatedHeight: host.clientHeight, trackContainerResize: () => undefined },
    } as unknown as ComponentFramework.Context<IInputs>;
}
control.init(context(), () => { console.log("PCF outputs", control.getOutputs()); }, {}, host);
new ResizeObserver(() => control.updateView(context())).observe(host);
