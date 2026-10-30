// Geometry Calculator BD — pure math logic (no DOM). UMD: works in browser and Node.
// All formulas are standard school geometry. Inputs are plain numbers in the
// user's chosen length unit; results are in unit^2 (area) / unit^3 (volume)
// or unit (length). SI conversions live in toSI() below.
'use strict';

const UNITS = { mm: 0.001, cm: 0.01, m: 1, inch: 0.0254, ft: 0.3048 }; // metres per unit
const PI = Math.PI;

function isPosNum(v) {
  return typeof v === 'number' && isFinite(v) && v > 0;
}

// Validate that every field in `fields` is a positive finite number.
// Returns null on success, or an error code string.
function validate(vals, fields) {
  for (const f of fields) {
    if (!isPosNum(vals[f])) return 'positive';
  }
  return null;
}

function triangleCheck(a, b, c) {
  return a + b > c && a + c > b && b + c > a;
}

const SHAPES = [
  {
    id: 'rectangle', kind: '2d',
    fields: ['length', 'width'],
    calc: (v) => ({
      formula: 'A = l × w ;  P = 2(l + w)',
      results: [
        { key: 'area', value: v.length * v.width, pow: 2 },
        { key: 'perimeter', value: 2 * (v.length + v.width), pow: 1 },
      ],
    }),
  },
  {
    id: 'square', kind: '2d',
    fields: ['side'],
    calc: (v) => ({
      formula: 'A = a² ;  P = 4a',
      results: [
        { key: 'area', value: v.side * v.side, pow: 2 },
        { key: 'perimeter', value: 4 * v.side, pow: 1 },
      ],
    }),
  },
  {
    id: 'circle', kind: '2d',
    fields: ['radius'],
    calc: (v) => ({
      formula: 'A = πr² ;  C = 2πr',
      results: [
        { key: 'area', value: PI * v.radius * v.radius, pow: 2 },
        { key: 'circumference', value: 2 * PI * v.radius, pow: 1 },
      ],
    }),
  },
  {
    id: 'triangle', kind: '2d',
    fields: ['base', 'height', 'sideA', 'sideB'],
    calc: (v) => {
      if (!triangleCheck(v.base, v.sideA, v.sideB)) return { error: 'triangle' };
      return {
        formula: 'A = ½ × b × h ;  P = a + b + c',
        results: [
          { key: 'area', value: 0.5 * v.base * v.height, pow: 2 },
          { key: 'perimeter', value: v.base + v.sideA + v.sideB, pow: 1 },
        ],
      };
    },
  },
  {
    id: 'parallelogram', kind: '2d',
    fields: ['base', 'height', 'side'],
    calc: (v) => ({
      formula: 'A = b × h ;  P = 2(a + b)',
      results: [
        { key: 'area', value: v.base * v.height, pow: 2 },
        { key: 'perimeter', value: 2 * (v.side + v.base), pow: 1 },
      ],
    }),
  },
  {
    id: 'trapezoid', kind: '2d',
    fields: ['top', 'bottom', 'height', 'leftSide', 'rightSide'],
    calc: (v) => ({
      formula: 'A = ½(a + b) × h ;  P = a + b + c + d',
      results: [
        { key: 'area', value: 0.5 * (v.top + v.bottom) * v.height, pow: 2 },
        { key: 'perimeter', value: v.top + v.bottom + v.leftSide + v.rightSide, pow: 1 },
      ],
    }),
  },
  {
    id: 'cube', kind: '3d',
    fields: ['side'],
    calc: (v) => ({
      formula: 'V = a³ ;  SA = 6a²',
      results: [
        { key: 'volume', value: Math.pow(v.side, 3), pow: 3 },
        { key: 'surface', value: 6 * v.side * v.side, pow: 2 },
      ],
    }),
  },
  {
    id: 'cuboid', kind: '3d',
    fields: ['length', 'width', 'height'],
    calc: (v) => ({
      formula: 'V = l × w × h ;  SA = 2(lw + lh + wh)',
      results: [
        { key: 'volume', value: v.length * v.width * v.height, pow: 3 },
        { key: 'surface', value: 2 * (v.length * v.width + v.length * v.height + v.width * v.height), pow: 2 },
      ],
    }),
  },
  {
    id: 'cylinder', kind: '3d',
    fields: ['radius', 'height'],
    calc: (v) => ({
      formula: 'V = πr²h ;  SA = 2πr(r + h)',
      results: [
        { key: 'volume', value: PI * v.radius * v.radius * v.height, pow: 3 },
        { key: 'surface', value: 2 * PI * v.radius * (v.radius + v.height), pow: 2 },
      ],
    }),
  },
  {
    id: 'sphere', kind: '3d',
    fields: ['radius'],
    calc: (v) => ({
      formula: 'V = (4/3)πr³ ;  SA = 4πr²',
      results: [
        { key: 'volume', value: (4 / 3) * PI * Math.pow(v.radius, 3), pow: 3 },
        { key: 'surface', value: 4 * PI * v.radius * v.radius, pow: 2 },
      ],
    }),
  },
  {
    id: 'cone', kind: '3d',
    fields: ['radius', 'height'],
    calc: (v) => {
      const slant = Math.sqrt(v.radius * v.radius + v.height * v.height);
      return {
        formula: 'V = (1/3)πr²h ;  SA = πr(r + l),  l = √(r² + h²)',
        results: [
          { key: 'volume', value: (1 / 3) * PI * v.radius * v.radius * v.height, pow: 3 },
          { key: 'surface', value: PI * v.radius * (v.radius + slant), pow: 2 },
        ],
      };
    },
  },
];

function getShape(id) {
  return SHAPES.find((s) => s.id === id) || null;
}

// Main entry: returns { formula, results } or { error }.
function calcShape(id, vals) {
  const shape = getShape(id);
  if (!shape) return { error: 'shape' };
  const bad = validate(vals, shape.fields);
  if (bad) return { error: bad };
  return shape.calc(vals);
}

// Convert a result value from the user's unit to SI.
// pow 1 -> metres, 2 -> m^2, 3 -> m^3. Volume also yields litres (1 m^3 = 1000 L).
function toSI(value, unit, pow) {
  const f = UNITS[unit];
  if (f === undefined) return null;
  const si = value * Math.pow(f, pow);
  return pow === 3 ? { m3: si, litres: si * 1000 } : { value: si };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UNITS, SHAPES, getShape, calcShape, toSI, round2, isPosNum, triangleCheck };
}
