'use strict';

// A small authored phrase bank: no chat text is sent to a speech service.
(() => {
  const $ = (id) => document.getElementById(id);
  const ui = window.AmadeusI18n;
  const toggle = $('voice-toggle');
  const preview = $('voice-preview');
  const bubble = $('voice-bubble');
  const status = $('voice-status');
  const volume = $('voice-volume');
  const ambient = $('voice-ambient');
  const selector = $('voice-profile');
  const audio = $('kurisu-audio');
  let bank = [];
  let profiles = [];
  let enabled = false;
  let busy = false;
  let playing = false;
  let sequence = 0;
  let lastLine = '';
  let lastInteraction = Date.now();
  let idleTimer = 0;
  let bubbleTimer = 0;
  let frame = 0;
  let context, analyser, samples;

  function preference(name) {
    try { return localStorage.getItem('amadeus.voice.' + name); }
    catch { return null; }
  }
  function savePreference(name, value) {
    try { localStorage.setItem('amadeus.voice.' + name, value); }
    catch { /* Keep in-page controls usable when browser storage is unavailable. */ }
  }
  let arrivalPending = preference('enabled') !== 'off';
  let arrivalTried = false;

  // Preferences are local to this browser; an explicit mute also applies on arrival.
  const storedVolume = preference('volume');
  const savedVolume = storedVolume === null ? 65 : Number(storedVolume);
  volume.value = Number.isFinite(savedVolume) ? Math.max(0, Math.min(100, savedVolume)) : 65;
  audio.volume = Number(volume.value) / 100;
  ambient.checked = preference('ambient') !== 'off';

  function announce(speaking, level = 0) {
    document.dispatchEvent(new CustomEvent('amadeus:voice', {detail: {speaking, level}}));
  }
  function panelVisible() {
    return !$('character-panel').inert && !document.hidden;
  }
  function available() {
    return enabled && !busy && panelVisible() && !document.querySelector('dialog[open]');
  }
  function greetOnArrival(fromGesture = false) {
    if (!arrivalPending || (arrivalTried && !fromGesture) || playing || busy || !panelVisible()
      || document.querySelector('dialog[open]') || $('avatar-container').dataset.state !== 'ready'
      || audio.volume <= 0 || !bank.some((line) => line.group === 'welcome')) return;
    arrivalPending = false;
    arrivalTried = true;
    enabled = true;
    controls();
    playGroup('welcome', {arrival: true});
  }
  function controls() {
    toggle.setAttribute('aria-pressed', String(enabled));
    ui.attr(toggle, 'aria-label', enabled ? 'Tắt giọng Kurisu' : 'Bật giọng Kurisu');
    ui.bind($('voice-toggle-label'), enabled ? 'Giọng Nhật · bật' : 'Bật giọng Nhật');
    toggle.classList.toggle('active', enabled);
  }
  function selectProfile(profile) {
    stop();
    bank = profile.lines;
    lastLine = '';
    selector.value = profile.id;
    ui.attr(toggle, 'title', '{profile} · {description}', () => ({profile: ui.t(profile.label), description: ui.t('giọng nhân vật tổng hợp')}));
    $('voice-credit').textContent = profile.credit || '';
    $('voice-credit').hidden = !profile.credit;
    ui.bind(status, enabled ? 'Tiếng Nhật · phụ đề Việt' : 'Giọng anime · bấm để bật');
  }
  function stop(hide = true) {
    sequence++;
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    playing = false;
    bubble.dataset.speaking = 'false';
    cancelAnimationFrame(frame);
    clearTimeout(bubbleTimer);
    announce(false);
    if (hide) bubble.hidden = true;
  }
  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (!enabled || !ambient.checked) return;
    idleTimer = setTimeout(() => {
      const focused = document.activeElement;
      const composing = ['TEXTAREA', 'INPUT', 'SELECT'].includes(focused?.tagName)
        && (focused.value?.trim() || Date.now() - lastInteraction < 90000);
      if (available() && !playing && !composing && Date.now() - lastInteraction >= 90000) playGroup('idle');
      else scheduleIdle();
    }, 105000 + Math.random() * 75000);
  }
  function meter() {
    if (!playing) return;
    let level;
    if (analyser && context.state === 'running') {
      analyser.getByteTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
      level = Math.min(1, rms * 5);
    } else {
      // Timed fallback when Web Audio isn't available; never animates before play.
      level = audio.paused ? 0 : 0.15 + Math.abs(Math.sin(audio.currentTime * 12)) * 0.35;
    }
    announce(true, level);
    frame = requestAnimationFrame(meter);
  }
  function prepareMeter() {
    try {
      if (!context) {
        // A suspended audio graph can silence otherwise permitted HTML autoplay.
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        context = new AudioContext();
        const source = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        samples = new Uint8Array(analyser.fftSize);
        source.connect(analyser);
        analyser.connect(context.destination);
      }
      context.resume().catch(() => {});
    } catch { /* HTML audio still works without a meter. */ }
  }
  function playGroup(group, {arrival = false} = {}) {
    if (!available()) return;
    const options = bank.filter((line) => line.group === group);
    const fresh = options.filter((line) => line.id !== lastLine);
    const pool = fresh.length ? fresh : options;
    const line = pool[Math.floor(Math.random() * pool.length)];
    if (!line) return;
    stop();
    const token = sequence;
    lastLine = line.id;
    audio.src = line.src;
    prepareMeter();
    audio.onended = () => {
      if (token !== sequence) return;
      playing = false;
      bubble.dataset.speaking = 'false';
      cancelAnimationFrame(frame);
      announce(false);
      bubbleTimer = setTimeout(() => { bubble.hidden = true; }, 2400);
      scheduleIdle();
    };
    const failed = (error) => {
      if (token !== sequence) return;
      stop();
      enabled = false;
      controls();
      clearTimeout(idleTimer);
      if (arrival && error?.name === 'NotAllowedError') {
        arrivalPending = true;
        ui.bind(status, 'Chạm vào trang để nghe lời chào của Kurisu.');
      } else ui.bind(status, 'Chưa phát được âm thanh. Bấm bật giọng để thử lại.');
    };
    audio.onerror = failed;
    // Play immediately so a gesture retry retains the browser's user activation.
    audio.play().then(() => {
      if (token !== sequence) return;
      playing = true;
      bubble.dataset.speaking = 'true';
      ui.bind($('voice-subtitle'), line.vi);
      bubble.hidden = false;
      ui.bind(status, 'Tiếng Nhật · phụ đề Việt');
      meter();
    }).catch(failed);
    scheduleIdle();
  }
  function reaction(text) {
    const value = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    if (/christina|kurisutina|tro ly|assistant|tsundere/.test(value)) return 'tease';
    if (/ngu ngon|oyasumi|good\s*night/.test(value)) return 'night';
    if (/\b(met|buon|stress|nan|co don|kiet suc|tired|sad|lonely|exhausted|discouraged)\b/.test(value)) return 'comfort';
    if (/cam on|arigato|thank/.test(value)) return 'thanks';
    if (/de thuong|dang yeu|xinh|yeu cau|yeu ban|kawaii|cute/.test(value)) return 'praise';
    if (/okabe|hououin|kyouma/.test(value)) return 'okabe';
    if (/ban la ai|cau la ai|ai tao|amadeus la|who are you|who (made|created) you/.test(value)) return 'identity';
    if (/d-?mail|time.?leap|world.?line|ky uc|than kinh|vat ly|khoa hoc|gia thuyet|memor(y|ies)|neuro|physics|science|hypothesis/.test(value)) return 'science';
    if (/\b(hoc|code|python|lap trinh|bai tap|study|learning|homework|programming)\b/.test(value)) return 'study';
    if (/^(chao|hello|hi\b|xin chao|ohayo|konnichiwa)/.test(value)) return 'greeting';
    return 'reply';
  }
  toggle.addEventListener('click', () => {
    arrivalPending = false;
    enabled = !enabled;
    savePreference('enabled', enabled ? 'on' : 'off');
    controls();
    lastInteraction = Date.now();
    if (enabled) playGroup('welcome');
    else { stop(); clearTimeout(idleTimer); ui.bind(status, 'Âm thanh đang tắt'); }
  });
  preview.addEventListener('click', () => {
    arrivalPending = false;
    savePreference('enabled', 'on');
    enabled = true; controls(); lastInteraction = Date.now(); playGroup('idle');
  });
  $('voice-stop').addEventListener('click', () => { arrivalPending = false; stop(); scheduleIdle(); });
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    savePreference('volume', volume.value);
  });
  ambient.addEventListener('change', () => {
    savePreference('ambient', ambient.checked ? 'on' : 'off');
    scheduleIdle();
  });
  selector.addEventListener('change', () => {
    const profile = profiles.find((item) => item.id === selector.value);
    if (!profile) return;
    arrivalPending = false;
    savePreference('enabled', 'on');
    savePreference('profile', profile.id);
    selectProfile(profile);
    enabled = true;
    controls();
    lastInteraction = Date.now();
    playGroup('welcome');
  });
  document.addEventListener('amadeus:state', (event) => {
    busy = event.detail !== 'idle';
    if (busy) { arrivalPending = false; stop(); }
    preview.disabled = busy || !bank.length;
    selector.disabled = busy || !profiles.length;
    scheduleIdle();
  });
  document.addEventListener('amadeus:reply', (event) => {
    lastInteraction = Date.now();
    if (available()) playGroup(reaction(event.detail.userText));
  });
  document.addEventListener('amadeus:navigate', () => { arrivalPending = false; stop(); lastInteraction = Date.now(); scheduleIdle(); });
  document.addEventListener('visibilitychange', () => {
    stop(); clearTimeout(idleTimer);
    if (!document.hidden) { lastInteraction = Date.now(); greetOnArrival(); scheduleIdle(); }
  });
  for (const event of ['pointerdown', 'keydown', 'input']) {
    document.addEventListener(event, () => { lastInteraction = Date.now(); }, {passive: true});
  }
  for (const type of ['click', 'keydown']) {
    document.addEventListener(type, (event) => {
      if ((!event.isTrusted && !navigator.userActivation?.isActive) || event.repeat
        || event.ctrlKey || event.metaKey || event.altKey || event.key === 'Escape'
        || event.target.closest?.('#voice-toggle, #voice-preview, #voice-profile, #voice-stop')) return;
      greetOnArrival(true);
    });
  }
  const observer = new MutationObserver(() => {
    if (!panelVisible() || document.querySelector('dialog[open]')) stop();
    else greetOnArrival();
  });
  observer.observe($('character-panel'), {attributes: true, attributeFilter: ['inert', 'class']});
  observer.observe($('avatar-container'), {attributes: true, attributeFilter: ['data-state']});
  document.querySelectorAll('dialog').forEach((dialog) => observer.observe(dialog, {attributes: true, attributeFilter: ['open']}));
  $('kurisu-canvas').addEventListener('click', () => {
    if (enabled && !playing && Date.now() - lastInteraction < 1000) playGroup('touch');
  });
  window.addEventListener('pagehide', () => { arrivalPending = false; stop(); clearTimeout(idleTimer); });
  controls();
  fetch('/runtime/voice/bank.json').then((response) => {
    if (!response.ok) throw new Error('missing voice bank');
    return response.json();
  }).then((manifest) => {
    const validLines = (lines) => Array.isArray(lines) ? lines.filter((line) => /^[a-z0-9-]+$/.test(line.id) && typeof line.vi === 'string'
      && typeof line.src === 'string' && /^\/runtime\/voice\/[a-z0-9-]+\.mp3$/.test(line.src)) : [];
    profiles = (Array.isArray(manifest.profiles) ? manifest.profiles : [])
      .filter((profile) => /^[a-z0-9-]+$/.test(profile.id) && typeof profile.label === 'string')
      .map((profile) => ({...profile, lines: validLines(profile.lines)})).filter((profile) => profile.lines.length);
    if (profiles.length) {
      selector.replaceChildren();
      for (const profile of profiles) {
        const option = document.createElement('option');
        option.value = profile.id; ui.bind(option, profile.label); selector.append(option);
      }
      const remembered = preference('profile');
      const selected = profiles.find((profile) => profile.id === remembered)
        || profiles.find((profile) => profile.id === manifest.default_profile) || profiles[0];
      selectProfile(selected);
      selector.disabled = busy;
      $('voice-choice').hidden = false;
    } else {
      bank = validLines(manifest.lines);
      ui.bind(status, 'Giọng Nhật thử nghiệm · bấm để bật');
      ui.attr(toggle, 'title', '{profile} · {description}', () => ({profile: ui.t(manifest.label), description: ui.t('giọng nữ Nhật tổng hợp')}));
    }
    if (!bank.length) throw new Error('empty voice bank');
    toggle.disabled = false; preview.disabled = busy;
    if (preference('enabled') === 'off') ui.bind(status, 'Âm thanh đang tắt');
    greetOnArrival();
  }).catch(() => {
    ui.bind(status, 'Chưa có bộ giọng. Xem Hệ thống & nguồn.');
  });
})();
