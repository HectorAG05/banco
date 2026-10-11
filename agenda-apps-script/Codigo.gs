/**
 * PRUEBA AGENDA 2026 — Autocompletado de pacientes en las hojas de CICLOS.
 *
 * Qué hace (solo en hojas "<MES> <AÑO> CICLOS" desde OCTUBRE 2026 en adelante):
 *   1. En la columna D (NOMBRE Y APELLIDO) hay un desplegable con buscador que
 *      lista todos los pacientes de la hoja PACIENTES (se actualiza solo).
 *   2. Al escribir o elegir un nombre:
 *        - si el paciente tiene un único protocolo, completa al instante
 *          Nº PACIENTE, RAMA, COORDINADORA, PROTOCOLO, SPONSOR e INVESTIGADOR;
 *        - si tiene más de uno, muestra en PROTOCOLO (col. G) un desplegable
 *          para elegir; al elegirlo se completa el resto.
 *   3. RAMA, COORDINADORA, SPONSOR e INVESTIGADOR quedan como fórmulas
 *      vinculadas a PACIENTES: si se corrige algo allí, se actualiza en vivo.
 *   4. Si la fila no tiene DÍA y FECHA (columnas A y B), los copia de la fila
 *      más cercana del mismo bloque de día.
 *
 * Instalación: ver README.md de esta carpeta.
 */

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

var HOJA_PACIENTES = 'PACIENTES';
var HOJA_LISTA = 'LISTA PACIENTES'; // hoja auxiliar oculta para el desplegable

// Primer mes en que se activa el autocompletado (OCTUBRE 2026).
var DESDE_ANIO = 2026;
var DESDE_MES = 10;

var MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO',
  'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

// Columnas (1 = A) de la hoja PACIENTES.
var P = {
  SPONSOR: 1,      // A
  PROTOCOLO: 3,    // C
  PI: 4,           // D
  NOMBRE: 5,       // E
  NRO_PAC: 8,      // H
  ACTIVO: 11,      // K
  ESTADO: 12,      // L
  RAMA: 13,        // M
  COORDI: 14,      // N
  ULTIMA: 15       // O
};

// Columnas (1 = A) de las hojas de CICLOS.
var C = {
  NRO_PAC: 3,      // C
  NOMBRE: 4,       // D
  RAMA: 5,         // E
  COORDI: 6,       // F
  PROTOCOLO: 7,    // G
  SPONSOR: 8,      // H
  PI: 9            // I
};

var COL_DIA = 1;    // A: día de la semana
var COL_FECHA = 2;  // B: fecha

var PRIMERA_FILA_DATOS = 2;
var SEPARADOR = ' · ';
var VENTANA_DIA = 80; // filas hacia arriba/abajo donde buscar el día

// Separador de argumentos de fórmulas: ';' en planillas con configuración
// regional de coma decimal (ej. Argentina), ',' en las demás. Se detecta solo.
var SEP_FORMULA = null;

// ---------------------------------------------------------------------------
// Disparadores
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Agenda')
    .addItem('Activar autocompletado en CICLOS', 'configurarCiclos')
    .addToUi();
}

/** Se ejecuta solo cada vez que alguien edita una celda. */
function onEdit(e) {
  if (!e || !e.range) return;
  var hoja = e.range.getSheet();
  if (!esHojaCiclosHabilitada(hoja.getName())) return;

  var col = e.range.getColumn();
  var ultimaCol = e.range.getLastColumn();
  var tocaNombre = col <= C.NOMBRE && C.NOMBRE <= ultimaCol;
  var tocaProtocolo = col <= C.PROTOCOLO && C.PROTOCOLO <= ultimaCol && !tocaNombre;
  if (!tocaNombre && !tocaProtocolo) return;

  var desde = Math.max(e.range.getRow(), PRIMERA_FILA_DATOS);
  var hasta = Math.min(e.range.getLastRow(), desde + 199); // pegados grandes: hasta 200 filas
  if (hasta < desde) return;

  var pacientes = leerPacientes();
  for (var fila = desde; fila <= hasta; fila++) {
    if (tocaNombre) {
      alCambiarNombre(hoja, fila, pacientes);
    } else {
      alElegirProtocolo(hoja, fila, pacientes);
    }
  }
}

