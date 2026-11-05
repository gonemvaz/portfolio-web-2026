/* Copia el email al portapapeles; si no se puede, lo deja seleccionado */
export function initCopyEmail() {
  const copy = document.getElementById('copy')!;
  const email = document.getElementById('email')!;
  const copyState = document.getElementById('copyState')!;
  const place = copyState.textContent;

  function selectIt() {
    const r = document.createRange(); r.selectNodeContents(email);
    const s = getSelection()!; s.removeAllRanges(); s.addRange(r);
    copyState.textContent = 'Email seleccionado';
  }

  copy.addEventListener('click', () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email.textContent!).then(() => { copyState.textContent = 'Email copiado'; }, selectIt);
    } else { selectIt(); }
    setTimeout(() => { copyState.textContent = place; }, 2000);
  });
}
