'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const ui = window.AmadeusI18n;
  const tr = (vi, en) => ui.language === 'en' ? en : vi;
  const local = value => value?.[ui.language] || '';
  const node = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; };
  const link = (text, href, className = '') => { const n = node('a', className, text); n.href = href; if (href.startsWith('/')) n.dataset.route = ''; return n; };
  const button = (text, action, className = 'portal-button') => { const n = node('button', className, text); n.type = 'button'; n.addEventListener('click', action); return n; };
  const state = {pages: [], details: new Map(), timeline: [], relations: [], role: 'guest', authEpoch: 0, status: null, load: 0, fetching: true, error: false, dirty: false,
    drafts: [], editing: null, saving: false, field: 'all', selectedEvent: '', person: 'makise-kurisu', answers: new Map(), mail: null,
    companion: {busy: false, sid: null, slug: null, controller: null, epoch: 0, retry: null}};
  function get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
  function set(key, value) { try { localStorage.setItem(key, value); return true; } catch { notice(tr('Trình duyệt không lưu được lựa chọn này.', 'The browser could not save this preference.')); return false; } }
  let spoiler = Number(get('amadeus.explorer.spoiler', '2'));
  if (![0, 1, 2].includes(spoiler)) spoiler = 2;
  const prefKey = name => `amadeus.${state.role}.explorer.${name}`;
  const categories = {character: ['Nhân vật', 'Character'], concept: ['Khái niệm', 'Concept'], organization: ['Tổ chức', 'Organization'], place: ['Địa điểm', 'Place'], device: ['Thiết bị', 'Device'], event: ['Sự kiện', 'Event']};
  const scopes = {shared: ['Liên phần', 'Shared'], sg: ['Steins;Gate', 'Steins;Gate'], sg0: ['Steins;Gate 0', 'Steins;Gate 0']};
  const fields = {'all': ['Tất cả mốc', 'All milestones'], alpha: ['Alpha', 'Alpha'], beta: ['Beta', 'Beta'], 'steins-gate': ['Steins Gate', 'Steins Gate']};
  const category = key => categories[key] ? tr(...categories[key]) : key;
  const scope = key => scopes[key] ? tr(...scopes[key]) : key;
  const pageBySlug = slug => state.pages.find(p => p.slug === slug);
  async function fullPage(slug) {
    if (state.details.has(slug)) return state.details.get(slug);
    const version = state.load, page = await api('/archives/' + slug + '?spoiler=' + spoiler);
    if (version === state.load) state.details.set(slug, page);
    return page;
  }
  const normalize = s => String(s).toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
  function notice(text) { $('portal-notice').textContent = text; $('portal-notice').hidden = !text; }
  async function api(path, options = {}) {
    const response = await fetch('/api' + path, {signal: AbortSignal.timeout(20000), ...options, headers: {'Content-Type': 'application/json', ...options.headers}});
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 && path !== '/login') {
        invalidateIdentity();
        $('system-label').textContent = tr('Hệ thống', 'System');
        if (location.pathname === '/editor') render();
      }
      let message = typeof data.detail === 'string' ? data.detail : tr('Yêu cầu chưa thành công. Kiểm tra các trường và thử lại.', 'Request failed. Check the fields and try again.');
      if (ui.language === 'en') {
        if (response.status === 422) message = 'Invalid fields: ' + (typeof data.detail === 'string' ? data.detail.split(': ').slice(1).join(': ') : 'check the form.');
        else if (response.status === 401) message = 'Please sign in as admin again.';
        else if (response.status === 429) message = 'Too many requests. Wait a minute and retry.';
      }
      const error = new Error(message);
      error.status = response.status; throw error;
    }
    return response.json();
  }
  function invalidateIdentity() {
    state.authEpoch++; state.load++; state.role = 'guest'; state.drafts = []; state.editing = null;
    state.dirty = false; state.saving = false; editorLoading = false; closeCompanion();
    $('page-content').replaceChildren(node('p', 'portal-loading', tr('Đang đồng bộ phiên…', 'Refreshing session…'))); shell();
  }
  function listPreference(name) {
    const raw = get(prefKey(name)); if (!raw) return [];
    const value = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > 100 || value.some(s => typeof s !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) throw new Error('Invalid preference');
    return value;
  }
  function readBookmarks() { try { return listPreference('saved'); } catch { notice(tr('Danh sách đã lưu không đọc được; dữ liệu cũ được giữ nguyên.', 'Saved records could not be read; existing data was preserved.')); return []; } }
  function toggleBookmark(slug) {
    try {
      const items = listPreference('saved'), index = items.indexOf(slug);
      if (index < 0) { if (items.length >= 100) throw new Error('Full'); items.unshift(slug); } else items.splice(index, 1);
      if (set(prefKey('saved'), JSON.stringify(items))) render();
    } catch { notice(tr('Không lưu được hồ sơ. Kiểm tra bộ nhớ trình duyệt; giới hạn 100 mục.', 'Could not save this record. Check browser storage; the limit is 100.')); }
  }
  function pageTitle(vi, en, leadVi, leadEn, label = 'LAB ARCHIVES / 004') {
    const section = node('section', 'page-intro'); section.append(node('p', 'portal-eyebrow', label), node('h1', 'portal-heading', tr(vi, en)));
    if (leadVi) section.append(node('p', 'portal-lead', tr(leadVi, leadEn)));
    $('page-content').append(section); return section;
  }
  function sectionTitle(vi, en, href, parent = $('page-content')) {
    const h = node('div', 'portal-section-title'); h.append(node('h2', '', tr(vi, en)));
    if (href) h.append(link(tr('Khám phá ↗', 'Explore ↗'), href)); parent.append(h); return h;
  }
  function card(p) {
    const a = link('', '/archives/' + p.slug, 'archive-card');
    const meta = node('div', 'card-meta'); meta.append(node('span', '', category(p.category)), node('span', '', scope(p.scope)));
    a.append(meta, node('h3', '', local(p.title)), node('p', '', local(p.summary)));
    const tail = node('div', 'card-tail'); tail.append(node('span', '', p.kind === 'interpretation' ? tr('Diễn giải biên tập', 'Editorial interpretation') : 'CANON REFERENCE'), node('span', '', '↗')); a.append(tail); return a;
  }
  function cards(pages, parent = $('page-content')) {
    if (!pages.length) { parent.append(node('p', 'portal-empty', tr('Chưa có hồ sơ trong phạm vi này.', 'No records in this selection.'))); return; }
    const grid = node('div', 'portal-grid'); pages.forEach(p => grid.append(card(p))); parent.append(grid);
  }
  function shell() {
    const links = [['/explore', '01', 'Tổng quan', 'Overview'], ['/archives', '02', 'Kho dữ liệu', 'Archives'], ['/worldlines', '03', 'World lines', 'World lines'], ['/characters', '04', 'Nhân vật', 'Characters'], ['/research', '05', 'Nghiên cứu', 'Research']];
    if (state.role === 'admin') links.push(['/editor', '06', 'Biên tập', 'Editor']);
    $('explorer-nav').replaceChildren();
    for (const [href, id, vi, en] of links) {
      const a = link('', href); a.append(node('span', '', id), document.createTextNode(tr(vi, en)));
      const active = href === location.pathname || (href === '/archives' && location.pathname.startsWith('/archives/'));
      if (active) a.setAttribute('aria-current', 'page'); $('explorer-nav').append(a);
    }
    $('return-chat-label').textContent = tr('Kết nối với Kurisu', 'Connect to Kurisu');
    $('system-label').textContent = tr('Hệ thống', 'System');
    $('system-description').textContent = state.role === 'admin' ? tr('Biên tập & lịch sử trên máy chủ', 'Editor & server history') : tr('Lịch sử chỉ trên trình duyệt', 'History in this browser');
    $('system-badge').textContent = state.role === 'admin' ? 'ADMIN' : tr('KHÁCH', 'GUEST');
    $('spoiler-label').textContent = tr('Mức spoiler', 'Spoiler level'); $('spoiler-filter').replaceChildren();
    [['Giới thiệu · ít spoiler', 'Introduction · low spoilers'], ['Spoiler Steins;Gate', 'Steins;Gate spoilers'], ['Spoiler S;G + S;G 0', 'S;G + S;G 0 spoilers']].forEach((names, i) => { const o = node('option', '', tr(...names)); o.value = String(i); $('spoiler-filter').append(o); });
    $('spoiler-filter').value = String(spoiler);
    $('portal-footer').textContent = tr('Tóm tắt biên soạn · Nguồn theo từng hồ sơ', 'Original summaries · Sources on each record');
    $('companion-input').placeholder = tr('Hỏi Kurisu về hồ sơ này…', 'Ask Kurisu about this record…');
    $('full-chat-link').textContent = tr('Mở hội thoại đầy đủ ↗', 'Open full conversation ↗');
    $('login-title').textContent = tr('Hệ thống', 'System'); $('password-label').textContent = tr('Mật khẩu admin', 'Admin password');
    $('login-description').textContent = tr('Đăng nhập để biên tập hồ sơ. Mọi người vẫn có thể đọc và trò chuyện mà không cần tài khoản.', 'Sign in to edit records. Reading and chatting remain open to everyone.');
    $('portal-login-submit').textContent = tr('Đăng nhập', 'Sign in');
    $('page-breadcrumb').textContent = links.find(([path]) => path === location.pathname)?.[ui.language === 'en' ? 3 : 2] || tr('Hồ sơ tham chiếu', 'Reference record');
    $('companion-context').textContent = state.companion.slug ? tr('Đang tham khảo: ', 'Reading: ') + local(pageBySlug(state.companion.slug)?.title) : tr('Đối thoại nghiên cứu cùng Kurisu.', 'Research discussion with Kurisu.');
  }
  function home() {
    $('page-content').classList.add('overview-page');
    const hero = node('section', 'portal-hero'), copy = node('div', 'hero-copy');
    copy.append(node('p', 'portal-eyebrow', 'AMADEUS / KNOWLEDGE TERMINAL'), node('h1', 'portal-heading', tr('Mỗi câu hỏi mở ra một khả năng.', 'Every question opens a possibility.')),
      node('p', 'portal-lead', tr('Khám phá con người, ký ức và những nhánh thời gian của Steins;Gate. Kurisu ở đây để cùng cậu tìm hiểu.', 'Explore the people, memories and branching time of Steins;Gate. Kurisu is here to investigate with you.')));
    const actions = node('div', 'portal-actions'); actions.append(link(tr('Mở kho dữ liệu →', 'Open the archives →'), '/archives', 'portal-button primary'), link(tr('Trò chuyện với Kurisu', 'Talk to Kurisu'), '/', 'portal-button')); copy.append(actions);
    const visual = node('div', 'hero-visual'); const logo = node('img'); logo.src = '/runtime/branding/logo.webp'; logo.alt = ''; visual.append(logo, node('span', '', 'MEMORY ARCHIVE / 004')); hero.append(copy, visual); $('page-content').append(hero);
    sectionTitle('Hồ sơ hôm nay', "Today's record", '/archives');
    const featured = state.pages.filter(p => ['makise-kurisu', 'amadeus', 'memory-identity'].includes(p.slug));
    const day = Math.floor(Date.now() / 86400000); cards(featured.length ? [featured[day % featured.length], ...state.pages.filter(p => p.slug === 'd-mail' || p.slug === 'future-gadget-lab').slice(0, 2)] : state.pages.slice(0, 3));
    const question = window.AmadeusActivities.questions[day % window.AmadeusActivities.questions.length];
    const q = node('section', 'research-card home-question'), prompt = node('div');
    prompt.append(node('h2', '', tr('Một câu hỏi dành cho cậu', 'A question for you')), node('p', '', local(question)));
    q.append(prompt, button(tr('Cùng Kurisu suy nghĩ ↗', 'Think it through with Kurisu ↗'), () => openCompanion(null, local(question)))); $('page-content').append(q);
    const personal = node('details', 'home-personal'), contents = node('div', 'home-personal-content');
    personal.append(node('summary', '', tr('Góc cá nhân · đọc tiếp, hồ sơ đã lưu & khoảnh khắc', 'Your space · continue reading, saved records & moments')), contents);
    const last = pageBySlug(get(prefKey('last')));
    if (last) { sectionTitle('Tiếp tục khám phá', 'Continue exploring', null, contents); cards([last], contents); }
    const saved = readBookmarks().map(pageBySlug).filter(Boolean);
    if (saved.length) { sectionTitle('Hồ sơ đã lưu', 'Saved records', null, contents); cards(saved.slice(0, 6), contents); }
    renderJournal(contents);
    if (contents.childElementCount) $('page-content').append(personal);
  }
  function archiveList() {
    const characters = state.pages.filter(p => p.category === 'character').length, organizations = state.pages.filter(p => p.category === 'organization').length;
    pageTitle('Kho dữ liệu.', 'The archives.', `${state.pages.length} hồ sơ đang mở · ${characters} nhân vật · ${organizations} tổ chức / nhóm / cơ sở. Phạm vi anime Steins;Gate, 23β và Steins;Gate 0; lọc theo phần, loại và mức spoiler.`, `${state.pages.length} available records · ${characters} characters · ${organizations} organizations / groups / businesses. Covers the Steins;Gate, 23β and Steins;Gate 0 anime; filter by series, type and spoiler level.`);
    const form = node('form', 'archive-filters'); form.setAttribute('role', 'search');
    const search = node('input'); search.type = 'search'; search.maxLength = 300; search.placeholder = tr('Tìm trong kho dữ liệu…', 'Search the archives…'); search.setAttribute('aria-label', search.placeholder);
    const params = new URLSearchParams(location.search); search.value = (params.get('q') || '').slice(0, 300);
    const cat = node('select'), series = node('select'); cat.setAttribute('aria-label', tr('Loại hồ sơ', 'Record type')); series.setAttribute('aria-label', tr('Phần truyện', 'Series'));
    for (const [k, names] of [['', ['Mọi loại', 'All types']], ...Object.entries(categories)]) { const o = node('option', '', tr(...names)); o.value = k; cat.append(o); }
    for (const [k, names] of [['', ['Mọi phần', 'All series']], ...Object.entries(scopes)]) { const o = node('option', '', tr(...names)); o.value = k; series.append(o); }
    cat.value = params.get('type') || ''; series.value = params.get('series') || '';
    const count = node('p', 'archive-count'), results = node('div'); count.setAttribute('role', 'status');
    form.append(search, cat, series); $('page-content').append(form, count, results);
    function filter() {
      const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      const matches = state.pages.filter(p => (!cat.value || p.category === cat.value) && (!series.value || p.scope === series.value) && terms.every(t => normalize(local(p.title) + ' ' + local(p.summary)).includes(t)));
      results.replaceChildren(); cards(matches, results); count.textContent = tr(`${matches.length} hồ sơ tìm thấy`, `${matches.length} records found`);
      const next = new URLSearchParams(); if (search.value) next.set('q', search.value); if (cat.value) next.set('type', cat.value); if (series.value) next.set('series', series.value);
      history.replaceState(null, '', '/archives' + (next.size ? '?' + next : ''));
    }
    form.addEventListener('submit', e => { e.preventDefault(); filter(); }); search.addEventListener('input', filter); cat.addEventListener('change', filter); series.addEventListener('change', filter); filter();
  }
  function article(slug) {
    const p = state.details.get(slug) || pageBySlug(slug);
    if (!p) { pageTitle('Hồ sơ chưa khả dụng.', 'Record unavailable.', 'Hồ sơ chưa xuất bản, không tồn tại hoặc bị ẩn bởi mức spoiler. Có thể thay đổi mức spoiler ở góc trên.', 'The record is unpublished, missing or hidden by your spoiler level. You can adjust that level above.'); $('page-content').append(link(tr('Quay lại kho dữ liệu', 'Back to archives'), '/archives', 'portal-button')); return; }
    if (!p.body) {
      const loading = node('p', 'portal-loading', tr('Đang mở hồ sơ…', 'Opening record…')); $('page-content').append(loading); const version = state.load;
      fullPage(slug).then(() => { if (version === state.load && location.pathname === '/archives/' + slug && loading.isConnected) render(); }).catch(e => { if (loading.isConnected) { loading.textContent = e.message; loading.append(button(tr('Thử lại', 'Retry'), render)); } }); return;
    }
    document.title = local(p.title) + ' · Amadeus'; set(prefKey('last'), slug);
    const top = node('div', 'article-top'); top.append(link(tr('← Kho dữ liệu', '← Archives'), '/archives'));
    const actions = node('div', 'portal-actions'); actions.append(button(readBookmarks().includes(slug) ? tr('★ Đã lưu', '★ Saved') : tr('☆ Lưu hồ sơ', '☆ Save record'), () => toggleBookmark(slug)));
    if (p.ai_reference) actions.append(button(tr('Hỏi Kurisu ↗', 'Ask Kurisu ↗'), () => openCompanion(slug), 'portal-button primary'));
    top.append(actions); $('page-content').append(top);
    const layout = node('div', 'article-layout'), main = node('article', 'archive-article'), aside = node('aside', 'article-aside');
    const meta = node('div', 'article-meta'); [category(p.category), scope(p.scope), p.kind === 'interpretation' ? tr('DIỄN GIẢI', 'INTERPRETATION') : 'CANON'].forEach(t => meta.append(node('span', 'portal-tag', t)));
    main.append(meta, node('h1', 'portal-heading', local(p.title)), node('p', 'portal-lead', local(p.summary)));
    main.append(node('p', 'article-label-note', p.kind === 'interpretation' ? tr('Bài diễn giải biên tập. Các câu hỏi và lời dẫn không phải lời thoại chính thức của nhân vật.', 'Editorial interpretation. Questions and commentary are not official character dialogue.') : tr('Tóm tắt biên soạn theo phạm vi ghi ở nguồn. Thông tin tham khảo không tự động trở thành ký ức trực tiếp của Amadeus.', 'Original summary within the cited adaptation. Reference information does not automatically become Amadeus’s personal memory.')));
    const body = node('div', 'article-body'); window.AmadeusMarkdown.render(body, local(p.body)); main.append(body);
    if (p.image) {
      const img = node('img', 'article-portrait' + (p.image.endsWith('-sheet.png') ? ' character-sheet' : ''));
      img.src = p.image; img.alt = local(p.title); img.decoding = 'async'; img.width = 206; img.height = 206;
      img.addEventListener('error', () => img.replaceWith(node('p', 'portrait-unavailable', tr('Ảnh nhân vật tạm thời chưa tải được.', 'The character image is temporarily unavailable.'))), {once:true});
      aside.append(img);
    }
    aside.append(node('h2', '', tr('Trong hồ sơ', 'In this record')));
    body.querySelectorAll('h2,h3').forEach((h, i) => { h.id = 'record-section-' + i; const a = node('a', '', h.textContent); a.href = '#' + h.id; aside.append(a); });
    aside.append(node('h2', '', tr('Nguồn & phạm vi', 'Sources & scope')));
    p.sources.forEach(s => { const a = node('a', '', s.title + ' ↗'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(node('small', '', s.locator)); aside.append(a); });
    const related = p.related.map(pageBySlug).filter(Boolean);
    if (related.length) { aside.append(node('h2', '', tr('Hồ sơ liên quan', 'Related records'))); related.forEach(p => aside.append(link(local(p.title) + ' →', '/archives/' + p.slug))); }
    layout.append(main, aside); $('page-content').append(layout);
  }
  function worldlines() {
    pageTitle('Những nhánh khả năng.', 'Branches of possibility.', 'Bản đồ chọn lọc các mốc kể chuyện, không phải lịch thời gian đầy đủ. Bấm vào từng mốc để xem nguyên nhân và hệ quả.', 'Selected narrative milestones, not a complete chronology. Select a milestone to inspect its causes and consequences.', 'WORLD LINE OBSERVATORY');
    const controls = node('div', 'field-controls');
    Object.entries(fields).forEach(([id, names]) => { const b = button(tr(...names), () => { state.field = id; render(); }, ''); b.setAttribute('aria-pressed', String(state.field === id)); controls.append(b); }); $('page-content').append(controls);
    const events = state.timeline.filter(e => state.field === 'all' || e.field === state.field || e.field === 'shared').sort((a, b) => a.order - b.order);
    if (!events.length) { $('page-content').append(node('p', 'portal-empty', tr('Các mốc chứa spoiler. Chọn mức Steins;Gate hoặc S;G + S;G 0 để mở bản đồ.', 'These milestones contain spoilers. Choose Steins;Gate or S;G + S;G 0 above to open the map.'))); return; }
    const layout = node('div', 'worldline-layout'), line = node('div', 'timeline'), detail = node('section', 'event-detail'); detail.setAttribute('aria-live', 'polite');
    const current = events.find(e => e.id === state.selectedEvent) || events[0];
    function selectEvent(event) {
      state.selectedEvent = event.id; line.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.event === event.id)));
      detail.replaceChildren(node('p', 'portal-eyebrow', event.field.toUpperCase()), node('h2', '', local(event.title)), node('p', '', local(event.detail)), node('h3', '', tr('Nguyên nhân', 'Cause')), node('p', '', local(event.cause)), node('h3', '', tr('Hệ quả', 'Consequence')), node('p', '', local(event.result)));
      event.links.map(pageBySlug).filter(Boolean).forEach(p => detail.append(link(local(p.title) + ' ↗', '/archives/' + p.slug)));
    }
    events.forEach(event => { const b = button('', () => selectEvent(event), ''); b.dataset.event = event.id; b.append(node('small', '', `${String(event.order).padStart(2, '0')} / ${event.field.toUpperCase()}`), node('h3', '', local(event.title)), node('p', '', local(event.detail))); line.append(b); });
    selectEvent(current); layout.append(line, detail); $('page-content').append(layout);
    sectionTitle('Đối chiếu hai nhánh', 'Compare two fields');
    const compareControls = node('div', 'archive-filters'), grid = node('div', 'compare-grid'); const selects = [];
    for (const initial of ['alpha-field', 'beta-field']) {
      const select = node('select'); select.setAttribute('aria-label', tr('Nhánh để so sánh', 'Field to compare') + ' ' + (selects.length + 1));
      ['alpha-field', 'beta-field', 'steins-gate'].map(pageBySlug).filter(Boolean).forEach(p => { const o = node('option', '', local(p.title)); o.value = p.slug; select.append(o); });
      if ([...select.options].some(o => o.value === initial)) select.value = initial; selects.push(select); compareControls.append(select);
    }
    let comparison = 0;
    async function compare() {
      const version = ++comparison; grid.replaceChildren(node('p', 'portal-loading', tr('Đang đối chiếu…', 'Loading comparison…')));
      try { const pages = await Promise.all(selects.filter(s => s.value).map(s => fullPage(s.value))); if (version !== comparison || !grid.isConnected) return;
        grid.replaceChildren(); pages.forEach(p => { const section = node('section'); section.append(node('h3', '', local(p.title))); const body = node('div'); window.AmadeusMarkdown.render(body, local(p.body)); section.append(body, link(tr('Mở hồ sơ ↗', 'Open record ↗'), '/archives/' + p.slug)); grid.append(section); });
      } catch (e) { if (version === comparison && grid.isConnected) grid.replaceChildren(node('p', 'portal-empty', e.message)); }
    }
    selects.forEach(s => s.addEventListener('change', compare)); $('page-content').append(compareControls, grid); compare();
  }
  function characters() {
    const people = state.pages.filter(p => p.category === 'character');
    pageTitle('Con người phía sau dữ liệu.', 'The people behind the data.', `${people.length} hồ sơ trong mức spoiler hiện tại. Chọn tên để xem sơ đồ quan hệ gần; toàn bộ hồ sơ ở bên dưới. Bí danh không được đếm thành người riêng.`, `${people.length} records at the current spoiler level. Select a name to explore nearby relationships; all records are listed below. Aliases are not counted as extra people.`, 'PERSONNEL / RELATIONSHIP INDEX');
    if (!people.some(p => p.slug === state.person)) state.person = people[0]?.slug;
    const controls = node('div', 'archive-filters character-controls'), pickerLabel = node('label', '', tr('Tra cứu nhân vật', 'Find a character')), picker = node('select');
    picker.setAttribute('aria-label', tr('Chọn nhân vật', 'Choose a character'));
    people.forEach(p => { const option = node('option', '', local(p.title)); option.value = p.slug; picker.append(option); });
    picker.value = state.person || ''; pickerLabel.append(picker); controls.append(pickerLabel, link(tr('Xem tổ chức & các phe ↗', 'Browse organizations & factions ↗'), '/archives?type=organization', 'portal-button')); $('page-content').append(controls);
    const layout = node('div', 'people-layout'), map = node('div', 'relationship-map'), detail = node('section', 'event-detail'), relations = node('div', 'relationship-list');
    function showRelation(r) {
      const from = pageBySlug(r.from), to = pageBySlug(r.to); if (!from || !to) return;
      map.querySelectorAll('.relation-edge').forEach(edge => edge.setAttribute('aria-pressed', String(edge.dataset.from === r.from && edge.dataset.to === r.to)));
      let note = detail.querySelector('.relationship-note');
      if (!note) { note = node('div', 'relationship-note research-result'); note.setAttribute('role', 'status'); detail.append(note); }
      const other = r.from === state.person ? to : from;
      note.replaceChildren(node('strong', '', local(from.title) + ' ↔ ' + local(to.title)), node('p', '', local(r.label)), link(tr('Đọc về ', 'Read about ') + local(other.title), '/archives/' + other.slug));
    }
    function selectPerson(p) {
      if (!p) return;
      state.person = p.slug; picker.value = p.slug; renderGraph();
      detail.replaceChildren(node('p', 'portal-eyebrow', 'PERSONNEL FILE'), node('h2', '', local(p.title)), node('p', '', local(p.summary)), link(tr('Mở hồ sơ đầy đủ ↗', 'Open full record ↗'), '/archives/' + p.slug), relations); relations.replaceChildren();
      const connections = state.relations.filter(r => (r.from === p.slug || r.to === p.slug) && pageBySlug(r.from) && pageBySlug(r.to));
      if (!connections.length) relations.append(node('p', '', tr('Chưa mở mối liên kết trong mức spoiler này.', 'No connections available at this spoiler level.')));
      connections.forEach(r => {
        const other = pageBySlug(r.from === p.slug ? r.to : r.from);
        const b = button('', () => showRelation(r), '');
        b.append(node('strong', '', local(p.title) + ' ↔ ' + local(other.title)), document.createTextNode(local(r.label))); relations.append(b);
      });
    }
    const svgNode = (tag, attrs = {}) => { const el = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v))); return el; };
    const graph = svgNode('svg', {viewBox: '0 0 560 490', role: 'group', 'aria-label': tr('Sơ đồ quan hệ. Chọn nhân vật hoặc đường nối.', 'Relationship graph. Select a person or a connection.')});
    function accessibleAction(el, action) { el.addEventListener('click', action); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); } }); }
    function renderGraph() {
      graph.replaceChildren();
      const points = new Map(), focused = people.length > 8, selected = pageBySlug(state.person);
      const connections = state.relations.filter(r => (r.from === state.person || r.to === state.person) && people.some(p => p.slug === r.from) && people.some(p => p.slug === r.to));
      const neighbors = [...new Set(connections.map(r => r.from === state.person ? r.to : r.from))].map(pageBySlug);
      const graphPeople = focused ? [selected, ...neighbors.slice(0, 8)].filter(Boolean) : people;
      const initialPoints = [[280, 70], [110, 225], [165, 410], [395, 410], [450, 225]];
      graphPeople.forEach((p, i) => {
        const angle = -Math.PI / 2 + (focused ? i - 1 : i) * 2 * Math.PI / Math.max(1, focused ? graphPeople.length - 1 : graphPeople.length);
        points.set(p.slug, focused && i === 0 ? [280, 245] : !focused && graphPeople.length === 5 ? initialPoints[i] : [280 + Math.cos(angle) * 190, 245 + Math.sin(angle) * 180]);
      });
      state.relations.filter(r => points.has(r.from) && points.has(r.to) && (!focused || r.from === state.person || r.to === state.person)).forEach(r => {
        const [x1, y1] = points.get(r.from), [x2, y2] = points.get(r.to);
        const edge = svgNode('g', {class: 'relation-edge', role: 'button', tabindex: 0, 'aria-label': local(pageBySlug(r.from).title) + ' ↔ ' + local(pageBySlug(r.to).title), 'aria-pressed': 'false'});
        edge.dataset.from = r.from; edge.dataset.to = r.to;
        edge.append(svgNode('line', {x1, y1, x2, y2, class: 'edge-target'}), svgNode('line', {x1, y1, x2, y2, class: 'edge-visible'}));
        const title = svgNode('title'); title.textContent = local(r.label); edge.append(title);
        accessibleAction(edge, () => { if (!focused) selectPerson(pageBySlug(r.from)); showRelation(r); }); graph.append(edge);
      });
      graphPeople.forEach(p => {
        const [x, y] = points.get(p.slug), g = svgNode('g', {class: 'person-node', role: 'button', tabindex: 0, 'aria-label': local(p.title), 'aria-pressed': String(p.slug === state.person)}); g.dataset.person = p.slug;
        const name = local(p.title).split(' · ')[0], label = svgNode('text', {x, y: y + 5, 'text-anchor': 'middle'}), title = svgNode('title');
        label.textContent = name.length > 22 ? name.slice(0, 21) + '…' : name; title.textContent = local(p.title);
        g.append(title, svgNode('rect', {x: x - 74, y: y - 25, width: 148, height: 50, rx: 4}), label); accessibleAction(g, () => { selectPerson(p); map.querySelector(`[data-person="${p.slug}"]`)?.focus(); }); graph.append(g);
      });
      map.replaceChildren(graph, node('p', 'archive-count', focused ? tr(`Đang xem ${Math.min(neighbors.length, 8)}/${neighbors.length} liên kết trực tiếp. Danh sách bên cạnh có đầy đủ; đổi tên để xem bất kỳ hồ sơ nào.`, `Showing ${Math.min(neighbors.length, 8)}/${neighbors.length} direct connections. The adjacent list is complete; choose any profile above.`) : tr('Chọn một đường nối để xem quan hệ. Enter / Space để thao tác bằng bàn phím.', 'Select a connection to inspect it. Use Enter / Space with the keyboard.')));
    }
    picker.addEventListener('change', () => selectPerson(pageBySlug(picker.value)));
    layout.append(map, detail); $('page-content').append(layout); if (people.length) selectPerson(pageBySlug(state.person));
    sectionTitle('Hồ sơ nhân vật', 'Character records'); cards(people);
  }
  function research() {
    pageTitle('Một phòng lab để thử nghĩ khác.', 'A lab for thinking differently.', 'Các hoạt động do dự án biên soạn. Kết quả mô phỏng không phải sự kiện chính thức hay cơ chế du hành thời gian thật.', 'Activities authored for this project. Simulated outcomes are neither official story events nor real time-travel mechanisms.', 'EXPERIMENTAL / FICTION & REASONING');
    sectionTitle('Phân cảnh cùng Kurisu', 'Scenes with Kurisu');
    const scenes = node('div', 'portal-grid'); window.AmadeusActivities.scenes.forEach(s => { const c = node('section', 'archive-card'); c.append(node('span', 'portal-eyebrow', s.tag), node('h3', '', local(s.title)), node('p', '', local(s.description)), node('p', 'card-tail', local(s.goal)), button(tr('Bắt đầu đối thoại ↗', 'Start the dialogue ↗'), () => openCompanion(null, local(s.prompt)))); scenes.append(c); }); $('page-content').append(scenes);
    renderDmail();
    sectionTitle('Kiểm tra một giả thuyết', 'Test a hypothesis');
    const reset = button(tr('Làm lại bài tập', 'Reset exercises'), () => { state.answers.clear(); render(); }); $('page-content').append(reset);
    window.AmadeusActivities.puzzles.forEach(p => {
      const c = node('section', 'research-card'); c.append(node('p', 'portal-eyebrow', 'REASONING / ' + p.id.toUpperCase()), node('h2', '', local(p.title)), node('p', '', local(p.question)));
      const choices = node('div', 'choice-list'), selected = state.answers.get(p.id);
      p.options.forEach((option, i) => { const b = button(local(option), () => { if (!state.answers.has(p.id)) { state.answers.set(p.id, i); render(); } }, ''); b.disabled = selected !== undefined; b.setAttribute('aria-pressed', String(selected === i)); choices.append(b); }); c.append(choices);
      if (selected !== undefined) { c.append(node('div', 'research-result', tr(selected === p.answer ? 'Đúng. ' : 'Cần xem lại giả thuyết. ', selected === p.answer ? 'Correct. ' : 'Reconsider the hypothesis. ') + local(p.explanation)), button(tr('Thảo luận với Kurisu ↗', 'Discuss with Kurisu ↗'), () => openCompanion(null, local(p.question) + '\n\n' + tr('Tôi đã chọn: ', 'I chose: ') + local(p.options[selected]) + '\n' + local(p.explanation)))); }
      $('page-content').append(c);
    });
  }
  function renderDmail() {
    sectionTitle('Bàn thử D-mail', 'The D-mail bench');
    const c = node('section', 'research-card'); c.append(node('p', 'portal-eyebrow', 'AUTHORED SIMULATION / NOT CANON'), node('h2', '', tr('18:00 · chiếc ngăn kéo', '18:00 · the drawer')), node('p', '', tr('Trong phân cảnh giả tưởng, cậu tìm thấy một ngăn kéo bị kẹt và một ghi chú chưa rõ nguồn. Chọn tin nhắn muốn gửi cho bản thân trước đó.', 'In this fictional scene, you find a jammed drawer and a note of unknown origin. Choose a message for your earlier self.')));
    const choices = [['Đừng mở ngăn kéo lúc 18:00.', 'Do not open the drawer at 18:00.'], ['Kiểm tra bản lề và chụp ảnh trước khi mở.', 'Check the hinge and photograph it before opening.'], ['Không gửi. Quan sát thêm trước.', 'Send nothing. Observe first.']];
    const outcomes = [
      ['Cậu tránh mở ngăn kéo, nhưng vẫn chưa biết ghi chú có đáng tin hay điều gì gây ra tiếng động. Tránh một hành động chưa kiểm chứng được giả thuyết về nguyên nhân.', 'You avoid opening it, but still do not know whether the note is reliable or what caused the noise. Avoiding an action has not tested the causal hypothesis.'],
      ['Ảnh cho thấy bản lề lỏng. Tiếng động có một lời giải thích thông thường. Cậu có thêm bằng chứng, nhưng chưa chứng minh tin nhắn có thể đến từ tương lai.', 'The photograph shows a loose hinge. The noise has an ordinary explanation. You gain evidence, but have not established that a message can arrive from the future.'],
      ['Cậu ghi lại thời gian, người có mặt và tình trạng ngăn kéo. Chưa có kết luận mới, nhưng dữ liệu quan sát giúp phân biệt các lời giải thích sau đó.', 'You record the time, people present and condition of the drawer. There is no new conclusion yet, but observations help distinguish later explanations.'],
    ];
    const list = node('div', 'choice-list'); choices.forEach((names, i) => { const b = button(tr(...names), () => { state.mail = i; render(); }, ''); b.setAttribute('aria-pressed', String(state.mail === i)); list.append(b); }); c.append(list);
    if (state.mail !== null) c.append(node('div', 'research-result', tr(...outcomes[state.mail])), button(tr('Để Kurisu phản biện ↗', 'Let Kurisu challenge this ↗'), () => openCompanion(null, tr('Trong một mô phỏng hư cấu, tôi chọn: ', 'In a fictional simulation I chose: ') + tr(...choices[state.mail]) + '\n' + tr(...outcomes[state.mail]) + '\n' + tr('Giúp tôi phân biệt điều đã quan sát và điều mới phỏng đoán.', 'Help me distinguish observations from assumptions.'))));
    $('page-content').append(c);
  }
  function renderJournal(parent = $('page-content')) {
    const key = `amadeus.${state.role}.moments.v1`;
    try {
      const raw = get(key); if (!raw) return; const moments = JSON.parse(raw);
      if (!Array.isArray(moments) || moments.length > 100 || moments.some(m => typeof m.text !== 'string' || m.text.length > 2400 || typeof m.createdAt !== 'string' || !Number.isFinite(Date.parse(m.createdAt)))) throw new Error('Invalid journal');
      if (!moments.length) return; sectionTitle('Khoảnh khắc đã giữ', 'Kept moments', null, parent);
      parent.append(node('p', 'archive-count', tr('Nhật ký trên trình duyệt này · tách riêng khách và admin.', 'Journal on this browser · separate for guests and admin.')));
      moments.slice(0, 3).forEach(m => { const c = node('section', 'journal-entry'), time = node('time', '', new Date(m.createdAt).toLocaleString(ui.locale)); time.dateTime = m.createdAt; const quote = node('div'); window.AmadeusMarkdown.render(quote, m.text); c.append(time, quote); parent.append(c); });
    } catch { notice(tr('Không đọc được nhật ký; dữ liệu cũ được giữ nguyên.', 'Could not read the journal; existing data was preserved.')); }
  }
  function render() {
    shell(); $('page-content').replaceChildren(); $('page-content').classList.remove('overview-page'); document.title = 'Lab Archives · Amadeus';
    if (state.fetching) { $('page-content').append(node('p', 'portal-loading', tr('Đang mở kho dữ liệu…', 'Opening archives…'))); return; }
    if (state.error) { pageTitle('Chưa mở được kho dữ liệu.', 'Archives could not be opened.', 'Kiểm tra kết nối rồi thử lại. Cuộc trò chuyện của cậu vẫn ở trang chat.', 'Check your connection and retry. Your conversations remain on the chat page.'); $('page-content').append(button(tr('Thử lại', 'Retry'), load)); return; }
    const path = location.pathname.replace(/\/$/, '');
    if (path === '/archives') archiveList();
    else if (path.startsWith('/archives/')) article(path.slice(10));
    else if (path === '/worldlines') worldlines();
    else if (path === '/characters') characters();
    else if (path === '/research') research();
    else if (path === '/editor') renderEditor();
    else home();
  }
  async function load() {
    const version = ++state.load; state.fetching = true; render();
    try {
      const [data, status] = await Promise.all([api('/archives?spoiler=' + spoiler), api('/status')]);
      if (version !== state.load) return;
      const role = status.role === 'admin' ? 'admin' : 'guest';
      if (role !== state.role) { state.authEpoch++; state.drafts = []; state.editing = null; state.dirty = false; closeCompanion(); }
      state.role = role; state.status = status; state.pages = data.pages; state.details.clear(); state.timeline = data.timeline; state.relations = data.relations; state.error = false; state.fetching = false;
      if (state.companion.slug && !pageBySlug(state.companion.slug)) closeCompanion();
      render();
    } catch (e) { if (version === state.load) { state.error = true; state.fetching = false; render(); notice(e.message); } }
  }
  function canLeave() { return !state.saving && (!state.dirty || window.confirm(tr('Bản nháp chưa lưu. Bỏ các thay đổi đang viết?', 'This draft has unsaved changes. Discard them?'))); }
  function navigate(href) { if (!canLeave()) return; state.dirty = false; history.pushState(null, '', href); setNavigation(false, false); render(); $('page-content').focus(); $('page-content').scrollTop = 0; }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-route]'); if (!a || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (a.getAttribute('href') === '/') { if (!canLeave()) e.preventDefault(); return; }
    e.preventDefault(); navigate(a.getAttribute('href'));
  });
  window.addEventListener('popstate', () => { if (state.dirty || state.saving) { notice(tr('Bản nháp chưa lưu vẫn ở đây. Lưu trước khi chuyển trang.', 'Your unsaved draft is still here. Save it before leaving.')); history.pushState(null, '', '/editor'); return; } setNavigation(false, false); render(); $('page-content').scrollTop = 0; });
  window.addEventListener('beforeunload', e => { if (state.dirty || state.saving) { e.preventDefault(); e.returnValue = ''; } });
  $('spoiler-filter').addEventListener('change', () => { if (!canLeave()) { $('spoiler-filter').value = String(spoiler); return; } state.dirty = false; spoiler = Number($('spoiler-filter').value); set('amadeus.explorer.spoiler', String(spoiler)); load(); });
  document.addEventListener('amadeus:language', () => { if (state.dirty && location.pathname === '/editor') { shell(); notice(tr('Lưu bản nháp trước khi làm mới biểu mẫu ngôn ngữ.', 'Save the draft before refreshing the form language.')); return; } render(); });
  window.addEventListener('storage', e => { if (e.key === 'amadeus.auth.changed') { invalidateIdentity(); load(); } else if (e.key === prefKey('saved') && !state.dirty) render(); });
  let checkingIdentity = false;
  async function checkIdentity() {
    if (checkingIdentity || document.hidden || state.fetching) return;
    checkingIdentity = true; const epoch = state.authEpoch;
    try { const status = await api('/status'); if (epoch === state.authEpoch && (status.role === 'admin' ? 'admin' : 'guest') !== state.role) { invalidateIdentity(); await load(); } }
    catch { /* An offline tab keeps its draft; writes still require server auth. */ }
    finally { checkingIdentity = false; }
  }
  window.addEventListener('focus', checkIdentity);
  document.addEventListener('visibilitychange', checkIdentity);
  $('system-button').addEventListener('click', () => { setNavigation(false, false); state.role === 'admin' ? navigate('/editor') : $('portal-login').showModal(); });
  $('close-login').addEventListener('click', () => $('portal-login').close());
  $('portal-login').addEventListener('close', () => { $('portal-password').value = ''; $('login-error').hidden = true; });
  $('portal-login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('portal-login-submit').disabled = true;
    try { await api('/login', {method: 'POST', body: JSON.stringify({password: $('portal-password').value})}); $('portal-password').value = ''; $('portal-login').close(); set('amadeus.auth.changed', crypto.randomUUID()); await load(); navigate('/editor'); }
    catch (error) { $('login-error').textContent = error.message; $('login-error').hidden = false; }
    finally { $('portal-login-submit').disabled = false; }
  });

  // Companion uses the existing guest browser store and authenticated admin APIs.
  // Its session is created only on Send, and its original reference is server-resolved.
  async function chatStore(path, options) { return state.role === 'guest' ? window.AmadeusGuestStore.request(path, options) : api(path, options); }
  let companionOpener = null;
  const navigationMedia = window.matchMedia('(max-width:760px)');
  let navigationOpen = false;
  function setNavigation(open, restoreFocus = true) {
    navigationOpen = navigationMedia.matches && open;
    $('explorer-sidebar').classList.toggle('open', navigationOpen);
    $('explorer-menu').setAttribute('aria-expanded', String(navigationOpen));
    $('explorer-backdrop').hidden = !navigationOpen;
    syncCompanionAccess();
    if (navigationOpen) $('explorer-sidebar').querySelector('a').focus();
    else if (restoreFocus && navigationMedia.matches) $('explorer-menu').focus();
  }
  $('explorer-menu').addEventListener('click', () => setNavigation(!navigationOpen));
  $('explorer-backdrop').addEventListener('click', () => setNavigation(false));
  navigationMedia.addEventListener('change', () => setNavigation(false, false));
  $('explorer-sidebar').addEventListener('keydown', e => {
    if (!navigationOpen || e.key !== 'Tab') return;
    const controls = [...$('explorer-sidebar').querySelectorAll('a,button')], first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && navigationOpen) { e.preventDefault(); setNavigation(false); } });
  function syncCompanionAccess() {
    const modal = !$('companion').hidden && window.matchMedia('(max-width:600px)').matches;
    $('explorer-main').inert = modal || navigationOpen;
    $('explorer-sidebar').inert = modal || (navigationMedia.matches && !navigationOpen);
    $('companion').setAttribute('role', modal ? 'dialog' : 'complementary');
    if (modal) $('companion').setAttribute('aria-modal', 'true'); else $('companion').removeAttribute('aria-modal');
  }
  syncCompanionAccess();
  function closeCompanion() {
    const c = state.companion; c.epoch++; c.controller?.abort(); c.busy = false; c.sid = null; c.slug = null; c.retry = null;
    $('companion').hidden = true; $('companion-messages').replaceChildren(); $('companion-input').value = '';
    $('companion-error').hidden = true; $('companion-send').disabled = false; $('companion-stop').hidden = true;
    syncCompanionAccess(); if (companionOpener?.isConnected) companionOpener.focus(); companionOpener = null;
  }
  async function openCompanion(slug, draft = '') {
    const c = state.companion; if (c.busy) { notice(tr('Chờ Kurisu trả lời hoặc dừng lượt hiện tại trước khi đổi tài liệu.', 'Wait for Kurisu or stop the current turn before switching references.')); return; }
    const same = c.slug === slug && !$('companion').hidden;
    const existingDraft = $('companion-input').value;
    if (!same) { closeCompanion(); $('companion-input').value = existingDraft; }
    companionOpener = document.activeElement; c.slug = slug; $('companion').hidden = false; shell(); syncCompanionAccess();
    if (draft) {
      const current = $('companion-input').value.trim(); const next = current ? current + '\n\n' + draft : draft;
      if (next.length <= 6000) $('companion-input').value = next;
      else notice(tr('Bản nháp quá dài; nội dung đang viết được giữ nguyên.', 'The draft is too long; your existing text was preserved.'));
    }
    $('companion-input').focus();
  }
  $('close-companion').addEventListener('click', closeCompanion);
  window.addEventListener('resize', syncCompanionAccess);
  $('companion').addEventListener('keydown', e => {
    if (e.key !== 'Tab' || $('companion').getAttribute('aria-modal') !== 'true') return;
    const controls = [...$('companion').querySelectorAll('button,a,textarea')].filter(n => !n.hidden && !n.disabled);
    const first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $('companion-stop').addEventListener('click', () => state.companion.controller?.abort());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('companion').hidden && !state.companion.busy) closeCompanion(); });
  $('companion-input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('companion-form').requestSubmit(); } });
  $('companion-form').addEventListener('submit', async e => {
    e.preventDefault(); const c = state.companion, text = $('companion-input').value.trim(); if (c.busy || !text || text.length > 6000) return;
    const role = state.role, epoch = c.epoch, slug = c.slug;
    const request = c.retry && c.retry.text === text && c.retry.slug === slug ? c.retry : {text, slug, rid: crypto.randomUUID(), language: ui.language};
    const {rid, language} = request; c.retry = request;
    c.busy = true; c.controller = new AbortController(); $('companion-send').disabled = true; $('companion-stop').hidden = false; $('companion-error').hidden = true;
    let assistant, reader;
    try {
      if (!c.sid) {
        const session = await chatStore('/sessions', {method: 'POST', body: JSON.stringify({mode: 'amadeus'})});
        if (epoch !== c.epoch) return;
        c.sid = session.id; set(`amadeus.${role}.active`, c.sid);
      }
      const sid = c.sid, body = {text, request_id: rid, language, ...(slug ? {archive_slug: slug} : {}), ...(role === 'guest' ? window.AmadeusGuestStore.context(sid) : {})};
      $('companion-input').value = '';
      [...$('companion-messages').children].filter(n => n.dataset.request === rid).forEach(n => n.remove());
      const userTurn = node('div', 'companion-turn user', text); userTurn.dataset.request = rid; $('companion-messages').append(userTurn);
      assistant = node('div', 'companion-turn assistant', tr('Đang suy nghĩ…', 'Thinking…')); assistant.dataset.request = rid; $('companion-messages').append(assistant);
      const response = await fetch(role === 'guest' ? '/api/guest/messages' : `/api/sessions/${sid}/messages`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: c.controller.signal});
      if (!response.ok) { if (response.status === 401) { set('amadeus.auth.changed', crypto.randomUUID()); closeCompanion(); await load(); } const info = await response.json().catch(() => ({})); throw new Error(typeof info.detail === 'string' ? info.detail : tr('Không gửi được tin nhắn.', 'Could not send the message.')); }
      reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '', answer = '', done = false;
      while (!done) {
        const chunk = await reader.read(); if (epoch !== c.epoch) break; if (chunk.done) break;
        buffer += decoder.decode(chunk.value, {stream: true}); if (buffer.length > 200000) throw new Error('Invalid stream'); let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          const kind = block.split('\n').find(l => l.startsWith('event:'))?.slice(6).trim(); const raw = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('\n'); if (!raw) continue;
          const data = JSON.parse(raw);
          if (kind === 'error') throw new Error(data.message);
          if (kind === 'delta') { answer += data.text; if (answer.length > 20000) throw new Error('Invalid stream'); window.AmadeusMarkdown.render(assistant, answer); }
          if (kind === 'done') {
            if (role === 'guest') await window.AmadeusGuestStore.commitTurn(sid, rid, text, data);
            done = true; c.retry = null; window.AmadeusMarkdown.render(assistant, data.text);
          }
          $('companion-messages').scrollTop = $('companion-messages').scrollHeight;
        }
      }
      if (epoch === c.epoch && !done) throw new Error(tr('Lượt trả lời chưa hoàn tất. Có thể xem kết quả đã lưu ở trang chat.', 'The reply did not finish. Check the chat page for any saved result.'));
    } catch (error) {
      if (epoch === c.epoch) { $('companion-error').textContent = error.name === 'AbortError' ? tr('Đã dừng. Lượt chưa hoàn tất không lưu vào lịch sử khách.', 'Stopped. Incomplete turns are not saved to guest history.') : error.message; $('companion-error').hidden = false; if (!$('companion-input').value.trim()) $('companion-input').value = text; }
    } finally {
      if (reader) { try { await reader.cancel(); } catch {} }
      if (epoch === c.epoch) { c.busy = false; c.controller = null; $('companion-send').disabled = false; $('companion-stop').hidden = true; }
    }
  });

  // Editorial forms keep both locales together and use optimistic revisions.
  function blankPage() {
    return {slug: '', category: 'concept', scope: 'shared', kind: 'canon', spoiler: 0, title: {vi: '', en: ''}, summary: {vi: '', en: ''}, body: {vi: '', en: ''}, sources: [], related: [], image: '', ai_reference: false};
  }
  let editorLoading = false;
  async function fetchDrafts() {
    if (editorLoading || state.role !== 'admin') return;
    editorLoading = true; const epoch = state.authEpoch;
    try { const drafts = await api('/admin/archives'); if (state.role !== 'admin' || state.authEpoch !== epoch) return; state.drafts = drafts; if (!state.editing) state.editing = drafts[0] || {page: blankPage(), revision: 0, visibility: 'hidden'}; if (location.pathname === '/editor' && !state.dirty) render(); }
    catch (e) { notice(e.message); }
    finally { if (state.authEpoch === epoch) editorLoading = false; }
  }
  function renderEditor() {
    if (state.role !== 'admin') { pageTitle('Khu vực biên tập.', 'Editorial workspace.', 'Đăng nhập admin để tạo bản nháp và xuất bản hồ sơ.', 'Sign in as admin to draft and publish records.'); $('page-content').append(button(tr('Đăng nhập admin', 'Admin sign-in'), () => $('portal-login').showModal())); return; }
    pageTitle('Biên tập kho dữ liệu.', 'Edit the archives.', 'Lưu bản nháp trước, xem trước rồi xuất bản. Bản nháp không hiển thị công khai và không được dùng làm tài liệu AI.', 'Save a draft, preview it, then publish. Drafts are private and excluded from AI reference.', 'ADMIN / EDITORIAL CONTROL');
    const toolbar = node('div', 'editor-toolbar');
    const selector = node('select'); selector.setAttribute('aria-label', tr('Chọn hồ sơ biên tập', 'Choose a record to edit'));
    state.drafts.forEach(d => { const o = node('option', '', local(d.page.title) + ' · r' + d.revision); o.value = d.page.slug; selector.append(o); });
    if (state.editing) selector.value = state.editing.page.slug;
    selector.addEventListener('change', () => { if (!canLeave()) { selector.value = state.editing?.page.slug || ''; return; } state.dirty = false; state.editing = state.drafts.find(d => d.page.slug === selector.value); render(); });
    toolbar.append(selector, button(tr('+ Hồ sơ mới', '+ New record'), () => { if (!canLeave()) return; state.dirty = false; state.editing = {page: blankPage(), revision: 0, visibility: 'hidden'}; render(); }), button(tr('Tải lại bản mới', 'Reload latest'), () => { if (!canLeave()) return; state.dirty = false; state.editing = null; fetchDrafts(); }), button(tr('Sao lưu hồ sơ', 'Export records'), () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify({version: 1, exported_at: new Date().toISOString(), drafts: state.drafts}, null, 2)], {type: 'application/json'}));
      const a = node('a'); a.href = url; a.download = 'amadeus-archives-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }), button(tr('Đăng xuất', 'Sign out'), async () => { if (!canLeave()) return; try { await api('/logout', {method: 'POST'}); invalidateIdentity(); set('amadeus.auth.changed', crypto.randomUUID()); await load(); } catch (e) { notice(e.message); } })); $('page-content').append(toolbar);
    if (!state.editing) { $('page-content').append(node('p', 'portal-loading', tr('Đang tải bản nháp…', 'Loading drafts…'))); fetchDrafts(); return; }
    const item = state.editing, p = structuredClone(item.page), form = node('form', 'editor-form');
    const controls = {};
    function field(key, vi, en, value, type = 'text', options = null, wide = false) {
      const label = node('label', wide ? 'wide' : '', tr(vi, en)); let input;
      if (options) { input = node('select'); options.forEach(([v, label]) => { const o = node('option', '', label); o.value = String(v); input.append(o); }); }
      else { input = node(type === 'textarea' ? 'textarea' : 'input'); if (type !== 'textarea') input.type = type; }
      input.id = 'editor-' + key; input.value = value; input.required = !['related', 'image'].includes(key); input.maxLength = key.startsWith('body') ? 16000 : key.startsWith('summary') ? 500 : key.startsWith('title') ? 120 : 6000;
      label.append(input); form.append(label); controls[key] = input; return input;
    }
    const slug = field('slug', 'Đường dẫn hồ sơ (chữ thường và dấu -)', 'Record slug (lowercase and hyphens)', p.slug); slug.pattern = '[a-z0-9]+(-[a-z0-9]+)*'; slug.maxLength = 70; slug.readOnly = Boolean(p.slug);
    field('category', 'Loại hồ sơ', 'Record type', p.category, 'text', Object.entries(categories).map(([k, n]) => [k, tr(...n)]));
    field('scope', 'Phạm vi', 'Adaptation scope', p.scope, 'text', Object.entries(scopes).map(([k, n]) => [k, tr(...n)]));
    field('spoiler', 'Mức spoiler', 'Spoiler level', p.spoiler, 'text', [[0, tr('Giới thiệu', 'Introduction')], [1, 'Steins;Gate'], [2, 'S;G + S;G 0']]);
    field('kind', 'Tính chất nội dung', 'Content classification', p.kind, 'text', [['canon', 'Canon reference'], ['interpretation', tr('Diễn giải biên tập', 'Editorial interpretation')]]);
    const imageOptions = new Map([['', tr('Không có', 'None')], ['/assets/kurisu-account.jpg', 'Kurisu'], ['/runtime/branding/logo.webp', 'Amadeus']]);
    [...state.pages, ...state.drafts.map(d => d.page)].forEach(record => { if (record.image && !imageOptions.has(record.image)) imageOptions.set(record.image, local(record.title)); });
    if (p.image && !imageOptions.has(p.image)) imageOptions.set(p.image, local(p.title));
    field('image', 'Ảnh đại diện', 'Record image', p.image, 'text', [...imageOptions]);
    for (const lang of ['vi', 'en']) field('title-' + lang, 'Tiêu đề · ' + lang.toUpperCase(), 'Title · ' + lang.toUpperCase(), p.title[lang]);
    for (const lang of ['vi', 'en']) field('summary-' + lang, 'Tóm tắt · ' + lang.toUpperCase(), 'Summary · ' + lang.toUpperCase(), p.summary[lang], 'textarea').className = 'short';
    for (const lang of ['vi', 'en']) field('body-' + lang, 'Nội dung Markdown · ' + lang.toUpperCase(), 'Markdown content · ' + lang.toUpperCase(), p.body[lang], 'textarea', null, true);
    field('related', 'Hồ sơ liên quan (slug, cách nhau bằng dấu phẩy)', 'Related record slugs (comma-separated)', p.related.join(', '), 'text', null, true);
    const sources = field('sources', 'Nguồn (mỗi dòng: tiêu đề | URL HTTPS | tập / phạm vi)', 'Sources (one per line: title | HTTPS URL | episode / scope)', p.sources.map(s => [s.title, s.url, s.locator].join(' | ')).join('\n'), 'textarea', null, true); sources.className = 'short code';
    const checkLabel = node('label', 'check wide'), check = node('input'); check.type = 'checkbox'; check.checked = p.ai_reference; checkLabel.append(check, document.createTextNode(tr('Cho Kurisu dùng bản đã xuất bản làm tài liệu tham khảo', 'Allow Kurisu to use the published version as reference'))); form.append(checkLabel);
    const status = node('p', 'editor-status', tr(`Phiên bản r${item.revision} · ${item.visibility}`, `Revision r${item.revision} · ${item.visibility}`)); status.setAttribute('role', 'status');
    form.addEventListener('input', () => { state.dirty = true; status.classList.add('editor-dirty'); status.textContent = tr('Có thay đổi chưa lưu.', 'There are unsaved changes.'); });
    const footer = node('div', 'editor-footer'), preview = node('section', 'editor-preview'); preview.hidden = true;
    function collect() {
      const sourceList = controls.sources.value.trim().split('\n').filter(Boolean).map(line => { const bits = line.split('|').map(v => v.trim()); if (bits.length !== 3) throw new Error(tr('Mỗi nguồn cần đúng 3 cột, ngăn bằng |.', 'Each source needs exactly three columns separated by |.')); return {title: bits[0], url: bits[1], locator: bits[2]}; });
      return {...p, slug: controls.slug.value.trim(), category: controls.category.value, scope: controls.scope.value, spoiler: Number(controls.spoiler.value), kind: controls.kind.value, image: controls.image.value,
        title: {vi: controls['title-vi'].value.trim(), en: controls['title-en'].value.trim()}, summary: {vi: controls['summary-vi'].value.trim(), en: controls['summary-en'].value.trim()}, body: {vi: controls['body-vi'].value.trim(), en: controls['body-en'].value.trim()},
        related: controls.related.value.split(',').map(s => s.trim()).filter(Boolean), sources: sourceList, ai_reference: check.checked};
    }
    function lock(locked) { state.saving = locked; form.querySelectorAll('input,textarea,select').forEach(n => n.disabled = locked); footer.querySelectorAll('button').forEach(n => n.disabled = locked); toolbar.querySelectorAll('button,select').forEach(n => n.disabled = locked); }
    async function save(action) {
      if (state.saving || !form.reportValidity()) return;
      const epoch = state.authEpoch;
      lock(true);
      try {
        const page = collect();
        const saved = await api('/admin/archives/' + page.slug, {method: 'PUT', body: JSON.stringify({page, revision: item.revision})});
        if (state.authEpoch !== epoch || state.role !== 'admin') return;
        item.revision = saved.revision; item.page = page;
        if (action !== 'save') { const result = await api(`/admin/archives/${page.slug}/${action}`, {method: 'POST', body: JSON.stringify({revision: item.revision})}); item.revision = result.revision; item.visibility = action === 'publish' ? 'published' : 'hidden'; }
        if (state.authEpoch !== epoch || state.role !== 'admin') return;
        state.dirty = false; state.saving = false; state.editing = item; state.drafts = []; await fetchDrafts();
        const data = await api('/archives?spoiler=' + spoiler); if (state.authEpoch !== epoch) return; state.pages = data.pages; state.details.clear();
        notice(tr(action === 'publish' ? 'Đã xuất bản hồ sơ.' : action === 'unpublish' ? 'Đã ẩn hồ sơ khỏi công khai và tài liệu AI.' : 'Đã lưu bản nháp. Bản công khai giữ nguyên.', action === 'publish' ? 'Record published.' : action === 'unpublish' ? 'Record hidden from public view and AI reference.' : 'Draft saved. The public version is unchanged.'));
      } catch (e) { if (state.authEpoch === epoch) { status.textContent = e.message; notice(e.status === 409 ? tr('Xung đột phiên bản. Nội dung đang viết vẫn được giữ; sao chép phần cần giữ trước khi tải lại.', 'Revision conflict. Your text is preserved; copy anything needed before reloading.') : e.message); } }
      finally { if (state.authEpoch === epoch) lock(false); }
    }
    footer.append(button(tr('Lưu nháp', 'Save draft'), () => save('save'), 'portal-button primary'), button(tr('Xem trước', 'Preview'), () => { try { const page = collect(); preview.hidden = false; preview.replaceChildren(node('p', 'portal-eyebrow', 'DRAFT PREVIEW / ' + ui.language.toUpperCase()), node('h2', '', local(page.title)), node('p', 'portal-lead', local(page.summary))); const body = node('div', 'article-body'); window.AmadeusMarkdown.render(body, local(page.body)); preview.append(body); preview.scrollIntoView({block: 'nearest'}); } catch (e) { notice(e.message); } }), button(tr('Xuất bản', 'Publish'), () => save('publish')), button(tr('Ẩn khỏi công khai', 'Unpublish'), () => save('unpublish')));
    form.addEventListener('submit', e => { e.preventDefault(); save('save'); }); $('page-content').append(status, form, preview, footer);
  }
  // Apply the same night preference without starting model/audio on archive pages.
  document.documentElement.dataset.night = String(get('amadeus.atmosphere.night') !== 'off');
  window.addEventListener('storage', e => { if (e.key === 'amadeus.atmosphere.night') document.documentElement.dataset.night = String(e.newValue !== 'off'); });
  load();
})();
