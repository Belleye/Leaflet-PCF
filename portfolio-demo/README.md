# Leaflet portfolio demo

This standalone static demo reuses the same map component and fictional sample data as the Power Apps control. It is separate from the existing development preview.

Build from the repository root with `npx vite build portfolio-demo --base=./ --outDir ../portfolio-dist`. Copy the contents of `portfolio-dist` into a folder on GitHub Pages. The **Back to portfolio** link points to the parent folder (`../`); change it in `portfolio-demo/main.ts` if your portfolio lives elsewhere, then rebuild. Map tiles require an internet connection. The optional Mapbox token is held only in memory for the current page session.
