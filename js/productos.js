/*
 * Configuración de la tienda y catálogo.
 * Para cambiar el número de WhatsApp, editá CONFIG.whatsapp
 * (código de país + código de área + número, solo dígitos; ej. Argentina: 549 + 11 + número).
 */
window.CONFIG = {
  tienda: "VUELO",
  whatsapp: "5491123456789",
  envioGratisDesde: 150000,
  costoEnvio: 8500,
  descuentoTransferencia: 0.10
};

// Equivalencias de talle (referencia). AR -> US / CM
window.TALLES = {
  28: { us: "11K", cm: 17.5 }, 29: { us: "12K", cm: 18 }, 30: { us: "12.5K", cm: 19 },
  31: { us: "13.5K", cm: 19.5 }, 32: { us: "1Y", cm: 20.5 }, 33: { us: "2Y", cm: 21 },
  34: { us: "3Y", cm: 22 }, 35: { us: "4.5", cm: 22.5 }, 36: { us: "5", cm: 23 },
  37: { us: "6", cm: 24 }, 38: { us: "7", cm: 24.5 }, 39: { us: "7.5", cm: 25.5 },
  40: { us: "8.5", cm: 26 }, 41: { us: "9", cm: 27 }, 42: { us: "10", cm: 27.5 },
  43: { us: "10.5", cm: 28.5 }, 44: { us: "11.5", cm: 29 }, 45: { us: "12", cm: 30 }
};

