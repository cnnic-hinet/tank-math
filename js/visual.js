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
    // 一根绳子分成 segs 段；cuts 时在接口处画剪刀（提示图才画，题目图不画答案）
    rope(v) {
      // 有剪刀的位置留宽一点，没剪刀时留个窄缝，绳子的分段才连得起来
      const gapCls = v.cuts ? 'rope-cut' : 'rope-gap';
      const row = h('div', { class: 'rope-row' });
      for (let i = 0; i < v.segs; i++) {
        row.append(h('span', { class: 'rope-seg' }));
        if (i < v.segs - 1) row.append(h('span', { class: gapCls }, v.cuts ? '✂' : ''));
      }
      const nums = h('div', { class: 'rope-row rope-nums' });
      for (let i = 0; i < v.segs; i++) {
        nums.append(h('span', null, String(i + 1)));
        if (i < v.segs - 1) nums.append(h('span', { class: gapCls }));
      }
      return h('div', { class: 'v-rope' }, row, nums);
    },
    // 晾衣绳：n 块手帕；pegs 时把夹子也画出来（两头各一个）
    hang(v) {
      // 手帕多了就缩一号，9 块加夹子也能挤在一行里
      const row = h('div', { class: 'hang-row' + (v.n >= 8 ? ' tiny' : v.n > 5 ? ' small' : '') });
      const cloths = ['🌸', '⭐', '🍓', '🌻'];
      for (let i = 0; i < v.n; i++) {
        if (v.pegs) row.append(h('span', { class: 'hang-peg' }, '📌'));
        row.append(h('span', { class: 'hang-cloth' }, cloths[i % cloths.length]));
      }
      if (v.pegs) row.append(h('span', { class: 'hang-peg' }, '📌'));
      return h('div', { class: 'v-hang' }, h('div', { class: 'hang-line' }), row,
        h('div', { class: 'v-label' }, `${v.n} 块手帕`));
    },
    // 一排树，benches 时在两棵树之间画长椅
    lineup(v) {
      const row = h('div', { class: 'lineup-row' + (v.trees > 6 ? ' small' : '') });
      for (let i = 0; i < v.trees; i++) {
        row.append(h('span', { class: 'lu-tree' }, '🌳'));
        if (v.benches && i < v.trees - 1) row.append(h('span', { class: 'lu-bench' }, '🪑'));
      }
      return h('div', { class: 'v-lineup' }, row,
        h('div', { class: 'v-label' }, `一排 ${v.trees} 棵树`));
    },
    // 围成一圈：n 个小朋友/树，between 时在两人之间画球
    ring(v) {
      const n = v.n, box = 250, R = n > 7 ? 98 : 88;
      const wrap = h('div', { class: 'v-ring', style: `width:${box}px;height:${box}px` });
      const put = (ang, text, cls) => wrap.append(h('span', {
        class: 'ring-item' + (cls ? ' ' + cls : ''),
        style: `left:50%;top:50%;transform:translate(-50%,-50%) translate(${Math.round(Math.cos(ang) * R)}px,${Math.round(Math.sin(ang) * R)}px)`,
      }, text));
      for (let i = 0; i < n; i++) put(-Math.PI / 2 + i * Math.PI * 2 / n, v.e || '🙂');
      if (v.between) for (let i = 0; i < n; i++) put(-Math.PI / 2 + (i + .5) * Math.PI * 2 / n, v.between, 'between');
      return h('div', { class: 'v-ringwrap' }, wrap, h('div', { class: 'v-label' }, v.label || `${n} 个围成一圈`));
    },
    // 几位同学的方法卡片：只写名字和做法，不标对错
    cards(v) {
      return h('div', { class: 'v-cards' }, v.cards.map(c => h('div', { class: 'v-card' },
        h('b', { class: 'c-name' }, c.name), h('div', { class: 'c-text' }, c.text))));
    },
    // 左图 → 右图，配一句算式（看图说算式的意思）
    picpair(v) {
      const box = s => h('div', { class: 'pp-box' },
        h('div', { class: 'pp-scene' }, Array.from({ length: Math.max(1, s.n || 1) }, () => h('span', { class: 'em' }, s.e))),
        s.cap ? h('div', { class: 'pp-cap' }, s.cap) : null);
      return h('div', { class: 'v-picpair' },
        box(v.left), h('span', { class: 'pp-arrow' }, '➡'), box(v.right),
        v.eq ? h('div', { class: 'pp-eq' }, v.eq) : null);
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
    desert: d => `<g fill="${d}" opacity=".4"><path d="M18 86 q14 -12 28 -3 q10 6 34 0 v9 h-62z"/><path d="M28 48 q10 -8 20 -2 q8 4 22 0 v8 h-42z"/></g>`,
    city: d => `<g fill="${d}" opacity=".45"><rect x="24" y="38" width="10" height="14"/><rect x="38" y="34" width="8" height="18"/><rect x="50" y="40" width="12" height="12"/><rect x="66" y="36" width="9" height="16"/><rect x="28" y="72" width="12" height="12"/><rect x="44" y="68" width="9" height="16"/><rect x="58" y="74" width="11" height="10"/></g>`,
    stripes: () => '<g stroke="#fff" stroke-width="5" opacity=".72" stroke-linecap="round"><path d="M18 80 L46 38"/><path d="M34 88 L62 46"/><path d="M52 90 L80 48"/></g>',
    candy: () => '<g fill="#fff" opacity=".8"><circle cx="30" cy="46" r="4"/><circle cx="70" cy="52" r="5"/><circle cx="36" cy="78" r="4.5"/><circle cx="62" cy="82" r="4"/></g><g fill="#ffe14d" opacity=".75"><circle cx="58" cy="42" r="3"/><circle cx="32" cy="88" r="3"/><circle cx="74" cy="74" r="3"/></g>',
    jelly: () => '<ellipse cx="36" cy="46" rx="13" ry="7" fill="#fff" opacity=".6" transform="rotate(-22 36 46)"/><ellipse cx="66" cy="76" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-22 66 76)"/>',
    zebra: d => `<g stroke="${d}" stroke-width="5" fill="none" opacity=".85" stroke-linecap="round"><path d="M22 46 q14 8 0 16"/><path d="M78 42 q-14 9 0 18"/><path d="M26 76 q14 8 0 16"/><path d="M74 72 q-12 8 0 16"/></g>`,
    diamond: () => '<g fill="#fff" opacity=".9"><path d="M28 40 l4 6 -4 6 -4 -6z"/><path d="M72 44 l4 6 -4 6 -4 -6z"/><path d="M30 78 l4 6 -4 6 -4 -6z"/><path d="M70 74 l4 6 -4 6 -4 -6z"/></g>',
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
    // 加农炮车：长长的炮管，炮口带个制退器
    cannon: c => [`${TRACKS}
      <rect x="18" y="40" width="64" height="46" rx="15" fill="${c.fill}"/>${c.deco}
      <rect x="45" y="0" width="10" height="52" rx="5" fill="${c.dark}"/>
      <rect x="38" y="0" width="24" height="9" rx="4" fill="${c.dark}"/>
      ${turret(c, 20, 64)}`, 64],
    // 装甲运兵车：方方正正，六个轮子
    apc: c => [`<g fill="#4a4a55">
        <rect x="6" y="34" width="18" height="22" rx="8"/><rect x="76" y="34" width="18" height="22" rx="8"/>
        <rect x="6" y="66" width="18" height="22" rx="8"/><rect x="76" y="66" width="18" height="22" rx="8"/></g>
      <g fill="#9a9aa6"><circle cx="15" cy="45" r="4"/><circle cx="85" cy="45" r="4"/><circle cx="15" cy="77" r="4"/><circle cx="85" cy="77" r="4"/></g>
      <path d="M20 44 L26 32 H74 L80 44 V82 a8 8 0 0 1 -8 8 H28 a8 8 0 0 1 -8 -8Z" fill="${c.fill}"/>${c.deco}
      <rect x="36" y="6" width="28" height="28" rx="9" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <rect x="45" y="0" width="10" height="14" rx="5" fill="${c.dark}"/>`, 64],
    // 喷火坦克：车头一个喷火口
    flamer: c => [`${TRACKS}${hull(c)}
      <rect x="42" y="10" width="16" height="28" rx="8" fill="${c.dark}"/>
      <path d="M42 4 q8 -12 16 0 q-8 8 -16 0z" fill="#ffb03b"/>
      <circle cx="50" cy="6" r="5" fill="#ffe14d" class="blink"/>
      ${turret(c, 22, 62)}`, 62],
    // 导弹发射车：车厢上竖着两枚导弹
    missile: c => [`<g fill="#4a4a55">
        <rect x="8" y="42" width="16" height="26" rx="7"/><rect x="76" y="42" width="16" height="26" rx="7"/>
        <rect x="8" y="72" width="16" height="24" rx="7"/><rect x="76" y="72" width="16" height="24" rx="7"/></g>
      <g fill="#9a9aa6"><circle cx="16" cy="55" r="4"/><circle cx="84" cy="55" r="4"/><circle cx="16" cy="84" r="4"/><circle cx="84" cy="84" r="4"/></g>
      <rect x="16" y="38" width="68" height="46" rx="10" fill="${c.fill}"/>${c.deco}
      <rect x="24" y="6" width="18" height="34" rx="9" fill="#eef2f6" stroke="${c.dark}" stroke-width="2"/>
      <path d="M24 13 q9 -15 18 0z" fill="#ff5252"/>
      <rect x="58" y="6" width="18" height="34" rx="9" fill="#eef2f6" stroke="${c.dark}" stroke-width="2"/>
      <path d="M58 13 q9 -15 18 0z" fill="#ff5252"/>
      ${turret(c, 16, 66)}`, 66],
    // 推土机：前面一把大铲子
    dozer: c => [`${TRACKS}
      <rect x="18" y="42" width="64" height="46" rx="14" fill="${c.fill}"/>${c.deco}
      <path d="M6 32 H94 L86 12 H14Z" fill="#b8c0ca" stroke="#5b6470" stroke-width="3" stroke-linejoin="round"/>
      <rect x="36" y="34" width="28" height="30" rx="7" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <rect x="70" y="34" width="7" height="11" rx="3.5" fill="${c.dark}"/>`, 50],
    // 激光战车：炮塔上顶着一颗激光球
    laser: c => [`${TRACKS}${hull(c)}
      <rect x="46" y="12" width="8" height="30" rx="4" fill="${c.dark}"/>
      <circle cx="50" cy="10" r="8" fill="#7fe0ff" class="blink"/>
      <path d="M36 42 q14 -14 28 0" stroke="${c.dark}" stroke-width="3" fill="none"/>
      ${turret(c, 21, 64)}`, 64],
    // 武装直升机
    heli: c => [`<rect x="44" y="56" width="12" height="32" rx="6" fill="${c.dark}"/>
      <path d="M44 84 L34 96 H44Z M56 84 L66 96 H56Z" fill="${c.light}"/>
      <rect x="47" y="2" width="6" height="16" fill="#555"/>
      <g class="rotor"><rect x="6" y="2" width="88" height="5" rx="2.5" fill="#555"/></g>
      <ellipse cx="50" cy="46" rx="27" ry="24" fill="${c.fill}"/>${c.deco}
      <ellipse cx="50" cy="42" rx="17" ry="15" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M26 86 h48 M32 74 v12 M68 74 v12" stroke="#555" stroke-width="4" stroke-linecap="round"/>`, 44],
    // 螺旋桨飞机
    prop: c => [`<path d="M10 56 L50 42 L90 56 L50 68Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 78 L34 96 H66Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M50 4 q14 18 14 38 v30 q0 10 -14 10 q-14 0 -14 -10 v-30 q0 -20 14 -38z" fill="${c.fill}"/>${c.deco}
      <ellipse cx="50" cy="40" rx="10" ry="12" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <circle cx="50" cy="8" r="5" fill="${c.dark}"/>
      <g class="prop"><rect x="10" y="6" width="80" height="4" rx="2" fill="#666"/></g>`, 50],
    // 喷气战斗机
    jet: c => [`<path d="M34 46 L2 78 L34 72Z M66 46 L98 78 L66 72Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 76 L26 98 L38 94Z M64 76 L74 98 L62 94Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M50 2 q14 18 14 42 v26 q0 8 -14 8 q-14 0 -14 -8 v-26 q0 -24 14 -42z" fill="${c.fill}"/>${c.deco}
      <ellipse cx="50" cy="38" rx="9" ry="12" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M44 76 h12 l-6 16z" fill="#7fe0ff" class="blink"/>`, 42],
    // 轰炸机
    bomber: c => [`<path d="M6 62 L50 46 L94 62 L50 74Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>
      <g fill="${c.dark}"><ellipse cx="26" cy="62" rx="6" ry="4"/><ellipse cx="40" cy="57" rx="6" ry="4"/><ellipse cx="60" cy="57" rx="6" ry="4"/><ellipse cx="74" cy="62" rx="6" ry="4"/></g>
      <path d="M50 84 L36 98 H64Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="50" cy="52" rx="21" ry="34" fill="${c.fill}"/>${c.deco}
      <ellipse cx="50" cy="36" rx="11" ry="12" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`, 40],
    // 无人机：四个小旋翼
    drone: c => [`<g stroke="${c.dark}" stroke-width="6" stroke-linecap="round"><path d="M50 50 L20 24 M50 50 L80 24 M50 50 L20 76 M50 50 L80 76"/></g>
      <g fill="#555" class="blink"><ellipse cx="18" cy="22" rx="13" ry="4"/><ellipse cx="82" cy="22" rx="13" ry="4"/><ellipse cx="18" cy="78" rx="13" ry="4"/><ellipse cx="82" cy="78" rx="13" ry="4"/></g>
      <rect x="32" y="34" width="36" height="36" rx="13" fill="${c.fill}"/>${c.deco}
      <circle cx="50" cy="62" r="5" fill="#222"/><circle cx="50" cy="62" r="2" fill="#7fe0ff" class="blink"/>`, 50],
    // 飞碟
    ufo: c => [`<path d="M34 74 L26 98 H74 L66 74Z" fill="#fff59d" opacity=".3"/>
      <ellipse cx="50" cy="64" rx="40" ry="18" fill="${c.dark}"/>
      <ellipse cx="50" cy="58" rx="38" ry="16" fill="${c.fill}"/>${c.deco}
      <path d="M24 54 A26 30 0 0 1 76 54Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <g fill="#fff59d" class="blink"><circle cx="16" cy="64" r="4"/><circle cx="34" cy="70" r="4"/><circle cx="66" cy="70" r="4"/><circle cx="84" cy="64" r="4"/></g>`, 42],
  };

  // ---------- 改装工厂的零件（从上往下看，炮口朝上，炮塔中心 50,58） ----------
  const starPath = (cx, cy, r) => 'M' + [...Array(10)].map((_, i) => {
    const a = Math.PI / 5 * i - Math.PI / 2, k = i % 2 ? r * .45 : r;
    return `${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`;
  }).join(' L') + 'Z';
  const TILE = ['#ff5252', '#ffd23f', '#3d8bfd', '#4caf50', '#ffffff', '#ff9f1c'];
  const grid3 = (x, y, w, ht, gap) => [0, 1, 2].map(j => [0, 1, 2].map(i =>
    `<rect x="${x + i * (w + gap)}" y="${y + j * (ht + gap)}" width="${w}" height="${ht}" rx="${ht / 5}" fill="${TILE[(i + j * 2) % 6]}"/>`).join('')).join('');
  // 底盘
  const CH = {
    track: () => TRACKS,
    wide: () => `<rect x="2" y="24" width="25" height="72" rx="11" fill="#3e3e48"/><rect x="73" y="24" width="25" height="72" rx="11" fill="#3e3e48"/>
      <g fill="#6d6d7a">${[36, 52, 68, 84].map(y => `<circle cx="14.5" cy="${y}" r="6"/><circle cx="85.5" cy="${y}" r="6"/>`).join('')}</g>`,
    wheel4: () => `<g fill="#4a4a55"><rect x="8" y="30" width="18" height="26" rx="8"/><rect x="74" y="30" width="18" height="26" rx="8"/><rect x="8" y="64" width="18" height="26" rx="8"/><rect x="74" y="64" width="18" height="26" rx="8"/></g>
      <g fill="#9a9aa6"><circle cx="17" cy="43" r="4"/><circle cx="83" cy="43" r="4"/><circle cx="17" cy="77" r="4"/><circle cx="83" cy="77" r="4"/></g>`,
    wheel6: () => `<g fill="#4a4a55">${[30, 52, 74].map(y => `<rect x="6" y="${y}" width="18" height="19" rx="8"/><rect x="76" y="${y}" width="18" height="19" rx="8"/>`).join('')}</g>
      <g fill="#9a9aa6">${[39.5, 61.5, 83.5].map(y => `<circle cx="15" cy="${y}" r="4"/><circle cx="85" cy="${y}" r="4"/>`).join('')}</g>`,
    hover: c => `<ellipse cx="50" cy="97" rx="34" ry="4" fill="#000" opacity=".15"/>
      <g fill="#7fe0ff" class="blink"><ellipse cx="24" cy="32" rx="9" ry="4.5"/><ellipse cx="76" cy="32" rx="9" ry="4.5"/><ellipse cx="24" cy="91" rx="9" ry="4.5"/><ellipse cx="76" cy="91" rx="9" ry="4.5"/></g>
      <path d="M18 56 L4 80 L22 74Z M82 56 L96 80 L78 74Z" fill="${c.dark}"/>`,
    legs: () => `<g stroke="#4a4a55" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M28 44 L10 32 L6 18 M72 44 L90 32 L94 18 M28 80 L10 88 L6 98 M72 80 L90 88 L94 98"/></g>
      <g fill="#6d6d7a"><circle cx="10" cy="32" r="5"/><circle cx="90" cy="32" r="5"/><circle cx="10" cy="88" r="5"/><circle cx="90" cy="88" r="5"/></g>
      <g fill="#4a4a55"><ellipse cx="6" cy="18" rx="6" ry="4"/><ellipse cx="94" cy="18" rx="6" ry="4"/><ellipse cx="6" cy="98" rx="6" ry="4"/><ellipse cx="94" cy="98" rx="6" ry="4"/></g>`,
    pzTrack: () => `<rect x="8" y="30" width="20" height="64" rx="10" fill="#4a4a55"/><rect x="72" y="30" width="20" height="64" rx="10" fill="#4a4a55"/>
      ${[[18, 1], [82, 4]].map(([x, k]) => [42, 62, 82].map((y, i) => `<circle cx="${x}" cy="${y}" r="7" fill="${TILE[(k + i) % 4]}"/>
        <text x="${x}" y="${y + 4}" font-size="11" font-weight="900" text-anchor="middle" fill="#222">${k + i}</text>`).join('')).join('')}`,
  };
  // 车身（c.deco 是涂装的花纹）
  const BD = {
    round: c => hull(c),
    box: c => `<path d="M20 44 L26 32 H74 L80 44 V82 a8 8 0 0 1 -8 8 H28 a8 8 0 0 1 -8 -8Z" fill="${c.fill}"/>${c.deco}
      <g fill="${c.dark}" opacity=".45"><circle cx="27" cy="40" r="2.5"/><circle cx="73" cy="40" r="2.5"/><circle cx="27" cy="84" r="2.5"/><circle cx="73" cy="84" r="2.5"/></g>`,
    sharkhead: c => `<path d="M50 84 L36 100 L50 93 L64 100Z" fill="${c.dark}"/><path d="M24 56 L3 74 L24 72Z M76 56 L97 74 L76 72Z" fill="${c.dark}"/>
      <rect x="20" y="34" width="60" height="56" rx="18" fill="${c.fill}"/>${c.deco}
      <path d="M26 36 ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `L${29 + i * 6} 45 L${32 + i * 6} 36`).join(' ')}Z" fill="#fff" stroke="${c.dark}" stroke-width="1"/>`,
    sleek: c => `<path d="M50 22 L80 46 V82 q0 8 -8 8 H28 q-8 0 -8 -8 V46Z" fill="${c.fill}"/>${c.deco}
      <path d="M26 86 h12 M62 86 h12 M50 26 v8" stroke="${c.dark}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
    fort: c => `<rect x="16" y="32" width="68" height="60" rx="6" fill="${c.fill}"/>${c.deco}
      <g stroke="${c.dark}" stroke-width="1.5" opacity=".3"><path d="M16 50 H84 M16 74 H84 M34 32 V50 M66 32 V50 M50 50 V74 M34 74 V92 M66 74 V92"/></g>
      <g fill="${c.dark}">${[[10, 26], [78, 26], [10, 86], [78, 86]].map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="12" rx="2"/>`).join('')}</g>`,
    beetle: c => `<path d="M40 34 q-6 -12 -14 -14 M60 34 q6 -12 14 -14" stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="62" rx="33" ry="32" fill="${c.fill}"/>${c.deco}
      <path d="M50 30 V94" stroke="${c.dark}" stroke-width="2.5"/>
      <g fill="${c.dark}" opacity=".5"><circle cx="34" cy="78" r="5"/><circle cx="66" cy="78" r="5"/><circle cx="28" cy="56" r="4"/><circle cx="72" cy="56" r="4"/></g>
      <ellipse cx="36" cy="40" rx="8" ry="4" fill="#fff" opacity=".4" transform="rotate(-30 36 40)"/>`,
    pzArmor: c => `<rect x="20" y="36" width="60" height="52" rx="12" fill="${c.dark}"/>
      ${[[21, 37, c.fill], [51, 37, c.light], [21, 63, c.light], [51, 63, c.fill]].map(([x, y, f]) => `<rect x="${x}" y="${y}" width="28" height="24" rx="6" fill="${f}"/>`).join('')}
      <g><circle cx="50" cy="49" r="4.5" fill="${c.fill}"/><circle cx="50" cy="75" r="4.5" fill="${c.light}"/><circle cx="35" cy="62" r="4.5" fill="${c.fill}"/><circle cx="65" cy="62" r="4.5" fill="${c.light}"/></g>${c.deco}`,
  };
  // 主炮（画在炮塔下面）
  const GN = {
    short: c => barrel(c, 44, 12, 12, 36),
    long: c => `<rect x="45" y="0" width="10" height="52" rx="5" fill="${c.dark}"/><rect x="38" y="0" width="24" height="9" rx="4" fill="${c.dark}"/>`,
    twin: c => barrel(c, 32, 10, 0, 44) + barrel(c, 58, 10, 0, 44),
    rockets: c => `<rect x="22" y="20" width="56" height="24" rx="8" fill="${c.dark}"/>
      ${[27, 40, 53, 66].map(x => `<rect x="${x}" y="6" width="7" height="22" rx="3" fill="#eee"/><path d="M${x} 8 q3.5 -10 7 0z" fill="#ff5252"/>`).join('')}`,
    missiles: c => [22, 60].map(x => `<rect x="${x}" y="6" width="18" height="34" rx="9" fill="#eef2f6" stroke="${c.dark}" stroke-width="2"/>
      <path d="M${x} 13 q9 -15 18 0z" fill="#ff5252"/>`).join(''),
    laser: c => `<rect x="46" y="12" width="8" height="30" rx="4" fill="${c.dark}"/><circle cx="50" cy="10" r="8" fill="#7fe0ff" class="blink"/>
      <path d="M36 40 q14 -14 28 0" stroke="${c.dark}" stroke-width="3" fill="none"/>`,
    flame: c => `<rect x="42" y="10" width="16" height="30" rx="8" fill="${c.dark}"/><path d="M42 4 q8 -12 16 0 q-8 8 -16 0z" fill="#ffb03b"/>
      <circle cx="50" cy="6" r="5" fill="#ffe14d" class="blink"/>`,
    pzGun: c => `${barrel(c, 45, 10, 16, 30)}<rect x="35" y="0" width="30" height="22" rx="4" fill="${c.dark}"/>${grid3(37.5, 2.5, 7, 5, 1.5)}`,
  };
  // 炮塔
  const TU = {
    tround: c => turret(c),
    tmini: c => turret(c, 17),
    tsquare: c => `<rect x="29" y="37" width="42" height="42" rx="9" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`,
    dome: c => `${turret(c, 27)}<ellipse cx="40" cy="44" rx="9" ry="5" fill="#fff" opacity=".5" transform="rotate(-25 40 44)"/>`,
    double: c => `${turret(c, 27)}<circle cx="50" cy="58" r="18" fill="${c.fill}" stroke="${c.dark}" stroke-width="2"/>`,
    cube: () => `<rect x="30" y="38" width="40" height="40" rx="6" fill="#2b2b38"/>${grid3(32.5, 40.5, 11, 11, 1.5)}<rect x="32" y="51" width="36" height="16" rx="5" fill="#fff" opacity=".9"/>`,
  };
  // 挂件（画在最上面，避开脸）
  const AD = {
    none: () => '',
    antenna: () => '<path d="M72 44 L84 8" stroke="#555" stroke-width="3" stroke-linecap="round"/><circle cx="84" cy="8" r="4.5" fill="#ff5252" class="blink"/>',
    flag: () => '<path d="M76 46 V10" stroke="#555" stroke-width="3" stroke-linecap="round"/><path d="M77 10 L96 16 L77 23Z" fill="#ff5252" class="flag"/>',
    radar: () => '<path d="M26 44 V32" stroke="#555" stroke-width="3"/><g class="radar"><path d="M13 30 q13 -13 26 0z" fill="#dfe6ee" stroke="#5b6470" stroke-width="2"/></g><circle cx="26" cy="26" r="2.5" fill="#ff5252" class="blink"/>',
    horn: () => `<rect x="27" y="32" width="6" height="12" fill="#b98500"/><path d="M25 34 L18 18 H42 L35 34Z" fill="#ffd23f" stroke="#b98500" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16 12 l-4 -5 M30 10 v-7 M44 12 l4 -5" stroke="#ff9f1c" stroke-width="2.5" stroke-linecap="round" class="blink"/>`,
    shield: () => '<path d="M16 34 Q50 12 84 34 L82 41 Q50 22 18 41Z" fill="#8fdcff" stroke="#3f86c4" stroke-width="2" opacity=".85"/>',
    wings: () => '<g class="wings" fill="#fff" stroke="#b8c1cc" stroke-width="2" stroke-linejoin="round"><path d="M10 52 Q-8 38 -2 20 Q6 34 16 40Z M90 52 Q108 38 102 20 Q94 34 84 40Z"/></g>',
    badge: () => `<path d="${starPath(50, 84, 9)}" fill="#ffd23f" stroke="#b98500" stroke-width="1.5"/>`,
    pzCube: () => `<path d="M78 88 V96" stroke="#555" stroke-width="2"/><rect x="70" y="76" width="18" height="18" rx="3" fill="#2b2b38" transform="rotate(12 79 85)"/>
      <g transform="rotate(12 79 85)">${grid3(71.5, 77.5, 4.5, 4.5, 1)}</g>`,
  };
  const buildSvg = (c, b) => (CH[b.chassis] || CH.track)(c) + (BD[b.body] || BD.round)(c)
    + (GN[b.gun] || GN.short)(c) + (TU[b.turret] || TU.tround)(c) + (AD[b.addon] || AD.none)(c);

  // 我方坦克：没传 skin、model 就用当前装备的；model.id 是 custom 时按 model.build 拼零件
  let gid = 0;
  const meTank = (sk, m) => {
    const [body, light, dark] = sk.pal;
    const g = sk.grad ? 'tg' + ++gid : null;
    const c = { fill: g ? `url(#${g})` : body, light, dark, deco: sk.deco ? DECO[sk.deco](dark) : '' };
    const custom = m.id === 'custom' && m.build;
    const [svg, fy] = custom ? [buildSvg(c, m.build), 58] : (MODELS[m.id] || MODELS.basic)(c);
    const defs = g ? `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">${sk.grad.map((col, i) =>
      `<stop offset="${i / (sk.grad.length - 1)}" stop-color="${col}"/>`).join('')}</linearGradient></defs>` : '';
    return `<svg viewBox="0 0 100 100" class="tank-svg m-${m.id}${custom ? ' c-' + m.build.chassis : ''}">${defs}${svg}${face(50, fy, 'me', false)}</svg>`;
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
  const ENEMY = { 1: heli, 2: robot, 4: heli, 5: ufo, 6: robot };
  V.enemy = (zi, kind) => (ENEMY[zi] || V.tank)(kind);

  // ---------- 数独：一边填一边组装的侧面坦克（车头朝右） ----------
  // stage = 已经装上几个零件（0 是木板小车，10 是金色超级坦克）；下一个零件画成半透明虚影
  V.BUILD_PARTS = ['履带', '装甲车身', '炮塔', '主炮', '机枪', '天线雷达', '加厚装甲', '变大', '火箭推进器', '金色涂装'];
  const GOLD = ['#f2c230', '#ffe27a', '#b8860b'];
  const sideEyes = (x, y, angry) => `<circle cx="${x - 7}" cy="${y}" r="5" fill="#fff"/><circle cx="${x + 7}" cy="${y}" r="5" fill="#fff"/>
    <circle cx="${x - 6}" cy="${y + 1}" r="2.6" fill="#222"/><circle cx="${x + 8}" cy="${y + 1}" r="2.6" fill="#222"/>
    ${angry ? `<path d="M${x - 12} ${y - 8} l9 3 M${x + 12} ${y - 8} l-9 3" stroke="#333" stroke-width="2.6" stroke-linecap="round"/>`
    : `<path d="M${x - 4} ${y + 8} q4 3 8 0" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`}`;
  const SP = {
    wheels: () => '<g fill="#6b4a2b"><circle cx="56" cy="92" r="8"/><circle cx="104" cy="92" r="8"/></g><g fill="#c9a27a"><circle cx="56" cy="92" r="3"/><circle cx="104" cy="92" r="3"/></g>',
    cart: () => `<rect x="40" y="78" width="80" height="8" rx="2" fill="#b07a45"/><path d="M60 78 v8 M80 78 v8 M100 78 v8" stroke="#8a5a2e" stroke-width="1.5"/>
      <rect x="62" y="58" width="36" height="20" rx="3" fill="#d9a86c" stroke="#a8763d" stroke-width="2"/>`,
    tracks: () => `<rect x="36" y="83" width="90" height="17" rx="8.5" fill="#4a4a55"/><g fill="#8a8a96">${[45, 59, 73, 87, 101, 115].map(x => `<circle cx="${x}" cy="91.5" r="5"/>`).join('')}</g>`,
    hull: c => `<path d="M34 84 L40 66 H120 L130 76 L126 84Z" fill="${c.b}" stroke="${c.d}" stroke-width="2" stroke-linejoin="round"/>`,
    armor: c => `<path d="M39 66 H120 L123 70 H38Z" fill="${c.l}" stroke="${c.d}" stroke-width="1.5"/>
      <g fill="${c.d}"><rect x="38" y="80" width="28" height="8" rx="2"/><rect x="68" y="80" width="28" height="8" rx="2"/><rect x="98" y="80" width="28" height="8" rx="2"/></g>
      <g fill="${c.l}">${[43, 61, 73, 91, 103, 121].map(x => `<circle cx="${x}" cy="84" r="1.6"/>`).join('')}</g>`,
    turret: c => `<path d="M58 66 Q60 47 80 46 H92 Q106 47 108 66Z" fill="${c.l}" stroke="${c.d}" stroke-width="2"/>`,
    gun: c => `<rect x="104" y="52" width="44" height="7" rx="3" fill="${c.d}"/><rect x="144" y="49.5" width="8" height="12" rx="2" fill="${c.d}"/>`,
    mg: () => '<rect x="76" y="39" width="11" height="8" rx="2" fill="#555"/><rect x="85" y="40.5" width="20" height="3.5" rx="1.5" fill="#333"/>',
    radar: () => `<path d="M66 48 L60 16" stroke="#555" stroke-width="2.5" stroke-linecap="round"/><circle cx="60" cy="15" r="3.5" fill="#ff5252" class="blink"/>
      <path d="M48 66 v-8" stroke="#555" stroke-width="2.5"/><path d="M40 53 q8 9 17 -1z" fill="#d8dde3" stroke="#555" stroke-width="2"/>`,
    booster: () => `<g class="bt-flame"><path d="M24 66 L6 71 L24 76Z" fill="#ff9800"/><path d="M24 68.5 L14 71 L24 73.5Z" fill="#ffe14d"/></g>
      <rect x="22" y="64" width="26" height="13" rx="6" fill="#e9edf2" stroke="#555" stroke-width="2"/><path d="M34 64 v13" stroke="#ff5252" stroke-width="3"/>`,
    sparkle: () => '<g fill="#fffbd0" class="blink"><path d="M50 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M118 40 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z"/><path d="M96 70 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z"/></g>',
  };
  V.buildTank = (stage, pal) => {
    const p = stage >= 10 ? GOLD : pal;
    const c = { b: p[0], l: p[1], d: p[2] };
    const has = k => stage >= k;
    const ghost = (k, svg) => (stage === k - 1 ? `<g class="bt-ghost">${svg}</g>` : '');
    const part = (k, f) => (has(k) ? f(c) : ghost(k, f(c)));
    const body = [
      part(9, SP.booster),
      has(1) ? SP.tracks() : SP.wheels() + ghost(1, SP.tracks()),
      has(2) ? '' : SP.cart(),
      part(2, SP.hull), part(7, SP.armor), part(3, SP.turret), part(6, SP.radar), part(5, SP.mg), part(4, SP.gun),
      has(2) ? sideEyes(110, 75) : sideEyes(80, 68),
      has(10) ? SP.sparkle() : '',
    ].join('');
    const big = has(8) ? 'transform="translate(78 100) scale(1.2) translate(-78 -100)"' : '';
    return `<svg viewBox="0 0 160 110" class="bt-svg"><ellipse cx="80" cy="102" rx="${has(8) ? 56 : 46}" ry="5" fill="#000" opacity=".12"/><g ${big}>${body}</g></svg>`;
  };
  // 对面的敌方坦克（车头朝左）。broken = 被打败后冒烟的样子
  V.sideFoe = (kind = 'enemy', broken) => {
    const [b, l, d] = PAL[broken ? 'broken' : kind];
    const c = { b, l, d };
    const top = broken ? '' : kind === 'elite' ? crown(84, 34) : kind === 'boss' ? horns(68, 100, 52) : '';
    const gun = broken ? `<path d="M106 58 L140 74" stroke="${d}" stroke-width="7" stroke-linecap="round"/>` : SP.gun(c);
    const eyes = broken ? '<path d="M99 71 l8 8 M107 71 l-8 8 M113 71 l8 8 M121 71 l-8 8" stroke="#333" stroke-width="2.6" stroke-linecap="round"/>'
      : sideEyes(110, 75, true);
    const smoke = broken ? '<g class="bt-smoke" fill="#8a8f96"><circle cx="76" cy="40" r="8"/><circle cx="88" cy="30" r="6"/><circle cx="70" cy="24" r="5"/></g>' : '';
    return `<svg viewBox="0 0 160 110" class="bt-svg"><ellipse cx="80" cy="102" rx="46" ry="5" fill="#000" opacity=".12"/>
      <g transform="translate(160 0) scale(-1 1)">${SP.tracks()}${SP.hull(c)}${kind === 'boss' ? SP.armor(c) : ''}${SP.turret(c)}${top}${gun}${eyes}</g>${smoke}</svg>`;
  };

  TM.V = V;
})(window.TM);
