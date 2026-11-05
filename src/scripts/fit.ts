import { narrow } from './media';

/* Ajustes de tamaño que dependen de medir el texto ya renderizado */
export function initFit() {
  /* El nombre ocupa el ancho disponible, en una sola línea */
  const nameEl = document.getElementById('name')!;
  function fitName() {
    const span = nameEl.firstElementChild!;
    nameEl.style.fontSize = '100px';
    const size = 100 * nameEl.clientWidth / span.getBoundingClientRect().width * 0.97;
    nameEl.style.fontSize = Math.min(size, 60) + 'px';
  }

  /* La franja de Habilidades toma el alto justo para que su contenido quepa entre las dos diagonales */
  const hab = document.getElementById('habilidades')!;
  const habContent = document.getElementById('habContent')!;
  function fitBand() {
    if (narrow.matches) return;
    const drop = hab.clientWidth * 0.123; // Igual a --tan.
    const inset = habContent.firstElementChild!.getBoundingClientRect().width / hab.clientWidth;
    hab.style.setProperty('--band', Math.round(habContent.offsetHeight + drop * inset * 0.55 + 20) + 'px');
  }

  for (const fit of [fitName, fitBand]) {
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
  }
}
