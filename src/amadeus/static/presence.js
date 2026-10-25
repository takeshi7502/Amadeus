'use strict';

(() => {
  const ui = window.AmadeusI18n;
  const stage = document.getElementById('avatar-container');
  const caption = document.getElementById('presence-caption');
  const labels = {neutral: 'Đang lắng nghe', thinking: 'Đang suy nghĩ…', curious: 'Tò mò', gentle: 'Dịu dàng', shy: 'Hơi ngượng', annoyed: 'Hờn nhẹ', happy: 'Vui vẻ'};
  let timer, captionTimer, busy = false, replyMood = 'neutral', taps = [], lastTap = 0;
  function classify(text) {
    const value = String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    if (/christina|kurisutina|tsundere|tro ly|assistant/.test(value)) return 'annoyed';
    if (/de thuong|dang yeu|kawaii|cute|love you|yeu cau|yeu ban|xinh/.test(value)) return 'shy';
    if (/\b(met|buon|co don|stress|nan|tired|sad|lonely|exhausted)\b/.test(value)) return 'gentle';
    if (/cam on|arigato|thank/.test(value)) return 'happy';
    if (/d-?mail|time.?leap|world.?line|ky uc|khoa hoc|gia thuyet|science|memor(y|ies)|physics|hypothesis/.test(value)) return 'curious';
    return 'neutral';
  }
  function express(mood, duration = 12000) {
    if (!Object.hasOwn(labels, mood)) return;
    clearTimeout(timer);
    stage.dataset.mood = mood;
    ui.bind(document.getElementById('presence-mood'), labels[mood]);
    document.dispatchEvent(new CustomEvent('amadeus:expression', {detail: {mood}}));
    if (mood !== 'neutral' && !busy) timer = setTimeout(() => express('neutral'), duration);
  }
  function react(mood, group, text, lineId) {
    if (busy || document.hidden || document.getElementById('character-panel').inert || document.querySelector('dialog[open]')) return;
    express(mood);
    clearTimeout(captionTimer);
    if (text && document.getElementById('voice-bubble').dataset.speaking !== 'true') {
      ui.bind(caption, text); caption.hidden = false; captionTimer = setTimeout(() => { caption.hidden = true; }, 6000);
    }
    document.dispatchEvent(new CustomEvent('amadeus:reaction', {detail: {group, lineId}}));
  }
  document.addEventListener('amadeus:state', event => {
    busy = event.detail !== 'idle';
    if (busy) { clearTimeout(captionTimer); caption.hidden = true; express(event.detail === 'thinking' ? 'thinking' : replyMood); }
    else express('neutral');
  });
  document.addEventListener('amadeus:turn', event => { replyMood = classify(event.detail.userText); });
  document.addEventListener('amadeus:reply', event => express(classify(event.detail.userText)));
  document.addEventListener('amadeus:voice', event => { if (event.detail.speaking) caption.hidden = true; });
  document.addEventListener('amadeus:navigate', () => { caption.hidden = true; taps = []; express('neutral'); });
  document.getElementById('kurisu-canvas').addEventListener('click', () => {
    if (busy || document.hidden || document.getElementById('character-panel').inert || document.querySelector('dialog[open]')) return;
    const now = Date.now();
    taps = taps.filter(time => now - time < 7000); taps.push(now);
    const repeated = taps.length >= 3;
    if (now - lastTap < 900 && taps.length !== 3) return;
    lastTap = now;
    react(repeated ? 'annoyed' : 'shy', 'touch', repeated ? 'Tôi nghe mà. Cậu không cần gọi đi gọi lại đâu.' : 'G-gì vậy? Đừng đột nhiên nhìn tôi như thế chứ.', repeated ? 'touch-two' : 'touch-one');
  });
  document.getElementById('call-kurisu').addEventListener('click', () => react('happy', 'greeting', 'Chào cậu. Tôi vẫn đang nghe rõ đây.', 'hello'));
  document.getElementById('kurisu-canvas').addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || event.repeat) return;
    event.preventDefault(); event.currentTarget.click();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { caption.hidden = true; clearTimeout(timer); } else if (!busy) express('neutral'); });
  window.AmadeusPresence = Object.freeze({classify, express});
  express('neutral');
})();
