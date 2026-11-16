import './style.css';
import { supabase } from './supabase.js';

document.querySelector('#app').innerHTML = `<header><strong>Tic-Tac-Toe</strong><a id="hub-link" href="https://kumori1313.github.io/game-hub/">← Game Hub</a></header>
<section class="intro"><p class="eyebrow">Two players · One classic</p><h1>Make your<br />next move.</h1><p>Take turns. Find your line. Outthink your friend.</p></section>
<section class="card" aria-labelledby="status-title"><h2 id="status-title">The board is being set.</h2><p>Online tic-tac-toe is on its way. Public lobbies, guest entry, and live matches will arrive in the next development phases.</p><a class="button" id="return-link" href="https://kumori1313.github.io/game-hub/">Back to Game Hub</a></section>`;

if (import.meta.env.DEV) {
  for (const id of ['hub-link', 'return-link']) {
    document.getElementById(id).href = 'http://127.0.0.1:5173/game-hub/';
  }
}

// Initialize the shared client without signing visitors in before guest entry exists.
void supabase;
