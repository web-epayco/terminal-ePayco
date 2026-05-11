# terminal-ePayco

Landing estática para **Terminal ePayco**: una sola página (`index.html`), estilos en `assets/css/` y lógica en `assets/js/`. Pensada para despliegue directo (GitHub Pages, CDN o cualquier hosting de archivos estáticos).

## Estructura

```
terminal-ePayco/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   ├── fonts.css    # @font-face Davivienda
│   │   └── main.css     # estilos de la página
│   ├── js/
│   │   └── main.js      # UI, carrito demo, GSAP + ScrollTrigger
│   └── fonts/           # WOFF2 oficiales (ver nota legal)
```

## Cómo verlo en local

Abre `index.html` en el navegador o sirve la carpeta raíz con cualquier servidor estático, por ejemplo:

```bash
npx --yes serve .
```

## Tipografía

Los archivos bajo `assets/fonts/` corresponden a la familia **Davivienda** en formato WOFF2. Deben usarse según la licencia y los lineamientos del proveedor tipográfico y de la marca.

## GitHub Pages

Configura el repositorio con **Pages** apuntando a la rama principal y carpeta raíz (`/`). La entrada es `index.html`.

## Cuenta GitHub

Este proyecto se versiona con la cuenta autenticada en `gh` (por ejemplo `web-epayco`). Comprueba con:

```bash
gh auth status
```
