import { SceneAudio } from './audio.js';
import { GIFTS, configuredGift } from './gift-catalog.js';
import { giftIcon } from './info-panel.js';
const $ = id => document.getElementById(id);
// A deliberate click tests this tab's output, even when no broadcast window is open.
let musicPreviewing = false;
const soundCheck = new SceneAudio({ onMusicStatus: status => {
  if (!musicPreviewing) return;
  $('musicPreviewStatus').textContent = ({ loading: 'Đang tải bản nhạc…', playing: 'Đang nghe thử tại bảng điều khiển.', ended: 'Đã phát hết bản nhạc. Bật lặp hoặc bấm nghe thử lại.', error: 'Không tải được nhạc. Tải lại trang hoặc kiểm tra gói cài đặt.' })[status.state] || '';
  if (['ended', 'error'].includes(status.state)) stopMusicPreview();
} });
const SETTINGS = ['title', 'subtitle', 'goal', 'joinOnEnter', 'joinOnChat', 'statueMotion', 'statueMotionLevel', 'music', 'volume', 'voiceEnabled', 'voice', 'rate', 'pitch', 'giftMap', 'characterMode', 'idlePrompts', 'idleEverySec', 'ambientCrowd', 'musicVolume', 'musicLoop', 'cinematicZoom', 'petalMode', 'effectsEnabled', 'effectsVolume', 'voiceVolume', 'mushikaGiftId', 'mushikaGiftName', 'mushikaGiftIcon', 'galaxyGiftId', 'galaxyGiftName', 'galaxyGiftIcon', 'infoPanelX', 'infoPanelY'];
SETTINGS.push('safeTop','safeBottom');
for(const g of GIFTS){
  const b=document.createElement('button');b.dataset.gift=g.kind;b.dataset.name=g.name;b.dataset.unit=g.coins;if(g.id)b.dataset.id=g.id;
  b.append(giftIcon(g));for(const [tag,text] of [['b',g.name],['small',`${g.coins} xu · ${g.id?'ID '+g.id:g.legacy?'mapping tên cũ':'DEMO · chờ ID'}`],['em',g.effect]]){const el=document.createElement(tag);el.textContent=text;b.append(el);}$('demoGifts').append(b);
}
let socket, mode = 'demo', bots = false, toastTimer;
const people = new Map(), numbers = new Intl.NumberFormat('en-US');
const obsURL = location.origin + '/live/overlay.html'; $('obsURL').textContent = obsURL;
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000); }
function send(cmd, extra = {}) {
  if (socket?.readyState !== WebSocket.OPEN) { toast('Chưa kết nối server. Giữ cửa sổ CHAY-LIVE đang mở.'); return; }
  socket.send(JSON.stringify({ t: 'ctl', cmd, ...extra }));
}
function logLine(line) { const el = $('log'); el.textContent = (el.textContent + line + '\n').split('\n').slice(-160).join('\n'); el.scrollTop = el.scrollHeight; }
function fillSettings(settings) { for (const k of SETTINGS) { if (settings[k] === undefined) continue; const el = $(k); if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k]; }
  if(settings.giftMap!==undefined)$('mappingStatus').textContent='Chưa sẵn sàng nhận quà thật: '+GIFTS.filter(g=>!configuredGift(g,settings).liveReady).map(g=>g.name+' '+g.coins+' xu').join(', ')+'. Icon chưa có sẽ để ô chữ; không thay bằng emoji. Rose/Perfume/Doughnut/Corgi/Galaxy đối chiếu catalog; cần xác nhận danh mục trên tài khoản Thái.';
}
function readSettings() { return Object.fromEntries(SETTINGS.map(k => { const el = $(k); return [k, el.type === 'checkbox' ? el.checked : ['number', 'range'].includes(el.type) ? Number(el.value) : el.value]; })); }
function stats(m) { if (!m.stats) return; $('coins').textContent = numbers.format(m.stats.coins); $('giftTotal').textContent = numbers.format(m.stats.gifts); $('likes').textContent = numbers.format(m.stats.likes); }
function seating(m) {
  $('count').textContent = m.seated;
  $('queueStatus').textContent = `${m.ambient} nhân vật nền · ${m.seated} người ở khu quỳ · ${m.waiting} người chờ ghế · ${m.departing} người đang rời chỗ · ${(m.standing || 0) + (m.entryWaiting || 0)} người chờ · vẽ tối đa ${m.standing || 0} đầu–vai · ${m.rituals || 0} lượt nghi thức đang chờ`;
}
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
      fillSettings(m.settings); sourceStatus(m.tiktok); stats(m); seating(m.seating);
    }
    if (m.t === 'stats') stats(m);
    if (m.t === 'gift-guide') fillSettings(m.settings);
    if (m.t === 'tiktok') sourceStatus(m);
    if (m.t === 'seating') seating(m);
    if (m.t === 'join' && !m.v.ambient) { people.set(m.v.id, m.v); $('count').textContent = people.size; }
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
$('enter').onclick = () => send('member', { name: $('simName').value, skin: $('simSkin').value });
for (const b of document.querySelectorAll('[data-entry-fill]')) b.onclick = () => send('entry-fill', { n: +b.dataset.entryFill });
$('simText').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('chat').click(); } };
for (const b of document.querySelectorAll('[data-gift]')) b.onclick = () => send('gift', { name: $('simName').value, gift: b.dataset.name, giftId: b.dataset.id, kind: b.dataset.gift, skin: $('simSkin').value, count: +$('repeat').value, diamonds: +b.dataset.unit });
for (const b of document.querySelectorAll('[data-fill]')) b.onclick = () => send('fill', { n: +b.dataset.fill });
$('giftBurst').onclick = () => send('burst', { name: $('simName').value, skin: $('simSkin').value });
$('resetDemo').onclick = () => send('demo-reset');
$('bots').onclick = () => send('bots', { on: !bots, pace: $('botPace').value });
$('settingsForm').onsubmit = e => { e.preventDefault(); send('settings', { settings: readSettings() }); };
$('say').onclick = () => { send('settings', { settings: readSettings() }); send('say', { text: $('sayText').value }); };
$('bell').onclick = async () => {
  stopMusicPreview();
  const volume = Number($('volume').value);
  if (volume <= 0) { toast('Âm lượng tổng đang bằng 0. Tăng âm lượng rồi thử lại.'); return; }
  soundCheck.configure({ music: false, voiceEnabled: false, volume });
  try {
    if (await soundCheck.start()) {
      soundCheck.bell('aarti');
      toast('Chuông thử phát ở bảng điều khiển này. Nếu vẫn im, kiểm tra tắt tiếng tab và Bộ trộn âm lượng Windows.');
    } else toast('Trình duyệt chưa mở âm thanh. Bấm Thử loa / chuông một lần nữa.');
  } catch { toast('Không mở được âm thanh trình duyệt. Tải lại trang rồi thử lại.'); }
};
$('clearScene').onclick = () => send('clear');
$('resetSession').onclick = () => { if (confirm(`Xóa điểm và bảng xếp hạng của phiên ${mode.toUpperCase()} hiện tại để bắt đầu phiên mới?`)) send('reset'); };
$('copyURL').onclick = async () => { try { await navigator.clipboard.writeText(obsURL); toast('Đã sao chép địa chỉ nguồn OBS.'); } catch { toast('Chọn và sao chép địa chỉ nguồn OBS bên trên.'); } };

