/* Card ordering for toolbox pages.
   Mark a container with data-order="name". Visitors click 調整順序,
   drag cards (or use ▲ ▼), and the order is saved in this browser. */
(function () {
  'use strict';
  var PREFIX = 'tnmr-card-order:';
  var STYLE = '.order-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px;font-size:13px;color:#617775}' +
    '.order-bar button{border:1px solid #dce7e2;background:#fff;color:#176b5c;border-radius:9px;padding:7px 11px;font:inherit;font-size:13px;font-weight:750;cursor:pointer}' +
    '.order-bar .primary{background:#176b5c;color:#fff;border-color:#176b5c}' +
    '.order-ctrl{display:none;gap:6px;margin-top:10px}' +
    '.order-mode>*>.order-ctrl{display:flex}' +
    '.order-mode>*{cursor:grab}' +
    '.order-mode>* a{pointer-events:none}' +
    '.order-mode>.order-dragging{opacity:.45;cursor:grabbing}' +
    '.order-handle{display:inline-flex;align-items:center;border:1px dashed #9fc5b4;background:#f3faf6;color:#176b5c;border-radius:8px;padding:5px 10px;font-size:13px;font-weight:750;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}' +
    '.order-no-select,.order-no-select *{user-select:none;-webkit-user-select:none}' +
    '.order-ctrl button{border:1px solid #dce7e2;background:#fff;color:#176b5c;border-radius:8px;padding:5px 10px;font:inherit;font-size:13px;font-weight:750;cursor:pointer}' +
    '.order-ctrl button:disabled{opacity:.35;cursor:default}' +
    '.order-mode{outline:2px dashed #b9d6c8;outline-offset:6px;border-radius:12px}';

  function ensureStyle() {
    if (document.getElementById('card-order-style')) return;
    var st = document.createElement('style');
    st.id = 'card-order-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  function labelOf(el) {
    var h = el.querySelector('h1,h2,h3,h4,strong,.label');
    var t = ((h && h.textContent) || el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.slice(0, 80);
  }

  function items(c) {
    var seen = {};
    return Array.prototype.filter.call(c.children, function (el) {
      return el.nodeType === 1 && !el.classList.contains('order-bar') && el.tagName !== 'SCRIPT';
    }).map(function (el) {
      var base = labelOf(el), k = base, n = 1;
      while (seen[k]) { n++; k = base + '#' + n; }
      seen[k] = true;
      return { el: el, key: k };
    });
  }

  function savedOrder(name) {
    try {
      var v = JSON.parse(localStorage.getItem(PREFIX + name) || 'null');
      return Array.isArray(v) ? v : null;
    } catch (e) { return null; }
  }

  function saveOrder(c) {
    try {
      localStorage.setItem(PREFIX + c.dataset.order, JSON.stringify(items(c).map(function (x) { return x.key; })));
    } catch (e) { /* storage unavailable: order works for this visit only */ }
  }

  function applySaved(c, observer) {
    var saved = savedOrder(c.dataset.order);
    if (!saved) return;
    var rank = {};
    saved.forEach(function (k, i) { if (!(k in rank)) rank[k] = i; });
    var list = items(c);
    var known = list.filter(function (x) { return x.key in rank; })
      .sort(function (a, b) { return rank[a.key] - rank[b.key]; });
    var unknown = list.filter(function (x) { return !(x.key in rank); });
    if (observer) observer.disconnect();
    known.concat(unknown).forEach(function (x) { c.appendChild(x.el); });
    if (observer) observer.observe(c, { childList: true });
  }

  function addControls(c) {
    items(c).forEach(function (x) {
      if (x.el.querySelector(':scope > .order-ctrl')) return;
      var box = document.createElement('div');
      box.className = 'order-ctrl';
      var up = document.createElement('button');
      up.type = 'button'; up.textContent = '▲ 上移'; up.setAttribute('aria-label', '上移');
      var down = document.createElement('button');
      down.type = 'button'; down.textContent = '▼ 下移'; down.setAttribute('aria-label', '下移');
      up.onclick = function () {
        var prev = x.el.previousElementSibling;
        if (prev && !prev.classList.contains('order-bar')) { c.insertBefore(x.el, prev); }
        saveOrder(c); refresh(c);
      };
      down.onclick = function () {
        var next = x.el.nextElementSibling;
        if (next) { c.insertBefore(next, x.el); }
        saveOrder(c); refresh(c);
      };
      var handle = document.createElement('span');
      handle.className = 'order-handle'; handle.textContent = '⠿ 拖曳';
      handle.setAttribute('aria-hidden', 'true');
      box.append(handle, up, down);
      x.el.appendChild(box);
    });
  }

  function refresh(c) {
    var list = items(c);
    list.forEach(function (x, i) {
      var box = x.el.querySelector(':scope > .order-ctrl');
      if (!box) return;
      var b = box.querySelectorAll('button');
      b[0].disabled = i === 0;
      b[1].disabled = i === list.length - 1;
    });
  }

  function setDraggable(c, on) {
    /* Kept for the MutationObserver hook; dragging is handled by pointer events. */
    items(c).forEach(function (x) { x.el.classList.toggle('order-item', !!on); });
  }

  /* Pointer-event dragging works with mouse, finger and pen.
     Mouse: drag anywhere on the card. Touch: drag the ⠿ handle (the rest of
     the card still scrolls the page). */
  function enableDrag(c) {
    var drag = null;

    function cardOf(node) {
      while (node && node.parentNode !== c) node = node.parentNode;
      return node && node.nodeType === 1 && !node.classList.contains('order-bar') ? node : null;
    }

    c.addEventListener('pointerdown', function (e) {
      if (!c.classList.contains('order-mode') || e.button > 0) return;
      var onHandle = e.target.closest && e.target.closest('.order-handle');
      if (!onHandle && (e.pointerType !== 'mouse' || (e.target.closest && e.target.closest('button')))) return;
      var card = cardOf(e.target);
      if (!card) return;
      drag = { el: card, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
      c.dataset.dragging = '1';
      if (onHandle) e.preventDefault();
    });

    document.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
        drag.moved = true;
        drag.el.classList.add('order-dragging');
        document.body.classList.add('order-no-select');
      }
      e.preventDefault();
      if (e.clientY < 70) window.scrollBy(0, -14);
      else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
      var over = cardOf(document.elementFromPoint(e.clientX, e.clientY));
      if (!over || over === drag.el) return;
      var r = over.getBoundingClientRect();
      var d = drag.el.getBoundingClientRect();
      // Same row in a multi-column grid: compare horizontally; otherwise vertically.
      var sameRow = Math.abs(r.top - d.top) < r.height / 2;
      var after = sameRow ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
      var ref = after ? over.nextElementSibling : over;
      if (ref !== drag.el && drag.el.nextElementSibling !== ref) c.insertBefore(drag.el, ref);
    }, { passive: false });

    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var moved = drag.moved;
      drag.el.classList.remove('order-dragging');
      document.body.classList.remove('order-no-select');
      drag = null;
      delete c.dataset.dragging;
      if (moved) { saveOrder(c); refresh(c); }
    }
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  }

  function buildBar(c, observer) {
    var bar = document.createElement('div');
    bar.className = 'order-bar';
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = '調整順序';
    var reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = '恢復預設順序';
    var hint = document.createElement('span');
    hint.textContent = '可拖曳卡片或按 ▲ ▼ 調整，會自動儲存在這個瀏覽器';
    toggle.onclick = function () {
      var on = c.classList.toggle('order-mode');
      toggle.textContent = on ? '完成排序' : '調整順序';
      toggle.classList.toggle('primary', on);
      if (on) { addControls(c); refresh(c); }
      setDraggable(c, on);
    };
    reset.onclick = function () {
      try { localStorage.removeItem(PREFIX + c.dataset.order); } catch (e) {}
      location.reload();
    };
    bar.append(toggle, reset, hint);
    c.parentNode.insertBefore(bar, c);
  }

  function init() {
    ensureStyle();
    document.querySelectorAll('[data-order]').forEach(function (c) {
      var observer = new MutationObserver(function () {
        if (c.dataset.dragging) return; /* don't undo the card being dragged */
        applySaved(c, observer);
        if (c.classList.contains('order-mode')) { addControls(c); refresh(c); setDraggable(c, true); }
      });
      applySaved(c, observer);
      observer.observe(c, { childList: true });
      buildBar(c, observer);
      enableDrag(c);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
