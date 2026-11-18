import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key, 'Set Supabase URL and publishable key in .env.local.');
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname), 'This check creates a guest and must only run locally.');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.auth.signInAnonymously();
assert.ifError(error);
assert.equal(data.user.is_anonymous, true);
try {
  const { data: verified, error: verifyError } = await client.auth.getUser();
  assert.ifError(verifyError);
  assert.equal(verified.user.id, data.user.id);
  const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${data.session.access_token}` } });
  assert.equal(response.status, 200, 'PostgREST must be reachable.');
  const spec = await response.json();
  const allowed = new Set(['/', '/game_catalog', '/lobby_summaries', '/rpc/lobby_action', '/rpc/play_move', '/rpc/room_action', '/rpc/submit_move']);
  assert.deepEqual(Object.keys(spec.paths).filter(path => !allowed.has(path)), [], 'Only catalog, public lobby summaries, and the guarded lobby API may be exposed.');
  const { data: games, error: catalogError } = await client.from('game_catalog').select('id');
  assert.ifError(catalogError);
  assert.ok(games.some(game => game.id === 'tic-tac-toe'));
  console.log('PASS: anonymous sign-in, verified identity, and restricted lobby Data API.');
} finally {
  const { error: signOutError } = await client.auth.signOut();
  assert.ifError(signOutError);
}
