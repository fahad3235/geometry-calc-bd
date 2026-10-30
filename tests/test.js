// Geometry Calculator BD — Node unit tests for logic.js. Run: node tests/test.js
'use strict';
const assert = require('assert');
const { calcShape, toSI, round2, triangleCheck } = require('../logic.js');

let passed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log('ok - ' + name); }
  else { console.log('FAIL - ' + name + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
}
function close(a, b, eps = 1e-9) { return Math.abs(a - b) < eps; }
function res(out, key) { const r = out.results.find((x) => x.key === key); return r ? r.value : NaN; }

// 2D shapes — hand-verified values
check('rectangle 5x3 -> A15 P16', close(res(calcShape('rectangle', { length: 5, width: 3 }), 'area'), 15) && close(res(calcShape('rectangle', { length: 5, width: 3 }), 'perimeter'), 16));
check('square 4 -> A16 P16', close(res(calcShape('square', { side: 4 }), 'area'), 16) && close(res(calcShape('square', { side: 4 }), 'perimeter'), 16));
check('circle r=7 -> A 153.938... C 43.982...', close(res(calcShape('circle', { radius: 7 }), 'area'), Math.PI * 49) && close(res(calcShape('circle', { radius: 7 }), 'circumference'), 2 * Math.PI * 7));
check('triangle 6x4 -> A12; 3-4-5 -> P12', close(res(calcShape('triangle', { base: 6, height: 4, sideA: 4, sideB: 5 }), 'area'), 12) && close(res(calcShape('triangle', { base: 3, height: 4, sideA: 4, sideB: 5 }), 'perimeter'), 12));
check('triangle 1-2-10 rejected', calcShape('triangle', { base: 1, height: 1, sideA: 2, sideB: 10 }).error === 'triangle');
check('triangleCheck 3-4-5 true, 1-2-10 false', triangleCheck(3, 4, 5) === true && triangleCheck(1, 2, 10) === false);
check('parallelogram 5x3 side4 -> A15 P18', close(res(calcShape('parallelogram', { base: 5, height: 3, side: 4 }), 'area'), 15) && close(res(calcShape('parallelogram', { base: 5, height: 3, side: 4 }), 'perimeter'), 18));
check('trapezoid 3,5 h4 sides 4,4 -> A16 P16', close(res(calcShape('trapezoid', { top: 3, bottom: 5, height: 4, leftSide: 4, rightSide: 4 }), 'area'), 16) && close(res(calcShape('trapezoid', { top: 3, bottom: 5, height: 4, leftSide: 4, rightSide: 4 }), 'perimeter'), 16));

// 3D shapes — hand-verified values
check('cube 3 -> V27 SA54', close(res(calcShape('cube', { side: 3 }), 'volume'), 27) && close(res(calcShape('cube', { side: 3 }), 'surface'), 54));
check('cuboid 2x3x4 -> V24 SA52', close(res(calcShape('cuboid', { length: 2, width: 3, height: 4 }), 'volume'), 24) && close(res(calcShape('cuboid', { length: 2, width: 3, height: 4 }), 'surface'), 52));
check('cylinder r3 h5 -> V 141.371... SA 150.796...', close(res(calcShape('cylinder', { radius: 3, height: 5 }), 'volume'), Math.PI * 9 * 5) && close(res(calcShape('cylinder', { radius: 3, height: 5 }), 'surface'), 2 * Math.PI * 3 * 8));
check('sphere r3 -> V 113.097... SA 113.097...', close(res(calcShape('sphere', { radius: 3 }), 'volume'), (4 / 3) * Math.PI * 27) && close(res(calcShape('sphere', { radius: 3 }), 'surface'), 4 * Math.PI * 9));
check('cone r3 h4 -> V 37.699... SA 75.398... (slant 5)', close(res(calcShape('cone', { radius: 3, height: 4 }), 'volume'), (1 / 3) * Math.PI * 9 * 4) && close(res(calcShape('cone', { radius: 3, height: 4 }), 'surface'), Math.PI * 3 * 8));

// Validation
check('zero rejected', calcShape('square', { side: 0 }).error === 'positive');
check('negative rejected', calcShape('circle', { radius: -2 }).error === 'positive');
check('NaN rejected', calcShape('square', { side: NaN }).error === 'positive');
check('unknown shape rejected', calcShape('hexagon', {}).error === 'shape');
check('formulas present for all shapes', ['rectangle', 'square', 'circle', 'triangle', 'parallelogram', 'trapezoid', 'cube', 'cuboid', 'cylinder', 'sphere', 'cone'].every((id) => {
  const fields = { rectangle: { length: 2, width: 3 }, square: { side: 2 }, circle: { radius: 2 }, triangle: { base: 3, height: 4, sideA: 4, sideB: 5 }, parallelogram: { base: 3, height: 2, side: 2 }, trapezoid: { top: 2, bottom: 4, height: 3, leftSide: 3, rightSide: 3 }, cube: { side: 2 }, cuboid: { length: 2, width: 3, height: 4 }, cylinder: { radius: 2, height: 3 }, sphere: { radius: 2 }, cone: { radius: 2, height: 3 } };
  const o = calcShape(id, fields[id]);
  return o.formula && o.results && o.results.length === 2;
}));

// SI conversions
check('100 cm length -> 1 m', close(toSI(100, 'cm', 1).value, 1));
check('12 inch -> 0.3048 m', close(toSI(12, 'inch', 1).value, 0.3048));
check('1 m^2 area stays 1 m^2', close(toSI(1, 'm', 2).value, 1));
check('10000 cm^2 -> 1 m^2', close(toSI(10000, 'cm', 2).value, 1));
check('1 m^3 -> 1000 litres', close(toSI(1, 'm', 3).litres, 1000));
check('100 cm cube volume 1,000,000 cm^3 -> 1 m^3', close(toSI(1000000, 'cm', 3).m3, 1));
check('round2(2.675-ish) sanity', round2(2.345) === 2.35 || round2(2.345) === 2.34); // float rounding tolerance, either accepted

console.log('\n' + passed + ' checks passed.');
