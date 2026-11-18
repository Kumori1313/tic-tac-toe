import { mountBoard } from './board.js';

export function mountLobbies(client) {
  const region = document.querySelector('#lobby-app');
  const status = document.querySelector('#lobby-status');
  const error = document.querySelector('#lobby-error');
  const list = document.querySelector('#lobby-list');
  const discovery = document.querySelector('#lobby-discovery');
  const roomView = document.querySelector('#lobby-room');
  const create = document.querySelector('#create-lobby');
  const refresh = document.querySelector('#refresh-lobbies');
  const start = document.querySelector('#start-game');
  const leave = document.querySelector('#leave-lobby');
  const back = document.querySelector('#back-lobbies');
  const members = document.querySelector('#room-members');
  const renderBoard = mountBoard(document.querySelector('#match-board'), submitMove);
  const connectionId = crypto.randomUUID();
  let userId = null;
  let roomId = null;
  let room = null;
  let busy = false;
  let refreshing = false;
  let roomChannel = null;
  let discoveryChannel = null;
  let presenceReady = false;
  let present = new Set();
  let listTimer;
  let roomTimer;
  let heartbeatTimer;
  let generation = 0;
  let roomOnline = navigator.onLine;
  let lastView = '';
  let requestSequence = 0;
  let appliedSequence = 0;
  let snapshotPending = false;
  let nextSnapshotAt = 0;
  let movePending = false;
  let uncertainMove = false;

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function message(text) { error.textContent = text; }
  function setBusy(value) {
    busy = value;
    create.disabled = value || !navigator.onLine;
    refresh.disabled = value || !navigator.onLine;
    leave.disabled = value || !navigator.onLine;
    start.disabled = value || !navigator.onLine || !roomOnline || room?.members.length !== 2 || room?.members.some(m => !m.connected || (presenceReady && !present.has(m.user_id)));
    list.querySelectorAll('button').forEach(button => { button.disabled = value || !navigator.onLine || button.dataset.available !== 'true'; });
    region.setAttribute('aria-busy', String(value));
    renderBoard({ room, userId, busy, online: navigator.onLine && roomOnline });
  }
  async function action(kind, id = roomId) {
    const { data, error } = await client.rpc('lobby_action', { p_action: kind, p_lobby: id, p_connection: connectionId }).abortSignal(AbortSignal.timeout(12000));
    if (error) throw error;
    return data;
  }
  function editUrl(id, match = false) {
    const next = new URL(location.href);
    next.searchParams.delete('room'); next.searchParams.delete('lobby');
    if (id) next.searchParams.set(match ? 'lobby' : 'room', id);
    history.replaceState(null, '', next);
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  async function refreshList() {
    if (!userId || roomId || refreshing || !navigator.onLine) return;
    refreshing = true;
    try {
      const { data, error: failure } = await client.from('lobby_summaries').select('id,title,player_count,capacity,status,game_id')
        .eq('game_id', 'tic-tac-toe').in('status', ['waiting', 'playing']).order('created_at', { ascending: false }).limit(50);
      if (failure) throw failure;
      list.replaceChildren();
      for (const lobby of data) {
        const row = element('li', '', 'lobby-row');
        const description = element('div', '', 'lobby-description');
        description.append(element('strong', lobby.title), element('span', `${lobby.player_count}/${lobby.capacity} · ${lobby.status === 'playing' ? 'In progress' : 'Waiting'}`, 'hint'));
        const button = element('button', lobby.status === 'playing' ? 'In progress' : lobby.player_count >= 2 ? 'Full' : 'Join', 'secondary');
        button.type = 'button';
        button.dataset.available = String(lobby.status === 'waiting' && lobby.player_count < 2);
        button.disabled = busy || button.dataset.available !== 'true';
        button.addEventListener('click', () => perform(async () => {
          const joined = await action('join', lobby.id);
          await enterRoom(joined.id);
        }));
        row.dataset.lobbyId = lobby.id;
        row.append(description, button); list.append(row);
      }
      status.textContent = data.length ? '' : 'No public lobbies. Create one to host.';
    } catch { message('Couldn’t load lobbies. Try Refresh.'); }
    finally { refreshing = false; }
  }
  function text(selector, value) {
    const node = document.querySelector(selector);
    if (node.textContent !== value) node.textContent = value;
  }
  function acceptSnapshot(snapshot) {
    const rank = { waiting: 0, playing: 1, closed: 2, finished: 2 };
    if (room && (rank[snapshot?.status] < rank[room.status]
      || (room.match && snapshot?.match && snapshot.match.revision < room.match.revision))) return false;
    room = snapshot;
    return true;
  }
  function renderRoom() {
    if (!room) return;
    const finished = room.status === 'finished';
    const terminal = room.status === 'closed' || finished;
    const playing = room.status === 'playing';
    discovery.hidden = true;
    roomView.hidden = false;
    const mark = room.members.find(member => member.user_id === userId)?.mark;
    text('#room-title', finished ? 'Match finished' : playing ? 'Tic-Tac-Toe' : terminal ? (room.match ? 'Match interrupted' : 'Lobby closed') : room.title);
    text('#selection-title', playing || terminal ? 'Match' : 'Lobbies');
    document.body.classList.toggle('match-active', Boolean(room.match));
    document.body.classList.toggle('match-playing', playing);
    document.querySelector('#selection-title').hidden = true;
    text('#room-message', finished ? (room.match?.winner ? (room.match.winner === mark ? `You won (${mark}).` : `${room.match.winner} won.`) : 'Draw.') : terminal ? room.reason : playing ? (movePending ? 'Submitting move…' : room.match.current_turn === mark ? `Your turn (${mark}).` : `Waiting for ${room.match.current_turn}.`) : room.members.length < 2 ? 'Waiting for another player.' : '');
    text('#room-connection', terminal ? '' : !navigator.onLine ? 'Offline. Reconnect to keep your seat.' : !roomOnline ? 'Reconnecting…' : '');
    members.replaceChildren();
    for (const member of [...room.members].sort((a, b) => a.mark === b.mark ? 0 : a.mark === 'X' ? -1 : 1)) {
      const item = element('li', '', 'member-row');
      const label = `${member.display_name}${member.user_id === userId ? ' (you)' : ''}`;
      const name = element('strong', label);
      const details = element('span', `${member.mark}${member.user_id === room.host_id ? ' · Host' : ''}${terminal ? '' : ` · ${member.connected && (!presenceReady || present.has(member.user_id)) ? 'Connected' : 'Reconnecting'}`}`, 'hint');
      item.append(name, details); members.append(item);
    }
    start.hidden = terminal || playing || room.host_id !== userId;
    leave.hidden = terminal;
    back.hidden = !terminal;
    leave.textContent = playing ? 'Leave match' : 'Leave lobby';
    setBusy(busy);
    const mode = finished ? 'finished' : terminal ? 'closed' : playing ? 'playing' : 'waiting';
    if (mode !== lastView) {
      lastView = mode;
      if (playing || finished) editUrl(roomId, true);
      if (terminal) { clearInterval(heartbeatTimer); if (roomChannel) { const channel = roomChannel; roomChannel = null; client.removeChannel(channel); } }
      // Focus only on a screen transition; polling must not steal keyboard focus.
      document.querySelector('#room-title').focus({ preventScroll: true });
    }
  }
  async function refreshRoom(heartbeat = false) {
    if (!roomId || !userId || !navigator.onLine) return;
    if (!heartbeat && snapshotPending) return;
    if (!heartbeat) snapshotPending = true;
    const ticket = generation;
    const request = ++requestSequence;
    try {
      const snapshot = await action(heartbeat ? 'heartbeat' : 'snapshot');
      if (ticket !== generation || !roomId || request < appliedSequence) return;
      appliedSequence = request;
      if (!snapshot || !snapshot.members?.some(m => m.user_id === userId)) throw new Error('Your seat is no longer available.');
      acceptSnapshot(snapshot);
      roomOnline = true;
      if (uncertainMove) { uncertainMove = false; message(''); }
      renderRoom();
    } catch (failure) {
      if (ticket !== generation || request < appliedSequence) return;
      roomOnline = false;
      if (failure.code === 'PT401') { document.dispatchEvent(new Event('guest-session-ended')); return; }
      if (failure.code === 'PT429') { message(failure.message); renderRoom(); return; }
      if (failure.code === '42501' || failure.code === 'P0002' || failure.message === 'Your seat is no longer available.') {
        message('Your lobby is no longer available. Choose another lobby.');
        await resetRoom();
      } else { renderRoom(); }
    } finally { if (!heartbeat && ticket === generation) snapshotPending = false; }
  }
  async function resetRoom() {
    ++generation;
    clearInterval(roomTimer); clearInterval(heartbeatTimer);
    if (roomChannel) { await client.removeChannel(roomChannel); roomChannel = null; }
    delete region.dataset.presence;
    roomId = null; room = null; lastView = ''; presenceReady = false; present = new Set();
    snapshotPending = false; nextSnapshotAt = 0;
    renderBoard({ room, userId, busy, online: false });
    text('#selection-title', 'Lobbies');
    document.querySelector('#selection-title').hidden = false;
    document.body.classList.remove('match-active', 'match-playing');
    movePending = false; uncertainMove = false;
    editUrl(null);
    roomView.hidden = true; discovery.hidden = false;
    await refreshList();
  }
  async function enterRoom(id) {
    if (!uuid.test(id)) throw new Error('Invalid lobby link.');
    if (roomChannel) await client.removeChannel(roomChannel);
    clearInterval(roomTimer); clearInterval(heartbeatTimer);
    ++generation;
    roomId = id; room = null; lastView = ''; presenceReady = false; present = new Set();
    snapshotPending = false; nextSnapshotAt = 0;
    room = await action('heartbeat');
    if (!room?.members?.some(m => m.user_id === userId)) throw new Error('You are not a member of this lobby.');
    editUrl(id, ['playing','finished'].includes(room.status));
    status.textContent = '';
    roomOnline = true;
    renderRoom();
    if (['closed','finished'].includes(room.status)) return;
    roomChannel = client.channel(`lobby:${id}`, { config: { private: true, presence: { key: connectionId, enabled: true } } });
    const channel = roomChannel;
    channel.on('presence', { event: 'sync' }, () => {
      if (roomChannel !== channel) return;
      present = new Set(Object.values(channel.presenceState()).flat().map(entry => entry.user_id));
      presenceReady = present.has(userId);
      renderRoom();
      refreshRoom();
    }).subscribe(async state => {
      if (roomChannel !== channel) return;
      region.dataset.presence = state === 'SUBSCRIBED' ? 'connected' : 'reconnecting';
      if (state === 'SUBSCRIBED') {
        await channel.track({ user_id: userId });
        refreshRoom(true);
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(state)) {
        presenceReady = false;
        // Polling and heartbeats continue even when realtime is unavailable.
      }
    });
    roomTimer = setInterval(() => {
      if (['closed','finished'].includes(room?.status) || Date.now() < nextSnapshotAt) return;
      nextSnapshotAt = Date.now() + (room?.status === 'playing' && !document.hidden ? 1000 : 4000);
      refreshRoom();
    }, 1000);
    heartbeatTimer = setInterval(() => refreshRoom(true), 15000);
  }
  async function submitMove(cell) {
    const mark = room?.members.find(member => member.user_id === userId)?.mark;
    if (busy || !roomOnline || !navigator.onLine || room?.status !== 'playing'
      || room.match.current_turn !== mark || room.match.board[cell] !== null) return;
    const id = roomId, ticket = generation, revision = room.match.revision;
    movePending = true;
    setBusy(true); message(''); renderRoom();
    try {
      const { data, error: failure } = await client.rpc('play_move', { p_lobby: id, p_cell: cell, p_revision: revision }).abortSignal(AbortSignal.timeout(12000));
      if (failure) throw failure;
      if (ticket !== generation) return;
      acceptSnapshot(data); roomOnline = true;
    } catch (failure) {
      if (ticket !== generation) return;
      if (failure.code === 'PT401') { document.dispatchEvent(new Event('guest-session-ended')); return; }
      // A lost reply may follow a committed move. Re-read; never replay the click automatically.
      roomOnline = false;
      uncertainMove = !['40001', '42501', 'P0001', 'PT429'].includes(failure.code);
      message(failure.code === '40001' ? 'The board changed. Choose your move again.'
        : ['42501', 'P0001', 'PT429'].includes(failure.code) ? failure.message
        : 'Move not confirmed. Checking the board…');
      await refreshRoom();
    } finally {
      if (ticket === generation) { movePending = false; setBusy(false); renderRoom(); }
    }
  }
  async function perform(task) {
    if (busy || !navigator.onLine) return;
    setBusy(true); message('');
    try { await task(); }
    catch (failure) {
      if (failure.code === 'PT401') { document.dispatchEvent(new Event('guest-session-ended')); return; }
      message(['P0001', 'P0002', '42501', 'PT429'].includes(failure.code) ? failure.message : 'Couldn’t update the lobby. Check your connection and try again.');
      if (roomId && !room) await resetRoom();
      else if (!roomId) refreshList();
    } finally { setBusy(false); }
  }
  async function initialize(id) {
    if (userId === id) { if(roomId) refreshRoom(true); return; }
    userId = id;
    clearInterval(listTimer);
    if (discoveryChannel) await client.removeChannel(discoveryChannel);
    discoveryChannel = client.channel(`discovery:${connectionId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_summaries' }, () => { if (roomId) refreshRoom(); else refreshList(); }).subscribe();
    listTimer = setInterval(refreshList, 10000);
    const requested = new URL(location.href).searchParams.get('lobby') ?? new URL(location.href).searchParams.get('room');
    await perform(async () => {
      if (requested) {
        try { await enterRoom(requested); }
        catch {
          await resetRoom();
          const current = await action('current', null);
          if (current) await enterRoom(current);
          message(current ? 'You can’t enter that lobby. Your current lobby has been restored.' : 'You can’t enter that lobby. Join one from the list.');
        }
      } else {
        const current = await action('current', null);
        if (current) await enterRoom(current);
        else await refreshList();
      }
    });
  }
  document.addEventListener('guest-state', event => {
    if (event.detail.ready && event.detail.userId) initialize(event.detail.userId);
    else if (!event.detail.userId && userId) {
      userId = null; clearInterval(listTimer); resetRoom();
      if (discoveryChannel) { client.removeChannel(discoveryChannel); discoveryChannel = null; }
    }
  });
  create.addEventListener('click', () => perform(async () => { const id = await action('create', null); await enterRoom(id); }));
  refresh.addEventListener('click', () => perform(refreshList));
  start.addEventListener('click', () => perform(async () => { await action('start'); await refreshRoom(); }));
  leave.addEventListener('click', () => perform(async () => {
    if (room?.status === 'playing' && !confirm('Leave this match? It will end for both players.')) return;
    await action('leave'); await resetRoom();
    create.focus();
  }));
  back.addEventListener('click', () => perform(async () => { await action('leave'); await resetRoom(); create.focus(); }));
  document.querySelectorAll('a').forEach(link => {
    if (new URL(link.href).pathname !== '/game-hub/') return;
    link.addEventListener('click', event => {
      if (!roomId || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      perform(async () => {
        if (room?.status === 'playing' && !confirm('Leave this match? It will end for both players.')) return;
        await action('leave');
        location.assign(link.href);
      });
    });
  });
  addEventListener('offline', () => { roomOnline = false; setBusy(busy); renderRoom(); });
  addEventListener('online', () => { if (roomId) refreshRoom(true); else refreshList(); setBusy(busy); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (roomId) refreshRoom(true); else refreshList(); } });
  addEventListener('pageshow', event => { if (event.persisted && roomId) refreshRoom(true); });
}
