// 通用工具：随机数、日期、DOM 构造
window.TM = window.TM || {};
(function (TM) {
  const U = {};

  U.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  U.clone = o => JSON.parse(JSON.stringify(o));
  U.sleep = ms => new Promise(r => setTimeout(r, ms));

  // 日期统一用本地时间的 YYYY-MM-DD 字符串
  U.dateKey = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  U.today = () => U.dateKey(new Date());
  U.addDays = (key, n) => {
    const [y, m, d] = key.split('-').map(Number);
    return U.dateKey(new Date(y, m - 1, d + n));
  };
  U.daysBetween = (from, to) => {
    const p = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
    return Math.round((p(to) - p(from)) / 86400000);
  };
  U.fmtTime = sec => {
    const m = Math.floor(sec / 60), s = Math.round(sec % 60);
    return m ? `${m} 分 ${s} 秒` : `${s} 秒`;
  };

  // 数字选项：正确答案 + 常见错误 + 邻近数，从小到大排列
  U.numChoices = (answer, opts = {}) => {
    const { count = 4, min = 0, max = 20, near = [] } = opts;
    const set = new Set([answer]);
    const ok = c => Number.isInteger(c) && c >= min && c <= max;
    const cands = U.shuffle(near).concat(U.shuffle([1, -1, 2, -2]).map(d => answer + d), [answer + 3, answer - 3]);
    for (const c of cands) {
      if (set.size >= count) break;
      if (ok(c)) set.add(c);
    }
    for (let c = min; set.size < count && c <= max; c++) set.add(c);
    return [...set].sort((x, y) => x - y);
  };

  // 创建元素：U.h('div', {class: 'x', onclick: fn}, child1, child2)
  U.h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v);
      }
    }
    for (const c of kids.flat()) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : String(c));
    }
    return el;
  };

  // 长按 ms 毫秒才触发（家长入口防误触）
  U.longPress = (el, ms, fn) => {
    let timer = null;
    const stop = () => { clearTimeout(timer); el.classList.remove('pressing'); };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      el.classList.add('pressing');
      timer = setTimeout(() => { stop(); fn(); }, ms);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, stop));
    el.addEventListener('contextmenu', e => e.preventDefault());
  };

  TM.U = U;
})(window.TM);