function stopMusicPreview() {
  musicPreviewing = false; soundCheck.configure({ music: false });
  $('listenMusic').textContent = 'Nghe thử nhạc tại đây';
}
$('listenMusic').onclick = async () => {
  if (musicPreviewing) { stopMusicPreview(); $('musicPreviewStatus').textContent = 'Đã dừng nghe thử.'; return; }
  if (Number($('volume').value) <= 0 || Number($('musicVolume').value) <= 0) { toast('Tăng âm lượng tổng và âm lượng nhạc trước khi nghe thử.'); return; }
  musicPreviewing = true; $('listenMusic').textContent = 'Dừng nghe thử';
  soundCheck.configure({ music: true, musicLoop: $('musicLoop').checked, musicVolume: Number($('musicVolume').value), volume: Number($('volume').value), voiceEnabled: false });
  try { if (await soundCheck.start()) soundCheck.replayMusic(); }
  catch { stopMusicPreview(); toast('Chưa mở được tiếng. Thử loa / chuông trước rồi nghe nhạc lại.'); }
};
for (const id of ['musicVolume', 'musicLoop', 'volume']) $(id).addEventListener('input', () => {
  if (musicPreviewing) soundCheck.configure({ musicVolume: Number($('musicVolume').value), musicLoop: $('musicLoop').checked, volume: Number($('volume').value) });
});
$('replayMusic').onclick = () => { stopMusicPreview(); send('music-replay'); toast('Đã yêu cầu phát lại nhạc ở cửa sổ LIVE đã mở tiếng.'); };

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const showMotionHint = () => { $('reducedMotionHint').hidden = !motionPreference.matches; };
motionPreference.addEventListener('change', showMotionHint); showMotionHint();
