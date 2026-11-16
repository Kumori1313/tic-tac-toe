import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDisplayName, displayName, createGuestService } from '../src/guest.js';

test('names trim whitespace, count Unicode code points, and reject control characters', () => {
  assert.equal(validateDisplayName('  Alex 🦊  '), 'Alex 🦊');
  assert.equal(validateDisplayName('🦊'.repeat(24)), '🦊'.repeat(24));
  for (const value of ['', '   ', 'a'.repeat(25), 'Alex\n', 'A\u0000B', 'A\u202eB', '\ud800']) {
    assert.throws(() => validateDisplayName(value));
  }
  assert.equal(displayName({ user_metadata: { display_name: '\u0000' } }), null);
});

test('returning guests keep their identity when changing a display name', async () => {
  const user = { id: 'same-guest', user_metadata: { display_name: 'Alex' } };
  const client = { auth: {
    getSession: async () => ({ data: { session: {} } }),
    getUser: async () => ({ data: { user } }),
    updateUser: async ({ data }) => ({ data: { user: { ...user, user_metadata: data } } }),
    signInAnonymously: async () => assert.fail('must not create another guest'),
  } };
  const updated = await createGuestService(client).save('  Sam  ');
  assert.equal(updated.id, 'same-guest');
  assert.equal(displayName(updated), 'Sam');
});

test('new guests receive the validated name in auth metadata', async () => {
  const client = { auth: {
    getSession: async () => ({ data: { session: null } }),
    signInAnonymously: async ({ options }) => ({ data: { user: { id: 'new', user_metadata: options.data } } }),
  } };
  assert.equal(displayName(await createGuestService(client).save('Alex')), 'Alex');
});

test('network failures never discard an existing session or create another guest', async () => {
  const client = { auth: {
    getSession: async () => ({ data: { session: {} } }),
    getUser: async () => ({ error: { status: 0, message: 'Network failed' } }),
    signOut: async () => assert.fail('must retain saved session'),
    signInAnonymously: async () => assert.fail('must not create another guest'),
  } };
  await assert.rejects(createGuestService(client).save('Alex'));
});

test('an invalid saved identity returns to guest entry', async () => {
  let signedOut = false;
  const client = { auth: {
    getSession: async () => ({ data: { session: {} } }),
    getUser: async () => ({ error: { status: 401 } }),
    signOut: async ({ scope }) => { assert.equal(scope, 'local'); signedOut = true; return {}; },
  } };
  assert.equal(await createGuestService(client).restore(), null);
  assert.ok(signedOut);
});