// ---------------------------------------------------------------------------
// Lógica de edición
// ---------------------------------------------------------------------------

function alCambiarNombre(hoja, fila, pacientes) {
  var nombre = hoja.getRange(fila, C.NOMBRE).getValue();
  var celdaProt = hoja.getRange(fila, C.PROTOCOLO);

  if (nombre === '' || nombre === null) {
    limpiarFila(hoja, fila);
    return;
  }
  if (esEncabezado(nombre)) return;

  var opciones = buscarCandidatos(pacientes, nombre);
  if (opciones.length === 0) {
    celdaProt.clearDataValidations();
    hoja.getRange(fila, C.NOMBRE).setNote('No está en la hoja PACIENTES. Completar a mano o darlo de alta.');
    aviso('"' + nombre + '" no está en PACIENTES.');
    return;
  }
  hoja.getRange(fila, C.NOMBRE).setValue(opciones[0].nombre).clearNote();
  completarDia(hoja, fila);

  if (opciones.length === 1) {
    completarFila(hoja, fila, opciones[0]);
    return;
  }

  // Si la fila ya tenía un protocolo o Nº válido (ej. fila pegada), se respeta.
  var previo = elegirCandidato(opciones, celdaProt.getValue()) ||
    candidatoPorNumero(opciones, hoja.getRange(fila, C.NRO_PAC).getValue());
  if (previo) {
    completarFila(hoja, fila, previo);
    return;
  }

  // Varios protocolos / números: dejar elegir en la columna PROTOCOLO.
  limpiarDatos(hoja, fila);
  var etiquetas = opciones.map(etiquetaCandidato);
  celdaProt
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(etiquetas, true)
      .setAllowInvalid(true)
      .build())
    .setValue('')
    .setBackground('#fff2cc')
    .setNote('Este paciente tiene ' + opciones.length + ' protocolos/números. Elegí uno del desplegable.');
  aviso('Elegí el protocolo en la columna G (' + opciones.length + ' opciones).');
}

function alElegirProtocolo(hoja, fila, pacientes) {
  var nombre = hoja.getRange(fila, C.NOMBRE).getValue();
  var valor = hoja.getRange(fila, C.PROTOCOLO).getValue();
  if (!nombre || !valor) return;

  var elegido = elegirCandidato(buscarCandidatos(pacientes, nombre), valor);
  if (elegido) completarFila(hoja, fila, elegido);
}

function completarFila(hoja, fila, cand) {
  var celdaNro = hoja.getRange(fila, C.NRO_PAC);
  // Texto sin formato para no perder ceros a la izquierda (ej. 030700002).
  if (typeof cand.nroPac === 'string') celdaNro.setNumberFormat('@');
  else if (typeof cand.nroPac === 'number') celdaNro.setNumberFormat('0');
  celdaNro.setValue(cand.nroPac);

  hoja.getRange(fila, C.PROTOCOLO)
    .clearDataValidations()
    .setValue(cand.protocolo)
    .setBackground(null)
    .clearNote();

  escribirFormulasFila(hoja, fila);
}

function escribirFormulasFila(hoja, fila) {
  var f = formulasFila(fila);
  escribirFormula(hoja.getRange(fila, C.RAMA), f.rama);
  escribirFormula(hoja.getRange(fila, C.COORDI), f.coordi);
  escribirFormula(hoja.getRange(fila, C.SPONSOR), f.sponsor);
  escribirFormula(hoja.getRange(fila, C.PI), f.pi);
}

