'use strict';

(() => {
  // Only parser-generated HTML enters the DOM. Raw model HTML stays escaped;
  // remote images are disabled, and link protocols are checked before use.
  const parser = window.markdownit({html: false, linkify: true, breaks: true}).disable('image');
  parser.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    let safe = false;
    try { safe = ['http:', 'https:', 'mailto:'].includes(new URL(token.attrGet('href'), window.location.href).protocol); }
    catch { /* Invalid links stay inert. */ }
    if (safe) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noopener noreferrer');
    } else {
      token.attrs = (token.attrs || []).filter(([name]) => name !== 'href');
    }
    return renderer.renderToken(tokens, index, options);
  };
  // Table alignment uses classes so it works with the app's strict style CSP.
  for (const type of ['th_open', 'td_open']) {
    parser.renderer.rules[type] = (tokens, index, options, env, renderer) => {
      const token = tokens[index];
      const alignment = /^text-align:(left|right|center);?$/.exec(token.attrGet('style') || '');
      token.attrs = (token.attrs || []).filter(([name]) => name !== 'style');
      if (alignment) token.attrSet('class', 'md-align-' + alignment[1]);
      return renderer.renderToken(tokens, index, options);
    };
  }
  const pending = new WeakMap();
  function render(body, text) {
    const queued = pending.get(body);
    if (queued) { window.cancelAnimationFrame(queued.frame); pending.delete(body); }
    body.classList.add('markdown-body');
    body.innerHTML = parser.render(text);
  }
  function stream(body, text) {
    if (!window.requestAnimationFrame) { render(body, text); return; }
    const queued = pending.get(body);
    if (queued) { queued.text = text; return; }
    const next = {text, frame: 0};
    next.frame = window.requestAnimationFrame(() => {
      pending.delete(body);
      render(body, next.text);
    });
    pending.set(body, next);
  }
  window.AmadeusMarkdown = Object.freeze({render, stream});
})();
