import { narrow, reduced } from './media';
import type { Menu } from './menu';

const WHEEL_THRESHOLD = 24; // Cuánto hay que girar la rueda para cambiar de sección.
const SLIDE_MS = 760;       // Igual a --slide-time.
const QUIET_MS = 110;       // Pausa que separa un gesto de la inercia del trackpad.

/* En escritorio las secciones se recorren como diapositivas (rueda, teclado y navbar);
   en el teléfono se leen con scroll normal y el navbar marca la sección visible. */
export function initNavigation(menu: Menu) {
  const track = document.getElementById('track')!;
  const stage = document.getElementById('stage')!;
  const slides = Array.from(document.querySelectorAll<HTMLElement>('.slide'));
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('#navlist a'));
  const ids = slides.map((s) => s.id);
  let at = 0;
  let lastAt = 0;
  let lockUntil = 0;

  function paint() {
    track.style.setProperty('--at', String(at));
    links.forEach((a, i) => {
      if (i === at) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === at);
      s.classList.toggle('is-past', i < at);
      s.classList.toggle('is-back', i === at && at < lastAt);
      s.inert = !narrow.matches && i !== at;
    });
    lastAt = at;
  }

  function go(i: number, fromObserver = false) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const changed = i !== at;
    at = i;
    paint();
    if (narrow.matches) {
      if (!fromObserver) slides[i].scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
    } else if (changed) {
      lockUntil = performance.now() + SLIDE_MS;
    }
    if (!fromObserver && location.hash !== '#' + ids[i]) {
      try { history.replaceState(null, '', '#' + ids[i]); } catch (e) {}
    }
  }

  /* ¿Hay algo con scroll propio bajo el puntero que todavía puede moverse en esa dirección? */
  function scrollsInner(target: EventTarget | null, dy: number) {
    let el = target as Node | null;
    while (el && el !== document.body && el.nodeType === 1) {
      const box = el as HTMLElement;
      if (box.scrollHeight > box.clientHeight + 1) {
        const o = getComputedStyle(box).overflowY;
        if (o === 'auto' || o === 'scroll') {
          if (dy > 0 && box.scrollTop + box.clientHeight < box.scrollHeight - 1) return true;
          if (dy < 0 && box.scrollTop > 0) return true;
        }
      }
      el = el.parentNode;
    }
    return false;
  }

  /* Rueda y trackpad, en toda la página */
  let acc = 0, lastWheel = 0, waitQuiet = false;
  window.addEventListener('wheel', (e) => {
    if (narrow.matches || e.ctrlKey) return;
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * stage.clientHeight : e.deltaY;

    if (now >= lockUntil && scrollsInner(e.target, dy)) { waitQuiet = true; acc = 0; return; }
    e.preventDefault();
    if (now < lockUntil) return;
    if (waitQuiet && gap < QUIET_MS) return;
    waitQuiet = false;
    if (gap > 220) acc = 0;
    acc += dy;
    if (Math.abs(acc) >= WHEEL_THRESHOLD) {
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      waitQuiet = true;
      go(at + dir);
    }
  }, { passive: false });

  /* Teclado */
  window.addEventListener('keydown', (e) => {
    if (narrow.matches || e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return;
    const map: Record<string, number> = { ArrowDown: at + 1, PageDown: at + 1, ArrowUp: at - 1, PageUp: at - 1, Home: 0, End: slides.length - 1 };
    if (!(e.key in map)) return;
    const dy = e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 0;
    if (dy && scrollsInner(slides[at].firstElementChild, dy)) return;
    e.preventDefault();
    if (performance.now() >= lockUntil) go(map[e.key]);
  });

  /* Navbar y botón de volver arriba */
  links.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (menu.isOpen()) menu.close(true);
      go(i);
    });
  });
  document.getElementById('up')!.addEventListener('click', () => {
    if (narrow.matches) window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
    else go(0);
  });

  function fromHash() {
    const i = ids.indexOf(location.hash.slice(1));
    if (i >= 0 && i !== at) go(i);
  }
  window.addEventListener('hashchange', fromHash);
  stage.addEventListener('scroll', () => { if (!narrow.matches) stage.scrollTop = 0; });

  /* Teléfono: resalta la sección visible mientras se lee */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!narrow.matches) return;
      entries.forEach((en) => {
        if (en.isIntersecting) go(slides.indexOf(en.target as HTMLElement), true);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    slides.forEach((s) => io.observe(s));
  }
  narrow.addEventListener('change', paint);

  paint();
  fromHash();
  /* El rebote se activa después de la carga, para que solo aparezca al volver */
  requestAnimationFrame(() => requestAnimationFrame(() => track.classList.add('ready')));
}
