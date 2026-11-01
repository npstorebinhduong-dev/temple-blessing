import WebSocket from 'ws';

// TikFinity Desktop WebSocket API: { event, data }.
export function createEventHandler({ chat, gift, member, like }) {
  const seen = new Map();
  return raw => {
    let message;
    try { message = JSON.parse(String(raw)); } catch { return; }
    if (!message || typeof message !== 'object') return;
    const { event, data: d } = message;
    if (!d || typeof d !== 'object') return;
    const id = d.uniqueId || d.userId || d.user?.uniqueId || d.user?.userId;
    if (!id || !['chat', 'gift', 'member', 'like'].includes(event)) return;
    const name = String(d.nickname || d.user?.nickname || id);
    const avatar = typeof d.profilePictureUrl === 'string' ? d.profilePictureUrl : '';
    // Streak updates are cumulative; apply only the final count.
    if (event === 'gift' && Number(d.giftType) === 1 && ![true, 1].includes(d.repeatEnd)) return;
    const now = Date.now();
    for (const [key, time] of seen) if (now - time > 300000) seen.delete(key);
    const key = d.msgId ? `${event}:${id}:${d.msgId}` : null;
    if (key && seen.has(key)) return;
    if (key) { seen.set(key, now); if (seen.size > 10000) seen.delete(seen.keys().next().value); }
    const positive = (v, max) => Number.isFinite(Number(v)) ? Math.max(1, Math.min(max, Math.floor(Number(v)))) : 1;
    if (event === 'chat') chat(String(id), name, String(d.comment || ''), avatar);
    if (event === 'gift') gift(String(id), name, String(d.giftName || 'quà'), positive(d.repeatCount, 9999), positive(d.diamondCount, 50000), avatar);
    if (event === 'member') member(String(id), name, avatar);
    if (event === 'like') like(String(id), positive(d.likeCount, 100000));
  };
}

export function connectTikFinity({ url = 'ws://127.0.0.1:21213/', onEvent, onState, retryMs = 2000 }) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'ws:' || !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password) {
    throw new Error('TikFinity phải chạy trên cùng máy: ws://127.0.0.1:21213/');
  }
  let stopped = false, socket, timer;
  function open() {
    onState('connecting', '');
    socket = new WebSocket(endpoint, { maxPayload: 1024 * 1024, handshakeTimeout: 5000 });
    socket.on('open', () => onState('connected', ''));
    socket.on('message', onEvent);
    socket.on('error', e => onState('error', e.message));
    socket.on('close', () => {
      if (stopped) return;
      onState('reconnecting', 'Đang chờ TikFinity Desktop');
      timer = setTimeout(open, retryMs);
    });
  }
  open();
  return { disconnect() { stopped = true; clearTimeout(timer); socket.removeAllListeners(); socket.on('error', () => {}); socket.terminate(); } };
}
