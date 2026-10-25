'use strict';

(() => {
  const $ = id => document.getElementById(id), ui = window.AmadeusI18n;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let context, bed, gain, speaking = false, cuePending = false, cuePlayed = false;
  const tones = new Set();
  function pref(key) { try { return localStorage.getItem('amadeus.atmosphere.' + key); } catch { return null; } }
  function save(key, value) { try { localStorage.setItem('amadeus.atmosphere.' + key, value); } catch { /* Optional preferences. */ } }
  $('night-mode').checked = pref('night') !== 'off';
  $('reduce-motion').checked = pref('motion') === 'on' || motion.matches;
  $('reduce-motion').disabled = motion.matches;
  $('lab-ambient').checked = pref('ambient') === 'on';
  $('connection-sound').checked = pref('signal') === 'on';
  const storedVolume = pref('volume'), volume = storedVolume === null ? 12 : Number(storedVolume);
  $('lab-volume').value = Number.isFinite(volume) ? Math.min(35, Math.max(0, volume)) : 12;
  function visuals() {
    root.dataset.night = String($('night-mode').checked);
    root.dataset.motion = $('reduce-motion').checked || motion.matches ? 'reduce' : 'full';
  }
  function status(source) { ui.bind($('atmosphere-status'), source); }
  function level() {
    if (!context || !gain) return;
    gain.gain.setTargetAtTime(Number($('lab-volume').value) / 100 * (speaking ? 0.12 : 0.5), context.currentTime, 0.25);
  }
  function stopBed() {
    if (bed) { bed.source.stop(); bed.source.disconnect(); bed.filter.disconnect(); bed = null; }
    if (gain) { gain.disconnect(); gain = null; }
  }
  function makeBed() {
    if (bed) return;
    // A filtered, quiet equipment hum; generated locally with no audio downloads.
    const source = context.createBufferSource();
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 4), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * 0.25 + Math.sin(i * 2 * Math.PI * 60 / context.sampleRate) * 0.05;
    source.buffer = buffer; source.loop = true;
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 340; filter.Q.value = 0.4;
    gain = context.createGain(); gain.gain.value = 0;
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    source.start(); bed = {source, filter}; level();
  }
  function signal() {
    if (!context || context.state !== 'running' || document.hidden || !$('connection-sound').checked) return;
    for (const [index, frequency] of [660, 880].entries()) {
      const oscillator = context.createOscillator(), envelope = context.createGain(), at = context.currentTime + index * 0.12;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(0.025, at + 0.012); envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
      oscillator.connect(envelope); envelope.connect(context.destination); tones.add(oscillator);
      oscillator.onended = () => { tones.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
      oscillator.start(at); oscillator.stop(at + 0.17);
    }
    cuePending = false; cuePlayed = true;
  }
  async function audio(fromGesture = false) {
    if (document.hidden) return;
    if (!$('lab-ambient').checked && !$('connection-sound').checked) {
      stopBed(); context?.suspend().catch(() => {}); status('Âm nền và tín hiệu đang tắt.'); return;
    }
    if (!context && !fromGesture) { status('Chạm vào trang để bật âm thanh phòng lab đã chọn.'); return; }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('unavailable');
      context ||= new AudioContext();
      await context.resume();
      if (document.hidden || (!$('lab-ambient').checked && !$('connection-sound').checked)) { stopBed(); await context.suspend(); return; }
      if (context.state !== 'running') { status('Chạm vào trang để bật âm thanh phòng lab đã chọn.'); return; }
      if ($('lab-ambient').checked) makeBed(); else stopBed();
      if (cuePending) signal();
      status($('lab-ambient').checked ? 'Âm nền phòng lab đang bật.' : 'Âm báo kết nối đang bật.');
    } catch { status('Chưa bật được âm thanh phòng lab. Thử lại bằng nút bật âm nền.'); }
  }
  for (const [id, key] of [['night-mode', 'night'], ['reduce-motion', 'motion']]) {
    $(id).addEventListener('change', () => { save(key, $(id).checked ? 'on' : 'off'); visuals(); });
  }
  motion.addEventListener('change', () => {
    $('reduce-motion').disabled = motion.matches;
    $('reduce-motion').checked = motion.matches || pref('motion') === 'on'; visuals();
  });
  $('lab-ambient').addEventListener('change', () => { save('ambient', $('lab-ambient').checked ? 'on' : 'off'); audio(true); });
  $('connection-sound').addEventListener('change', () => {
    save('signal', $('connection-sound').checked ? 'on' : 'off');
    cuePending = $('connection-sound').checked;
    if (!cuePending) for (const tone of tones) tone.stop();
    audio(true);
  });
  $('lab-volume').addEventListener('input', () => { save('volume', $('lab-volume').value); level(); });
  for (const type of ['click', 'keydown']) document.addEventListener(type, event => {
    if ((!event.isTrusted && !navigator.userActivation?.isActive) || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key === 'Escape') return;
    if ((!context || context.state !== 'running') && ($('lab-ambient').checked || $('connection-sound').checked)) audio(true);
  });
  document.addEventListener('amadeus:voice', event => {
    const next = Boolean(event.detail.speaking);
    if (next !== speaking) { speaking = next; level(); }
  });
  const observer = new MutationObserver(() => {
    if ($('avatar-container').dataset.state === 'ready' && !cuePlayed && $('connection-sound').checked) {
      cuePending = true; audio();
    }
  });
  observer.observe($('avatar-container'), {attributes: true, attributeFilter: ['data-state']});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { for (const tone of tones) tone.stop(); context?.suspend().catch(() => {}); }
    else audio();
  });
  window.addEventListener('pagehide', event => {
    for (const tone of tones) tone.stop();
    if (event.persisted) context?.suspend().catch(() => {});
    else { observer.disconnect(); stopBed(); context?.close().catch(() => {}); }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) audio(); });
  visuals(); audio();
})();
