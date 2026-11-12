# Development, validation and delivery

## Local workflow

Use Node.js 22.12+. Dependencies are locked in [package-lock.json](../package-lock.json); [package.json](../package.json) defines the commands. No Node version file or `engines` constraint is present.

```powershell
npm ci
npm run refreshTypes
npm run dev
```

Open `http://127.0.0.1:5173`. Vite serves [index.html](../index.html) and the actual PCF class with a simulated context. `/sandbox.html` is the minimal alternative. `npm start` runs Microsoft's PCF harness; `npm run start:watch` enables its watch mode. Neither preview proves Canvas-player compatibility.

The standalone [Mapbox test page](../testMapbox.html) also tests place search outside the PCF. To use it, create the Git-ignored `mapbox.local.js` at the repository root containing `window.MAPBOX_TOKEN = "YOUR_PUBLIC_MAPBOX_TOKEN";`, then open the page in a browser. The token is visible to browser users, so use a public, appropriately restricted token.

The manifest generates `LeafletMap/generated/ManifestTypes.d.ts`; regenerate after property changes rather than editing generated types. [tsconfig.json](../tsconfig.json) extends `pcf-scripts` configuration. [eslint.config.mjs](../eslint.config.mjs) uses TypeScript, promise and Microsoft Power Apps rules and excludes generated types. [pcfconfig.json](../pcfconfig.json) sets `out/controls` as output.

## Checks

```powershell
npm test
npx playwright install chromium
npm run test:browser
npm run build:production
dotnet build solution/solution.cdsproj --configuration Release
```

| Check | What it establishes |
| --- | --- |
| `npm test` | [38 parameterised cases](../tests/data.test.ts): asset/geometry validation, empty arrays, unsafe image URLs and fuel thresholds. The script names this one file explicitly; new unit files require updating discovery. |
| `npm run test:browser` | [14 scenarios](../tests/browser/map.spec.ts) in desktop and touch-tablet Chromium projects: outputs, filtering, repeat/keyboard selection, templates, layers, geometry styles, layout and teardown. [Config](../playwright.config.ts) starts/reuses Vite on strict port 5173. Public OSM/EOX/NASA tile requests are aborted; synthetic provider requests are intercepted. |
| `npm run build:production` | PCF manifest/control validation, type generation, linting and production compilation/bundling. |
| `dotnet build ...` | Local solution packaging, through [solution.cdsproj](../solution/solution.cdsproj) referencing [the PCF project](../Leaflet%20PCF.pcfproj). It does not import or publish anything. Requires compatible .NET/MSBuild/NuGet tooling. |

No tracked CI workflow was found. The maintainer intends pull requests to run unit tests, browser tests and the production build, with all checks required before merge. Until enforcement is available, verify them manually before merging; configure required checks when the repository becomes public after review and refactoring. GitHub returned a plan/visibility restriction for branch protection and rulesets while the repository was private. Solution packaging remains a manual release check. Browser tests do not validate live provider availability, authenticated images, actual Canvas notifications or mobile-player behavior. This is a demo concept; performance targets and benchmarking are outside its current scope. Add meaningful regressions at the boundary affected by a change; update maker samples alongside public-contract changes.

## Packaging and deployment

The PCF and solution projects target `net462` and reference Power Apps MSBuild packages with floating `1.*` versions. Unlike npm, the repository has no committed NuGet lockfile. `SolutionPackageType=Both` builds unmanaged `solution/bin/Release/solution.zip` and managed `solution_managed.zip`. Output, intermediate, generated-type and test-report directories are ignored. Existing output timestamps do not prove correspondence with current source.

Three version fields currently differ: npm package `1.0.0`, manifest control `1.10.0`, solution `1.1.0.0` ([solution metadata](../solution/src/Other/Solution.xml)). Their release policy is undocumented; do not assume they must match or that any particular version is deployed. The solution is `MineOperationsMap`, with publisher `MineOperations` and prefix `mine`.

Before distributing a changed control, review manifest compatibility, intended external domains and version changes, run checks and rebuild the solution. Import the unmanaged package into a development environment or the managed package for the intended installation workflow. Enable the environment's Canvas PCF capability and add the imported code component to the app as described in the [import guide](importing.md). There is no deployment automation, environment configuration or host Canvas app source in this repository.

The maintainer selected a simple manual release process: increment the control and solution versions independently, build both solution packages, and smoke-test the working Canvas app. Leave the npm package version alone unless needed; the three versions need not match. Record the tested package identity and smoke-test result with the release.

Validate the imported control in the intended app: input formulas, blank versus empty behavior, selection/repeated selection, filtering, validation notifications, sizing, keyboard/touch behavior, image access and chosen provider attribution/networking. [Canvas wiring](../samples/canvas-app-wiring.md) is reference material, not a deployed app. A local build or historical handoff does not establish that an app was saved or published.

## Documentation maintenance

Keep the README focused on an overview and links to maker guides, terminology in [CONTEXT](../CONTEXT.md), module/data-flow descriptions in [architecture](architecture.md), and consequential decisions in [ADRs](adr/README.md). Record observed behavior separately from inferred rationale. Update relevant docs when changing contract, ownership, network use, build commands or module boundaries. Check relative links and compare claims with both implementation and tests.
