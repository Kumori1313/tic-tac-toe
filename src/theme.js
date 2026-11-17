export function mountTheme() {
  const button = document.querySelector('#theme-toggle');
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const light = theme === 'light';
    button.textContent = light ? '◐ Dark mode' : '◑ Light mode';
    button.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }
  apply(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('game-hub-theme', next); } catch {}
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'game-hub-theme' || event.key === null) apply(event.newValue === 'light' ? 'light' : 'dark');
  });
}
