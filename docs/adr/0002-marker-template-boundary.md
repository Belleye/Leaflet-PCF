# 0002: Sanitised templates with text substitution

Status: observed in current implementation. Recorded 2026-11-12; original decision date and rationale unknown.

## Observed arrangement

Markers support direct HTML, keyed HTML catalogue entries and a shared fallback template. DOMPurify restricts tags and attributes before inserting record values as text. A dedicated image-source placeholder uses the validated record/catalogue URL. Attribute interpolation is otherwise removed. Original HTML can still be returned in selected-record JSON.

Evidence: [template precedence](../../LeafletMap/mapView.ts), [templateMarker](../../LeafletMap/equipment.ts), [safeImageUrl and parsers](../../LeafletMap/data.ts), and [template browser regressions](../../tests/browser/map.spec.ts).

## Consequences

Templates provide maker-controlled presentation without interpreting record text as markup. They are not arbitrary app/plugin execution. Static style/class attributes remain allowed; sanitisation does not establish CSS isolation, network isolation or safety for downstream rendering of original output HTML. Changes to allowlists, substitution or URL policy need focused regression coverage. Shared catalogues keep their contents out of individual selected records.

Alternatives considered historically: not established by repository evidence.
