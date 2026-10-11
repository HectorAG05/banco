// Prueba local del script con una planilla simulada: node tests/prueba.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// ---- Planilla simulada mínima ----
class Celda { constructor() { this.v = ''; this.f = null; this.nf = null; this.dv = null; this.note = ''; this.bg = null; } }
class Rango {
  constructor(h, r, c, nr = 1, nc = 1) { Object.assign(this, { h, r, c, nr, nc }); }
  _c() { return this.h.celda(this.r, this.c); }
  getSheet() { return this.h; } getRow() { return this.r; } getColumn() { return this.c; }
  getLastRow() { return this.r + this.nr - 1; } getLastColumn() { return this.c + this.nc - 1; }
  getValue() { return this._c().v; }
  getValues() { const o = []; for (let i = 0; i < this.nr; i++) { const f = []; for (let j = 0; j < this.nc; j++) f.push(this.h.celda(this.r + i, this.c + j).v); o.push(f); } return o; }
  _todas(fn) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) fn(this.h.celda(this.r + i, this.c + j)); return this; }
  setValue(v) { return this._todas(c => { c.v = v; c.f = null; }); }
  setFormula(f) { return this._todas(c => { c.f = f; c.v = '<formula>'; }); }
  clearContent() { return this._todas(c => { c.v = ''; c.f = null; }); }
  setNumberFormat(n) { return this._todas(c => { c.nf = n; }); }
  setDataValidation(d) { return this._todas(c => { c.dv = d; }); }
  clearDataValidations() { return this._todas(c => { c.dv = null; }); }
  setNote(n) { return this._todas(c => { c.note = n; }); }
  clearNote() { return this._todas(c => { c.note = ''; }); }
  setBackground(b) { return this._todas(c => { c.bg = b; }); }
}
class Hoja {
  constructor(n) { this.n = n; this.m = {}; this.hidden = false; }
  getName() { return this.n; }
  celda(r, c) { return this.m[r + ',' + c] || (this.m[r + ',' + c] = new Celda()); }
  getRange(r, c, nr, nc) { if (typeof r === 'string') return new Rango(this, 1, 1, 1000, 1); return new Rango(this, r, c, nr, nc); }
  getLastRow() { return Math.max(0, ...Object.keys(this.m).filter(k => this.m[k].v !== '').map(k => +k.split(',')[0])); }
  getMaxRows() { return 1000; }
  hideSheet() { this.hidden = true; }
}
const hojas = {};
const toasts = [];
const ss = {
  getSheetByName: n => hojas[n] || null,
  insertSheet: n => (hojas[n] = new Hoja(n)),
  getSheets: () => Object.values(hojas),
  toast: m => toasts.push(m),
};
function dvBuilder() {
  const d = {};
  const b = {
    requireValueInList: (l) => { d.lista = l; return b; },
    requireValueInRange: (r) => { d.rango = r; return b; },
    setAllowInvalid: (x) => { d.allowInvalid = x; return b; },
    setHelpText: () => b, build: () => d,
  };
  return b;
}
const SpreadsheetApp = {
  getActive: () => ss,
  newDataValidation: dvBuilder,
  getUi: () => ({ alert: m => toasts.push(m), createMenu: () => ({ addItem() { return this; }, addToUi() {} }) }),
};

// ---- Cargar el script ----
const ctx = { SpreadsheetApp };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Codigo.gs'), 'utf8'), ctx);

// ---- Datos de prueba (columnas A..O de PACIENTES) ----
const pac = new Hoja('PACIENTES'); hojas.PACIENTES = pac;
const filasPac = [
  // A sponsor, B CRO, C protocolo, D PI, E nombre, F site, G HC, H Nº, I, J, K activo, L estado, M rama, N coordi, O estado prot
  ['MSD', 'MSD', 'MK2870009', 'CLAUDIO MARTIN', 'PEREZ JUAN', '', 1, '030700002', '', '', 'SI', 'TRATAMIENTO', 'RAMA A', 'LAURA', 'ABIERTO'],
  ['ROCHE', 'IQVIA', 'WO12345', 'SADE', 'GOMEZ ANA', '', 2, '111', '', '', 'NO', 'FALLA SCREENING', 'FALLA SCREENING', 'MICA', 'CERRADO'],
  ['BRISTOL', 'BRISTOL', 'CA239-0004', 'CLAUDIO MARTIN', 'GOMEZ ANA', '', 2, 57500113, '', '', 'SI', 'TRATAMIENTO', 'DOBLE CIEGO', 'CATALINA Z', 'ABIERTO'],
  ['BRISTOL', 'BRISTOL', 'CA239-0004', 'CLAUDIO MARTIN', 'GOMEZ ANA', '', 2, 57500113, '', '', 'SI', 'TRATAMIENTO', 'DOBLE CIEGO', 'CATALINA Z', 'ABIERTO'], // duplicada
  ['PFIZER', 'PFIZER', 'C2321014', 'SADE', 'López  María José', '', 3, '10491001', '', '', 'SI', 'TRATAMIENTO', 'RAMA 2', 'MAILEN', 'ABIERTO'],
];
filasPac.forEach((f, i) => f.forEach((v, j) => { pac.celda(i + 2, j + 1).v = v; }));

const oct = new Hoja('OCTUBRE 2026 CICLOS'); hojas[oct.n] = oct;
const sep = new Hoja('SEPTIEMBRE 2026 CICLOS'); hojas[sep.n] = sep;
const est = new Hoja('OCTUBRE 2026 ESTUDIOS'); hojas[est.n] = est;

function editar(h, fila, col, valor, nr = 1, nc = 1) {
  h.getRange(fila, col).setValue(valor);
  ctx.onEdit({ range: h.getRange(fila, col, nr, nc), value: valor });
}
const v = (h, r, c) => h.celda(r, c);

