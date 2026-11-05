/* Modo claro u oscuro: respeta el sistema hasta que la persona elige.
   El tema guardado se aplica antes de pintar, desde un script en línea en el <head>. */
export function initTheme() {
  const root = document.documentElement;
  document.getElementById('theme')!.addEventListener('click', () => {
    const attr = root.getAttribute('data-theme');
    const isDark = attr ? attr === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('theme', nextTheme); } catch (e) {}
  });
}
