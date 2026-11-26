// 数独训练营：独立的数独副本，按难度一盘一盘练
(function (TM) {
  const { U, Store, Audio } = TM;
  const h = U.h;
  const DATA = TM.SUDOKU_DATA || [];
  const S = {};

  let live = null;   // 当前这一盘的计时器，换页时要停掉

  const starsOf = id => (Store.data.sudoku.done[id] || {}).stars || 0;
  const saves = () => (Store.data.sudoku.saves = Store.data.sudoku.saves || {});
  const sayOf = (g, v) => (g.names ? g.names[v - 1] : String(v));
  const symOf = (g, v) => (g.sym ? g.sym[v - 1] : String(v));
  const allPuzzles = () => DATA.flatMap(g => g.puzzles.map(p => ({ g, p })));

  // ---------- 训练营首页 ----------
  S.show = () => {
    if (live) { live.stop(); live = null; }
    const total = allPuzzles().length;
    const done = allPuzzles().filter(x => starsOf(x.p.id)).length;
    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: () => { Audio.sfx.tap(); TM.App.map(); } }, '←'),
      h('div', { class: 'title' }, '🧩 数独训练营'),
      h('div', { class: 'pill' }, `完成 ${done}/${total}`));

    const groups = DATA.map(g => h('div', { class: 'sd-group' },
      h('div', { class: 'sd-group-head' },
        h('b', null, g.name),
        h('small', null, g.size === 4 && g.sym ? '每行、每列、每个小宫，4 种水果各一个'
          : `每行、每列、每个 ${g.br}×${g.bc} 宫，1～${g.size} 各一个`)),
      h('div', { class: 'sd-puzzles' }, g.puzzles.map((p, i) => {
        const st = starsOf(p.id), saved = !!saves()[p.id];
        return h('button', { class: 'sd-lv' + (st ? ' done' : '') + (st ? '' : saved ? ' inprog' : ''),
          onclick: () => { Audio.sfx.tap(); S.start(g, p); } },
          h('b', null, `第 ${i + 1} 盘`),
          h('small', null, st ? p.lv : saved ? '接着做 ⏳' : p.lv),
          TM.App.starsEl(st));
      }))));

    TM.App.show(h('div', { class: 'screen sudoku' }, top,
      h('div', { class: 'sd-rule' }, '👆 点一个空格，再点下面的数字。每行、每列、每个小宫都不能重复。填对会开炮，填错会变红。'),
      h('div', { class: 'sd-list' }, groups)));
  };

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
    const t0 = Date.now() - sec * 1000;
    const st = { g, p, n, sol, cells, given, wrong, tips, sel: null, done: false, dead: false, fired: new Set() };

    const timeEl = h('div', { class: 'pill' }, '⏱ 0:00');
    const status = h('div', { class: 'sd-status' });
    const posEl = h('div', { class: 'sd-pos' }, '点一个空格开始');
    const grid = h('div', { class: 'sd-grid' });
    const fx = h('div', { class: 'sd-fx' });

    const elapsed = () => Math.round((Date.now() - t0) / 1000);
    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const store = () => {
      const sd = Store.data.sudoku;
      if (st.done) delete sd.saves[p.id];
      else sd.saves[p.id] = { id: p.id, cells: st.cells, wrong: st.wrong, tips: st.tips, sec: elapsed() };
      Store.save();
    };

    // 键盘
    const keys = h('div', { class: 'sd-keys', style: `--kcols:${n <= 4 ? 2 : 3}` },
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

    // 一整行 / 一整列 / 一个宫填满：坦克开一炮
    const blast = text => {
      const shell = h('span', { class: 'sd-shell' }, '🚀');
      const plane = h('span', { class: 'sd-plane' }, '🛩️');
      fx.append(shell, plane);
      setTimeout(() => { shell.remove(); plane.remove(); }, 1000);
      Audio.sfx.shoot();
      setTimeout(() => Audio.sfx.boom(), 350);
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
      if (full(row) && !st.fired.has('r' + r)) { st.fired.add('r' + r); blast(`第 ${r + 1} 行填满啦，开炮！`); }
      if (full(col) && !st.fired.has('c' + c)) { st.fired.add('c' + c); blast(`第 ${c + 1} 列填满啦，开炮！`); }
      if (full(box) && !st.fired.has('b' + r0 + ',' + c0)) { st.fired.add('b' + r0 + ',' + c0); blast('一整宫填满啦，开炮！'); }
    };

    const finish = () => {
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
          { label: '下一盘 ▶', value: 'next', cls: 'green' },
          { label: '再玩这盘', value: 'again', cls: 'blue' },
          { label: '回训练营', value: 'list', cls: 'gray' },
        ],
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
        Audio.sfx.shoot();
        paint(); store();
        checkUnits(i);
        if (st.cells.every((x, k) => x === st.sol[k])) return finish();
      } else {
        st.wrong++;
        Audio.sfx.bad();
        paint();
        flashBad(i);
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
        h('div', { class: 'sd-left' }, h('div', { class: 'sd-gridwrap' }, grid, fx), status),
        h('div', { class: 'sd-side' },
          posEl,
          keys,
          h('div', { class: 'sd-acts' },
            h('button', { class: 'btn green', onclick: () => { Audio.sfx.tap(); hint(); } }, '💡 提示'),
            h('button', { class: 'btn gray', onclick: erase }, '🧽 擦掉')),
          h('div', { class: 'sd-help' }, g.sym ? '每行、每列、每个小宫，4 种水果各一个。' : `每行、每列、每个小宫，1～${n} 各一个。`)))),
    { keepVoice: true });

    paint();
    store();
    Audio.speak(saved ? '接着上次继续填吧。' : `数独：每一行、每一列、每一个小宫，${n === 4 && g.sym ? '4 种水果' : `1 到 ${n}`}都不能重复。点一个空格，再点下面的数字。`);

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

  const nextOf = (g, p) => {
    const all = allPuzzles();
    const i = all.findIndex(x => x.p.id === p.id);
    return all[i + 1] || null;
  };

  TM.Sudoku = S;
})(window.TM);
