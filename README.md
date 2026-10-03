# VUELO — tienda de zapatillas con pedidos por WhatsApp

Sitio estático (HTML + CSS + JavaScript, sin dependencias ni build) de una tienda de zapatillas con marca propia. El cliente arma el carrito y el pedido se envía armado a WhatsApp.

## Qué hace

- Catálogo con filtros (Hombre, Mujer, Niños, Running, Urbano, Básquet, Ofertas), búsqueda y orden por precio o nombre.
- Ficha de producto con selector de color, talle (con equivalencia US/cm) y cantidad.
- Carrito lateral que se guarda en el navegador, con descuento por transferencia y envío gratis desde un monto.
- Checkout: nombre, entrega (envío o retiro) y forma de pago. El botón **Enviar pedido por WhatsApp** abre `wa.me` con el pedido completo en el mensaje.
- Botón **Comprar ahora por WhatsApp** en cada producto y botón flotante para consultas.
- Guía de talles, modo oscuro automático y diseño adaptado a celulares.

## Configurar tu número

Editá `js/productos.js`:

```js
window.CONFIG = {
  tienda: "VUELO",
  whatsapp: "5491123456789",   // código de país + área + número, solo dígitos
  envioGratisDesde: 150000,
  costoEnvio: 8500,
  descuentoTransferencia: 0.10
};
```

En el mismo archivo está `PRODUCTOS`: ahí se cambian nombres, precios, talles y colores de cada modelo.

## Verlo

Abrí `index.html` en el navegador, o publicalo gratis con GitHub Pages (Settings → Pages → Deploy from branch).