// Cada colorway define los colores del dibujo de la zapatilla.
// upper: capellada · panel: puntera/talón · accent: ala lateral · sole: entresuela · outsole: suela · lace: cordones
window.PRODUCTOS = [
  {
    id: "aire-01", nombre: "Aire 01", codigo: "VL-2601-114",
    genero: "hombre", tipo: "running", precio: 129999, precioAntes: null, etiqueta: "Nuevo",
    descripcion: "Running de uso diario con espuma reactiva y capellada de malla respirable. Liviana y firme en la pisada.",
    talles: [39, 40, 41, 42, 43, 44, 45],
    colores: [
      { nombre: "Cobalto / Goma", upper: "#2340E6", panel: "#F2F3F7", accent: "#F2F3F7", sole: "#F7F5EF", outsole: "#C68A45", lace: "#F2F3F7" },
      { nombre: "Negro / Volt", upper: "#1A1C22", panel: "#33363F", accent: "#D7F23A", sole: "#F2F3F7", outsole: "#1A1C22", lace: "#D7F23A" },
      { nombre: "Hueso", upper: "#E9E3D6", panel: "#D5CDBC", accent: "#8C7A5B", sole: "#FBF9F4", outsole: "#8C7A5B", lace: "#FBF9F4" }
    ]
  },
  {
    id: "ruta-x", nombre: "Ruta X", codigo: "VL-2602-301",
    genero: "mujer", tipo: "running", precio: 139999, precioAntes: null, etiqueta: "Nuevo",
    descripcion: "Pensada para fondos largos: más amortiguación en el talón y suela de caucho con tracción en mojado.",
    talles: [35, 36, 37, 38, 39, 40],
    colores: [
      { nombre: "Coral / Lila", upper: "#F0715A", panel: "#F7D9E3", accent: "#7A5CD6", sole: "#FFFFFF", outsole: "#7A5CD6", lace: "#FFFFFF" },
      { nombre: "Menta", upper: "#7FD3B5", panel: "#E9F7F1", accent: "#1F5F4C", sole: "#FFFFFF", outsole: "#1F5F4C", lace: "#E9F7F1" }
    ]
  },
  {
    id: "barrio-lo", nombre: "Barrio Lo", codigo: "VL-2510-020",
    genero: "unisex", tipo: "urbano", precio: 99999, precioAntes: 124999, etiqueta: "Oferta",
    descripcion: "Caña baja de cuero vacuno con suela vulcanizada. La de todos los días, con o sin medias.",
    talles: [36, 37, 38, 39, 40, 41, 42, 43, 44],
    colores: [
      { nombre: "Blanco total", upper: "#F7F7F5", panel: "#E7E7E2", accent: "#E7E7E2", sole: "#FFFFFF", outsole: "#DADAD4", lace: "#FFFFFF" },
      { nombre: "Blanco / Verde", upper: "#F7F7F5", panel: "#1E6B47", accent: "#1E6B47", sole: "#F5F1E6", outsole: "#C68A45", lace: "#F7F7F5" },
      { nombre: "Negro", upper: "#202227", panel: "#2E3137", accent: "#F7F7F5", sole: "#F5F1E6", outsole: "#202227", lace: "#202227" }
    ]
  },
  {
    id: "cancha-hi", nombre: "Cancha Hi", codigo: "VL-2603-777",
    genero: "hombre", tipo: "basquet", precio: 169999, precioAntes: null, etiqueta: null,
    descripcion: "Bota de básquet con cuello acolchado, contrafuerte firme y cámara de aire visible en el talón.",
    talles: [40, 41, 42, 43, 44, 45],
    colores: [
      { nombre: "Rojo / Negro", upper: "#C8262E", panel: "#15161A", accent: "#15161A", sole: "#FFFFFF", outsole: "#15161A", lace: "#FFFFFF" },
      { nombre: "Azul noche", upper: "#18234A", panel: "#E9ECF5", accent: "#F2B33D", sole: "#FFFFFF", outsole: "#18234A", lace: "#E9ECF5" }
    ]
  },
  {
    id: "brisa", nombre: "Brisa", codigo: "VL-2604-208",
    genero: "mujer", tipo: "urbano", precio: 109999, precioAntes: null, etiqueta: null,
    descripcion: "Plataforma suave de 4 cm y gamuza en la puntera. Cómoda para caminar todo el día.",
    talles: [35, 36, 37, 38, 39, 40],
    colores: [
      { nombre: "Arena / Rosa", upper: "#EADBC8", panel: "#E7A8B4", accent: "#E7A8B4", sole: "#FFFDF8", outsole: "#E7A8B4", lace: "#FFFDF8" },
      { nombre: "Gris piedra", upper: "#B9BCC4", panel: "#6E7380", accent: "#F7F7F5", sole: "#F7F7F5", outsole: "#6E7380", lace: "#F7F7F5" }
    ]
  },
  {
    id: "trazo", nombre: "Trazo Trail", codigo: "VL-2509-450",
    genero: "unisex", tipo: "running", precio: 119999, precioAntes: 154999, etiqueta: "Oferta",
    descripcion: "Trail running con tacos de 4 mm, puntera reforzada y lengüeta con fuelle para que no entren piedras.",
    talles: [37, 38, 39, 40, 41, 42, 43, 44],
    colores: [
      { nombre: "Oliva / Naranja", upper: "#5C6B3A", panel: "#2E3420", accent: "#F07A28", sole: "#E8E3D4", outsole: "#2E3420", lace: "#F07A28" },
      { nombre: "Tierra", upper: "#8A5A3C", panel: "#3D2A1E", accent: "#E8E3D4", sole: "#E8E3D4", outsole: "#3D2A1E", lace: "#E8E3D4" }
    ]
  },
  {
    id: "pique-kids", nombre: "Pique Kids", codigo: "VL-2605-033",
    genero: "ninos", tipo: "urbano", precio: 74999, precioAntes: null, etiqueta: "Nuevo",
    descripcion: "Abrojo doble para que se las pongan solos, suela antideslizante y punta reforzada para el recreo.",
    talles: [28, 29, 30, 31, 32, 33, 34],
    colores: [
      { nombre: "Amarillo / Azul", upper: "#F5C43A", panel: "#2340E6", accent: "#2340E6", sole: "#FFFFFF", outsole: "#2340E6", lace: "#FFFFFF" },
      { nombre: "Fucsia", upper: "#E04A8E", panel: "#FFE3EF", accent: "#FFFFFF", sole: "#FFFFFF", outsole: "#9C2A5E", lace: "#FFFFFF" }
    ]
  },
  {
    id: "salto-kids", nombre: "Salto Kids", codigo: "VL-2511-061",
    genero: "ninos", tipo: "running", precio: 64999, precioAntes: 79999, etiqueta: "Oferta",
    descripcion: "Liviana y flexible para correr en el patio. Plantilla extraíble y lavable.",
    talles: [28, 29, 30, 31, 32, 33, 34],
    colores: [
      { nombre: "Turquesa", upper: "#2BB3B1", panel: "#0F4C5C", accent: "#FFFFFF", sole: "#FFFFFF", outsole: "#0F4C5C", lace: "#FFFFFF" }
    ]
  },
  {
    id: "doble-v", nombre: "Doble V", codigo: "VL-2606-909",
    genero: "unisex", tipo: "basquet", precio: 189999, precioAntes: null, etiqueta: "Edición limitada",
    descripcion: "Edición limitada numerada. Cuero premium con ala reflectiva y suela traslúcida de goma natural.",
    talles: [38, 39, 40, 41, 42, 43, 44],
    colores: [
      { nombre: "Blanco / Cobalto", upper: "#F4F4F2", panel: "#2340E6", accent: "#2340E6", sole: "#F4F4F2", outsole: "#C68A45", lace: "#F4F4F2" },
      { nombre: "Negro / Oro", upper: "#141518", panel: "#2A2B30", accent: "#D4A84B", sole: "#141518", outsole: "#D4A84B", lace: "#D4A84B" }
    ]
  },
  {
    id: "paseo", nombre: "Paseo", codigo: "VL-2507-118",
    genero: "hombre", tipo: "urbano", precio: 89999, precioAntes: 109999, etiqueta: "Oferta",
    descripcion: "Gamuza y lona con suela de goma color miel. Clásica, liviana y fácil de combinar.",
    talles: [39, 40, 41, 42, 43, 44, 45],
    colores: [
      { nombre: "Azul marino", upper: "#1F2A44", panel: "#C9B48A", accent: "#F2EEE3", sole: "#F2EEE3", outsole: "#C68A45", lace: "#F2EEE3" },
      { nombre: "Verde botella", upper: "#1F4434", panel: "#C9B48A", accent: "#F2EEE3", sole: "#F2EEE3", outsole: "#C68A45", lace: "#F2EEE3" }
    ]
  }
];
