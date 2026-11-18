import './style.css';
import { supabase } from './supabase.js';
import { mountGuestEntry } from './guest-ui.js';
import { mountTheme } from './theme.js';
import { mountIllustration } from './illustration.js';
import { mountLobbies } from './lobbies.js';

document.querySelector('#app').innerHTML = `<a class="skip-link" href="#guest-entry">Skip to guest entry</a><header class="site-header"><nav class="nav-inner" aria-label="Main navigation"><a class="brand" href="/game-hub/" aria-label="Game Hub home"><svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 3h24l5 5v24l-5 5H8l-5-5V8Z" fill="none" stroke="currentColor"/><path d="M15 8v24M25 8v24M8 15h24M8 25h24" fill="none" stroke="currentColor" opacity=".5"/><path d="m8 8 4 4m0-4-4 4m20 20 4 4m0-4-4 4" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg><span>GAME<span class="brand-dot">/</span>HUB</span></a><div class="nav-links"><button id="theme-toggle" type="button" class="theme-toggle" aria-label="Switch to light mode">◑ Light mode</button></div></nav></header><section class="hero" aria-labelledby="mission"><div class="hero-inner"><div class="hero-copy"><h1 id="mission">Tic-Tac-Toe</h1></div><div class="hero-art" aria-hidden="true"></div></div></section><main class="content-layout"><div class="main-column"><section class="entry-panel" id="guest-entry" aria-labelledby="entry-title">

<h2 id="entry-title">Checking your guest session…</h2>
<p id="guest-status" role="status" aria-live="polite"></p>
<div id="identity" hidden><p><strong id="guest-name"></strong></p><button type="button" class="secondary" id="change-name">Change name <span aria-hidden="true">↗</span></button></div>
<form id="guest-form" novalidate hidden>
<label for="display-name">Display name</label>
<div class="input-line"><input id="display-name" name="display-name" type="text" autocomplete="nickname" aria-describedby="name-hint guest-error" disabled /><button id="save-name" class="button" type="submit" disabled>Continue <span aria-hidden="true">→</span></button></div>
<p id="name-hint" class="hint">1–24 characters.</p>
<button id="cancel-name" class="secondary" type="button" hidden>Cancel</button>
</form>
<p id="guest-error" class="error" role="alert"></p>
<button id="retry" type="button" class="secondary" hidden>Retry connection</button>
</section><section id="selection" class="game-card lobby-section" aria-labelledby="selection-title" hidden><h2 id="selection-title" tabindex="-1">Lobbies</h2><div id="lobby-app"><p id="lobby-error" role="alert" class="error"></p><div id="lobby-discovery"><div class="lobby-actions"><button class="button" type="button" id="create-lobby">Create lobby</button><button class="secondary" type="button" id="refresh-lobbies">Refresh</button></div><p id="lobby-status" role="status">Loading lobbies…</p><ul id="lobby-list" class="lobby-list"></ul></div><section id="lobby-room" hidden aria-labelledby="room-title"><h3 id="room-title" tabindex="-1"></h3><p id="room-message" role="status"></p><p id="room-connection" role="status" class="hint"></p><ul id="room-members" class="member-list"></ul><div id="match-board" class="match-board" role="group" aria-label="Tic-tac-toe board" hidden></div><div class="lobby-actions"><button class="button" type="button" id="start-game" hidden>Start game</button><button class="secondary" type="button" id="leave-lobby">Leave lobby</button><button class="secondary" type="button" id="back-lobbies" hidden>Back to lobbies</button></div></section></div><a id="return-link" class="back-link" href="/game-hub/">Back to Game Hub</a></section></div><aside class="side-rail" aria-label="Tic-tac-toe preview"><div id="side-visual" data-step="1"><span class="tag preview-label">Preview</span><div class="diagram-wrap"><svg class="demo-board" viewBox="0 0 320 300" role="img" aria-label="Illustration of a tic-tac-toe game with X completing a diagonal. This is a preview, not a playable match."><g class="board-grid"><path d="M110 20v260M210 20v260M20 100h280M20 200h280"/></g><g data-move="1" class="move cross"><path d="m43 33 34 34m0-34L43 67"/></g><g data-move="2" class="move nought"><circle cx="160" cy="53" r="23"/></g><g data-move="3" class="move cross"><path d="m143 133 34 34m0-34-34 34"/></g><g data-move="4" class="move nought"><circle cx="60" cy="150" r="23"/></g><g data-move="5" class="move cross"><path d="m243 233 34 34m0-34-34 34"/><path class="win-line" d="M27 17 293 283"/></g></svg></div></div></aside></main><footer class="site-footer"><details class="privacy-note"><summary>About guest identities</summary><p>Names are not unique. Your guest identity is saved in this browser; clearing browser data or switching devices can lose it.</p></details></footer>`;

if (import.meta.env.DEV) {
  document.querySelector('#return-link').href = 'http://127.0.0.1:5173/game-hub/';
  document.querySelectorAll('a[href="/game-hub/"]').forEach((link) => { link.href = 'http://127.0.0.1:5173/game-hub/'; });
}

mountLobbies(supabase);
mountTheme();
mountIllustration();
mountGuestEntry({ client: supabase, gamePage: true });
