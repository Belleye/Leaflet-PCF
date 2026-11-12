import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { MapView } from "./mapView";

export class LocationMap implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private view: MapView;
    private outputs: IOutputs = { SelectedAssetId: "", SelectedAssetJson: "", SelectionVersion: 0, ValidationMessage: "" };
    private notify: () => void;

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void,
        _state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this.notify = notifyOutputChanged;
        context.mode.trackContainerResize(true);
        this.view = new MapView(container, (asset) => {
            this.outputs.SelectedAssetId = asset?.id ?? "";
            this.outputs.SelectedAssetJson = asset ? JSON.stringify(asset) : "";
            this.outputs.SelectionVersion = (this.outputs.SelectionVersion ?? 0) + 1;
            this.notify();
        }, (message) => {
            if (this.outputs.ValidationMessage !== message) {
                this.outputs.ValidationMessage = message;
                this.notify();
            }
        });
        this.updateView(context);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const p = context.parameters;
        this.view.update({
            assetsJson: p.AssetsJson.raw ?? "", roadsJson: p.RoadsGeoJson.raw ?? "",
            useDemoData: p.UseDemoData.raw === true, showBasemap: p.ShowBasemap.raw === true,
            showLabels: p.ShowLabels.raw !== false, labelPosition: p.LabelPosition?.raw ?? "bottom", labelOffsetX: p.LabelOffsetX?.raw ?? 0, labelOffsetY: p.LabelOffsetY?.raw ?? 0, title: p.MapTitle.raw || "",
            imagesJson: p.ImageCatalogJson?.raw ?? "", markerTemplate: p.MarkerHtmlTemplate?.raw ?? "", htmlCatalogJson: p.HtmlCatalogJson?.raw ?? "",
            customTileProvidersJson: p.CustomTileProvidersJson?.raw ?? "",
        });
        this.view.resize(context.mode.allocatedWidth, context.mode.allocatedHeight);
    }

    public getOutputs(): IOutputs { return this.outputs; }
    public destroy(): void { this.view.destroy(); }
}
