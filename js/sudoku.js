// 数独训练营：独立的数独副本，按难度一盘一盘练
(function (TM) {
  const { U, Store, Audio } = TM;
  const h = U.h;
  const DATA = TM.SUDOKU_DATA || [];
  const S = {};

  let live = null;   // 当前这一盘的计时器，换页时要停掉
  let run = 0;       // 换页就 +1，结尾动画播完时用它判断还在不在这一盘

  // ---------- 坦克组装：每填对一格就多装一点，全部填完发起致命一击 ----------
  const { V } = TM;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pal = () => TM.Rewards.skin().pal;
  const foeOf = n => (n <= 4 ? 'enemy' : n <= 6 ? 'elite' : 'boss');
  const bump = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const arenaOf = (n, mini) => {
    const me = h('div', { class: 'sd-me', html: V.buildTank(0, pal()) });
    const foe = h('div', { class: 'sd-foe s' + n, html: V.sideFoe(foeOf(n)) });
    const el = h('div', { class: 'sd-arena' + (mini ? ' mini' : '') }, me, foe);
    return { el, me, foe, n };
  };
  // 一颗星从填对的格子飞进坦克
  const flyStar = (from, to, done) => {
    if (!from || !to || !from.isConnected) return done();
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const s = h('span', { class: 'sd-star' }, '⭐');
    s.style.left = ax - 15 + 'px';
    s.style.top = ay - 18 + 'px';
    document.body.append(s);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      s.style.transform = `translate(${b.left + b.width / 2 - ax}px, ${b.top + b.height / 2 - ay}px) scale(.6)`;
    }));
    setTimeout(() => { s.remove(); done(); }, 580);
  };
  // 致命一击：坦克蓄力，一道炮光打过去，敌方坦克变成冒烟的废铁
  const strike = async ar => {
    bump(ar.me, 'charge');
    await wait(900);
    const box = ar.el.getBoundingClientRect(), m = ar.me.getBoundingClientRect(), f = ar.foe.getBoundingClientRect();
    const x0 = m.left - box.left + m.width * 1.02, y = m.top - box.top + m.height * 0.42;
    const x1 = f.left - box.left + f.width * 0.45, fy = f.top - box.top + f.height * 0.55;
    const beam = h('span', { class: 'sd-beam', style: `left:${x0}px;top:${y - 6}px;width:${Math.max(24, x1 - x0)}px` });
    ar.el.append(beam);
    Audio.sfx.laser();
    await wait(380);
    beam.remove();
    Audio.sfx.boom();
    ar.el.append(h('span', { class: 'sd-bang', style: `left:${x1}px;top:${fy}px` }, '💥'));
    ar.foe.innerHTML = V.sideFoe(foeOf(ar.n || 4), true);
    bump(ar.foe, 'hit');
    ar.me.classList.remove('charge');
    await wait(1000);
  };

  const starsOf = id => (Store.data.sudoku.done[id] || {}).stars || 0;
  const saves = () => (Store.data.sudoku.saves = Store.data.sudoku.saves || {});
  const seen = () => (Store.data.sudoku.seen = Store.data.sudoku.seen || {});
  const sayOf = (g, v) => (g.names ? g.names[v - 1] : String(v));
  const symOf = (g, v) => (g.sym ? g.sym[v - 1] : String(v));
  const allPuzzles = () => DATA.flatMap(g => g.puzzles.map(p => ({ g, p })));
  // 每列从上往下一盘一盘开：做完上一盘才开下一盘
  const isOpen = (g, i) => i === 0 || starsOf(g.puzzles[i - 1].id) > 0;
  const rule = g => (g.sym ? '每行、每列、每个小宫，4 种水果各一个'
    : `每行、每列、每个 ${g.br}×${g.bc} 小宫，1～${g.size} 各一个`);

  // 进一盘：这种大小第一次玩，先看怎么玩
  S.open = async (g, p) => {
    if (!seen()[g.id]) {
      await S.demo(g);
      seen()[g.id] = 1;
      Store.save();
    }
    S.start(g, p);
  };

  // ---------- 训练营首页：和地图一样，一种大小一列，从上到下越来越难 ----------
  S.show = () => {
    run++;
    if (live) { live.stop(); live = null; }
    const total = allPuzzles().length;
    const done = allPuzzles().filter(x => starsOf(x.p.id)).length;
    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: () => { Audio.sfx.tap(); TM.App.map(); } }, '←'),
      h('div', { class: 'title' }, '🧩 数独训练营'),
      h('div', { class: 'pill' }, `完成 ${done}/${total}`));

    const cols = DATA.map(g => {
      const got = g.puzzles.reduce((s, p) => s + starsOf(p.id), 0);
      let marked = false;
      const nodes = g.puzzles.map((p, i) => {
        const open = isOpen(g, i), st = starsOf(p.id), saved = !!saves()[p.id];
        const next = open && !st && !marked;
        if (next) marked = true;
        return h('button', {
          class: 'node' + (open ? '' : ' locked') + (next ? ' next' : ''),
          onclick: () => { Audio.sfx.tap(); S.open(g, p); },
        },
        h('span', { class: 'n-idx' }, String(i + 1)),
        h('span', { class: 'n-name' }, saved && !st ? '接着做 ⏳' : p.lv),
        TM.App.starsEl(st));
      });
      return h('div', { class: 'zone', style: '--zc:' + g.color },
        h('div', { class: 'zone-head' },
          h('span', { class: 'icon' }, g.icon),
          h('div', null, h('div', { class: 'name' }, g.name), h('div', { class: 'desc' }, rule(g))),
          h('div', { class: 'sd-zfoot' },
            h('span', { class: 'zstars' }, `★ ${got}/${g.puzzles.length * 3}`),
            h('button', { class: 'sd-howto', onclick: () => { Audio.sfx.tap(); S.demo(g).then(S.show); } }, '▶ 怎么玩'))),
        h('div', { class: 'nodes' }, nodes));
    });

    TM.App.show(h('div', { class: 'screen map sudoku' }, top, h('div', { class: 'zones sd-zones' }, cols)));
  };

  // ---------- 怎么玩：小手在一块小棋盘上边说边演示 ----------
  const BOX_SAY = {
    4: '粗线分出来的 2 乘 2 小方块，叫小宫',
    6: '粗线分出来的小宫，是 2 行 3 列的长方形',
    9: '粗线分出来的 3 乘 3 小方块，叫小宫，一共 9 个',
  };
  S.demo = g => new Promise(resolve => {
    const n = g.size, p = g.puzzles[0];
    const sol = [...p.s].map(Number), cells = [...p.g].map(Number);
    const rowOf = i => Math.floor(i / n), colOf = i => i % n;
    const unit = {
      row: r => Array.from({ length: n }, (_, k) => r * n + k),
      col: c => Array.from({ length: n }, (_, k) => k * n + c),
      box: i => {
        const r0 = Math.floor(rowOf(i) / g.br) * g.br, c0 = Math.floor(colOf(i) / g.bc) * g.bc, u = [];
        for (let y = 0; y < g.br; y++) for (let x = 0; x < g.bc; x++) u.push((r0 + y) * n + c0 + x);
        return u;
      },
    };
    // 挑一行空格最少的，演示时先把这行补到只差一格
    let tr = 0, best = n + 1;
    for (let r = 0; r < n; r++) {
      const e = unit.row(r).filter(i => !cells[i]).length;
      if (e > 0 && e < best) { best = e; tr = r; }
    }
    const rowEmpty = unit.row(tr).filter(i => !cells[i]);
    const target = rowEmpty[rowEmpty.length - 1];
    rowEmpty.slice(0, -1).forEach(i => { cells[i] = sol[i]; });
    // 再挑一个别的空格演示填错：填它这一行里已经有的东西
    let wrongAt = -1, wrongV = 0;
    for (let i = 0; i < n * n && wrongAt < 0; i++) {
      if (cells[i] || i === target || rowOf(i) === tr) continue;
      const had = unit.row(rowOf(i)).map(k => cells[k]).find(v => v && v !== sol[i]);
      if (had) { wrongAt = i; wrongV = had; }
    }
    const thing = v => (g.names ? g.names[v - 1] : String(v));
    const all = g.names ? g.names.join('、') : `1 到 ${n}`;

    // 棋盘
    const cellPx = n <= 4 ? 70 : n <= 6 ? 54 : 40;
    const grid = h('div', { class: 'sd-grid', style: `--n:${n};--cell:${cellPx}px` });
    grid.append(h('span', { class: 'sd-corner' }));
    for (let c = 0; c < n; c++) grid.append(h('span', { class: 'sd-lab' }, String(c + 1)));
    const els = [];
    for (let r = 0; r < n; r++) {
      grid.append(h('span', { class: 'sd-lab' }, String(r + 1)));
      for (let c = 0; c < n; c++) {
        const i = r * n + c, alt = (Math.floor(r / g.br) + Math.floor(c / g.bc)) % 2;
        const el = h('span', { class: 'sd-cell' + (cells[i] ? ' given' : '') + (alt ? ' alt' : '') +
          ((c + 1) % g.bc === 0 && c < n - 1 ? ' br' : '') + ((r + 1) % g.br === 0 && r < n - 1 ? ' bb' : '') },
        cells[i] ? symOf(g, cells[i]) : '');
        els.push(el);
        grid.append(el);
      }
    }
    const keyEls = Array.from({ length: n }, (_, k) => h('span', { class: 'sd-key' }, symOf(g, k + 1)));
    const cap = h('div', { class: 'sd-demo-cap' });
    const dar = arenaOf(n, true);
    const hand = h('span', { class: 'sd-hand' }, '👆');
    const fx = h('span', { class: 'sd-demo-fx' });
    let stopped = false;
    const end = () => {
      if (stopped) return;
      stopped = true;
      Audio.stop();
      ov.remove();
      resolve();
    };
    const doneBtn = h('button', { class: 'btn green', style: 'display:none', onclick: () => { Audio.sfx.tap(); end(); } }, '我会了，开始 ▶');
    const box = h('div', { class: 'sd-demo' },
      h('div', { class: 'sd-demo-head' },
        h('b', null, `▶ ${g.name} 怎么玩`),
        h('button', { class: 'btn small gray', onclick: () => { Audio.sfx.tap(); end(); } }, '跳过 ⏭')),
      h('div', { class: 'sd-demo-body' },
        h('div', { class: 'sd-gridwrap' }, grid),
        h('div', { class: 'sd-demo-side' }, dar.el, cap,
          h('div', { class: 'sd-keys', style: `--kcols:${n <= 4 ? 2 : 3}` }, keyEls), doneBtn)),
      hand, fx);
    const ov = h('div', { class: 'overlay sd-demo-ov' }, box);
    document.getElementById('app').append(ov);

    const wait = ms => new Promise(r => setTimeout(r, ms));
    const guard = () => { if (stopped) throw new Error('stop'); };
    // 说一句：等读完；关了声音也留够看字的时间
    const say = async t => {
      guard();
      cap.textContent = t;
      const t0 = Date.now();
      await Audio.speak(t);
      guard();
      const rest = t.length * 160 - (Date.now() - t0);
      if (rest > 0) await wait(rest);
      await wait(300);
      guard();
    };
    const hl = (list, cls = 'hl') => {
      els.forEach(e => e.classList.remove('hl', 'hl2'));
      (list || []).forEach(i => els[i].classList.add(cls));
    };
    const center = el => {
      const a = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2];
    };
    const tap = async el => {
      guard();
      const [x, y] = center(el);
      hand.style.opacity = '1';
      hand.style.transform = `translate(${x - 14}px, ${y - 6}px)`;
      await wait(750);
      guard();
      hand.classList.add('tap');
      el.classList.add('pressed');
      Audio.sfx.tap();
      await wait(260);
      hand.classList.remove('tap');
      el.classList.remove('pressed');
    };
    const boom = (el, text) => {
      const [x, y] = center(el);
      fx.textContent = text;
      fx.style.left = x + 'px';
      fx.style.top = y + 'px';
      fx.classList.remove('go');
      void fx.offsetWidth;
      fx.classList.add('go');
    };

    (async () => {
      await wait(300);
      await say(`这是数独。每一行、每一列、每一个小宫里，${all}都只能有一个，不能重复。`);
      hl(unit.row(tr));
      await say(`横着的一排叫一行，这是第 ${tr + 1} 行。`);
      hl(unit.col(colOf(target)));
      await say(`竖着的一排叫一列，这是第 ${colOf(target) + 1} 列。`);
      hl(unit.box(target));
      await say(BOX_SAY[n] + '。');
      hl(unit.row(tr));
      const have = unit.row(tr).filter(i => i !== target).map(i => thing(cells[i]));
      await say(`看第 ${tr + 1} 行：已经有${have.join('、')}，只空一格。`);
      await tap(els[target]);
      els[target].classList.add('sel');
      await say(`先点这个空格。它还缺${thing(sol[target])}。`);
      await tap(keyEls[sol[target] - 1]);
      els[target].classList.remove('sel');
      els[target].classList.add('filled');
      els[target].textContent = symOf(g, sol[target]);
      Audio.sfx.magic();
      boom(els[target], '⭐');
      dar.me.innerHTML = V.buildTank(1, pal());
      bump(dar.me, 'pop');
      hl(unit.row(tr), 'hl2');
      await say('再点下面的' + thing(sol[target]) + '，填对啦！每填对一格，你的坦克就多一个零件。');
      if (wrongAt >= 0) {
        hl(unit.row(rowOf(wrongAt)));
        await tap(els[wrongAt]);
        els[wrongAt].classList.add('sel');
        await tap(keyEls[wrongV - 1]);
        Audio.sfx.bad();
        els[wrongAt].classList.remove('sel');
        els[wrongAt].classList.add('wrong');
        els[wrongAt].textContent = symOf(g, wrongV);
        bump(dar.foe, 'taunt');
        await say(`如果填${thing(wrongV)}，格子会变红，敌人会笑你。因为这一行已经有${thing(wrongV)}了。`);
        els[wrongAt].classList.remove('wrong');
        els[wrongAt].textContent = '';
      }
      hl(null);
      hand.style.opacity = '0';
      cap.textContent = '一格一格填，坦克越来越厉害……';
      for (let k = 2; k <= 10; k++) {
        guard();
        dar.me.innerHTML = V.buildTank(k, pal());
        bump(dar.me, 'pop');
        Audio.sfx.tap();
        await wait(320);
      }
      guard();
      cap.textContent = '全部填完，就变成超级坦克，发起致命一击！';
      await strike(dar);
      await say('全部填完，就变成超级坦克，发起致命一击，打败敌人！');
      await say(n <= 4 ? '做不出来的时候，先找只空一格的行、列或小宫。'
        : '格子多也不怕：先找快填满的行、列或小宫，一格一格填。');
      cap.textContent = '现在轮到你啦！';
      doneBtn.style.display = '';
      Audio.speak('现在轮到你啦！');
    })().catch(() => {});
  });

  // ---------- 一盘的题目和界面 ----------
  S.start = (g, p) => {
    if (live) live.stop();
    const n = g.size, sol = p.s.split('').map(Number);
    let cells = p.g.split('').map(Number);
    const given = cells.map(v => v !== 0);
    const saved = saves()[p.id] || null;
    let wrong = 0, tips = 0, sec = 0;
    if (saved) {
      wrong = saved.wrong || 0;
      tips = saved.tips || 0;
      sec = saved.sec || 0;
      (saved.cells || []).forEach((v, i) => { if (!given[i] && v && v === sol[i]) cells[i] = v; });
    }
    let t0 = Date.now() - sec * 1000;
    // 棋盘上重看「怎么玩」时，计时先停住
    const replay = async () => {
      const a = Date.now();
      await S.demo(g);
      t0 += Date.now() - a;
    };
    const st = { g, p, n, sol, cells, given, wrong, tips, sel: null, done: false, dead: false, fired: new Set() };
    const myRun = ++run;

    const timeEl = h('div', { class: 'pill' }, '⏱ 0:00');
    const status = h('div', { class: 'sd-status' });
    const posEl = h('div', { class: 'sd-pos' }, '点一个空格开始');
    const grid = h('div', { class: 'sd-grid' });

    // 战场：填对的格数 → 装了几个零件。格子比零件多时，下一个零件要先充满能量
    const E = given.filter(x => !x).length;
    const ar = arenaOf(n);
    const meter = h('div', { class: 'sd-meter' }, h('i', null), h('span', null));
    ar.el.append(meter);
    const fillCount = () => st.cells.filter((v, i) => !given[i] && v === sol[i]).length;
    let peak = 0, shown = -1;          // 擦掉格子不拆零件，按填到过的最多格算
    const stageOf = () => Math.min(10, Math.floor(peak * 10 / E + 1e-9));
    const drawTank = () => {
      const s = stageOf(), pr = peak * 10 / E;
      if (s !== shown) { ar.me.innerHTML = V.buildTank(s, pal()); shown = s; }
      const bar = s >= 10 ? 1 : E > 10 ? pr - s : s / 10;
      meter.firstChild.style.width = Math.round(bar * 100) + '%';
      meter.lastChild.textContent = s >= 10 ? '超级坦克 ✨ 准备致命一击！'
        : `零件 ${s}/10 · 下一个：${V.BUILD_PARTS[s]}${E > 10 ? ' ⚡' : ''}`;
    };
    peak = fillCount();
    drawTank();
    const grow = i => {
      const before = stageOf();
      peak = Math.max(peak, fillCount());
      const after = stageOf();
      flyStar(grid.querySelectorAll('.sd-cell')[i], ar.me, () => {
        drawTank();
        if (after > before) {
          bump(ar.me, 'pop');
          Audio.sfx.magic();
          if (after < 10) Audio.speak(after === 8 ? '坦克变大啦！' : `装上${V.BUILD_PARTS[after - 1]}啦！`);
        } else Audio.sfx.coin();
      });
    };

    const elapsed = () => Math.round((Date.now() - t0) / 1000);
    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const store = () => {
      const sd = Store.data.sudoku;
      if (st.done) delete sd.saves[p.id];
      else sd.saves[p.id] = { id: p.id, cells: st.cells, wrong: st.wrong, tips: st.tips, sec: elapsed() };
      Store.save();
    };

    // 键盘
    const keys = h('div', { class: 'sd-keys' + (n > 6 ? ' k9' : ''), style: `--kcols:${n <= 4 ? 2 : 3}` },
      Array.from({ length: n }, (_, k) => h('button', {
        class: 'sd-key', onclick: () => { Audio.sfx.tap(); place(k + 1); },
      }, symOf(g, k + 1))));

    const paint = () => {
      grid.innerHTML = '';
      const cellSize = n <= 4 ? 96 : n <= 6 ? 74 : 56;
      grid.style.setProperty('--n', n);
      grid.style.setProperty('--cell', cellSize + 'px');
      grid.style.setProperty('--br', g.br);
      grid.style.setProperty('--bc', g.bc);
      grid.append(h('span', { class: 'sd-corner' }));
      for (let c = 0; c < n; c++) grid.append(h('span', { class: 'sd-lab' }, String(c + 1)));
      const sel = st.sel;
      for (let r = 0; r < n; r++) {
        grid.append(h('span', { class: 'sd-lab' }, String(r + 1)));
        for (let c = 0; c < n; c++) {
          const i = r * n + c, v = st.cells[i];
          const peer = sel != null && sel !== i && (Math.floor(sel / n) === r || sel % n === c ||
            (Math.floor(Math.floor(sel / n) / g.br) === Math.floor(r / g.br) && Math.floor((sel % n) / g.bc) === Math.floor(c / g.bc)));
          const alt = (Math.floor(r / g.br) + Math.floor(c / g.bc)) % 2;
          const cls = 'sd-cell' + (given[i] ? ' given' : v ? ' filled' : '') + (sel === i ? ' sel' : '') +
            (peer ? ' peer' : '') + (alt ? ' alt' : '') +
            ((c + 1) % g.bc === 0 && c < n - 1 ? ' br' : '') + ((r + 1) % g.br === 0 && r < n - 1 ? ' bb' : '');
          const b = h('button', { class: cls, 'data-i': String(i) }, v ? symOf(g, v) : '');
          b.onclick = () => {
            if (given[i] || st.done || st.dead) { Audio.sfx.tap(); return; }
            st.sel = i;
            Audio.sfx.tap();
            paint();
            posEl.textContent = `第 ${r + 1} 行，第 ${c + 1} 列`;
            Audio.speak(`第${r + 1}行，第${c + 1}列`);
          };
          grid.append(b);
        }
      }
      const left = st.cells.filter((v, i) => !given[i] && v !== sol[i]).length;
      status.textContent = `还剩 ${left} 格 · 看错 ${st.wrong} 次 · 提示 ${st.tips} 次`;
      timeEl.textContent = '⏱ ' + fmt(elapsed());
    };

    // 填错：闪一下红，不改棋盘
    const flashBad = i => {
      const el = grid.querySelectorAll('.sd-cell')[i];
      if (!el) return;
      el.classList.add('bad');
      setTimeout(() => el.classList.remove('bad'), 600);
    };

    // 一整行 / 一整列 / 一个宫填满：坦克闪一下光
    const cheer = text => {
      bump(ar.me, 'glow');
      Audio.sfx.ok();
      TM.App.toast(text, 1400);
    };

    const checkUnits = i => {
      const r = Math.floor(i / n), c = i % n;
      const row = Array.from({ length: n }, (_, k) => r * n + k);
      const col = Array.from({ length: n }, (_, k) => k * n + c);
      const box = [];
      const r0 = Math.floor(r / g.br) * g.br, c0 = Math.floor(c / g.bc) * g.bc;
      for (let y = 0; y < g.br; y++) for (let x = 0; x < g.bc; x++) box.push((r0 + y) * n + c0 + x);
      const full = set => set.every(k => st.cells[k] === sol[k]);
      if (full(row) && !st.fired.has('r' + r)) { st.fired.add('r' + r); cheer(`第 ${r + 1} 行完成啦！`); }
      if (full(col) && !st.fired.has('c' + c)) { st.fired.add('c' + c); cheer(`第 ${c + 1} 列完成啦！`); }
      if (full(box) && !st.fired.has('b' + r0 + ',' + c0)) { st.fired.add('b' + r0 + ',' + c0); cheer('这一宫完成啦！'); }
    };

    const finish = async () => {
      st.done = true;
      if (live) { live.stop(); live = null; }
      const used = elapsed();
      let stars = st.wrong === 0 && st.tips === 0 ? 3 : st.wrong <= 3 ? 2 : 1;
      if (st.tips > 0) stars = Math.min(stars, 2);
      const old = Store.data.sudoku.done[p.id] || { stars: 0 };
      const gain = Math.max(0, stars - old.stars);
      Store.data.sudoku.done[p.id] = {
        stars: Math.max(old.stars, stars),
        best: old.best ? Math.min(old.best, used) : used,
        mistakes: st.wrong, tips: st.tips,
      };
      delete Store.data.sudoku.saves[p.id];
      Store.save();
      TM.Tasks.bump('sudoku');
      // 练一盘就给一点辛苦星；破自己的纪录再按星级加，重复刷同一盘不会越刷越多
      const base = n <= 4 ? 1 : n <= 6 ? 2 : 3;
      const rows = [[`完成一盘${g.name}数独`, base]];
      if (gain) rows.push([`新拿到 ${gain} 颗关卡星`, gain * 2]);
      const pay = TM.Rewards.pay(rows);
      // 最后一颗星飞到、坦克变成金色，再发起致命一击；中途离开这一页就不弹完成框
      await wait(700);
      if (run !== myRun) return;
      Audio.speak('超级坦克，致命一击！');
      await strike(ar);
      if (run !== myRun) return;
      Audio.sfx.win();
      TM.App.ask({
        cls: 'report', title: '数独完成！',
        text: [
          h('div', { class: 'stars' }, [0, 1, 2].map(k => h('span', { class: k < stars ? '' : 'off' }, '⭐'))),
          h('div', { class: 'praise' }, stars === 3 ? '一次都没看错，真厉害！' : st.tips ? '用了提示也没关系，下次试着自己想！' : '看错几次没关系，接着练就更快了！'),
          h('div', { class: 'dtext' }, `用时 ${fmt(used)}，看错 ${st.wrong} 次，用了 ${st.tips} 次提示。`),
          TM.Hangar.payEl(pay),
        ],
        buttons: [
          nextOf(g, p) ? { label: '下一盘 ▶', value: 'next', cls: 'green' } : null,
          { label: '再玩这盘', value: 'again', cls: 'blue' },
          { label: '回训练营', value: 'list', cls: 'gray' },
        ].filter(Boolean),
      }).then(v => {
        if (v === 'next') {
          const nx = nextOf(g, p);
          if (nx) S.start(nx.g, nx.p); else S.show();
        } else if (v === 'again') S.start(g, p);
        else S.show();
      });
    };

    function place(v) {
      if (st.done || st.dead) return;
      if (st.sel == null) { TM.App.toast('先点一个空格'); Audio.speak('先点一个空格'); return; }
      const i = st.sel;
      if (st.cells[i] === v) {   // 再点同一个数字 = 擦掉
        st.cells[i] = 0;
        Audio.sfx.tap();
        paint(); store();
        return;
      }
      if (v === st.sol[i]) {
        st.cells[i] = v;
        paint(); store();
        grow(i);
        checkUnits(i);
        if (st.cells.every((x, k) => x === st.sol[k])) return finish();
      } else {
        st.wrong++;
        Audio.sfx.bad();
        paint();
        flashBad(i);
        bump(ar.foe, 'taunt');
        store();
      }
    }

    // 提示：把选中的格（或第一个空格）填上正确答案
    const hint = () => {
      if (st.done || st.dead) return;
      let i = st.sel;
      if (i == null || st.cells[i] === st.sol[i]) i = st.cells.findIndex((v, k) => !given[k] && v !== st.sol[k]);
      if (i < 0) return;
      st.sel = i;
      st.cells[i] = st.sol[i];
      st.tips++;
      Audio.sfx.tap();
      paint(); store();
      grow(i);
      checkUnits(i);
      if (st.cells.every((x, k) => x === st.sol[k])) return finish();
    };

    const erase = () => {
      if (st.done || st.dead || st.sel == null || given[st.sel]) return;
      st.cells[st.sel] = 0;
      Audio.sfx.tap();
      paint(); store();
    };

    const back = async () => {
      if (st.done) return S.show();
      const v = await TM.App.ask({
        emoji: '🧩', title: '先回去吗？',
        text: '这一盘的进度会留着，下次回来还能接着填。',
        buttons: [{ label: '接着做', value: 0, cls: 'green' }, { label: '回训练营', value: 1, cls: 'gray' }],
      });
      if (!v) return;
      st.dead = true;
      store();
      S.show();
    };

    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: back }, '←'),
      h('div', { class: 'title' }, `🧩 ${g.name} 第 ${g.puzzles.indexOf(p) + 1} 盘`),
      timeEl, h('div', { class: 'pill' }, p.lv));

    TM.App.show(h('div', { class: 'screen sudoku-play' }, top,
      h('div', { class: 'sd-main' },
        h('div', { class: 'sd-left' }, h('div', { class: 'sd-gridwrap' }, grid), status),
        h('div', { class: 'sd-side' },
          ar.el,
          posEl,
          keys,
          h('div', { class: 'sd-acts' },
            h('button', { class: 'btn green', onclick: () => { Audio.sfx.tap(); hint(); } }, '💡 提示'),
            h('button', { class: 'btn gray', onclick: erase }, '🧽 擦掉')),
          h('div', { class: 'sd-help' }, rule(g) + '。'),
          h('button', { class: 'sd-howto', onclick: () => { Audio.sfx.tap(); replay(); } }, '▶ 怎么玩')))),
    { keepVoice: true });

    paint();
    store();
    Audio.speak(saved ? '接着上次继续填吧。' : `数独：每一行、每一列、每一个小宫，${n === 4 && g.sym ? '4 种水果' : `1 到 ${n}`}都不能重复。点一个空格，再点下面的数字。每填对一格，坦克就多一个零件。`);

    live = {
      stop() {
        clearInterval(this.timer);
        st.dead = true;
        if (st.done) delete Store.data.sudoku.saves[p.id];
        else Store.data.sudoku.saves[p.id] = { id: p.id, cells: st.cells, wrong: st.wrong, tips: st.tips, sec: elapsed() };
        Store.save();
      },
      timer: setInterval(() => { if (!st.dead) timeEl.textContent = '⏱ ' + fmt(elapsed()); }, 1000),
    };
  };

  // 下一盘：同一列往下走
  const nextOf = (g, p) => {
    const i = g.puzzles.indexOf(p);
    return g.puzzles[i + 1] ? { g, p: g.puzzles[i + 1] } : null;
  };

  TM.Sudoku = S;
})(window.TM);
