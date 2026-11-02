import WebSocket from 'ws';

// TikFinity Desktop WebSocket API: { event, data }.
export function createEventHandler({ chat, gift, member, like, follow }) {
  const seen = new Map();
  return raw => {
    let message;
    try { message = JSON.parse(String(raw)); } catch { return; }
    if (!message || typeof message !== 'object') return;
    const { event, data: d } = message;
    if (!d || typeof d !== 'object') return;
    const id = d.uniqueId || d.userId || d.user?.uniqueId || d.user?.userId;
    if (!id || !['chat', 'gift', 'member', 'like', 'follow'].includes(event)) return;
    const name = String(d.nickname || d.user?.nickname || id);
    const picture = d.profilePictureUrl || d.user?.profilePictureUrl || d.user?.profilePicture?.url?.[0] || d.user?.avatarThumb?.urlList?.[0] || d.profilePicture?.urls?.[0];
    const avatar = typeof picture === 'string' && picture.length < 2048 ? picture : '';
    // Streak updates are cumulative; apply only the final count.
    if (event === 'gift' && Number(d.giftType) === 1 && ![true, 1, '1', 'true'].includes(d.repeatEnd)) return;
    const now = Date.now();
    for (const [key, time] of seen) if (now - time > 300000) seen.delete(key);
    const key = d.msgId ? `${event}:${id}:${d.msgId}` : null;
    if (key && seen.has(key)) return;
    if (key) { seen.set(key, now); if (seen.size > 10000) seen.delete(seen.keys().next().value); }
    const positive = (v, max) => Number.isFinite(Number(v)) ? Math.max(1, Math.min(max, Math.floor(Number(v)))) : 1;
    if (event === 'chat') chat?.(String(id), name, String(d.comment || ''), avatar);
    if (event === 'gift') {
      const args = [String(id), name, String(d.giftName || 'ของขวัญ'), positive(d.repeatCount, 9999), positive(d.diamondCount, 50000), avatar, String(d.giftId ?? d.gift?.id ?? '')];
      const icon = d.giftPictureUrl || d.gift?.image?.url_list?.[0] || d.extendedGiftInfo?.image?.url_list?.[0];
      if (icon) args.push(undefined, undefined, icon);
      gift?.(...args);
    }
    if (event === 'member') member?.(String(id), name, avatar);
    if (event === 'like') like?.(String(id), positive(d.likeCount, 100000));
    if (event === 'follow') follow?.(String(id), name);
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
