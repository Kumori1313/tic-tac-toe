import { createGuestService, displayName, validateDisplayName } from './guest.js';

export function mountGuestEntry({ client, gamePage = false }) {
  const form = document.querySelector('#guest-form');
  const input = document.querySelector('#display-name');
  const save = document.querySelector('#save-name');
  const change = document.querySelector('#change-name');
  const cancel = document.querySelector('#cancel-name');
  const retry = document.querySelector('#retry');
  const status = document.querySelector('#guest-status');
  const error = document.querySelector('#guest-error');
  const identity = document.querySelector('#identity');
  const nameLabel = document.querySelector('#guest-name');
  const selection = document.querySelector('#selection');
  let user = null;
  let busy = false;
  let operation = 0;
  let editing = false;
  let ready = false;
  let service;

  function render() {
    const name = displayName(user);
    input.disabled = busy;
    save.disabled = busy || !navigator.onLine;
    change.disabled = busy;
    retry.disabled = busy || !navigator.onLine;
    cancel.disabled = busy;
    form.hidden = Boolean(name) && !editing;
    cancel.hidden = !name;
    identity.hidden = !name;
    nameLabel.textContent = name ?? '';
    selection.hidden = !ready || !name || editing || busy || !navigator.onLine;
    document.querySelector('#entry-title').textContent = gamePage
      ? (name ? 'You’re ready for Tic-Tac-Toe.' : 'Enter as a guest')
      : (name ? 'Choose your next game.' : 'What should we call you?');
    form.setAttribute('aria-busy', String(busy));
  }

  function showError(message) {
    error.textContent = message;
    retry.hidden = false;
  }

  async function restore() {
    const ticket = ++operation;
    busy = true;
    ready = false;
    error.textContent = '';
    status.textContent = 'Checking your guest session…';
    retry.hidden = true;
    render();
    try {
      if (!navigator.onLine) throw new Error('offline');
      service ??= createGuestService(client);
      const restored = await service.restore();
      if (ticket !== operation) return;
      user = restored;
      ready = true;
      const name = displayName(user);
      if (!editing && name) input.value = name;
      status.textContent = name ? 'Guest session ready.' : (gamePage ? 'Enter a name to continue. No account or password needed.' : 'No account or password needed.');
    } catch {
      if (ticket !== operation) return;
      status.textContent = 'Guest session could not be checked.';
      showError(navigator.onLine ? 'We couldn’t connect to guest services. Check your connection and try again.' : 'You’re offline. Reconnect, then try again.');
    } finally {
      if (ticket === operation) { busy = false; render(); }
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const ticket = ++operation;
    busy = true;
    status.textContent = 'Saving your guest name…';
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    retry.hidden = true;
    render();
    try {
      validateDisplayName(input.value);
      if (!navigator.onLine) throw new Error('You’re offline. Reconnect, then try again.');
      service ??= createGuestService(client);
      const saved = await service.save(input.value);
      if (ticket !== operation) return;
      user = saved;
      editing = false;
      ready = true;
      input.value = displayName(user) ?? '';
      status.textContent = 'Guest session ready.';
    } catch {
      if (ticket !== operation) return;
      try { validateDisplayName(input.value); }
      catch (validation) {
        input.setAttribute('aria-invalid', 'true');
        error.textContent = validation.message;
      }
      if (!error.textContent) showError('We couldn’t save your name. Check your connection and try submitting again.');
      status.textContent = 'Your name has not been saved.';
    } finally {
      if (ticket === operation) {
        busy = false;
        render();
        if (error.textContent) input.focus();
        else document.querySelector(gamePage ? '#selection-title' : '#game-link').focus();
      }
    }
  });

  change.addEventListener('click', () => {
    editing = true;
    input.value = displayName(user) ?? '';
    error.textContent = '';
    render();
    input.focus();
    input.select();
  });
  cancel.addEventListener('click', () => { editing = false; error.textContent = ''; render(); change.focus(); });
  retry.addEventListener('click', restore);
  window.addEventListener('offline', () => {
    ++operation;
    busy = false;
    ready = false;
    status.textContent = 'You’re offline.';
    showError('Reconnect to continue. Your entered name is still here.');
    render();
  });
  window.addEventListener('online', restore);
  window.addEventListener('pageshow', (event) => { if (event.persisted) restore(); });
  client?.auth.onAuthStateChange((event) => {
    // Defer SDK calls until the auth callback has released its lock.
    if (!busy && ['SIGNED_OUT', 'USER_UPDATED'].includes(event)) setTimeout(restore, 0);
  });
  restore();
}
