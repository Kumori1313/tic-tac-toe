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
  assert.deepEqual(Object.keys(spec.paths).filter((path) => path !== '/'), [], 'Phase 2 should expose no application tables or functions.');
  console.log('PASS: anonymous sign-in, verified identity, and empty Data API.');
} finally {
  const { error: signOutError } = await client.auth.signOut();
  assert.ifError(signOutError);
}
