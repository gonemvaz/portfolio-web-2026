import { narrow } from './media';

export interface Menu {
  isOpen(): boolean;
  close(keepFocus?: boolean): void;
}

/* Menú lateral del teléfono */
export function initMenu(): Menu {
  const root = document.documentElement;
  const menuBtn = document.getElementById('menuBtn')!;
  const nav = document.getElementById('siteNav')!;
  const behind = document.querySelectorAll<HTMLElement>('.identity, .contact, .window');

  function setMenu(open: boolean, keepFocus = false) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    behind.forEach((el) => { el.inert = open; });
    if (open) nav.querySelector<HTMLElement>('a[aria-current="true"]')?.focus({ preventScroll: true });
    else if (!keepFocus) menuBtn.focus({ preventScroll: true });
  }
  const isOpen = () => root.classList.contains('menu-open');

  menuBtn.addEventListener('click', () => setMenu(!isOpen()));
  document.getElementById('scrim')!.addEventListener('click', () => setMenu(false));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) setMenu(false); });
  narrow.addEventListener('change', () => { if (isOpen()) setMenu(false, true); });

  return { isOpen, close: (keepFocus) => setMenu(false, keepFocus) };
}