/** Copia DÍA y FECHA de la fila más cercana del mismo bloque, si faltan. */
function completarDia(hoja, fila) {
  var actual = hoja.getRange(fila, COL_DIA, 1, 2).getValues()[0];
  if (actual[0] !== '' || actual[1] !== '') return;

  var desde = Math.max(PRIMERA_FILA_DATOS, fila - VENTANA_DIA);
  var hasta = Math.min(hoja.getMaxRows(), fila + VENTANA_DIA);
  var n = hasta - desde + 1;
  var valores = hoja.getRange(desde, COL_DIA, n, 2).getValues();

  // Filas combinadas a lo ancho (ej. "COMITÉ ...") separan un día de otro.
  var separadoras = {};
  hoja.getRange(desde, 1, n, 4).getMergedRanges().forEach(function (m) {
    if (m.getColumn() === 1 && m.getNumColumns() >= 3) {
      for (var r = m.getRow(); r <= m.getLastRow(); r++) separadoras[r] = true;
    }
  });

  var origen = buscarFilaDia(valores, desde, fila, separadoras);
  if (!origen) return;
  hoja.getRange(fila, COL_FECHA).setNumberFormat(hoja.getRange(origen, COL_FECHA).getNumberFormat());
  hoja.getRange(fila, COL_DIA, 1, 2).setValues([valores[origen - desde]]);
}

function limpiarDatos(hoja, fila) {
  hoja.getRange(fila, C.NRO_PAC).clearContent();
  hoja.getRange(fila, C.RAMA, 1, 2).clearContent();    // E:F
  hoja.getRange(fila, C.SPONSOR, 1, 2).clearContent(); // H:I
}

function limpiarFila(hoja, fila) {
  limpiarDatos(hoja, fila);
  hoja.getRange(fila, C.NOMBRE).clearNote();
  hoja.getRange(fila, C.PROTOCOLO)
    .clearDataValidations()
    .clearContent()
    .setBackground(null)
    .clearNote();
}

// ---------------------------------------------------------------------------
// Funciones puras (sin acceso a la planilla; se prueban en tests/)
// ---------------------------------------------------------------------------

/** true si el nombre es "<MES> <AÑO> CICLOS" y es OCTUBRE 2026 o posterior. */
function esHojaCiclosHabilitada(nombreHoja) {
  var m = String(nombreHoja).trim().toUpperCase().match(/^([A-ZÁÉÍÓÚ]+)\s+(\d{4})\s+CICLOS$/);
  if (!m) return false;
  var mes = MESES.indexOf(m[1].replace('SETIEMBRE', 'SEPTIEMBRE')) + 1;
  if (mes === 0) return false;
  return Number(m[2]) * 12 + mes >= DESDE_ANIO * 12 + DESDE_MES;
}

