'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const ui = window.AmadeusI18n, activities = window.AmadeusActivities;
  const dialog = $('lab-dialog');
  const answers = new Map();
  let tab = 'scenes', lastQuestion = -1, role = window.AmadeusChat?.role || 'guest';
  let memory = newMemory();
  const local = value => value[ui.language];
  function node(tag, className, text) {
    const result = document.createElement(tag); result.className = className || '';
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function button(source, action, className = 'lab-button') {
    const result = ui.bind(node('button', className), source); result.type = 'button';
    result.addEventListener('click', action); return result;
  }
  function notify(source) {
    ui.bind($('toast'), source); $('toast').hidden = false;
    clearTimeout(notify.timer); notify.timer = setTimeout(() => { $('toast').hidden = true; }, 3000);
  }
  function fail(source) { ui.bind($('lab-error'), source); $('lab-error').hidden = false; }
  function compose(text) {
    if (!window.AmadeusChat?.compose(text)) { fail('Chưa thể soạn thêm. Hãy chờ trả lời xong hoặc rút ngắn nội dung trong ô chat.'); return; }
    if (dialog.open) dialog.close();
    $('input').focus();
  }
  function selectTab(value, focus = false) {
    if (!['scenes', 'puzzles', 'journal', 'atmosphere'].includes(value)) return;
    tab = value; $('lab-error').hidden = true;
    for (const item of dialog.querySelectorAll('[data-lab-tab]')) {
      const selected = item.dataset.labTab === value;
      item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1;
      $('lab-' + item.dataset.labTab).hidden = !selected;
      if (focus && selected) item.focus();
    }
    if (value === 'journal') renderMoments();
  }
  function open(value = 'scenes') {
    $('sidebar').classList.remove('open'); $('menu').setAttribute('aria-expanded', 'false');
    if (matchMedia('(max-width: 760px)').matches) $('sidebar').inert = true;
    selectTab(value);
    if (!dialog.open) dialog.showModal();
  }
  for (const id of ['open-lab', 'welcome-lab']) $(id).addEventListener('click', () => open());
  $('model-settings').addEventListener('click', () => open('atmosphere'));
  dialog.querySelectorAll('[data-lab-tab]').forEach(item => {
    item.addEventListener('click', () => selectTab(item.dataset.labTab));
    item.addEventListener('keydown', event => {
      const tabs = [...dialog.querySelectorAll('[data-lab-tab]')];
      let index = tabs.indexOf(item);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault(); selectTab(tabs[index].dataset.labTab, true);
    });
  });
  function renderScenes() {
    $('scene-cards').replaceChildren();
    for (const scene of activities.scenes) {
      const card = node('article', 'lab-card scene-card'); card.dataset.scene = scene.id;
      card.append(node('span', 'tiny-label', scene.tag), node('h3', '', local(scene.title)), node('p', '', local(scene.description)));
      const goal = node('p', 'scene-goal'); goal.append(ui.bind(node('strong'), 'Mục tiêu: '), document.createTextNode(local(scene.goal)));
      const start = button('Soạn cảnh →', () => compose(local(scene.prompt))); start.dataset.compose = '';
      card.append(goal, start); $('scene-cards').append(card);
    }
    syncControls();
  }
  $('suggest-topic').addEventListener('click', () => {
    const choices = activities.questions.map((_, index) => index).filter(index => index !== lastQuestion);
    lastQuestion = choices[Math.floor(Math.random() * choices.length)];
    compose(local(activities.questions[lastQuestion]));
  });
  function newMemory() {
    const digits = () => Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('');
    const sequence = digits(), variants = new Set([sequence]);
    // Bounded deterministic variants also work with a seeded or constant RNG.
    for (let i = 1; i <= 3; i++) {
      const position = i * 2 - 1;
      variants.add(sequence.slice(0, position) + ((Number(sequence[position]) + i * 3) % 10) + sequence.slice(position + 1));
    }
    const choices = [...variants];
    for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
    return {sequence, choices, ready: false, answer: choices.indexOf(sequence)};
  }
  function puzzleResult(card, correct, explanation) {
    const result = node('div', 'puzzle-result ' + (correct ? 'correct' : 'incorrect')); result.setAttribute('role', 'status');
    result.append(ui.bind(node('strong'), correct ? 'Đúng rồi. Bằng chứng đứng về phía cậu.' : 'Chưa đúng. Cùng xem lại giả thuyết nhé.'), node('p', '', explanation));
    card.append(result);
  }
  function renderPuzzles() {
    $('puzzle-cards').replaceChildren();
    let correctCount = 0;
    const memoryPuzzle = {id: 'memory', title: {vi: 'Sáu chữ số trong ký ức', en: 'Six digits in memory'},
      question: {vi: 'Ghi nhớ dãy số, rồi tự bấm ẩn khi đã sẵn sàng. Sau đó chọn đúng dãy vừa thấy.', en: 'Remember the digits, then hide them when you are ready. Choose the sequence you just saw.'},
      options: memory.choices.map(value => ({vi: value, en: value})), answer: memory.answer,
      explanation: {vi: 'Dãy ban đầu là ' + memory.sequence + '. Thử chia thành hai nhóm ba chữ số để dễ ghi nhớ hơn.', en: 'The original sequence was ' + memory.sequence + '. Try grouping the digits into two sets of three to remember them.'}};
    for (const puzzle of [...activities.puzzles, memoryPuzzle]) {
      const card = node('article', 'lab-card puzzle-card'); card.dataset.puzzle = puzzle.id;
      card.append(node('span', 'tiny-label', 'EXPERIMENT / ' + String($('puzzle-cards').childElementCount + 1).padStart(2, '0')),
        node('h3', '', local(puzzle.title)), node('p', '', local(puzzle.question)));
      const answered = answers.has(puzzle.id), chosen = answers.get(puzzle.id), correct = chosen === puzzle.answer;
      if (answered && correct) correctCount++;
      if (puzzle.id === 'memory' && !memory.ready) {
        card.append(node('div', 'memory-sequence', memory.sequence.split('').join(' ')), button('Ẩn dãy & trả lời', () => { memory.ready = true; renderPuzzles(); $('puzzle-cards').querySelector('[data-puzzle="memory"] .puzzle-choice')?.focus(); }));
      } else {
        const options = node('div', 'puzzle-options');
        puzzle.options.forEach((option, index) => {
          const choice = node('button', 'puzzle-choice', local(option)); choice.type = 'button';
          choice.setAttribute('aria-pressed', String(answered && chosen === index)); choice.disabled = answered;
          if (answered && index === puzzle.answer) choice.classList.add('correct');
          if (answered && chosen === index && !correct) choice.classList.add('incorrect');
          choice.addEventListener('click', () => {
            if (answers.has(puzzle.id)) return;
            answers.set(puzzle.id, index); renderPuzzles();
            const result = $('puzzle-cards').querySelector('[data-puzzle="' + puzzle.id + '"] .puzzle-result');
            result.tabIndex = -1; result.focus();
          });
          options.append(choice);
        });
        card.append(options);
      }
      if (answered) {
        puzzleResult(card, correct, local(puzzle.explanation));
        const discuss = button('Thảo luận với Kurisu →', () => {
          const text = ui.language === 'en'
            ? `Kurisu, let us discuss this lab challenge: ${local(puzzle.question)} My choice: ${local(puzzle.options[chosen])}. The explanation: ${local(puzzle.explanation)} Help me understand the reasoning and ask one follow-up question.`
            : `Kurisu, cùng thảo luận thử thách này nhé: ${local(puzzle.question)} Tôi chọn: ${local(puzzle.options[chosen])}. Phần giải thích: ${local(puzzle.explanation)} Giúp tôi hiểu cách lập luận và hỏi thêm một câu để tôi tự suy nghĩ.`;
          compose(text);
        }); discuss.dataset.compose = ''; card.append(discuss);
      }
      $('puzzle-cards').append(card);
    }
    ui.bind($('puzzle-progress'), 'Đúng {count}/4 · Có thể thảo luận từng câu với Kurisu.', {count: correctCount});
    syncControls();
  }
  $('reset-puzzles').addEventListener('click', () => { answers.clear(); memory = newMemory(); renderPuzzles(); });
  function momentKey() { return 'amadeus.' + (window.AmadeusChat?.role === 'admin' ? 'admin' : 'guest') + '.moments.v1'; }
  function readMoments() {
    const raw = localStorage.getItem(momentKey());
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > 100 || !data.every(item => item && typeof item.id === 'string' && typeof item.text === 'string'
      && item.text.length <= 2400 && typeof item.question === 'string' && item.question.length <= 500
      && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)))) throw new Error('invalid journal');
    return data;
  }
  function renderMoments() {
    $('moment-list').replaceChildren();
    try {
      const moments = readMoments();
      ui.bind($('moment-count'), '{count}/100 khoảnh khắc', {count: moments.length});
      $('export-moments').disabled = !moments.length;
      if (!moments.length) $('moment-list').append(ui.bind(node('p', 'empty-note'), 'Chưa có kỷ niệm. Giữ lại một câu nói khiến cậu muốn đọc lần nữa.'));
      for (const moment of moments) {
        const card = node('article', 'lab-card moment-card');
        const heading = node('div', 'lab-section-heading');
        const time = node('time', 'tiny-label', new Intl.DateTimeFormat(ui.locale, {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(moment.createdAt)));
        time.dateTime = moment.createdAt;
        const remove = button('Xóa kỷ niệm', () => {
          try { localStorage.setItem(momentKey(), JSON.stringify(readMoments().filter(item => item.id !== moment.id))); renderMoments(); }
          catch { fail('Không lưu được nhật ký. Kiểm tra quyền lưu trữ hoặc dung lượng trình duyệt.'); }
        }, 'text-button');
        heading.append(time, remove); card.append(heading);
        if (moment.question) card.append(node('p', 'moment-question', moment.question));
        const quote = node('blockquote', 'moment-quote');
        window.AmadeusMarkdown.render(quote, moment.text);
        card.append(quote); $('moment-list').append(card);
      }
    } catch { $('moment-count').textContent = ''; $('export-moments').disabled = true; fail('Không đọc được nhật ký. Dữ liệu cũ vẫn được giữ nguyên.'); }
  }
  document.addEventListener('amadeus:keepsake', event => {
    const item = event.detail;
    if (item.role !== window.AmadeusChat?.role || typeof item.text !== 'string' || !item.text.trim()) return;
    try {
      const moments = readMoments(), text = item.text.slice(0, 2400);
      if (moments.some(moment => moment.sessionId === item.sessionId && moment.text === text)) { notify('Khoảnh khắc này đã có trong nhật ký.'); return; }
      if (moments.length >= 100) { notify('Nhật ký đã đủ 100 khoảnh khắc. Xóa bớt trước khi lưu thêm.'); return; }
      moments.unshift({id: crypto.randomUUID(), sessionId: item.sessionId, text, question: String(item.question || '').slice(0, 500), createdAt: new Date().toISOString()});
      localStorage.setItem(momentKey(), JSON.stringify(moments));
      notify('Đã giữ khoảnh khắc trong nhật ký.');
      if (tab === 'journal') renderMoments();
    } catch { notify('Không lưu được nhật ký. Kiểm tra quyền lưu trữ hoặc dung lượng trình duyệt.'); }
  });
  $('export-moments').addEventListener('click', () => {
    try {
      const moments = readMoments(); if (!moments.length) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify({version: 1, moments}, null, 2)], {type: 'application/json'}));
      const link = node('a'); link.href = url; link.download = 'amadeus-moments.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { fail('Không đọc được nhật ký. Dữ liệu cũ vẫn được giữ nguyên.'); }
  });
  function syncControls() {
    const blocked = Boolean(window.AmadeusChat?.blocked);
    dialog.querySelectorAll('[data-compose]').forEach(item => { item.disabled = blocked; });
    $('suggest-topic').disabled = blocked;
  }
  document.addEventListener('amadeus:workspace', event => {
    syncControls();
    if (role !== event.detail.role) {
      role = event.detail.role; $('moment-list').replaceChildren(); $('lab-error').hidden = true;
      if (tab === 'journal') renderMoments();
    }
  });
  window.addEventListener('storage', event => { if (event.key === momentKey() && tab === 'journal') renderMoments(); });
  document.addEventListener('amadeus:language', () => { renderScenes(); renderPuzzles(); if (tab === 'journal') renderMoments(); });
  renderScenes(); renderPuzzles();
})();
