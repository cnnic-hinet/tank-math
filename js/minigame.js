// 小游戏关「敌机编队」：一群敌机飞过来，点中符合要求的那几架
(function (TM) {
  const { U, Store, Audio, Levels: L, Battle, Lines } = TM;
  const h = U.h;
  const { rand, pick, shuffle } = U;
  const wait = U.sleep;
  const M = {};
  const ROUNDS = 3, N = 6;

  // 从 make() 里挑出 k 个对的、N−k 个错的（不重复）
  const fill = (k, make) => {
    const out = [], seen = new Set();
    for (let t = 0; out.length < N && t < 500; t++) {
      const it = make(t < 300 && out.filter(x => x.ok).length < k);
      if (seen.has(it.label) || (out.filter(x => x.ok).length >= k && it.ok)) continue;
      if (out.filter(x => !x.ok).length >= N - k && !it.ok) continue;
      seen.add(it.label);
      out.push(it);
    }
    return shuffle(out);
  };
  const exp = (a, op, b) => `${a} ${op} ${b}`;

  const SHAPES = { 长方体: ['🧱', '📦', '🧃'], 正方体: ['🎲', '🧊'], 圆柱: ['🥫', '🔋', '🧻'], 球: ['⚽', '🏀', '🍊', '⚾'] };

  // 每个战区一种玩法。返回 {title, speak, items: [{label, ok, why}]}
  const GENS = [
    () => {
      const x = rand(8, 14);
      return {
        title: `点出比 ${x} 大的数`, speak: `点出比${x}大的数`,
        items: fill(rand(2, 3), () => { const n = rand(x - 7, x + 6); return { label: String(n), ok: n > x, why: n === x ? `${n} = ${x}` : `${n} < ${x}` }; }),
      };
    },
    () => {
      const t = rand(6, 10);
      return {
        title: `点出得数是 ${t} 的算式`, speak: `点出得数是${t}的算式`,
        items: fill(rand(2, 3), want => {
          const add = Math.random() < 0.6;
          if (want) { const a = rand(add ? 0 : t, add ? t : 10); return add ? { label: exp(a, '+', t - a), ok: true } : { label: exp(a, '−', a - t), ok: true }; }
          const a = rand(1, 10), b = add ? rand(0, 10 - a) : rand(0, a), v = add ? a + b : a - b;
          return { label: exp(a, add ? '+' : '−', b), ok: v === t, why: `= ${v}` };
        }),
      };
    },
    () => {
      const t = rand(11, 16);
      return {
        title: `点出得数是 ${t} 的算式`, speak: `点出得数是${t}的算式`,
        items: fill(rand(2, 3), want => {
          const a = want ? rand(t - 9, 9) : rand(2, 9), b = want ? t - a : rand(11 - a, 9);
          return { label: exp(a, '+', b), ok: a + b === t, why: `= ${a + b}` };
        }),
      };
    },
    () => {
      const ask = pick(Object.keys(SHAPES));
      const all = Object.entries(SHAPES).flatMap(([k, es]) => es.map(e => [e, k]));
      return {
        title: `点出${ask}形状的东西`, speak: `点出${ask}形状的东西`,
        items: fill(Math.min(rand(2, 3), SHAPES[ask].length), want => { const [e, k] = want ? [pick(SHAPES[ask]), ask] : pick(all); return { label: e, ok: k === ask, why: k }; }),
      };
    },
    () => {
      const t = rand(4, 9);
      return {
        title: `点出得数是 ${t} 的算式`, speak: `点出得数是${t}的算式`,
        items: fill(rand(2, 3), want => {
          const b = want ? rand(Math.max(2, 11 - t), 9) : rand(2, 9), a = want ? t + b : rand(11, 9 + b);
          return { label: exp(a, '−', b), ok: a - b === t, why: `= ${a - b}` };
        }),
      };
    },
    () => {
      const k = rand(2, 9);
      return {
        title: `点出十位是 ${k} 的数`, speak: `点出十位是${k}的数`,
        items: fill(rand(2, 3), want => {
          const n = want ? k * 10 + rand(0, 9) : pick([rand(1, 9) * 10 + k, rand(10, 99)]);
          return { label: String(n), ok: Math.floor(n / 10) === k, why: `十位是 ${Math.floor(n / 10)}` };
        }),
      };
    },
  ];
  // 英语战区的玩法：字母和颜色数字
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const NUMW = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const COLORW = ['red', 'yellow', 'blue', 'green', 'black', 'white', 'pink', 'orange', 'purple', 'brown'];
  const EN_GENS = {
    e1: [
      () => ({
        title: '点出大写字母', speak: '点出大写字母',
        items: fill(3, want => {
          const L = pick(ALPHA);
          return { label: want ? L : L.toLowerCase(), ok: want, why: '这是小写' };
        }),
      }),
      () => ({
        title: '点出小写字母', speak: '点出小写字母',
        items: fill(3, want => {
          const L = pick(ALPHA);
          return { label: want ? L.toLowerCase() : L, ok: want, why: '这是大写' };
        }),
      }),
      () => {
        const t = pick(ALPHA.slice(0, 10));
        return {
          title: `点出字母 ${t}`, speak: `点出字母`, en: t,
          items: fill(2, want => {
            const L = want ? t : pick(ALPHA.filter(x => x !== t));
            return { label: want && Math.random() < 0.5 ? L.toLowerCase() : L, ok: want, why: `不是 ${t}` };
          }),
        };
      },
    ],
    e2: [
      () => ({
        title: '点出表示颜色的单词', speak: '点出表示颜色的单词',
        items: fill(3, want => want ? { label: pick(COLORW), ok: true } : { label: pick(NUMW), ok: false, why: '这是数字' }),
      }),
      () => ({
        title: '点出表示数字的单词', speak: '点出表示数字的单词',
        items: fill(3, want => want ? { label: pick(NUMW), ok: true } : { label: pick(COLORW), ok: false, why: '这是颜色' }),
      }),
      () => {
        const t = rand(2, 9);
        return {
          title: `点出比 ${NUMW[t - 1]} 大的数字`, speak: `点出比`, en: NUMW[t - 1],
          items: fill(3, want => {
            const n = want ? rand(t + 1, 10) : rand(1, t);
            return { label: NUMW[n - 1], ok: n > t, why: n === t ? '一样大' : '比它小' };
          }),
        };
      },
    ],
  };
  M.gen = zi => {
    const z = L.ZONES[zi];
    if (z && z.subject === 'en') return pick(EN_GENS[z.id] || EN_GENS.e1)();
    return GENS[zi % GENS.length]();
  };
  // 一轮：敌机分三条航线慢慢飞过，点中所有对的才进入下一轮。返回点错的次数
  const round = (st, r) => new Promise(done => {
    const f = st.f;
    st.banner.textContent = r.title;
    if (r.en) Audio.speakParts([{ text: r.speak }, { text: r.en, lang: 'en' }]);
    else Audio.speak(r.speak);
    let left = r.items.filter(x => x.ok).length, miss = 0;
    r.items.forEach((it, i) => {
      const dur = 13 + (i % 3) * 2;
      const p = h('button', { class: 'm-plane', style: { top: 16 + (i % 3) * 21 + '%', animationDuration: dur + 's', animationDelay: -(Math.floor(i / 3) * dur / 2 + (i % 3) * 2) + 's' } },
        h('span', { class: 'm-icon' }, '🛩️'), h('span', { class: 'm-label' }, it.label));
      p.onclick = async () => {
        if (p.disabled || st.dead) return;
        if (!it.ok) {
          miss++;
          Audio.sfx.bad();
          p.classList.add('wrong');
          if (it.why) p.append(h('span', { class: 'm-why' }, it.why));
          setTimeout(() => p.classList.remove('wrong'), 500);
          return;
        }
        p.disabled = true;
        p.classList.add('locked');
        Audio.sfx.shoot();
        const pt = await f.shell(f.me, p, 'mine');
        Audio.sfx.boom();
        f.boom(pt, false);
        p.classList.add('down');
        setTimeout(() => p.remove(), 600);
        if (--left === 0) {
          await wait(700);
          f.layer.innerHTML = '';
          done(miss);
        }
      };
      f.layer.append(p);
    });
  });

  M.run = async (zi, li) => {
    const lv = L.get(zi, li), zone = L.ZONES[zi], key = L.key(zi, li);
    const st = { dead: false };
    const fieldEl = h('div');
    const progress = h('div', { class: 'progress' });
    const exit = h('button', {
      class: 'btn-icon',
      onclick: async () => {
        Audio.sfx.tap();
        const v = await TM.App.ask({
          emoji: '🏳️', title: '要退出吗？', text: '这一关的进度不会保存。',
          buttons: [{ label: '继续作战', value: 0, cls: 'green' }, { label: '退出', value: 1, cls: 'gray' }],
        });
        if (!v) return;
        st.dead = true;
        TM.App.map();
      },
    }, '✖');
    st.banner = h('div', { class: 'm-banner' });
    TM.App.show(h('div', { class: 'screen minigame' },
      h('div', { class: 'bar' }, exit, h('div', { class: 'lv-name' }, `${zone.icon} ${lv.name}`), progress),
      h('div', { class: 'm-field' }, fieldEl, st.banner)), { keepVoice: true });
    st.f = new Battle(fieldEl, zi);
    st.f.base.style.display = 'none';
    Lines.onSay = t => st.f.say(t);
    await Audio.wait();
    if (st.dead) return;
    Lines.say('mini');
    await wait(1200);
    let miss = 0;
    const marks = [];
    for (let i = 0; i < ROUNDS; i++) {
      progress.innerHTML = '';
      for (let j = 0; j < ROUNDS; j++) progress.append(h('i', { class: marks[j] || (j === i ? 'cur' : '') }));
      const m = await round(st, M.gen(zi));
      if (st.dead) return;
      miss += m;
      marks.push(m ? 'miss' : 'ok');
      Lines.say(i < ROUNDS - 1 ? 'hit' : 'win');
      await wait(500);
    }
    if (st.dead) return;
    const stars = miss <= 1 ? 3 : miss <= 3 ? 2 : 1;
    const old = Store.data.levels[key] || { stars: 0 };
    Store.data.levels[key] = { stars: Math.max(old.stars, stars), best: Math.max(old.best || 0, ROUNDS * 2 - miss) };
    Store.save();
    TM.Tasks.bump('win');
    if (stars === 3) TM.Tasks.bump('three');
    // 发星星：这次拿到几颗星就给几颗，新拿到的关卡星每颗再给 2 颗
    const gain = Math.max(0, stars - old.stars);
    const pay = TM.Rewards.pay([[`击落敌机拿到 ${stars} 颗星`, stars], [`新拿到 ${gain} 颗关卡星`, gain * 2]]);
    Audio.sfx.win();
    const v = await TM.App.ask({
      cls: 'report', title: '敌机编队全部击落！',
      text: [
        h('div', { class: 'stars' }, [0, 1, 2].map(k => h('span', { class: k < stars ? '' : 'off' }, '⭐'))),
        h('div', { class: 'praise' }, miss ? `点错了 ${miss} 次，下次看准了再开炮！` : '一架都没点错，眼睛真亮！'),
        TM.Hangar.payEl(pay),
      ],
      buttons: [
        { label: 'Boss 决战 ▶', value: 'next', cls: 'green' },
        { label: '再玩一次', value: 'again', cls: 'blue' },
        { label: '回地图', value: 'map', cls: 'gray' },
      ],
    });
    if (v === 'next') TM.Play.level(zi, li + 1);
    else if (v === 'again') TM.Play.level(zi, li);
    else TM.App.map();
  };
  TM.Mini = M;
})(window.TM);
