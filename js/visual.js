// 图示（题目配图、提示图）和坦克图形
(function (TM) {
  const { U } = TM;
  const h = U.h;
  const V = {};

  const dot = (cls, txt) => h('span', { class: 'dot ' + (cls || '') }, txt || '');

  const renderers = {
    // 一堆东西，每排 group 个；cross 个被拿走；box 表示还有一些藏在盒子里
    emoji(v) {
      const g = v.group || 5;
      const wrap = h('div', { class: 'v-emoji' });
      for (let r = 0; r * g < v.n; r++) {
        const row = h('div', { class: 'v-row' + (v.mark5 ? ' marked' : '') });
        for (let i = r * g; i < Math.min(v.n, (r + 1) * g); i++) {
          row.append(h('span', { class: 'em' + (v.cross && i >= v.n - v.cross ? ' gone' : '') }, v.e));
        }
        if (v.mark5) row.append(h('span', { class: 'v-tag' }, String(Math.min(v.n, (r + 1) * g))));
        wrap.append(row);
      }
      if (v.box) wrap.append(h('div', { class: 'v-box' }, '🎁 ?'));
      return wrap;
    },
    // 左右两堆
    emoji2(v) {
      return h('div', { class: 'v-two' },
        renderers.emoji({ e: v.e, n: v.a, group: 5 }),
        h('span', { class: 'v-plus' }, '和'),
        renderers.emoji({ e: v.e, n: v.b, group: 5 }));
    },
    // 两组圆点；ghost 表示第二组是虚线（要求的部分）
    dots(v) {
      const wrap = h('div', { class: 'v-dots' });
      v.groups.forEach((n, gi) => {
        const g = h('div', { class: 'v-group' });
        const box = h('div', { class: 'v-dotbox' });
        for (let i = 0; i < n; i++) box.append(dot(gi === 0 ? 'red' : 'blue' + (v.ghost === gi ? ' ghost' : '')));
        g.append(box, h('div', { class: 'v-label' }, v.ghost === gi ? '?' : String(n)));
        wrap.append(g);
      });
      return wrap;
    },
    // n 个圆点，后 cross 个划掉
    cross(v) {
      const box = h('div', { class: 'v-dotbox wide' });
      for (let i = 0; i < v.n; i++) box.append(dot(i >= v.n - v.cross ? 'red crossed' : 'blue'));
      return h('div', { class: 'v-dots' }, h('div', { class: 'v-group' }, box,
        h('div', { class: 'v-label' }, v.hide ? `一共 ${v.n} 个` : `${v.n} 个，划掉 ${v.cross} 个`)));
    },
    // 两个十格：第一个装满 10，第二个放剩下的
    tenframe(v) {
      const need = 10 - v.a, rest = Math.max(0, v.b - need);
      const frame = (red, blue, label) => {
        const f = h('div', { class: 'v-frame' });
        for (let i = 0; i < 10; i++) f.append(dot(i < red ? 'red' : i < red + blue ? 'blue' : 'empty'));
        return h('div', { class: 'v-group' }, f, h('div', { class: 'v-label' }, label));
      };
      if (!v.b) return h('div', { class: 'v-dots' }, frame(v.a, 0, `${v.a} 个，空 ${need} 格`));
      return h('div', { class: 'v-dots' },
        frame(v.a, need, `${v.a} + ${need} = 10`),
        frame(0, rest, `还剩 ${rest}`));
    },
    // 数轴
    line(v) {
      const wrap = h('div', { class: 'v-line' });
      for (let i = v.from; i <= v.to; i++) {
        const on = (v.marks || []).includes(i);
        wrap.append(h('div', { class: 'tick' + (on ? ' on' : '') }, h('span', null, String(i))));
      }
      return wrap;
    },
    // 几排东西对齐比较
    rows(v) {
      return h('div', { class: 'v-rows' }, v.rows.map(r => {
        const row = h('div', { class: 'v-row' });
        for (let i = 0; i < r.n; i++) row.append(h('span', { class: 'em' }, r.e));
        row.append(h('span', { class: 'v-tag' }, String(r.n)));
        return row;
      }));
    },
    // 排队；num: 'left' | 'right' 给每个标号；hl 可以是一个或几个下标
    // walk: 'left' | 'right' 画出队伍往哪边走；cap 是队伍下面的一句说明
    queue(v) {
      const n = v.items.length, hl = [].concat(v.hl);
      const ends = v.ends || ['', ''];
      const row = h('div', { class: 'v-queue' });
      v.items.forEach((e, i) => {
        const k = v.num === 'right' ? n - i : i + 1;
        row.append(h('div', { class: 'q-item' + (hl.includes(i) ? ' hl' : '') },
          h('span', { class: 'em' }, e),
          v.num ? h('span', { class: 'q-num' }, String(k)) : null));
      });
      const line = h('div', { class: 'v-queuewrap' },
        ends[0] ? h('span', { class: 'q-end' }, ends[0]) : null, row, ends[1] ? h('span', { class: 'q-end' }, ends[1]) : null);
      if (!v.walk && !v.cap) return line;
      return h('div', { class: 'v-queuebox' },
        v.walk ? h('div', { class: 'q-walk ' + v.walk }, v.walk === 'left' ? '⬅ 往这边走' : '往这边走 ➡') : null,
        line, v.cap ? h('div', { class: 'q-cap' }, v.cap) : null);
    },
    // 公交线路：names 是站名，at 是车现在停的站，dir: 'left' | 'right' 是车开的方向
    stops(v) {
      return h('div', { class: 'v-stops' },
        h('div', { class: 'q-walk ' + v.dir }, v.dir === 'left' ? '⬅ 车往这边开' : '车往这边开 ➡'),
        h('div', { class: 's-line' }, v.names.map((s, i) => h('div', { class: 's-stop' + (i === v.at ? ' at' : '') + ((v.hl || []).includes(i) ? ' hl' : '') },
          h('span', { class: 's-bus' }, i === v.at ? '🚌' : ''), h('i'), h('b', null, s)))));
    },
    // 一条路分成两条道，walker 朝 dir（'away' 背对着你往前走 / 'toward' 朝你走过来）
    road(v) {
      const lane = k => h('div', { class: 'r-lane' + (v.hl === k ? ' hl' : '') }, h('b', null, k === 1 ? '①号道' : '②号道'),
        (v.lane === k) ? h('span', { class: 'r-who' }, v.e, h('small', null, v.dir === 'away' ? '⬆' : '⬇')) : null);
      return h('div', { class: 'v-road' },
        h('div', { class: 'r-cap' }, v.dir === 'away' ? `${v.e} 背对着你，往前走 ⬆` : `${v.e} 朝着你走过来 ⬇`),
        h('div', { class: 'r-lanes' }, lane(1), h('i', { class: 'r-mid' }), lane(2)),
        h('div', { class: 'f-me' }, h('span', null, '我的左边'), h('b', null, '🧒'), h('span', null, '我的右边')));
    },
    // 分与合
    bond(v) {
      const c = x => h('div', { class: 'b-cell' + (x === '?' ? ' ask' : '') }, x === '?' ? '?' : String(x));
      return h('div', { class: 'v-bond' },
        h('div', { class: 'b-top' }, c(v.whole)),
        h('div', { class: 'b-lines' }, h('i', { class: 'l' }), h('i', { class: 'r' })),
        h('div', { class: 'b-bottom' }, c(v.parts[0]), c(v.parts[1])));
    },
    // 小棒：一捆十根 + 单根
    tens(v) {
      const wrap = h('div', { class: 'v-sticks' + (v.small ? ' small' : '') });
      for (let t = 0; t < v.tens; t++) {
        const b = h('div', { class: 'bundle' });
        for (let i = 0; i < 10; i++) b.append(h('i'));
        wrap.append(h('div', { class: 'v-group' }, b, v.small ? null : h('div', { class: 'v-label' }, '1 个十')));
      }
      if (v.ones) {
        const o = h('div', { class: 'ones' });
        for (let i = 0; i < v.ones; i++) o.append(h('i'));
        wrap.append(h('div', { class: 'v-group' }, o, h('div', { class: 'v-label' }, `${v.ones} 个一`)));
      }
      return wrap;
    },
    // 3 层的格子（位置题）；hl 是要突出的格子 [[行, 列]]；num 标出数的方向
    grid(v) {
      const hl = v.hl || [];
      const g = h('div', { class: 'v-grid' });
      v.rows.forEach((row, r) => {
        const line = h('div', { class: 'g-row' });
        if (v.num) line.append(h('span', { class: 'g-lab' }, `第${v.num.top ? r + 1 : v.rows.length - r}层`));
        row.forEach((e, c) => line.append(h('span', { class: 'g-cell' + (hl.some(x => x[0] === r && x[1] === c) ? ' hl' : '') }, e)));
        g.append(line);
      });
      if (v.num && v.num.left != null) {
        const n = v.rows[0].length;
        g.append(h('div', { class: 'g-row g-foot' }, h('span', { class: 'g-lab' }),
          v.rows[0].map((_, c) => h('span', { class: 'g-cell num' }, String(v.num.left ? c + 1 : n - c)))));
      }
      if (v.side === false) return g;
      return h('div', { class: 'v-gridwrap' }, h('span', { class: 'q-end' }, '左'), g, h('span', { class: 'q-end' }, '右'));
    },
    // 面对面：对面的小动物举起一只手（mark 时标出来）；back 时它背对着你，左右和你一样
    face(v) {
      const right = v.back ? v.hand === '左' : v.hand === '右';
      const hand = v.mark || v.show ? h('span', { class: 'f-hand' }, '✋', v.mark ? h('small', null, v.hand + '手') : null) : h('span', { class: 'f-hand' });
      const top = h('div', { class: 'f-top' }, right ? hand : h('span', { class: 'f-hand' }), h('span', { class: 'f-who' }, v.e), right ? h('span', { class: 'f-hand' }) : hand);
      return h('div', { class: 'v-face' }, top,
        h('div', { class: 'f-mid' }, v.back ? '它背对着你（你看到的是它的后背）' : '⬆ 面对面 ⬇'),
        h('div', { class: 'f-me' }, h('span', null, '我的左边'), h('b', null, '🧒'), h('span', null, '我的右边')));
    },
    // 一堆混在一起的东西；hl 是要圈出来的下标
    pile(v) {
      const hl = v.hl || [];
      return h('div', { class: 'v-pile' }, v.items.map((e, i) => h('span', { class: 'em' + (hl.includes(i) ? ' hl' : '') }, e)));
    },
    // 钟面
    clock(v) {
      const hr = ((v.h % 12) + v.m / 60) * 30, mn = v.m * 6;
      const nums = Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return `<text x="${60 + Math.sin(a) * 39}" y="${60 - Math.cos(a) * 39 + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#3b3355">${i + 1}</text>`;
      }).join('');
      const ticks = Array.from({ length: 60 }, (_, i) => `<line x1="60" y1="${i % 5 ? 6 : 5}" x2="60" y2="${i % 5 ? 8 : 11}" stroke="#7a7397" stroke-width="${i % 5 ? 1 : 2}" transform="rotate(${i * 6} 60 60)"/>`).join('');
      const svg = `<svg viewBox="0 0 120 120" class="v-clock">
        <circle cx="60" cy="60" r="56" fill="#fff" stroke="#ff8a3d" stroke-width="5"/>${ticks}${nums}
        <line x1="60" y1="60" x2="60" y2="16" stroke="#4aa8ff" stroke-width="4" stroke-linecap="round" transform="rotate(${mn} 60 60)"/>
        <line x1="60" y1="60" x2="60" y2="32" stroke="#e8645a" stroke-width="7" stroke-linecap="round" transform="rotate(${hr} 60 60)"/>
        <circle cx="60" cy="60" r="5" fill="#3b3355"/></svg>`;
      const wrap = h('div', { class: 'v-clockwrap', html: svg });
      if (v.labels) wrap.append(h('div', { class: 'v-legend' }, h('span', { class: 'c-h' }, '短针：时针'), h('span', { class: 'c-m' }, '长针：分针')));
      return wrap;
    },
    // 四种立体图形；hl 是要突出的名字
    shapes(v) {
      const S = {
        长方体: '<path d="M10 30 L60 30 L60 70 L10 70Z" fill="#ffb84d"/><path d="M10 30 L24 16 L74 16 L60 30Z" fill="#ffd27f"/><path d="M60 30 L74 16 L74 56 L60 70Z" fill="#e8962b"/>',
        正方体: '<path d="M14 30 L50 30 L50 66 L14 66Z" fill="#4aa8ff"/><path d="M14 30 L28 16 L64 16 L50 30Z" fill="#8cc8ff"/><path d="M50 30 L64 16 L64 52 L50 66Z" fill="#2479c9"/>',
        圆柱: '<path d="M18 20 L18 62 A22 8 0 0 0 62 62 L62 20Z" fill="#6bd66b"/><ellipse cx="40" cy="20" rx="22" ry="8" fill="#a8eca8"/>',
        球: '<circle cx="40" cy="42" r="28" fill="#ff7eb6"/><ellipse cx="30" cy="32" rx="9" ry="6" fill="#fff" opacity=".6"/>',
      };
      return h('div', { class: 'v-shapes' }, Object.keys(S).map(k => h('div', { class: 'v-shape' + (v.hl === k ? ' hl' : '') },
        h('span', { html: `<svg viewBox="0 0 80 80">${S[k]}</svg>` }), h('b', null, k))));
    },
    // 破十法：从 10 里减，再加上个位
    borrow(v) {
      const ones = v.a - 10;
      const f = h('div', { class: 'v-frame' });
      for (let i = 0; i < 10; i++) f.append(dot(i < v.b ? 'red crossed' : 'blue'));
      const o = h('div', { class: 'v-dotbox' });
      for (let i = 0; i < ones; i++) o.append(dot('blue'));
      return h('div', { class: 'v-dots' },
        h('div', { class: 'v-group' }, f, h('div', { class: 'v-label' }, `10 − ${v.b} = ${10 - v.b}`)),
        ones ? h('div', { class: 'v-group' }, o, h('div', { class: 'v-label' }, `还有 ${ones} 个`)) : null);
    },
  };

  V.render = v => (v && renderers[v.kind] ? h('div', { class: 'visual' }, renderers[v.kind](v)) : null);

  // ---------- 坦克 ----------
  const PAL = {
    enemy: ['#e8645a', '#ff958b', '#b23b33'],
    elite: ['#f2b705', '#ffd84d', '#b98500'],
    boss: ['#8e5bd8', '#b48bf0', '#5d35a0'],
    broken: ['#9aa3ad', '#c4cbd2', '#6c757d'],
  };

  // 我方坦克车身上的花纹（d 是暗色）
  const DECO = {
    camo: d => `<g fill="${d}" opacity=".55"><ellipse cx="30" cy="46" rx="7" ry="4"/><ellipse cx="70" cy="80" rx="8" ry="4"/><ellipse cx="28" cy="80" rx="6" ry="5"/><ellipse cx="72" cy="44" rx="6" ry="4"/></g>`,
    star: () => '<path d="M27 40 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -.6z M73 70 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -.6z" fill="#fff" opacity=".9"/>',
    flame: () => '<path d="M22 86 q4 -14 10 -10 q0 -10 8 -12 q-2 10 4 14 q4 -6 8 -4 q-4 8 0 12z M78 86 q-4 -14 -10 -10 q0 -10 -8 -12 q2 10 -4 14 q-4 -6 -8 -4 q4 8 0 12z" fill="#ffe14d" opacity=".9"/>',
    shine: () => '<path d="M26 44 l6 -6 M30 50 l10 -10" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>',
    dots: () => '<g fill="#fff" opacity=".7"><circle cx="28" cy="42" r="3"/><circle cx="72" cy="44" r="3.5"/><circle cx="26" cy="72" r="3"/><circle cx="74" cy="80" r="3"/><circle cx="34" cy="86" r="2.5"/><circle cx="66" cy="38" r="2.5"/></g>',
    panda: d => `<g fill="${d}"><ellipse cx="28" cy="43" rx="7" ry="6"/><ellipse cx="72" cy="43" rx="7" ry="6"/><ellipse cx="29" cy="83" rx="6" ry="5"/><ellipse cx="71" cy="83" rx="6" ry="5"/></g>`,
    snow: () => `<g stroke="#fff" stroke-width="2.4" stroke-linecap="round">${[[28, 44], [72, 82], [27, 80], [73, 44]].map(([x, y]) =>
      `<path d="M${x - 6} ${y} h12 M${x} ${y - 6} v12 M${x - 4} ${y - 4} l8 8 M${x + 4} ${y - 4} l-8 8"/>`).join('')}</g>`,
    night: () => '<g fill="#fff"><circle cx="27" cy="44" r="1.8"/><circle cx="74" cy="40" r="1.5"/><circle cx="24" cy="66" r="1.4"/><circle cx="35" cy="86" r="1.5"/><circle cx="66" cy="87" r="1.4"/></g><path d="M77 70 a8 8 0 1 0 0 14 a6 6 0 1 1 0 -14z" fill="#fff59d"/>',
    bolt: () => '<path d="M30 38 l-6 14 h6 l-4 14 10 -18 h-6 l4 -10z M70 66 l-6 14 h6 l-4 14 10 -18 h-6 l4 -10z" fill="#ffe14d"/>',
    lava: () => '<path d="M24 44 l8 6 -4 8 8 6 M76 46 l-7 7 5 7 -6 8 M26 86 l8 -6 6 4 M74 86 l-8 -6" stroke="#ff8a3d" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  const face = (cx, cy, kind, angry) => kind === 'broken'
    ? `<path d="M${cx - 13} ${cy - 4} l8 6 M${cx - 5} ${cy - 4} l-8 6 M${cx + 5} ${cy - 4} l8 6 M${cx + 13} ${cy - 4} l-8 6" stroke="#333" stroke-width="3" stroke-linecap="round"/>
       <rect x="${cx + 6}" y="${cy + 6}" width="16" height="6" rx="2" fill="#fff" transform="rotate(-25 ${cx + 14} ${cy + 9})"/>`
    : `<circle cx="${cx - 8}" cy="${cy}" r="6" fill="#fff"/><circle cx="${cx + 8}" cy="${cy}" r="6" fill="#fff"/>
       <circle cx="${cx - (angry ? 8 : 7)}" cy="${cy + (angry ? 1 : -1)}" r="3" fill="#222"/><circle cx="${cx + (angry ? 8 : 9)}" cy="${cy + (angry ? 1 : -1)}" r="3" fill="#222"/>
       <circle cx="${cx - 15}" cy="${cy + 8}" r="3.5" fill="#ff8fa3" opacity=".7"/><circle cx="${cx + 15}" cy="${cy + 8}" r="3.5" fill="#ff8fa3" opacity=".7"/>
       ${angry ? `<path d="M${cx - 14} ${cy - 10} l10 4 M${cx + 14} ${cy - 10} l-10 4" stroke="#333" stroke-width="3" stroke-linecap="round"/>` : ''}`;
  const crown = (cx, y) => `<path d="M${cx - 12} ${y} l6 8 l6 -10 l6 10 l6 -8 l-2 12 h-20z" fill="#ffeb3b" stroke="#b98500" stroke-width="2"/>`;
  const horns = (l, r, y) => `<path d="M${l} ${y} q-10 -14 -4 -24 q4 12 12 16z M${r} ${y} q10 -14 4 -24 q-4 12 -12 16z" fill="#ffd84d" stroke="#5d35a0" stroke-width="2"/>`;
  const extras = (kind, cx, top, l, r, hy) => (kind === 'elite' ? crown(cx, top) : '') + (kind === 'boss' ? horns(l, r, hy) : '');

  // ---------- 车型 ----------
  // c = {fill 车身, light 炮塔, dark 炮管, deco 花纹}；每种车型返回 [画法, 脸的高度]
  const TRACKS = `<rect x="8" y="30" width="20" height="64" rx="10" fill="#4a4a55"/>
        <rect x="72" y="30" width="20" height="64" rx="10" fill="#4a4a55"/>
        <g fill="#6d6d7a"><circle cx="18" cy="42" r="5"/><circle cx="18" cy="62" r="5"/><circle cx="18" cy="82" r="5"/>
        <circle cx="82" cy="42" r="5"/><circle cx="82" cy="62" r="5"/><circle cx="82" cy="82" r="5"/></g>`;
  const hull = c => `<rect x="20" y="36" width="60" height="52" rx="18" fill="${c.fill}"/>${c.deco}`;
  const turret = (c, r = 23, cy = 58) => `<circle cx="50" cy="${cy}" r="${r}" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`;
  const barrel = (c, x = 44, w = 12, y = 2, len = 40) => `<rect x="${x}" y="${y}" width="${w}" height="${len}" rx="${w / 2}" fill="${c.dark}"/>`;
  const MODELS = {
    basic: c => [TRACKS + hull(c) + barrel(c) + turret(c), 58],
    scout: c => [`<g fill="#4a4a55"><rect x="8" y="30" width="18" height="26" rx="8"/><rect x="74" y="30" width="18" height="26" rx="8"/><rect x="8" y="64" width="18" height="26" rx="8"/><rect x="74" y="64" width="18" height="26" rx="8"/></g>
      <g fill="#9a9aa6"><circle cx="17" cy="43" r="4"/><circle cx="83" cy="43" r="4"/><circle cx="17" cy="77" r="4"/><circle cx="83" cy="77" r="4"/></g>
      <rect x="22" y="34" width="56" height="56" rx="16" fill="${c.fill}"/>${c.deco}
      <path d="M72 44 L84 8" stroke="#555" stroke-width="3" stroke-linecap="round"/><circle cx="84" cy="8" r="4.5" fill="#ff5252" class="blink"/>
      ${barrel(c, 46, 8, 14, 30)}${turret(c, 20, 60)}`, 60],
    twin: c => [`${TRACKS}${hull(c)}${barrel(c, 32, 10, 0, 44)}${barrel(c, 58, 10, 0, 44)}
      <ellipse cx="50" cy="58" rx="27" ry="23" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`, 58],
    shark: c => [`${TRACKS}<path d="M50 84 L36 100 L50 93 L64 100Z" fill="${c.dark}"/>
      <path d="M24 56 L3 74 L24 72Z M76 56 L97 74 L76 72Z" fill="${c.dark}"/>
      <rect x="20" y="34" width="60" height="56" rx="18" fill="${c.fill}"/>${c.deco}
      <path d="M26 36 ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `L${29 + i * 6} 45 L${32 + i * 6} 36`).join(' ')}Z" fill="#fff" stroke="${c.dark}" stroke-width="1"/>
      ${barrel(c, 44, 12, 4, 40)}${turret(c, 20, 64)}`, 64],
    rocket: c => [`${TRACKS}${hull(c)}<rect x="22" y="20" width="56" height="24" rx="8" fill="${c.dark}"/>
      ${[27, 40, 53, 66].map(x => `<rect x="${x}" y="6" width="7" height="22" rx="3" fill="#eee"/><path d="M${x} 8 q3.5 -10 7 0z" fill="#ff5252"/>`).join('')}
      ${turret(c, 20, 62)}`, 62],
    heavy: c => [`<rect x="2" y="24" width="25" height="72" rx="11" fill="#3e3e48"/><rect x="73" y="24" width="25" height="72" rx="11" fill="#3e3e48"/>
      <g fill="#6d6d7a">${[36, 52, 68, 84].map(y => `<circle cx="14.5" cy="${y}" r="6"/><circle cx="85.5" cy="${y}" r="6"/>`).join('')}</g>
      <rect x="16" y="30" width="68" height="62" rx="14" fill="${c.fill}"/>${c.deco}
      <g fill="${c.dark}" opacity=".45"><circle cx="22" cy="36" r="2.5"/><circle cx="78" cy="36" r="2.5"/><circle cx="22" cy="86" r="2.5"/><circle cx="78" cy="86" r="2.5"/></g>
      ${barrel(c, 41, 18, 6, 38)}<rect x="37" y="0" width="26" height="10" rx="4" fill="${c.dark}"/>
      ${turret(c, 26, 60)}`, 60],
    mech: c => [`${TRACKS}${hull(c)}
      ${[[4, 9], [78, 83]].map(([x, bx]) => `<rect x="${bx}" y="8" width="8" height="30" rx="4" fill="${c.dark}"/><rect x="${x}" y="30" width="18" height="26" rx="7" fill="${c.dark}"/><circle cx="${x + 9}" cy="43" r="4" fill="${c.light}" class="blink"/>`).join('')}
      ${barrel(c)}${turret(c)}<rect x="36" y="40" width="28" height="5" rx="2.5" fill="${c.dark}" opacity=".45"/>`, 58],
    hover: c => [`<ellipse cx="50" cy="97" rx="34" ry="4" fill="#000" opacity=".15"/>
      <g fill="#7fe0ff" class="blink"><ellipse cx="24" cy="32" rx="9" ry="4.5"/><ellipse cx="76" cy="32" rx="9" ry="4.5"/><ellipse cx="24" cy="91" rx="9" ry="4.5"/><ellipse cx="76" cy="91" rx="9" ry="4.5"/></g>
      <path d="M16 56 L2 80 L20 74Z M84 56 L98 80 L80 74Z" fill="${c.dark}"/>
      <rect x="14" y="32" width="72" height="58" rx="28" fill="${c.fill}"/>${c.deco}
      ${barrel(c, 45, 10, 4, 38)}<circle cx="50" cy="6" r="5" fill="#7fe0ff" class="blink"/>
      ${turret(c, 22, 60)}`, 60],
  };

  // 我方坦克：没传 skin、model 就用当前装备的
  let gid = 0;
  const meTank = (sk, m) => {
    const [body, light, dark] = sk.pal;
    const g = sk.grad ? 'tg' + ++gid : null;
    const c = { fill: g ? `url(#${g})` : body, light, dark, deco: sk.deco ? DECO[sk.deco](dark) : '' };
    const [svg, fy] = (MODELS[m.id] || MODELS.basic)(c);
    const defs = g ? `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">${sk.grad.map((col, i) =>
      `<stop offset="${i / (sk.grad.length - 1)}" stop-color="${col}"/>`).join('')}</linearGradient></defs>` : '';
    return `<svg viewBox="0 0 100 100" class="tank-svg m-${m.id}">${defs}${svg}${face(50, fy, 'me', false)}</svg>`;
  };

  V.tank = (kind = 'me', skin, model) => {
    if (kind === 'me') return meTank(skin || TM.Rewards.skin(), model || TM.Rewards.model());
    const [body, light, dark] = PAL[kind];
    const down = kind !== 'broken';
    const flip = down ? 'transform="translate(0 100) scale(1 -1)"' : '';
    const cy = down ? 42 : 58;
    return `<svg viewBox="0 0 100 100" class="tank-svg">
      <g ${flip}>${MODELS.basic({ fill: body, light, dark, deco: '' })[0]}</g>
      ${extras(kind, 50, cy - 30, 30, 70, cy - 16)}${face(50, cy, kind, down)}
    </svg>`;
  };

  // 沙漠战区：直升机
  const heli = kind => {
    const [body, light, dark] = PAL[kind];
    return `<svg viewBox="0 0 100 100" class="tank-svg">
      <rect x="66" y="44" width="30" height="9" rx="4.5" fill="${dark}"/>
      <circle cx="94" cy="48" r="7" fill="none" stroke="#555" stroke-width="3" class="tail-rotor"/>
      <rect x="47" y="12" width="6" height="14" fill="#555"/>
      <ellipse cx="46" cy="54" rx="31" ry="27" fill="${body}"/>
      <ellipse cx="46" cy="52" rx="21" ry="17" fill="${light}" stroke="${dark}" stroke-width="2"/>
      <path d="M22 90 h50 M32 80 v10 M60 80 v10" stroke="#555" stroke-width="4" stroke-linecap="round"/>
      <g class="rotor"><rect x="4" y="9" width="92" height="6" rx="3" fill="#555"/></g>
      ${extras(kind, 46, 22, 22, 70, 40)}${face(46, 52, kind, true)}
    </svg>`;
  };

  // 雪山战区：机器人
  const robot = kind => {
    const [body, light, dark] = PAL[kind];
    return `<svg viewBox="0 0 100 100" class="tank-svg">
      <path d="M50 16 v-10" stroke="#555" stroke-width="3"/><circle cx="50" cy="6" r="5" fill="${light}" class="blink"/>
      <rect x="12" y="56" width="15" height="28" rx="7" fill="${body}"/><rect x="73" y="56" width="15" height="28" rx="7" fill="${body}"/>
      <rect x="34" y="82" width="13" height="15" rx="4" fill="#4a4a55"/><rect x="53" y="82" width="13" height="15" rx="4" fill="#4a4a55"/>
      <rect x="28" y="52" width="44" height="34" rx="9" fill="${dark}"/>
      <circle cx="50" cy="69" r="7" fill="${light}" class="blink"/>
      <rect x="24" y="14" width="52" height="40" rx="12" fill="${body}"/>
      <rect x="30" y="24" width="40" height="22" rx="10" fill="${light}" stroke="${dark}" stroke-width="2"/>
      ${extras(kind, 50, 2, 28, 72, 22)}${face(50, 34, kind, true)}
    </svg>`;
  };

  // 天空战区：飞碟
  const ufo = kind => {
    const [body, light, dark] = PAL[kind];
    return `<svg viewBox="0 0 100 100" class="tank-svg">
      <path d="M30 78 L22 94 M70 78 L78 94" stroke="#ffe27a" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="50" cy="66" rx="46" ry="16" fill="${dark}"/>
      <ellipse cx="50" cy="60" rx="44" ry="14" fill="${body}"/>
      <circle cx="20" cy="62" r="4" fill="#fff59d" class="blink"/><circle cx="50" cy="70" r="4" fill="#fff59d" class="blink"/><circle cx="80" cy="62" r="4" fill="#fff59d" class="blink"/>
      <path d="M22 56 A28 34 0 0 1 78 56Z" fill="${light}" stroke="${dark}" stroke-width="2" opacity=".95"/>
      ${extras(kind, 50, 8, 26, 74, 30)}${face(50, 40, kind, true)}
    </svg>`;
  };

  // 每个战区的敌人长得不一样
  const ENEMY = { 1: heli, 2: robot, 4: heli, 5: ufo };
  V.enemy = (zi, kind) => (ENEMY[zi] || V.tank)(kind);

  TM.V = V;
})(window.TM);