// 1. Filtro de hojas
assert.strictEqual(ctx.esHojaCiclosHabilitada('OCTUBRE 2026 CICLOS'), true);
assert.strictEqual(ctx.esHojaCiclosHabilitada('DICIEMBRE 2026 CICLOS'), true);
assert.strictEqual(ctx.esHojaCiclosHabilitada('ENERO 2027 CICLOS'), true);
assert.strictEqual(ctx.esHojaCiclosHabilitada('SEPTIEMBRE 2026 CICLOS'), false);
assert.strictEqual(ctx.esHojaCiclosHabilitada('OCTUBRE 2026 ESTUDIOS'), false);
assert.strictEqual(ctx.esHojaCiclosHabilitada('PACIENTES'), false);

// 2. Paciente con un solo protocolo: completa todo, conserva ceros
editar(oct, 10, 4, 'perez juan');
assert.strictEqual(v(oct, 10, 4).v, 'PEREZ JUAN');
assert.strictEqual(v(oct, 10, 3).v, '030700002');
assert.strictEqual(v(oct, 10, 3).nf, '@');
assert.strictEqual(v(oct, 10, 7).v, 'MK2870009');
for (const c of [5, 6, 8, 9]) assert.ok(v(oct, 10, c).f.includes('$C10') && v(oct, 10, c).f.includes('$G10'));
assert.ok(v(oct, 10, 5).f.includes('PACIENTES!$M$2:$M'));   // RAMA
assert.ok(v(oct, 10, 6).f.includes('PACIENTES!$N$2:$N'));   // COORDI
assert.ok(v(oct, 10, 8).f.includes('PACIENTES!$A$2:$A'));   // SPONSOR
assert.ok(v(oct, 10, 9).f.includes('PACIENTES!$D$2:$D'));   // PI

// 3. Paciente con dos protocolos (y una fila duplicada): pide elegir
editar(oct, 11, 4, 'GOMEZ ANA');
const dv = v(oct, 11, 7).dv;
assert.ok(dv && dv.lista.length === 2, 'debe ofrecer 2 opciones');
assert.ok(dv.lista[0].startsWith('CA239-0004'), 'la activa va primero');
assert.strictEqual(v(oct, 11, 3).v, '');
assert.strictEqual(v(oct, 11, 7).bg, '#fff2cc');
// Elegir la segunda opción
editar(oct, 11, 7, dv.lista[1]);
assert.strictEqual(v(oct, 11, 7).v, 'WO12345');
assert.strictEqual(v(oct, 11, 3).v, '111');
assert.strictEqual(v(oct, 11, 7).dv, null);
assert.strictEqual(v(oct, 11, 7).bg, null);
assert.ok(v(oct, 11, 8).f.includes('$C11'));

// 4. Protocolo escrito a mano en vez de elegirlo; Nº numérico
editar(oct, 12, 4, 'GOMEZ ANA');
editar(oct, 12, 7, 'ca239-0004');
assert.strictEqual(v(oct, 12, 3).v, 57500113);
assert.strictEqual(v(oct, 12, 3).nf, '0');
assert.strictEqual(v(oct, 12, 7).v, 'CA239-0004');

// 5. Nombre con tildes / otro orden / espacios dobles
editar(oct, 13, 4, 'maria jose lopez');
assert.strictEqual(v(oct, 13, 7).v, 'C2321014');
assert.strictEqual(v(oct, 13, 4).v, 'López  María José');

// 6. Nombre inexistente: avisa y no toca nada
editar(oct, 14, 4, 'NADIE NUEVO');
assert.strictEqual(v(oct, 14, 3).v, '');
assert.ok(v(oct, 14, 4).note.includes('No está'));

// 7. Borrar el nombre limpia la fila
editar(oct, 10, 4, '');
for (const c of [3, 5, 6, 7, 8, 9]) assert.strictEqual(v(oct, 10, c).v, '', 'col ' + c);

// 8. Fila pegada que ya trae el protocolo: no pide elegir de nuevo
oct.celda(15, 7).v = 'WO12345';
editar(oct, 15, 4, 'GOMEZ ANA');
assert.strictEqual(v(oct, 15, 3).v, '111');
assert.strictEqual(v(oct, 15, 7).dv, null);

// 9. Pegado de varias filas (C:I) de una vez
oct.celda(20, 4).v = 'PEREZ JUAN'; oct.celda(21, 4).v = 'maria jose lopez';
ctx.onEdit({ range: oct.getRange(20, 3, 2, 7) });
assert.strictEqual(v(oct, 20, 7).v, 'MK2870009');
assert.strictEqual(v(oct, 21, 7).v, 'C2321014');

// 10. Hojas anteriores a octubre 2026 y hojas ESTUDIOS no cambian
editar(sep, 10, 4, 'PEREZ JUAN');
assert.strictEqual(v(sep, 10, 3).v, '');
editar(est, 10, 4, 'PEREZ JUAN');
assert.strictEqual(v(est, 10, 3).v, '');

// 11. Editar otra columna (ej. CICLO) no hace nada
editar(oct, 13, 10, 'C3D1');
assert.strictEqual(v(oct, 13, 7).v, 'C2321014');

// 12. Configuración: hoja auxiliar oculta + desplegable en D solo en hojas habilitadas
ctx.configurarCiclos();
assert.ok(hojas['LISTA PACIENTES'].hidden);
assert.ok(hojas['LISTA PACIENTES'].celda(1, 1).f.startsWith('=SORT(UNIQUE(FILTER('));
assert.ok(v(oct, 30, 4).dv && v(oct, 30, 4).dv.allowInvalid === true);
assert.strictEqual(v(sep, 30, 4).dv, null);

console.log('OK — todas las pruebas pasaron');
