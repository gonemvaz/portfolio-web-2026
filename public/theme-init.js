// Aplica el tema guardado antes de pintar, para que no parpadee.
// Va como archivo aparte (no en línea) para que la CSP no necesite 'unsafe-inline'.
try { var t = localStorage.getItem('theme'); if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t); } catch (e) {}
