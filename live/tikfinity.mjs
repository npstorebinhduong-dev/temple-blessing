import WebSocket from 'ws';

// TikFinity Desktop WebSocket API: { event, data }.
export function createEventHandler({ chat, gift, member, like, follow, seen = new Map(), combos = new Map() }) {
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
    const msgId=d.msgId??d.messageId;
    const group=d.groupId??d.repeatId??d.giftComboId;
    // Some bridges retain the transport message ID while advancing a final
    // combo total. The group ledger below still counts only the new delta.
    const revision=event==='gift'&&Number(d.giftType)===1&&group?`:${d.repeatCount}`:'';
    const key = msgId ? `${event}:${id}:${msgId}${revision}` : null;
    if (key && seen.has(key)) return;
    if (key) { seen.set(key, now); if (seen.size > 10000) seen.delete(seen.keys().next().value); }
    const positive = (v, max) => Number.isFinite(Number(v)) ? Math.max(1, Math.min(max, Math.floor(Number(v)))) : 1;
    if (event === 'chat') {
      const stamp=Number(d.createTime??d.timestamp??d.common?.createTime);
      const sentAt=stamp>0?(stamp<1e12?stamp*1000:stamp):now;
      chat?.(String(id), name, String(d.comment || ''), avatar, undefined, {sentAt,now});
    }
    if (event === 'gift') {
      const giftId=String(d.giftId ?? d.gift?.id ?? '');
      let count=positive(d.repeatCount,9999);
      if(Number(d.giftType)===1&&group) {
        for(const [k,v] of combos)if(now-v.at>600000)combos.delete(k);
        const k=`${id}:${giftId}:${group}`,old=combos.get(k)?.count||0,final=count;
        count=Math.max(0,final-old);if(!count)return;
        combos.set(k,{count:final,at:now});if(combos.size>10000)combos.delete(combos.keys().next().value);
      }
      const args = [String(id), name, String(d.giftName || 'ของขวัญ'), count, positive(d.diamondCount, 50000), avatar, giftId];
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
