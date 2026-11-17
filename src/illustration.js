export function mountIllustration() {
  const panel = document.querySelector('#side-visual');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let visible = false;
  let frame = 0;
  function draw() {
    frame = 0;
    if (!visible || document.hidden) return;
    const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const step = motion.matches ? 5 : Math.max(ready ? 3 : 1, Math.min(5, 1 + Math.floor(scrollY / range * 5)));
    panel.dataset.step = String(step);
    panel.querySelectorAll('[data-move]').forEach((move) => move.classList.toggle('shown', Number(move.dataset.move) <= step));
    document.querySelector('#move-label').textContent = motion.matches ? 'A familiar finish' : `Move ${String(step).padStart(2, '0')} / 05`;
    document.querySelector('#journey-guest').classList.toggle('complete', ready);
    document.querySelector('#journey-choice').classList.toggle('complete', ready && location.pathname.includes('/tic-tac-toe/'));
    document.querySelector('#journey-choice').classList.toggle('current', ready && !location.pathname.includes('/tic-tac-toe/'));
    document.querySelector('#visual-hint').textContent = ready ? 'Your guest is ready. Choose your next game.' : 'Scroll to follow a little friendly rivalry.';
  }
  function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(panel);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  document.addEventListener('guest-state', (event) => { ready = event.detail.ready; schedule(); });
}