/** Mayúsculas, sin tildes, sin puntuación y con espacios simples. */
function normalizarNombre(s) {
  return String(s === null || s === undefined ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mismas palabras sin importar el orden ("GOMEZ JOSE" = "JOSE GOMEZ"). */
function claveSinOrden(s) {
  return normalizarNombre(s).split(' ').sort().join(' ');
}

function esEncabezado(nombre) {
  return normalizarNombre(nombre) === 'NOMBRE Y APELLIDO';
}

/**
 * Devuelve las combinaciones distintas (protocolo + Nº paciente) del paciente,
 * primero las activas y con protocolo abierto.
 * `filas` es el resultado de getValues() de PACIENTES (sin encabezado).
 */
function buscarCandidatos(filas, nombre) {
  var buscado = normalizarNombre(nombre);
  if (!buscado) return [];
  var exactas = [];
  var sinOrden = [];
  var clave = claveSinOrden(nombre);

  for (var i = 0; i < filas.length; i++) {
    var r = filas[i];
    var n = r[P.NOMBRE - 1];
    if (n === '' || n === null) continue;
    if (normalizarNombre(n) === buscado) exactas.push(r);
    else if (claveSinOrden(n) === clave) sinOrden.push(r);
  }
  var usadas = exactas.length ? exactas : sinOrden;

  var vistos = {};
  var res = [];
  usadas.forEach(function (r) {
    var cand = {
      nombre: String(r[P.NOMBRE - 1]).trim(),
      protocolo: r[P.PROTOCOLO - 1],
      nroPac: r[P.NRO_PAC - 1],
      activo: String(r[P.ACTIVO - 1]).trim().toUpperCase() === 'SI',
      estado: String(r[P.ESTADO - 1] || '').trim(),
      abierto: String(r[P.ULTIMA - 1] || '').trim().toUpperCase() === 'ABIERTO'
    };
    var k = String(cand.protocolo).trim() + '|' + String(cand.nroPac).trim();
    if (vistos[k]) return;
    vistos[k] = true;
    res.push(cand);
  });

  res.sort(function (a, b) {
    return (b.activo - a.activo) || (b.abierto - a.abierto);
  });
  return res;
}

function etiquetaCandidato(c) {
  var partes = [String(c.protocolo).trim(), 'Nº ' + String(c.nroPac).trim()];
  if (c.estado) partes.push(c.estado);
  if (c.activo) partes.push('ACTIVO');
  return partes.join(SEPARADOR);
}

/** Acepta la etiqueta del desplegable o el protocolo escrito a mano (si es único). */
function elegirCandidato(candidatos, valor) {
  var v = String(valor).trim();
  for (var i = 0; i < candidatos.length; i++) {
    if (etiquetaCandidato(candidatos[i]) === v) return candidatos[i];
  }
  var porProtocolo = candidatos.filter(function (c) {
    return String(c.protocolo).trim().toUpperCase() === v.toUpperCase();
  });
  return porProtocolo.length === 1 ? porProtocolo[0] : null;
}

function candidatoPorNumero(candidatos, nro) {
  var v = String(nro === null || nro === undefined ? '' : nro).trim();
  if (!v) return null;
  var m = candidatos.filter(function (c) { return String(c.nroPac).trim() === v; });
  return m.length === 1 ? m[0] : null;
}

/**
 * Fila más cercana con FECHA, primero hacia arriba y luego hacia abajo, sin
 * cruzar filas separadoras (combinadas, o con texto en A y sin fecha en B).
 * `valores` son las columnas A:B desde la fila `desde`.
 */
function buscarFilaDia(valores, desde, fila, separadoras) {
  function vacio(v) { return v === '' || v === null || v === undefined; }
  function revisar(r) {
    var v = valores[r - desde];
    if (!v || separadoras[r]) return 'corte';
    if (!vacio(v[1])) return 'ok';
    if (!vacio(v[0])) return 'corte';
    return 'seguir';
  }
  var ultima = desde + valores.length - 1;
  var pasos = [[fila - 1, -1, desde], [fila + 1, 1, ultima]];
  for (var i = 0; i < pasos.length; i++) {
    for (var r = pasos[i][0]; pasos[i][1] < 0 ? r >= pasos[i][2] : r <= pasos[i][2]; r += pasos[i][1]) {
      var e = revisar(r);
      if (e === 'ok') return r;
      if (e === 'corte') break;
    }
  }
  return null;
}

/** Cambia las comas que separan argumentos por ';' (las fórmulas de este script no usan comas en textos). */
function conSeparador(formula, sep) {
  return sep === ',' ? formula : formula.replace(/,/g, sep);
}

/** Fórmulas vivas: buscan en PACIENTES por Nº de paciente + protocolo. */
function formulasFila(fila) {
  function f(colPac) {
    var letra = String.fromCharCode(64 + colPac);
    return '=IFERROR(INDEX(FILTER(' + HOJA_PACIENTES + '!$' + letra + '$2:$' + letra +
      ', ' + HOJA_PACIENTES + '!$H$2:$H=$C' + fila +
      ', ' + HOJA_PACIENTES + '!$C$2:$C=$G' + fila + '), 1), "")';
  }
  return { rama: f(P.RAMA), coordi: f(P.COORDI), sponsor: f(P.SPONSOR), pi: f(P.PI) };
}

// ---------------------------------------------------------------------------
// Configuración (menú Agenda → Activar autocompletado en CICLOS)
// ---------------------------------------------------------------------------

function configurarCiclos() {
  var ss = SpreadsheetApp.getActive();

  var activa = ss.getActiveSheet();
  var lista = ss.getSheetByName(HOJA_LISTA) || ss.insertSheet(HOJA_LISTA);
  escribirFormula(lista.getRange('A1'),
    '=SORT(UNIQUE(FILTER(ARRAYFORMULA(TRIM(' + HOJA_PACIENTES + '!E2:E)), ' +
    HOJA_PACIENTES + '!E2:E<>"")))');
  if (activa && activa.getName() !== HOJA_LISTA) ss.setActiveSheet(activa);
  if (!lista.isSheetHidden()) lista.hideSheet();

  var regla = SpreadsheetApp.newDataValidation()
    .requireValueInRange(lista.getRange('A:A'), true)
    .setAllowInvalid(true) // se puede escribir un nombre nuevo (avisa, no bloquea)
    .setHelpText('Escribí o elegí un paciente de la hoja PACIENTES.')
    .build();

  var hechas = [];
  ss.getSheets().forEach(function (h) {
    if (!esHojaCiclosHabilitada(h.getName())) return;
    h.getRange(PRIMERA_FILA_DATOS, C.NOMBRE, h.getMaxRows() - PRIMERA_FILA_DATOS + 1, 1)
      .setDataValidation(regla);
    repararFormulas(h);
    hechas.push(h.getName());
  });

  var msg = hechas.length
    ? 'Autocompletado activo en:\n' + hechas.join('\n')
    : 'No hay hojas de CICLOS desde OCTUBRE 2026.';
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (err) {
    Logger.log(msg); // ejecutado desde el editor de Apps Script
  }
}

/** Reescribe las fórmulas de este script que hayan quedado con error. */
function repararFormulas(hoja) {
  var ultima = hoja.getLastRow();
  if (ultima < PRIMERA_FILA_DATOS) return;
  var formulas = hoja.getRange(PRIMERA_FILA_DATOS, C.RAMA, ultima - PRIMERA_FILA_DATOS + 1, 1).getFormulas();
  var mostradas = hoja.getRange(PRIMERA_FILA_DATOS, C.RAMA, ultima - PRIMERA_FILA_DATOS + 1, 1).getDisplayValues();
  for (var i = 0; i < formulas.length; i++) {
    if (formulas[i][0].indexOf('FILTER(' + HOJA_PACIENTES) >= 0 && mostradas[i][0].charAt(0) === '#') {
      escribirFormulasFila(hoja, PRIMERA_FILA_DATOS + i);
    }
  }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function leerPacientes() {
  var h = SpreadsheetApp.getActive().getSheetByName(HOJA_PACIENTES);
  var ultima = h.getLastRow();
  if (ultima < 2) return [];
  return h.getRange(2, 1, ultima - 1, P.ULTIMA).getValues();
}

/**
 * Escribe una fórmula (redactada con comas) usando el separador que acepta
 * esta planilla. La primera vez lo prueba y, si da #ERROR!, usa el otro.
 */
function escribirFormula(rango, formula) {
  if (SEP_FORMULA) {
    rango.setFormula(conSeparador(formula, SEP_FORMULA));
    return;
  }
  var loc = String(SpreadsheetApp.getActive().getSpreadsheetLocale() || '');
  var primero = /^(en|ja|ko|zh|th|he|hi)/i.test(loc) || loc === 'es_MX' ? ',' : ';';
  var orden = [primero, primero === ',' ? ';' : ','];
  for (var i = 0; i < orden.length; i++) {
    rango.setFormula(conSeparador(formula, orden[i]));
    SpreadsheetApp.flush();
    if (String(rango.getDisplayValue()).indexOf('#ERROR') !== 0) {
      SEP_FORMULA = orden[i];
      return;
    }
  }
}

function aviso(msg) {
  SpreadsheetApp.getActive().toast(msg, 'Agenda', 5);
}
