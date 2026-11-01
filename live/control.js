const $ = id => document.getElementById(id);
const SETTINGS = ['title', 'subtitle', 'goal', 'seatMode', 'joinOnEnter', 'music', 'volume', 'voiceEnabled', 'voice', 'rate', 'pitch', 'giftMap', 'characterMode', 'idlePrompts', 'idleEverySec', 'ambientCrowd', 'ambientAfterSec', 'ambientTarget'];
let socket, mode = 'demo', bots = false, toastTimer;
const people = new Map(), numbers = new Intl.NumberFormat('en-US');
const obsURL = location.origin + '/live/overlay.html'; $('obsURL').textContent = obsURL;
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000); }
function send(cmd, extra = {}) {
  if (socket?.readyState !== WebSocket.OPEN) { toast('Chưa kết nối server. Giữ cửa sổ CHAY-LIVE đang mở.'); return; }
  socket.send(JSON.stringify({ t: 'ctl', cmd, ...extra }));
}
function logLine(line) { const el = $('log'); el.textContent = (el.textContent + line + '\n').split('\n').slice(-160).join('\n'); el.scrollTop = el.scrollHeight; }
function fillSettings(settings) { for (const k of SETTINGS) { if (settings[k] === undefined) continue; const el = $(k); if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k]; } }
function readSettings() { return Object.fromEntries(SETTINGS.map(k => { const el = $(k); return [k, el.type === 'checkbox' ? el.checked : ['number', 'range'].includes(el.type) ? Number(el.value) : el.value]; })); }
function stats(m) { if (!m.stats) return; $('coins').textContent = numbers.format(m.stats.coins); $('giftTotal').textContent = numbers.format(m.stats.gifts); $('likes').textContent = numbers.format(m.stats.likes); }
function sourceStatus(m) {
  const label = { idle: 'Chưa kết nối', connecting: 'Đang kết nối…', connected: 'Đã kết nối nguồn', reconnecting: 'Đang kết nối lại…', disconnected: 'Đã mất kết nối', error: 'Lỗi kết nối' }[m.status] || m.status;
  $('sourceStatus').textContent = label; $('sourceStatus').className = 'status-pill ' + (m.status === 'connected' ? 'ok' : ['error', 'disconnected'].includes(m.status) ? 'bad' : ''); $('sourceStatus').title = m.error || '';
  $('connect').disabled = ['connected', 'connecting', 'reconnecting'].includes(m.status);
  if (m.error) toast(m.error);
}
function connect() {
  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?role=control`);
  socket.onopen = () => { $('srv').textContent = 'Máy chủ đang chạy'; $('srv').className = 'status-pill ok'; };
  socket.onclose = () => { $('srv').textContent = 'Mất kết nối máy chủ'; $('srv').className = 'status-pill bad'; setTimeout(connect, 2000); };
  socket.onmessage = e => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'state' || m.t === 'settings') {
      mode = m.mode; $('mode').textContent = mode === 'demo' ? 'DEMO' : 'LIVE'; $('mode').className = 'mode ' + (mode === 'live' ? 'real' : '');
      $('simulation').disabled = mode !== 'demo'; $('demoHint').textContent = mode === 'demo' ? 'Quà thử và người mẫu được tách khỏi số liệu LIVE thật.' : 'Đang dùng dữ liệu LIVE. Bấm “Mở cảnh demo” để thử tương tác riêng.';
      people.clear(); for (const p of m.viewers) people.set(p.id, p); $('count').textContent = people.size;
      fillSettings(m.settings); sourceStatus(m.tiktok); stats(m);
    }
    if (m.t === 'stats') stats(m);
    if (m.t === 'tiktok') sourceStatus(m);
    if (m.t === 'join') { people.set(m.v.id, m.v); $('count').textContent = people.size; }
    if (m.t === 'leave') { people.delete(m.id); $('count').textContent = people.size; }
    if (m.t === 'bots') { bots = m.on; $('bots').textContent = bots ? 'Dừng mô phỏng' : 'Chạy mô phỏng'; }
    if (m.t === 'logs') { $('log').textContent = ''; m.lines.forEach(logLine); }
    if (m.t === 'log') logLine(m.line);
    if (m.t === 'error') toast(m.message);
    if (m.t === 'saved') toast('Đã lưu cấu hình Ganesha LIVE.');
  };
}
connect();
$('source').onchange = () => { const direct = $('source').value === 'direct'; $('urlLabel').hidden = direct; $('userLabel').hidden = !direct; };
$('connect').onclick = () => send('connect', { source: $('source').value, url: $('tikfinityURL').value, uniqueId: $('username').value });
$('disconnect').onclick = () => send('disconnect');
$('demo').onclick = () => send('demo'); $('showLive').onclick = () => send('live');
$('chat').onclick = () => send('chat', { name: $('simName').value, text: $('simText').value, skin: $('simSkin').value });
$('simText').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('chat').click(); } };
for (const b of document.querySelectorAll('[data-gift]')) b.onclick = () => send('gift', { name: $('simName').value, gift: b.dataset.name, kind: b.dataset.gift, skin: $('simSkin').value, count: +$('repeat').value, diamonds: +b.dataset.unit });
for (const b of document.querySelectorAll('[data-fill]')) b.onclick = () => send('fill', { n: +b.dataset.fill });
$('bots').onclick = () => send('bots', { on: !bots, pace: $('botPace').value });
$('settingsForm').onsubmit = e => { e.preventDefault(); send('settings', { settings: readSettings() }); };
$('say').onclick = () => { send('settings', { settings: readSettings() }); send('say', { text: $('sayText').value }); };
$('bell').onclick = () => send('bell');
$('clearScene').onclick = () => send('clear');
$('resetSession').onclick = () => { if (confirm(`Xóa điểm và bảng xếp hạng của phiên ${mode.toUpperCase()} hiện tại để bắt đầu phiên mới?`)) send('reset'); };
$('copyURL').onclick = async () => { try { await navigator.clipboard.writeText(obsURL); toast('Đã sao chép địa chỉ nguồn OBS.'); } catch { toast('Chọn và sao chép địa chỉ nguồn OBS bên trên.'); } };
