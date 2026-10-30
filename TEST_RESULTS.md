# Geometry Calculator BD — Test Results (run #181, 2026-10-30)

## Unit tests: 25/25 passed — `node tests/test.js`

Hand-verified values (all exact to 1e-9 unless noted):
- Rectangle 5×3 → A 15, P 16; Square 4 → A 16, P 16
- Circle r=7 → A π·49, C 2π·7
- Triangle 6×4 → A 12; 3-4-5 → P 12; 1-2-10 → triangle error
- Parallelogram 5×3, side 4 → A 15, P 18
- Trapezoid 3,5, h=4, sides 4,4 → A 16, P 16
- Cube 3 → V 27, SA 54; Cuboid 2×3×4 → V 24, SA 52
- Cylinder r=3, h=5 → V π·9·5, SA 2π·3·8
- Sphere r=3 → V (4/3)π·27, SA 4π·9
- Cone r=3, h=4 → V (1/3)π·9·4, SA π·3·8 (slant 5)
- Validation: 0, negative, NaN, and unknown shape all rejected
- SI: 100 cm → 1 m; 12 in → 0.3048 m; 10,000 cm² → 1 m²; 1 m³ → 1000 L

## Smoke tests: 23/23 passed — `node tests/smoke.js` (raw CDP, headless Chrome)

- Title, 6 2D chips, unit select + calculate button, empty-history state, diagram render
- Empty calculate → inline error; rectangle 5×3 cm → 15.00 cm² / 16.00 cm / SI 0.0015 m²
- Formula shown; calculation added to history; triangle form has 4 inputs
- Impossible triangle (1, 2, 10) → triangle error
- 3D tab: 5 chips; cube 3 → V 27.00 cm³, SA 54.00 cm², 0.027 litres
- Language toggle → Bangla title + Bengali digits in results
- History survives reload; 390px viewport has no horizontal overflow
- Zero console errors / page exceptions

## Repairs during this run

1. **SI precision (app display)**: 15 cm² rendered as "0.00 m²" with fixed 2
   decimals. Added adaptive `fmtSI` (6 dp below 0.01, 4 dp below 1, else 2 dp);
   smoke test asserts 0.0015 m² and 0.027 litres.
2. **Language-toggle result re-render (app bug)**: `renderForm()` hides the
   result box, so the toggle handler's "if result visible, recalculate" check
   always saw it hidden and results stayed in English digits. Fixed by
   capturing visibility before re-render; smoke test asserts Bengali digits
   after toggle. Also preserved typed inputs across re-renders.
3. **Smoke harness environment (not an app bug)**: this VM's Chromium build
   refuses to start without Hatch WebGL domain-policy flags. The harness now
   passes `--hatch-webgl-allowed-domains-file` +
   `--hatch-webgl-allowed-domains-sha256` from the system policy file at
   `/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt`.
   Note for future runs: earlier runs' bare-chrome harnesses will hit the same
   startup error on this VM until patched the same way.
