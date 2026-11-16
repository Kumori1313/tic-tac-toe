import './style.css';
import { supabase } from './supabase.js';
import { mountGuestEntry } from './guest-ui.js';

document.querySelector('#app').innerHTML = `<header><strong>Tic-Tac-Toe</strong><a id="hub-link" href="/game-hub/">← Game Hub</a></header>
<section class="intro"><p class="eyebrow">Two players · One classic</p><h1>Make your<br />next move.</h1><p>Take turns. Find your line. Outthink your friend.</p></section><section class="card" aria-labelledby="entry-title">
<h2 id="entry-title">Checking your guest session…</h2>
<p id="guest-status" role="status" aria-live="polite"></p>
<p id="identity" hidden>Playing as <strong id="guest-name"></strong> <button type="button" class="secondary" id="change-name">Change name</button></p>
<form id="guest-form" novalidate hidden>
<label for="display-name">Display name</label>
<input id="display-name" name="display-name" type="text" autocomplete="nickname" aria-describedby="name-hint guest-error" disabled />
<p id="name-hint" class="hint">1–24 characters. Names aren’t reserved and may be shared by other guests.</p>
<div class="actions"><button id="save-name" class="button" type="submit" disabled>Continue</button><button id="cancel-name" class="secondary" type="button" hidden>Cancel</button></div>
</form>
<p id="guest-error" class="error" role="alert"></p>
<button id="retry" type="button" class="secondary" hidden>Retry connection</button>
</section>
<section id="selection" class="card" aria-labelledby="selection-title" hidden><h2 id="selection-title" tabindex="-1">Your seat is nearly ready.</h2><p>You’ve arrived with your guest identity. Public lobbies and online matches are coming next.</p><a class="button" id="return-link" href="/game-hub/">Back to Game Hub</a></section><footer><p class="hint">Guest identities are saved in this browser. Clearing browser data, signing out, or switching devices can lose your identity. Your display name is only a label.</p></footer>`;

if (import.meta.env.DEV) {
  for (const id of ['hub-link', 'return-link']) document.getElementById(id).href = 'http://127.0.0.1:5173/game-hub/';
}

mountGuestEntry({ client: supabase, gamePage: true });
