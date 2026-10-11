# Agenda — autocompletado de pacientes en CICLOS

Script de Google Apps Script para la planilla **PRUEBA AGENDA 2026**.

Funciona en las hojas **"<MES> <AÑO> CICLOS" desde OCTUBRE 2026 en adelante**
(también las de 2027 que se creen con ese mismo nombre). Las hojas anteriores y
las de ESTUDIOS no cambian.

## Qué hace

1. En la columna **D (NOMBRE Y APELLIDO)** aparece un desplegable con buscador
   que lista todos los pacientes de la hoja **PACIENTES**. Se puede elegir de la
   lista o escribir el nombre (sin importar mayúsculas, tildes ni el orden
   nombre/apellido).
2. Al elegir el nombre:
   - **Si tiene un solo protocolo**, se completan al instante:
     C Nº PACIENTE, E RAMA, F COORDI, G PROTOCOLO, H SPONSOR, I INVESTIGADOR.
   - **Si tiene más de un protocolo o número**, la celda G se pinta de amarillo
     con un desplegable de opciones, por ejemplo
     `CA239-0004 · Nº 57500113 · TRATAMIENTO · ACTIVO`
     (las activas aparecen primero). Al elegir una, se completa el resto.
3. RAMA, COORDINADORA, SPONSOR e INVESTIGADOR quedan como **fórmulas vinculadas
   a PACIENTES** (por Nº de paciente + protocolo): si alguien corrige un dato
   en PACIENTES, se actualiza en vivo en la agenda, sin recargar.
4. La lista del desplegable también se actualiza sola cuando se agrega un
   paciente nuevo en PACIENTES.
5. Si se borra el nombre de una fila, se limpian C, E, F, G, H e I de esa fila.
6. Si el nombre no está en PACIENTES, se avisa con un mensaje y una nota en la
   celda, y no se toca nada más.

## Instalación (una sola vez, ~2 minutos)

1. Abrí la planilla → menú **Extensiones → Apps Script**.
2. Si ya hay código en `Código.gs`, **no lo borres**: creá un archivo nuevo
   (botón **+** → *Secuencia de comandos*) llamado `Autocompletado`.
   Si ya existe una función `onEdit` u `onOpen`, avisame antes de pegar.
3. Pegá todo el contenido de [`Codigo.gs`](./Codigo.gs) y guardá (💾).
4. Volvé a la planilla y **recargá la página una vez**. Aparece el menú
   **Agenda**.
5. Menú **Agenda → Activar autocompletado en CICLOS**. La primera vez Google
   pide autorizar el script (es tu propia cuenta: *Avanzado → Ir a…
   → Permitir*).
   Esto crea una hoja oculta **LISTA PACIENTES** (alimenta el desplegable) y
   pone el desplegable en la columna D de las hojas habilitadas.

Listo: desde ahí funciona para todos los editores, sin recargar.
Cuando se cree una hoja de CICLOS nueva (ej. ENERO 2027 CICLOS), volvé a
ejecutar **Agenda → Activar autocompletado en CICLOS** para agregarle el
desplegable (el autocompletado funciona igual aunque no lo tenga).

## Notas

- El Nº de paciente se guarda como texto para no perder los ceros a la
  izquierda (ej. `030700002`).
- La columna E de OCTUBRE, NOVIEMBRE y DICIEMBRE 2026 CICLOS dice "PROTOCOLO"
  en el encabezado pero contiene la **RAMA** (ya era así con las fórmulas
  anteriores). Conviene renombrar el encabezado a "RAMA".
- Escribir el Nº en la columna C como antes sigue funcionando en las filas que
  ya tenían las fórmulas viejas.

## Pruebas

`node tests/prueba.js` ejecuta el script contra una planilla simulada.
