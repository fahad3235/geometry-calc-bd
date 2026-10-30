# Geometry Calculator BD

Offline bilingual (English / বাংলা) geometry calculator for students, teachers,
and anyone who needs a quick area, perimeter, volume, or surface-area answer —
with the formula shown for every shape.

## Features

- **11 shapes**: 2D — Rectangle, Square, Circle, Triangle, Parallelogram,
  Trapezoid; 3D — Cube, Cuboid, Cylinder, Sphere, Cone.
- **Formula shown** for every calculation, so it teaches as well as answers.
- **Units**: mm, cm, m, inch, ft. Results are shown in the chosen unit plus
  SI conversions (m² / m³, and litres for volumes).
- **Validation**: positive-number checks on every field, plus a triangle
  inequality check (each side must be shorter than the other two combined).
- **History**: the last 20 calculations persist in localStorage, with clear.
- **Bilingual**: EN / বাংলা toggle persisted, with Bengali digits in বাংলা mode.
- **Fully offline**: zero network requests; a single static page.

## Formulas

| Shape | Results |
|---|---|
| Rectangle | A = l × w ; P = 2(l + w) |
| Square | A = a² ; P = 4a |
| Circle | A = πr² ; C = 2πr |
| Triangle | A = ½ × b × h ; P = a + b + c |
| Parallelogram | A = b × h ; P = 2(a + b) |
| Trapezoid | A = ½(a + b) × h ; P = a + b + c + d |
| Cube | V = a³ ; SA = 6a² |
| Cuboid | V = l × w × h ; SA = 2(lw + lh + wh) |
| Cylinder | V = πr²h ; SA = 2πr(r + h) |
| Sphere | V = (4/3)πr³ ; SA = 4πr² |
| Cone | V = (1/3)πr²h ; SA = πr(r + l), l = √(r² + h²) |

Results are rounded to 2 decimal places in the chosen unit. SI conversions use
adaptive precision so small values are not lost (e.g. 15 cm² = 0.0015 m², not
0.00 m²).

## Run it

No build step. Open `index.html` in any modern browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Testing

```sh
node tests/test.js    # 25 pure-logic unit checks
node tests/smoke.js   # 23 headless-Chrome (raw CDP) UI checks
```

The smoke test spawns `/opt/meta-chromium/chrome` with the Hatch WebGL domain
policy flags required by that build
(`--hatch-webgl-allowed-domains-file` +
`--hatch-webgl-allowed-domains-sha256`, policy at
`/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt`).
On a stock Chrome/Chromium those two flags are simply unnecessary.

## Limitations

- Educational tool, not a surveying or engineering instrument: check critical
  measurements yourself before building or buying materials.
- The triangle perimeter needs all three sides; the area needs base and height.
- No 3D rendering — diagrams are simple 2D schematics.

## Status

Built by the Muse Project Factory (run #181, 2026-10-30). Static site, no
backend, no accounts, no data leaves the browser.
