'use strict';
const $ = (id) => document.getElementById(id);
const ui = window.AmadeusI18n;
const state = {session: null, busy: false, navigating: false, controller: null, retry: null, ready: false, searchEnabled: true, selectedMode: 'amadeus', searchVersion: 0, role: 'guest', workspace: 0, initializing: 0, loading: false, refreshAuth: false};
const modeNames = {amadeus: 'Amadeus', lab: 'Kurisu tại lab'};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function label(tag, className, text, values) { return ui.bind(element(tag, className), text, values); }
function toast(message) {
  ui.bind($('toast'), message);
  $('toast').hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { $('toast').hidden = true; }, 2800);
}
function viewKey(key) { return 'amadeus.' + state.role + '.' + key; }
function viewGet(key) {
  try { return localStorage.getItem(viewKey(key)) ?? (state.role === 'admin' ? localStorage.getItem('amadeus.' + key) : null); }
  catch { return null; }
}
function viewSet(key, value) {
  // View preferences are optional; the guest store reports content-save failures.
  try {
    if (value === null) localStorage.removeItem(viewKey(key));
    else localStorage.setItem(viewKey(key), value);
  } catch { /* Admin DB history remains usable when browser storage is blocked. */ }
}
function refreshAuthWhenIdle() {
  if (!state.refreshAuth || state.busy || state.navigating || state.loading) return;
  state.refreshAuth = false;
  initialize();
}
async function serverApi(path, options = {}) {
  const response = await fetch('/api' + path, {
    ...options,
    headers: {'Content-Type': 'application/json', ...options.headers},
  });
  if (!response.ok) {
    let detail;
    try { detail = (await response.json()).detail; } catch { /* Not JSON. */ }
    if (response.status === 401 && path !== '/login' && state.role === 'admin') {
      state.refreshAuth = true;
      refreshAuthWhenIdle();
    }
    throw new Error(typeof detail === 'string' ? detail : 'Yêu cầu chưa thành công. Kiểm tra kết nối rồi thử lại.');
  }
  return response.json();
}
async function api(path, options = {}) {
  if (state.role === 'guest' && /^\/(sessions|memories)(\/|$)/.test(path)) return window.AmadeusGuestStore.request(path, options);
  return serverApi(path, options);
}
function error(message, canRetry = false) {
  ui.bind($('error-text'), message);
  $('error').hidden = false;
  $('retry').hidden = !canRetry;
}
function setBusy(busy) {
  state.busy = busy;
  document.dispatchEvent(new CustomEvent('amadeus:state', {detail: busy ? 'thinking' : 'idle'}));
  $('send').hidden = busy;
  $('stop').hidden = !busy;
  $('input').disabled = busy;
  updateControls();
  $('messages').setAttribute('aria-busy', String(busy));
}
function updateControls() {
  const blocked = state.busy || state.navigating || state.loading;
  for (const id of ['new-chat', 'mode', 'delete-chat', 'export']) $(id).disabled = blocked;
  $('account-button').disabled = blocked;
  $('admin-logout').disabled = blocked;
  $('send').disabled = state.navigating || state.loading;
  $('web-search').disabled = blocked || !state.searchEnabled;
  document.querySelectorAll('.session-open, .session-delete, .suggestions button').forEach((b) => { b.disabled = blocked; });
  document.dispatchEvent(new CustomEvent('amadeus:workspace', {detail: {role: state.role, blocked}}));
  refreshAuthWhenIdle();
}
async function navigate(action) {
  if (state.busy || state.navigating || state.loading) return;
  document.dispatchEvent(new CustomEvent('amadeus:navigate'));
  state.navigating = true;
  updateControls();
  try { return await action(); }
  finally { state.navigating = false; updateControls(); }
}
function scrollDown(force = false) {
  const box = $('conversation');
  if (force || box.scrollHeight - box.scrollTop - box.clientHeight < 200) box.scrollTop = box.scrollHeight;
}
function syncMode(mode) {
  state.selectedMode = mode;
  $('mode').value = mode;
  ui.bind($('mode-description'), mode === 'lab'
    ? 'Kurisu ở Alpha · những ngày tại Future Gadget Lab'
    : 'Ký ức trước chuyến về Nhật · có thể học từ cuộc đối thoại này');
}
function message(role, text, pending = false, knowledge = [], sources = []) {
  $('welcome').hidden = true;
  const article = element('article', 'message ' + role + (pending ? ' pending' : ''));
  if (role === 'assistant') {
    const avatar = element('div', 'message-avatar');
    const portrait = document.createElement('img');
    portrait.src = '/assets/kurisu-account.jpg';
    portrait.alt = '';
    portrait.width = 48;
    portrait.height = 48;
    avatar.append(portrait);
    article.append(avatar);
  }
  const main = element('div', 'message-main');
  main.append(label('div', 'message-label', role === 'assistant' ? 'MAKISE KURISU' : 'CẬU'));
  const body = element('div', 'message-body', text);
  if (role === 'assistant') window.AmadeusMarkdown.render(body, text);
  main.append(body);
  if (role === 'assistant' && !pending) addMessageActions(main, text, knowledge, sources);
  article.append(main);
  $('messages').append(article);
  return {article, body, main};
}
function addMessageActions(main, text, knowledge, sources = [], complete = true) {
  const actions = element('div', 'message-actions');
  const copy = label('button', 'text-button', 'Sao chép');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); toast('Đã sao chép.'); }
    catch { toast('Trình duyệt không cho sao chép. Cậu có thể chọn đoạn văn trực tiếp.'); }
  });
  actions.append(copy);
  if (complete) {
    const keep = label('button', 'text-button moment-save', '☆ Lưu kỷ niệm');
    keep.type = 'button';
    keep.addEventListener('click', () => document.dispatchEvent(new CustomEvent('amadeus:keepsake', {detail: {
      role: state.role, sessionId: state.session?.id, text,
      question: main.closest('.message')?.previousElementSibling?.querySelector('.message-body')?.textContent || '',
    }})));
    actions.append(keep);
  }
  if (knowledge.length) {
    const refs = label('button', 'text-button', 'Tham chiếu {count} ghi chú ↗', {count: knowledge.length});
    refs.type = 'button';
    ui.attr(refs, 'title', 'Những ghi chú được đưa vào prompt, không phải xác minh từng câu trả lời');
    refs.addEventListener('click', () => openCanon(knowledge.map((k) => k.id)));
    actions.append(refs);
  }
  main.append(actions);
  if (sources.length) {
    const refs = element('div', 'web-sources');
    for (const source of sources) {
      let url;
      try { url = new URL(source.url); } catch { continue; }
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const link = element('a', '', source.title || url.hostname);
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.title = url.hostname + ' — ' + source.title;
      refs.append(link);
    }
    main.append(refs);
  }
}
async function refreshSessions() {
  const workspace = state.workspace;
  const sessions = await api('/sessions');
  if (workspace !== state.workspace) return [];
  $('sessions').replaceChildren();
  $('session-count').textContent = String(sessions.length).padStart(2, '0');
  for (const session of sessions) {
    const active = state.session?.id === session.id;
    const row = element('div', 'session-item' + (active ? ' active' : ''));
    row.dataset.sessionId = session.id;
    const button = element('button', 'session-open');
    button.type = 'button';
    if (active) button.setAttribute('aria-current', 'page');
    if (session.title === 'Cuộc trò chuyện mới') {
      ui.attr(button, 'title', session.title);
      button.append(label('strong', '', session.title));
    } else {
      button.title = session.title;
      button.append(element('strong', '', session.title));
    }
    button.append(label('small', '', '{mode} · {date}', () => ({mode: ui.t(modeNames[session.mode]),
      date: new Intl.DateTimeFormat(ui.locale, {day: '2-digit', month: '2-digit'}).format(new Date(session.updated_at))})));
    button.disabled = state.busy || state.navigating;
    button.addEventListener('click', () => navigate(() => loadSession(session.id)).catch((e) => error(e.message)));
    const remove = element('button', 'session-delete');
    remove.type = 'button';
    ui.attr(remove, 'title', 'Xóa hội thoại');
    ui.attr(remove, 'aria-label', 'Xóa hội thoại: {title}', {title: session.title});
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '/assets/icons.svg#trash');
    icon.append(use); remove.append(icon);
    remove.disabled = state.busy || state.navigating;
    remove.addEventListener('click', () => navigate(() => deleteSession(session.id)).catch((e) => error(e.message)));
    row.append(button, remove);
    $('sessions').append(row);
  }
  if (!sessions.length) $('sessions').append(label('p', 'empty-note', 'Chưa có cuộc trò chuyện nào. Bắt đầu bằng điều cậu đang nghĩ.'));
  return sessions;
}
async function loadSession(id) {
  if (state.busy) return;
  const workspace = state.workspace;
  const session = await api('/sessions/' + id);
  if (workspace !== state.workspace) return;
  state.session = session;
  viewSet('active', id);
  viewSet('last.' + session.mode, id);
  syncMode(session.mode);
  $('messages').replaceChildren();
  $('welcome').hidden = session.messages.length > 0;
  for (const m of session.messages) message(m.role, m.content, false, m.knowledge || [], m.sources || []);
  state.retry = null;
  $('error').hidden = true;
  closeSidebar();
  await refreshSessions();
  scrollDown(true);
}
function showDraft(mode = state.selectedMode, {clearInput = true} = {}) {
  state.session = null;
  state.retry = null;
  syncMode(mode);
  viewSet('active', 'draft:' + mode);
  viewSet('last.' + mode, 'draft');
  $('messages').replaceChildren();
  $('welcome').hidden = false;
  $('error').hidden = true;
  if (clearInput) { $('input').value = ''; $('input').style.height = 'auto'; }
  closeSidebar();
}
async function newDraft() {
  return navigate(async () => { showDraft(); await refreshSessions(); $('input').focus(); });
}
async function switchMode(mode) {
  if (mode === state.selectedMode) return;
  const remembered = viewGet('last.' + mode);
  const sessions = await api('/sessions');
  const selected = remembered === 'draft' ? null
    : sessions.find((s) => s.mode === mode && s.id === remembered) || sessions.find((s) => s.mode === mode);
  if (selected) await loadSession(selected.id);
  else { showDraft(mode, {clearInput: false}); await refreshSessions(); }
}
async function createSessionForSend() {
  const mode = state.selectedMode;
  const session = await api('/sessions', {method: 'POST', body: JSON.stringify({mode})});
  await loadSession(session.id);
  return session;
}
async function deleteSession(id) {
  const deletingActive = state.session?.id === id;
  await api('/sessions/' + id, {method: 'DELETE'});
  for (const mode of Object.keys(modeNames)) {
    if (viewGet('last.' + mode) === id) viewSet('last.' + mode, null);
  }
  if (deletingActive) showDraft(state.selectedMode, {clearInput: false});
  const sessions = await refreshSessions();
  if (deletingActive && sessions.length) {
    const next = sessions.find((s) => s.mode === state.selectedMode) || sessions[0];
    await loadSession(next.id);
  }
  toast('Đã xóa hội thoại.');
}
async function send(retry = false) {
  if (state.busy || state.navigating || state.loading) return;
  const request = retry && state.retry ? state.retry : {text: $('input').value.trim(), request_id: crypto.randomUUID(),
    web_search: $('web-search').checked, language: ui.language};
  if (!request.text) return;
  $('error').hidden = true;
  // Lock controls before creating the first session, including double submits.
  state.navigating = true;
  updateControls();
  try {
    if (!state.session) await createSessionForSend();
    if (retry) {
      const completed = await api(`/sessions/${state.session.id}/requests/${request.request_id}`);
      if (completed.completed) {
        await loadSession(state.session.id);
        $('input').value = '';
        toast('Đã khôi phục câu trả lời đã lưu.');
        return;
      }
      // Restore durable history first, removing any unsaved partial answer.
      await loadSession(state.session.id);
      state.retry = request;
    }
  } catch (e) { error(e.message, retry); return; }
  finally {
    state.navigating = false;
    updateControls();
  }
  const sid = state.session.id;
  const guest = state.role === 'guest';
  const workspace = state.workspace;
  setBusy(true);
  document.dispatchEvent(new CustomEvent('amadeus:turn', {detail: {userText: request.text}}));
  state.retry = request;
  state.controller = new AbortController();
  $('input').value = '';
  $('input').style.height = 'auto';
  message('user', request.text);
  const assistant = message('assistant', '', true);
  scrollDown(true);
  let done = false;
  let answer = '';
  let context = [];
  let sources = [];
  try {
    const response = await fetch(guest ? '/api/guest/messages' : `/api/sessions/${sid}/messages`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(guest ? {...request, ...window.AmadeusGuestStore.context(sid)} : request), signal: state.controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 && !guest) state.refreshAuth = true;
      const info = await response.json().catch(() => ({}));
      throw new Error(typeof info.detail === 'string' ? info.detail : `Không gửi được tin nhắn (${response.status}).`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, {stream: true});
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        let event = 'message';
        const data = [];
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) data.push(line.slice(5).trim());
        }
        if (!data.length) continue;
        const payload = JSON.parse(data.join('\n'));
        if (event === 'error') throw new Error(payload.message);
        if (event === 'context') context = payload.knowledge;
        if (event === 'search') {
          assistant.body.dataset.uiSearch = 'true';
          assistant.body.textContent = ui.t('Đang tra cứu tài liệu bên ngoài…');
        }
        if (event === 'delta') {
          delete assistant.body.dataset.uiSearch;
          if (!answer) document.dispatchEvent(new CustomEvent('amadeus:state', {detail: 'speaking'}));
          answer += payload.text;
          window.AmadeusMarkdown.stream(assistant.body, answer);
          scrollDown();
        }
        if (event === 'done') {
          delete assistant.body.dataset.uiSearch;
          answer = payload.text;
          context = payload.knowledge || context;
          sources = payload.sources || [];
          window.AmadeusMarkdown.render(assistant.body, answer);
          if (guest) await window.AmadeusGuestStore.commitTurn(sid, request.request_id, request.text, payload);
          done = true;
        }
      }
    }
    if (!done) throw new Error('Luồng kết nối bị ngắt. Cậu có thể thử lại cùng tin nhắn.');
    assistant.article.classList.remove('pending');
    addMessageActions(assistant.main, answer, context, sources);
    state.retry = null;
    refreshSessions().catch(() => toast('Câu trả lời đã lưu. Danh sách lịch sử sẽ cập nhật khi tải lại trang.'));
  } catch (e) {
    state.controller.abort();
    if (workspace !== state.workspace) return;
    assistant.article.classList.remove('pending');
    assistant.article.classList.add('interrupted');
    assistant.main.append(label('div', 'interrupted-label', 'Lượt chưa xác nhận hoàn tất'));
    if (answer.trim()) addMessageActions(assistant.main, answer, context, sources, false);
    error(e.name === 'AbortError' ? 'Đã dừng nhận câu trả lời. Gửi lại sẽ kiểm tra kết quả đã lưu trước khi gọi model.' : e.message, true);
    $('input').value = request.text;
  } finally {
    setBusy(false);
    if (done && workspace === state.workspace) document.dispatchEvent(new CustomEvent('amadeus:reply', {detail: {userText: request.text}}));
    state.controller = null;
    $('input').focus();
    scrollDown();
  }
}
async function renderMemories() {
  const workspace = state.workspace;
  const notes = await api('/memories');
  if (workspace !== state.workspace) return;
  $('memory-count').textContent = notes.length;
  $('memory-list').replaceChildren();
  if (!notes.length) $('memory-list').append(label('p', 'empty-note', 'Chưa có ghi chú. Chỉ những điều cậu chủ động lưu mới được thêm vào đây.'));
  for (const note of notes) {
    const row = element('div', 'memory-item');
    row.append(element('span', '', note.content));
    const remove = element('button', 'icon-button', '×');
    ui.attr(remove, 'aria-label', 'Quên ghi chú: {content}', {content: note.content.slice(0, 50)});
    remove.addEventListener('click', async () => {
      try { await api('/memories/' + note.id, {method: 'DELETE'}); await renderMemories(); toast('Đã xóa ghi chú.'); }
      catch (e) { ui.bind($('memory-error'), e.message); $('memory-error').hidden = false; }
    });
    row.append(remove);
    $('memory-list').append(row);
  }
}
async function renderCanon(ids = null) {
  const version = ++state.searchVersion;
  const entries = await api('/canon?q=' + encodeURIComponent(ids ? '' : $('canon-search').value));
  if (version !== state.searchVersion) return;
  $('canon-list').replaceChildren();
  const selected = ids ? entries.filter((e) => ids.includes(e.id)) : entries;
  if (!selected.length) $('canon-list').append(label('p', 'empty-note', 'Không có ghi chú khớp từ khóa này. Thử tên nhân vật hoặc thuật ngữ khác.'));
  for (const entry of selected) {
    const detail = element('details', 'canon-entry');
    if (ids) detail.open = true;
    detail.append(element('summary', '', entry.title));
    detail.append(element('span', 'meta', `${entry.worldline} / ${entry.scope}`));
    detail.append(element('p', '', entry.content));
    for (const source of entry.sources) {
      if (!source.url) { detail.append(element('span', 'meta', source.title)); continue; }
      const link = element('a', '', source.title + ' ↗');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      detail.append(link);
    }
    $('canon-list').append(detail);
  }
}
async function openCanon(ids = null) {
  $('canon-search').value = '';
  if (!$('canon-dialog').open) $('canon-dialog').showModal();
  try { await renderCanon(ids); }
  catch (e) { $('canon-list').replaceChildren(label('p', 'dialog-error', e.message)); }
}
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('menu').setAttribute('aria-expanded', 'false');
  syncPanelAccess();
}
function showLogin() {
  $('login-error').hidden = true;
  if (!$('login-dialog').open) $('login-dialog').showModal();
}
function showRole(role) {
  state.role = role;
  const admin = role === 'admin';
  ui.bind($('profile-title'), admin ? 'Không gian admin' : 'Hệ thống');
  ui.bind($('profile-description'), admin ? 'Lịch sử lưu trên máy chủ' : 'Lịch sử chỉ trên trình duyệt');
  ui.bind($('profile-badge'), admin ? 'ADMIN' : 'KHÁCH');
  ui.attr($('account-button'), 'aria-label', admin ? 'Mở không gian admin' : 'Hệ thống');
  $('account-button').setAttribute('aria-controls', admin ? 'account-dialog' : 'login-dialog');
  ui.bind($('memory-privacy'), admin
    ? 'Ghi chú admin được lưu trên máy chủ và gửi đến nhà cung cấp AI khi trả lời. Xóa ghi chú sẽ ngừng dùng nó cho các lượt mới.'
    : 'Ghi chú chỉ lưu trên trình duyệt này, không ghi vào máy chủ. Nội dung liên quan được gửi đến AI khi trò chuyện. Xóa dữ liệu trang sẽ xóa các ghi chú này.');
}
async function initialize() {
  const initializing = ++state.initializing;
  state.loading = true;
  updateControls();
  state.workspace++;
  state.session = null;
  state.retry = null;
  $('messages').replaceChildren();
  $('sessions').replaceChildren();
  $('memory-list').replaceChildren();
  $('memory-count').textContent = '0';
  $('session-count').textContent = '00';
  $('welcome').hidden = false;
  $('input').value = '';
  $('memory-input').value = '';
  $('memory-error').hidden = true;
  $('error').hidden = true;
  for (const id of ['memory-dialog', 'account-dialog']) if ($(id).open) $(id).close();
  try {
    const status = await serverApi('/status');
    if (initializing !== state.initializing) return;
    showRole(status.role || (status.authenticated ? 'admin' : 'guest'));
    state.ready = status.model_ready;
    state.searchEnabled = status.web_search_enabled;
    $('web-search').disabled = !state.searchEnabled;
    if (!status.web_search_enabled) $('web-search').checked = false;
    if ($('login-dialog').open) $('login-dialog').close();
    $('setup-banner').hidden = status.model_ready;
    ui.bind($('connection-text'), status.model_ready ? 'SẴN SÀNG ĐỐI THOẠI' : 'CHỜ KẾT NỐI MODEL');
    $('connection-dot').classList.toggle('ready', status.model_ready);
    syncMode(status.default_mode);
    const sessions = await refreshSessions();
    const remembered = viewGet('active');
    if (remembered?.startsWith('draft:') && modeNames[remembered.slice(6)]) showDraft(remembered.slice(6));
    else {
      const selected = sessions.find((s) => s.id === remembered) || sessions[0];
      if (selected) await loadSession(selected.id);
    }
    await renderMemories();
  } catch (e) { error('Không mở được không gian trò chuyện. ' + e.message); }
  finally { if (initializing === state.initializing) {state.loading = false; updateControls();} }
}
$('chat-form').addEventListener('submit', (e) => { e.preventDefault(); send().catch((e) => error(e.message, Boolean(state.retry))); });
$('input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('chat-form').requestSubmit(); } });
$('input').addEventListener('input', () => { $('input').style.height = 'auto'; $('input').style.height = Math.min($('input').scrollHeight, 160) + 'px'; });
$('stop').addEventListener('click', () => state.controller?.abort());
$('retry').addEventListener('click', () => send(true).catch((e) => error(e.message, true)));
$('dismiss-error').addEventListener('click', () => { $('error').hidden = true; });
$('new-chat').addEventListener('click', () => newDraft().catch((e) => error(e.message)));
$('mode').addEventListener('change', async () => { const prior = state.selectedMode; try { await navigate(() => switchMode($('mode').value)); } catch (e) { syncMode(prior); error(e.message); } });
const mobileLayout = matchMedia('(max-width: 760px)');
const compactLayout = matchMedia('(max-width: 1100px)');
function syncPanelAccess() {
  $('sidebar').inert = mobileLayout.matches && !$('sidebar').classList.contains('open');
  $('character-panel').inert = compactLayout.matches && !$('character-panel').classList.contains('open');
}
mobileLayout.addEventListener('change', syncPanelAccess);
compactLayout.addEventListener('change', syncPanelAccess);
syncPanelAccess();
$('menu').addEventListener('click', () => { const open = $('sidebar').classList.toggle('open'); $('menu').setAttribute('aria-expanded', String(open)); syncPanelAccess(); });
$('show-avatar').setAttribute('aria-expanded', 'false');
$('show-avatar').addEventListener('click', () => { const open = $('character-panel').classList.toggle('open'); $('show-avatar').setAttribute('aria-expanded', String(open)); syncPanelAccess(); });
function closeAvatar() { $('character-panel').classList.remove('open'); $('show-avatar').setAttribute('aria-expanded', 'false'); syncPanelAccess(); }
$('close-avatar').addEventListener('click', closeAvatar);
$('open-about').addEventListener('click', () => { closeSidebar(); $('about-dialog').showModal(); });
document.addEventListener('pointerdown', (e) => { if (!$('character-panel').contains(e.target) && !$('show-avatar').contains(e.target)) closeAvatar(); });
document.addEventListener('pointerdown', (e) => { if (!$('sidebar').contains(e.target) && !$('menu').contains(e.target)) closeSidebar(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSidebar(); closeAvatar(); }
  if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) {
    e.preventDefault(); newDraft().catch((e) => error(e.message));
  }
});
document.querySelectorAll('.suggestions button').forEach((button) => button.addEventListener('click', () => { $('input').value = button.dataset.prompt; $('chat-form').requestSubmit(); }));
$('export').addEventListener('click', () => {
  if (!state.session) { toast('Chưa có hội thoại để tải.'); return; }
  const sid = state.session.id;
  if (state.role === 'guest') {
    api(`/sessions/${sid}/export`).then(data => {
      const link = element('a');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
      link.href = url; link.download = `amadeus-${sid}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }).catch(e => error(e.message));
  } else {
    const link = element('a'); link.href = `/api/sessions/${state.session.id}/export`; link.download = `amadeus-${state.session.id}.json`; link.click();
  }
});
$('delete-chat').addEventListener('click', async () => {
  if (!state.session) return;
  try { await navigate(() => deleteSession(state.session.id)); }
  catch (e) { error(e.message); }
});
$('open-memory').addEventListener('click', async () => {
  $('memory-error').hidden = true; $('memory-dialog').showModal();
  try { await renderMemories(); } catch (e) { ui.bind($('memory-error'), e.message); $('memory-error').hidden = false; }
});
$('memory-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const button = $('memory-form').querySelector('button'); button.disabled = true;
  try {
    await api('/memories', {method: 'POST', body: JSON.stringify({content: $('memory-input').value.trim()})});
    $('memory-input').value = ''; $('memory-error').hidden = true; await renderMemories(); toast('Đã lưu ghi chú.');
  } catch (e) { ui.bind($('memory-error'), e.message); $('memory-error').hidden = false; }
  finally { button.disabled = false; }
});
$('open-canon').addEventListener('click', () => openCanon());
$('canon-search').addEventListener('input', () => {
  clearTimeout(state.searchTimer);
  state.searchVersion++;
  state.searchTimer = setTimeout(() => renderCanon().catch((e) => { $('canon-list').replaceChildren(label('p', 'dialog-error', e.message)); }), 200);
});
document.querySelectorAll('.close-dialog').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
$('account-button').addEventListener('click', () => {
  if (state.busy || state.navigating || state.loading) return;
  closeSidebar();
  if (state.role === 'admin') $('account-dialog').showModal();
  else showLogin();
});
$('login-dialog').addEventListener('close', () => { $('password').value = ''; });
function authChanged() {
  try { localStorage.setItem('amadeus.auth.changed', crypto.randomUUID()); } catch { /* Cookie still controls authentication. */ }
}
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const button = $('login-form').querySelector('button'); button.disabled = true;
  try {
    await navigate(async () => {
      await serverApi('/login', {method: 'POST', body: JSON.stringify({password: $('password').value})});
      $('password').value = ''; authChanged(); await initialize();
    });
  }
  catch (e) { ui.bind($('login-error'), e.message); $('login-error').hidden = false; }
  finally { button.disabled = false; }
});
$('admin-logout').addEventListener('click', () => navigate(async () => {
  await serverApi('/logout', {method: 'POST'});
  authChanged(); await initialize(); toast('Đã trở về không gian khách trên trình duyệt này.');
}).catch(e => error(e.message)));
window.addEventListener('storage', event => {
  if (event.key === 'amadeus.auth.changed') {state.refreshAuth = true; refreshAuthWhenIdle();}
  if (event.key === window.AmadeusGuestStore.key && state.role === 'guest' && !state.busy && !state.navigating && !state.loading) {
    navigate(async () => {
      const active = state.session?.id, sessions = await refreshSessions();
      if (active && sessions.some(s => s.id === active)) await loadSession(active);
      else if (active) showDraft(state.selectedMode, {clearInput: false});
      await renderMemories();
    }).catch(e => error(e.message));
  }
});
document.addEventListener('amadeus:language', () => {
  document.querySelectorAll('.message-body[data-ui-search]').forEach(node => {
    node.textContent = ui.t('Đang tra cứu tài liệu bên ngoài…');
  });
});
initialize();

// The lab composes ordinary user messages, so scenes use the same history and
// language handling as chat. It never sends a message without the send action.
window.AmadeusChat = Object.freeze({
  get role() { return state.role; },
  get blocked() { return state.busy || state.navigating || state.loading; },
  compose(text) {
    if (this.blocked) return false;
    const current = $('input').value.trim();
    const draft = current ? current + '\n\n' + text : text;
    if (draft.length > 6000) return false;
    $('input').value = draft;
    $('input').dispatchEvent(new Event('input'));
    $('input').focus();
    return true;
  },
});
