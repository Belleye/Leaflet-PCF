# 0001: Host supplies data; control owns selection

Status: observed in current implementation. Recorded 2026-11-12; original decision date and rationale unknown.

## Observed arrangement

The host passes filtered JSON through PCF inputs. The control renders it without retrieving or writing business data. `MapView` owns a single selected marker; the adapter publishes selection and validation through `notifyOutputChanged` and `getOutputs`. There is no selection input or persistent PCF state.

Evidence: [manifest](../../LeafletMap/ControlManifest.Input.xml), [adapter lifecycle](../../LeafletMap/index.ts), [update/select in MapView](../../LeafletMap/mapView.ts), [host simulation](../../preview/main.ts), and [filtering/output browser scenarios](../../tests/browser/map.spec.ts). The README explicitly assigns filtering and detail panels to the host.

## Consequences

The same renderer can display non-mining records without a data connector. Removing the selected ID from inputs clears selection; changing the normalised selected record republishes it. Repeated selections increment a version to remain observable. Consumers must distinguish selection-version changes from validation-only notifications. Adding host-controlled selection, backend queries or writes would change this boundary and needs an explicit design decision.

Alternatives considered historically: not established by repository evidence.
