'use strict';

(() => {
  const key = 'amadeus.guest.history.v1';
  const empty = () => ({version: 1, sessions: [], memories: []});
  function read() {
    let raw;
    try { raw = window.localStorage.getItem(key); }
    catch { throw new Error('Trình duyệt đang chặn lưu lịch sử. Cho phép lưu dữ liệu trang để dùng chế độ khách.'); }
    if (!raw) return empty();
    let data;
    try { data = JSON.parse(raw); } catch { /* Preserve the original value. */ }
    if (data?.version !== 1 || !Array.isArray(data.sessions) || !Array.isArray(data.memories)
        || data.sessions.some(s => typeof s.id !== 'string' || !['amadeus', 'lab'].includes(s.mode) || !Array.isArray(s.messages))) {
      throw new Error('Không đọc được lịch sử trên trình duyệt. Hãy giữ lại dữ liệu trang trước khi đặt lại bộ nhớ.');
    }
    return data;
  }
  function save(data) {
    try { window.localStorage.setItem(key, JSON.stringify(data)); }
    catch { throw new Error('Không lưu được lịch sử trên trình duyệt. Hãy tải hoặc sao chép hội thoại cần giữ, rồi xóa bớt chat để có chỗ trống.'); }
  }
  async function mutate(action) {
    const run = () => {const data = read(); const result = action(data); save(data); return result;};
    // Serialize writes across tabs when Web Locks is available.
    return window.navigator.locks ? window.navigator.locks.request(key, run) : run();
  }
  function session(data, id) {
    const result = data.sessions.find(s => s.id === id);
    if (!result) throw new Error('Không tìm thấy cuộc hội thoại trên trình duyệt này.');
    return result;
  }
  function completion(chat, rid) {
    const index = chat.messages.findIndex(m => m.role === 'user' && m.request_id === rid);
    if (index < 0 || chat.messages[index + 1]?.role !== 'assistant' || chat.messages[index + 1].request_id !== rid) return null;
    return {input: chat.messages[index].content, answer: chat.messages[index + 1]};
  }
  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    if (path === '/sessions') {
      if (method === 'GET') return read().sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map(({messages, ...summary}) => summary);
      if (method === 'POST') return mutate(data => {
        if (data.sessions.length >= 100) throw new Error('Đã có 100 hội thoại trên trình duyệt. Xóa bớt chat trước khi tạo mới.');
        const mode = body.mode || 'amadeus';
        if (!['amadeus', 'lab'].includes(mode)) throw new Error('Chế độ hội thoại không hợp lệ.');
        const now = new Date().toISOString();
        const chat = {id: crypto.randomUUID(), title: 'Cuộc trò chuyện mới', mode, created_at: now, updated_at: now, messages: []};
        data.sessions.unshift(chat);
        return chat;
      });
    }
    const match = /^\/sessions\/([^/]+)(?:\/(export|requests\/[^/]+))?$/.exec(path);
    if (match) {
      const [, id, suffix] = match;
      if (method === 'DELETE' && !suffix) return mutate(data => {
        data.sessions = data.sessions.filter(s => s.id !== id);
        return {ok: true};
      });
      const chat = session(read(), id);
      if (method === 'GET') {
        if (suffix === 'export') return {title: chat.title, mode: chat.mode, messages: chat.messages};
        if (suffix?.startsWith('requests/')) return {completed: Boolean(completion(chat, suffix.slice(9)))};
        if (!suffix) return {...chat, messages: chat.messages.slice(-400)};
      }
    }
    if (path === '/memories') {
      if (method === 'GET') return read().memories;
      if (method === 'POST') return mutate(data => {
        const content = String(body.content || '').trim();
        if (!content || content.length > 1000) throw new Error('Ghi chú cần từ 1 đến 1000 ký tự.');
        if (data.memories.length >= 50) throw new Error('Đã có 50 ghi chú. Xóa bớt trước khi thêm.');
        const note = {id: crypto.randomUUID(), content, created_at: new Date().toISOString()};
        data.memories.push(note);
        return note;
      });
    }
    if (path.startsWith('/memories/') && method === 'DELETE') return mutate(data => {
      data.memories = data.memories.filter(m => m.id !== path.slice(10));
      return {ok: true};
    });
    throw new Error('Thao tác lưu trữ khách không hợp lệ.');
  }
  function context(id) {
    const data = read(), chat = session(data, id), pairs = [];
    let budget = 24000;
    for (let i = chat.messages.length - 2; i >= 0 && pairs.length < 12; i -= 2) {
      const pair = chat.messages.slice(i, i + 2);
      const size = pair[0].content.length + pair[1].content.length;
      if (size > budget) break;
      pairs.unshift(pair.map(({role, content}) => ({role, content})));
      budget -= size;
    }
    const memories = [];
    budget = 5000;
    for (const {content} of [...data.memories].reverse()) {
      if (content.length <= budget) {memories.unshift({content}); budget -= content.length;}
    }
    return {mode: chat.mode, history: pairs.flat(), memories};
  }
  async function commitTurn(id, rid, text, result) {
    return mutate(data => {
      const chat = session(data, id);
      const previous = completion(chat, rid);
      if (previous) {
        if (previous.input !== text) throw new Error('Mã gửi lại không khớp tin nhắn cũ.');
        return;
      }
      const created_at = new Date().toISOString();
      chat.messages.push({id: crypto.randomUUID(), role: 'user', content: text, request_id: rid, created_at},
        {id: crypto.randomUUID(), role: 'assistant', content: result.text, request_id: rid, created_at,
          knowledge: result.knowledge || [], sources: result.sources || []});
      if (chat.title === 'Cuộc trò chuyện mới') chat.title = text.trim().replace(/\s+/g, ' ').slice(0, 64);
      chat.updated_at = created_at;
    });
  }
  window.AmadeusGuestStore = Object.freeze({key, request, context, commitTurn});
})();
