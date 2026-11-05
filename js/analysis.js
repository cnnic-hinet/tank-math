// 学习分析：哪些题型容易错、错在哪儿、接下来练什么
(function (TM) {
  const { U, Store, Q, Levels: L, Repair } = TM;
  const h = U.h;
  const A = {};
  const D = () => Store.data;
  const DIFF = ['基础', '提高', '挑战'];
  const pct = r => (r == null ? '—' : Math.round(r * 100) + '%');
  const col = r => (r == null ? '#c8c3d6' : r >= 0.85 ? '#4caf50' : r >= 0.6 ? '#ffb300' : '#ff6b5e');

  // ---------- 把一次错答归到一类，看看是哪种错 ----------
  const KINDS = {
    flip: { name: '个位倒着减', icon: '🔻', tip: '不够减时不能把个位倒过来减。用破十法：把被减数拆成 10 和几，先从 10 里减。' },
    nocarry: { name: '忘记进位', icon: '➕', tip: '个位相加满 10 要向十位进 1。用凑十法：先凑成 10，再加上剩下的。' },
    onesonly: { name: '只算了个位', icon: '🔢', tip: '十几加几，先把整十放一边，算完个位再把十加回来。' },
    overborrow: { name: '多减了一个十', icon: '➖', tip: '退位只退 1 个十，不要多退。' },
    offby1: { name: '差 1', icon: '1️⃣', tip: '数的时候差了一格。用手指点着数，或者用小棒摆一摆。' },
    offbysmall: { name: '差几个', icon: '🎯', tip: '算得接近了但没算准。把凑十法、破十法的步骤再走一遍。' },
    far: { name: '差得比较多', icon: '❓', tip: '可能是看错题或点错了。先读一遍题，说说是加还是减。' },
    symbol: { name: '大小号弄反', icon: '⚖️', tip: '开口朝着大的数，尖头朝着小的数。' },
    other: { name: '其他', icon: '·', tip: '' },
    // 英语的错法
    letter: { name: '字母记混', icon: '🔤', tip: '大小写和 b/d、p/q 这些相像的字母容易看错。一起读一读、写一写，比一比哪里不一样。' },
    word: { name: '单词不认识', icon: '📖', tip: '把单词和图片、实物对上，边指边读。颜色和数字词可以每天过一遍。' },
    sentence: { name: '句子没听懂', icon: '💬', tip: '先听关键词，再把整句读一遍。可以跟着语音一句一句说。' },
  };
  A.KINDS = KINDS;

  const num = s => (/^-?\d+$/.test(String(s).trim()) ? Number(s.trim()) : null);
  A.classify = m => {
    if (m.k && KINDS[m.k]) return m.k;
    const a = String(m.a), g = String(m.g).trim();
    if (/^[<>=]$/.test(a)) return 'symbol';
    const av = num(a), gv = num(g);
    if (av == null || gv == null || av === gv) return 'other';
    const minus = /(\d+)\s*[−\-]\s*(\d+)/.exec(m.p);
    const plus = /(\d+)\s*\+\s*(\d+)/.exec(m.p);
    if (minus) {
      const x = +minus[1], y = +minus[2];
      if (y > x % 10 && gv === y - (x % 10)) return 'flip';
      if (gv === av + 10) return 'overborrow';
    } else if (plus) {
      const x = +plus[1], y = +plus[2];
      if (x + y >= 10 && gv === x + y - 10) return 'nocarry';
      if (gv === (x % 10) + (y % 10) && (x >= 10 || y >= 10)) return 'onesonly';
    }
    const off = Math.abs(gv - av);
    if (off === 1) return 'offby1';
    if (off <= 3) return 'offbysmall';
    return 'far';
  };

  // ---------- 历史错题：把以前维修厂记下的错题也拿来做分析 ----------
  // v8 以前没单独存错题样本，但维修厂每道错题都留了题目、选的答案和日期（history）
  const historyOf = () => {
    const out = [];
    (D().repair || []).forEach(it => {
      const hist = Array.isArray(it.history) && it.history.length
        ? it.history
        : [{ prompt: it.q && it.q.prompt, answer: it.q && it.q.answer, wrong: it.wrong, date: it.date }];
      hist.forEach(x => {
        if (x && x.wrong != null && x.answer != null) {
          out.push({ t: it.type, d: it.diff, p: x.prompt, a: x.answer, g: x.wrong, date: x.date || it.date });
        }
      });
    });
    return out;
  };
  A.historyOf = historyOf;

  // 打开时把历史错题补进 mistakes，只做一次；不覆盖已经记下的样本
  A.backfill = () => {
    const S = D();
    if (S.mistakesBackfilled) return;
    const m = (S.mistakes = S.mistakes || {});
    historyOf().forEach(x => {
      const list = (m[x.t] = m[x.t] || []);
      const p = String(x.p == null ? '' : x.p), a = String(x.a), g = String(x.g);
      if (list.some(y => y.p === p && y.g === g && y.t === x.date)) return;
      list.push({ d: x.d == null ? 0 : x.d, p, a, g, t: x.date || U.today(), s: 'history' });
    });
    Object.keys(m).forEach(t => {
      m[t].sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
      if (m[t].length > 12) m[t].splice(0, m[t].length - 12);
    });
    S.mistakesBackfilled = true;
    TM.Store.save();
  };

  // 每天的 daily.wrong 是完整的历史：统计每个题型一共错过多少、什么时候开始/最近错
  A.history = () => {
    const daily = D().daily || {}, out = {};
    Object.keys(daily).forEach(k => {
      Object.entries(daily[k].wrong || {}).forEach(([t, c]) => {
        const o = (out[t] = out[t] || { t, n: 0, first: k, last: k, days: {} });
        o.n += c;
        o.days[k] = (o.days[k] || 0) + c;
        if (k < o.first) o.first = k;
        if (k > o.last) o.last = k;
      });
    });
    return Object.values(out).sort((a, b) => b.n - a.n);
  };

  // 最近 n 周每周错了几道（含本周）
  A.weeks = (t, n = 4) => {
    const today = U.today(), out = [];
    for (let w = n - 1; w >= 0; w--) {
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        const d = D().daily[U.addDays(today, -(w * 7 + i))];
        if (d && d.wrong) sum += d.wrong[t] || 0;
      }
      out.push(sum);
    }
    return out;
  };
  A.WEEK_LABEL = ['3 周前', '2 周前', '上周', '本周'];

  // ---------- 每个题型的统计 ----------
  const zoneOf = t => L.ZONES.find(z => z.levels.some(l => !l.boss && !l.mini && l.types.includes(t)));
  const has = t => D().stats[t] && D().stats[t].n > 0 && Q.names[t];

  // 需要重点练的排前面：错得多、正确率低的优先
  A.rows = () => {
    const st = D().stats, rec = D().recent || {}, mis = D().mistakes || {}, rep = D().repair || [];
    const hs = A.history(), histBy = {};
    hs.forEach(h => { histBy[h.t] = h; });
    // 历史错题按难度分开（只能统计错的那部分，对的部分没有难度记录）
    const hdBy = {};
    historyOf().forEach(x => {
      const a = (hdBy[x.t] = hdBy[x.t] || [0, 0, 0]);
      a[Math.min(2, Math.max(0, x.d || 0))]++;
    });
    return Object.keys(st).filter(has).map(t => {
      const s = st[t], acc = s.ok / s.n, r = rec[t] || [];
      const recent = r.length >= 3 ? r.filter(Boolean).length / r.length : null;
      const kinds = {};
      (mis[t] || []).forEach(m => { const k = A.classify(m); kinds[k] = (kinds[k] || 0) + 1; });
      const main = Object.entries(kinds).sort((x, y) => y[1] - x[1])[0];
      // 复仇题（旧错题在关卡里回来）的表现
      const reps = rep.filter(x => x.type === t && x.replayN);
      const lastRep = reps.sort((a, b) => ((a.lastReplay || '') < (b.lastReplay || '') ? 1 : -1))[0];
      const replayN = reps.reduce((s, x) => s + (x.replayN || 0), 0);
      const replayOk = reps.reduce((s, x) => s + (x.replayOk || 0), 0);
      return {
        t, name: Q.names[t], zone: zoneOf(t), n: s.n, ok: s.ok, acc, wrong: s.n - s.ok,
        d: s.d || null, recent, kinds, main: main ? main[0] : null, mainN: main ? main[1] : 0,
        hist: histBy[t] || null, hd: hdBy[t] || null,
        active: rep.filter(x => !x.fixed && x.type === t).length,
        fixed: rep.filter(x => x.fixed && x.type === t).length,
        replayN, replayOk,
        lastReplay: lastRep ? lastRep.lastReplay : null,
        lastReplayOk: lastRep ? !!lastRep.lastReplayOk : null,
      };
    }).sort((a, b) => b.wrong * (1.2 - b.acc) - a.wrong * (1.2 - a.acc));
  };

  // 0 还没做够 / 1 基本掌握 / 2 要加练 / 3 重点补
  A.level = r => (r.n < 3 ? 0 : r.acc >= 0.85 ? 1 : r.acc >= 0.6 ? 2 : 3);
  const LEVEL = ['刚开始', '基本掌握', '多练几次', '重点补'];
  const LEVEL_CLS = ['new', 'good', 'mid', 'bad'];
  A.LEVEL = LEVEL;

  A.all = rows => rows.reduce((o, r) => ({ n: o.n + r.n, ok: o.ok + r.ok, wrong: o.wrong + r.wrong }), { n: 0, ok: 0, wrong: 0 });

  A.zones = () => L.ZONES.map(z => {
    const ts = [...new Set(z.levels.filter(l => !l.boss && !l.mini).flatMap(l => l.types))];
    const ss = ts.map(t => D().stats[t]).filter(s => s && s.n);
    const n = ss.reduce((a, s) => a + s.n, 0), ok = ss.reduce((a, s) => a + s.ok, 0);
    const weak = ts.filter(t => {
      const s = D().stats[t];
      return s && s.n >= 3 && s.ok / s.n < 0.6;
    }).length;
    return { z, n, ok, acc: n ? ok / n : null, weak };
  }).filter(x => x.n > 0);

  // 错的都是什么（所有题型的错题样本合在一起）
  A.kinds = () => {
    const mis = D().mistakes || {}, out = {};
    Object.keys(mis).forEach(t => mis[t].forEach(m => {
      const k = A.classify(m);
      const o = (out[k] = out[k] || { k, n: 0, types: {}, sample: null });
      o.n++;
      o.types[t] = (o.types[t] || 0) + 1;
      if (!o.sample && String(m.g) !== String(m.a)) o.sample = m;
    }));
    return Object.values(out).sort((a, b) => b.n - a.n);
  };

  // 最近 N 天的做题情况
  A.week = (days = 7) => {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = U.addDays(U.today(), -i);
      const d = D().daily[key] || { n: 0, ok: 0, sec: 0, wrong: {} };
      const w = Object.entries(d.wrong || {}).sort((a, b) => b[1] - a[1]);
      out.push({ key, n: d.n, ok: d.ok, sec: d.sec, acc: d.n ? d.ok / d.n : null, top: w[0] ? Q.names[w[0][0]] || w[0][0] : null, wrong: d.n - d.ok });
    }
    return out;
  };

  A.empty = () => !A.rows().length;

  // ---------- 页面 ----------
  const bar = (r, cls) => h('div', { class: 'an-bar ' + (cls || '') },
    h('i', { style: { width: Math.max(3, (r || 0) * 100) + '%', background: col(r) } }));

  // 基础/提高/挑战 分开看，能看出是「难题做不动」还是「基础也不牢」
  const diffChips = r => {
    if (!r.d) return null;
    return h('div', { class: 'an-diff' }, DIFF.map((name, i) => {
      const c = r.d[i] || [0, 0];
      if (!c[0]) return h('span', { class: 'an-chip none' }, name + ' 没做过');
      const rt = c[1] / c[0];
      return h('span', { class: 'an-chip ' + (rt >= 0.85 ? 'good' : rt >= 0.6 ? 'mid' : 'bad') },
        `${name} ${pct(rt)}（${c[0]}）`);
    }));
  };

  const overview = rows => {
    const all = A.all(rows), rep = D().repair || [];
    const stat = (v, label) => h('div', { class: 'an-st' }, h('b', null, v), h('span', null, label));
    return h('div', { class: 'an-card an-overview' },
      h('div', { class: 'an-stats' },
        stat(String(all.n), '做题总数'),
        stat(pct(all.ok / all.n), '第一次答对'),
        stat(String(rows.filter(r => A.level(r) === 3).length), '重点补的题型'),
        stat(String(rep.filter(x => !x.fixed).length), '待修坦克')),
      h('div', { class: 'an-sum' }, A.summary()));
  };

  // 点开一个题型看细节，可以直接出 5 道题练
  const detail = async r => {
    const mis = (D().mistakes[r.t] || []).filter(m => String(m.g) !== String(m.a)).slice(-3).reverse();
    const k = r.main ? KINDS[r.main] : null;
    const wk = A.weeks(r.t);
    const wkSum = wk.reduce((a, b) => a + b, 0);
    const v = await TM.App.ask({
      cls: 'an-detail', emoji: r.zone ? r.zone.icon : '📊', title: r.name,
      text: [
        h('div', { class: 'an-d-num' }, pct(r.acc)),
        h('div', { class: 'an-d-sub' }, `做了 ${r.n} 次 · 错 ${r.wrong} 次 · ${LEVEL[A.level(r)]}`),
        r.active || r.fixed ? h('div', { class: 'an-d-sub' }, `维修厂：待修 ${r.active} 辆，已修好 ${r.fixed} 辆`) : null,
        r.replayN ? h('div', { class: 'an-d-sub' },
          `老对手回来 ${r.replayN} 次，一次答对 ${r.replayOk} 次` +
          (r.lastReplay ? ` · 上次 ${r.lastReplay.slice(5).replace('-', '/')}` : '') +
          (r.replayOk >= 2 && r.lastReplayOk ? ' · 已掌握' : r.lastReplayOk === false ? ' · 又忘了' : '')) : null,
        diffChips(r),
        !r.d && r.hd && r.hd.some(x => x)
          ? h('div', { class: 'an-d-sub' }, `以前的错题里：基础 ${r.hd[0]} 道 · 提高 ${r.hd[1]} 道 · 挑战 ${r.hd[2]} 道`)
          : null,
        wkSum ? h('div', { class: 'an-d-sub' }, '近 4 周错题：' + wk.map((n, i) => `${A.WEEK_LABEL[i]} ${n}`).join(' · ')) : null,
        k ? h('div', { class: 'an-d-tip' }, h('b', null, `${k.icon} 主要错在：${k.name}`), h('div', null, k.tip)) : null,
        mis.length ? h('div', { class: 'an-d-list' }, h('b', null, '最近的错题'),
          mis.map(m => h('div', { class: 'an-d-q' }, `${m.p}　选了 ${m.g}，应该是 ${m.a}`,
            h('span', { class: 'an-d-date' }, m.t ? String(m.t).slice(5).replace('-', '/') : '')))) : null,
      ],
      buttons: [{ label: '🎯 练 5 道', value: 1, cls: 'green' }, { label: '知道了', value: 0, cls: 'gray' }],
    });
    if (v) TM.Play.practice([r.t], 5);
  };

  const rowsCard = rows => h('div', { class: 'an-card' },
    h('h3', null, '📉 最需要练的题型'),
    h('div', { class: 'an-note' }, '按「错得多 + 正确率低」排序。点一个题型可以看错在哪儿，也能直接出 5 道题练。'),
    h('div', { class: 'an-list' }, rows.slice(0, 8).map((r, i) => h('button', {
      class: 'an-row lv' + A.level(r), onclick: () => { TM.Audio.sfx.tap(); detail(r); },
    },
    h('div', { class: 'an-row-top' },
      h('span', { class: 'an-rank' }, String(i + 1)),
      h('b', null, r.name),
      r.zone ? h('span', { class: 'an-zone' }, `${r.zone.icon} ${r.zone.name}`) : null,
      h('span', { class: 'an-state ' + LEVEL_CLS[A.level(r)] }, LEVEL[A.level(r)])),
    bar(r.acc),
    h('div', { class: 'an-meta' },
      h('span', null, `做了 ${r.n} 次，错 ${r.wrong} 次 · 正确率 ${pct(r.acc)}`),
      r.recent != null ? h('span', { class: 'an-trend ' + (r.recent - r.acc >= 0.15 ? 'up' : r.recent - r.acc <= -0.15 ? 'down' : '') },
        r.recent - r.acc >= 0.15 ? '↑ 最近在进步' : r.recent - r.acc <= -0.15 ? '↓ 最近错得更多' : '→ 稳定') : null),
    diffChips(r),
    r.main ? h('div', { class: 'an-main' }, `最近错题：${KINDS[r.main].icon} ${KINDS[r.main].name}（${r.mainN} 次）`) : null,
    r.replayN ? h('div', { class: 'an-replay' },
      `😤 老对手回来 ${r.replayN} 次，一次答对 ${r.replayOk} 次` +
      (r.replayOk >= 2 && r.lastReplayOk ? ' · 已掌握' : r.lastReplayOk === false ? ' · 又忘了' : '')) : null))),
    rows.length > 8 ? h('div', { class: 'an-note', style: { marginTop: '8px', marginBottom: '0' } },
      `还有 ${rows.length - 8} 个题型做得不错，没有列出来。`) : null);

  // 历史错题：以前的记录也能看，不用等新的题慢慢攒
  const historyCard = () => {
    const hs = A.history();
    if (!hs.length) return null;
    const tot = hs.reduce((s, h) => s + h.n, 0);
    const peak = hs[0].n;
    return h('div', { class: 'an-card' },
      h('h3', null, '📚 历史错题（全部记录）'),
      h('div', { class: 'an-note' }, `一共错了 ${tot} 道，涉及 ${hs.length} 个题型。这是从头到现在的记录，不是这次的更新才开始的。`),
      h('div', { class: 'an-list' }, hs.slice(0, 6).map(x => {
        const wk = A.weeks(x.t), sum = wk.reduce((a, b) => a + b, 0);
        const half = Math.floor(wk.length / 2);
        const old = wk.slice(0, half).reduce((a, b) => a + b, 0), now = wk.slice(half).reduce((a, b) => a + b, 0);
        return h('div', { class: 'an-hrow' },
          h('div', { class: 'an-hrow-top' },
            h('b', null, Q.names[x.t] || x.t),
            h('span', { class: 'an-cnt' }, `${x.n} 次`)),
          h('div', { class: 'an-bar' }, h('i', { style: { width: Math.max(4, (x.n / peak) * 100) + '%', background: '#ff9b52' } })),
          h('div', { class: 'an-meta' },
            h('span', null, `${x.first.slice(5).replace('-', '/')} 起，最近 ${x.last.slice(5).replace('-', '/')}`),
            sum ? h('span', { class: 'an-trend ' + (now < old ? 'up' : now > old ? 'down' : '') },
              `近 4 周 ${wk.join(' · ')}${now < old ? ' ↓ 在变少' : now > old ? ' ↑ 在变多' : ''}`) : null));
      })),
      hs.length > 6 ? h('div', { class: 'an-note', style: { marginTop: '8px', marginBottom: '0' } },
        `还有 ${hs.length - 6} 个题型错得比较少，没有列出来。`) : null);
  };

  const kindsCard = () => {
    const ks = A.kinds();
    if (!ks.length) return null;
    const tot = ks.reduce((s, k) => s + k.n, 0);
    return h('div', { class: 'an-card' },
      h('h3', null, '🧩 错的都是什么'),
      h('div', { class: 'an-note' }, '把记下来的错题按「错法」分了类，包括以前送进维修厂的题。同一种错反复出现，说明是这个知识点没通。'),
      ks.slice(0, 6).map(k => {
        const meta = KINDS[k.k];
        return h('div', { class: 'an-k' },
          h('div', { class: 'an-k-top' }, h('b', null, `${meta.icon} ${meta.name}`),
            h('span', { class: 'an-cnt' }, `${k.n} 次 · ${Math.round((k.n / tot) * 100)}%`)),
          bar(k.n / ks[0].n, 'kal'),
          meta.tip ? h('div', { class: 'an-tip' }, meta.tip) : null,
          k.sample ? h('div', { class: 'an-eg' }, `例：${k.sample.p}　选了 ${k.sample.g}，应该是 ${k.sample.a}`) : null);
      }));
  };

  const weekCard = () => {
    const ds = A.week(7);
    if (!ds.some(d => d.n)) return null;
    const maxN = Math.max(5, ...ds.map(d => d.n));
    const tops = [...new Set(ds.filter(d => d.top).map(d => d.top))];
    return h('div', { class: 'an-card' },
      h('h3', null, '📅 最近 7 天'),
      h('div', { class: 'an-week' }, ds.map((d, i) => h('div', { class: 'an-day' },
        h('span', { class: 'v' }, d.n || ''),
        h('div', { class: 'an-col' }, h('i', { style: { height: (d.n / maxN) * 100 + '%', background: col(d.acc) } })),
        h('span', { class: 'd' }, i === 6 ? '今天' : d.key.slice(5).replace('-', '/'))))),
      h('div', { class: 'an-note' }, '柱子越高做题越多，颜色越绿正确率越高。' + (tops.length ? `这几天错得最多：${tops.join('、')}。` : '')));
  };

  const zonesCard = () => {
    const zs = A.zones();
    if (!zs.length) return null;
    return h('div', { class: 'an-card' },
      h('h3', null, '🗺️ 按单元'),
      zs.map(x => h('div', { class: 'an-z' },
        h('div', { class: 'an-z-top' }, h('b', null, `${x.z.icon} ${x.z.name}`), h('span', null, `${pct(x.acc)}（${x.n} 题）`)),
        bar(x.acc),
        x.weak ? h('div', { class: 'an-z-weak' }, `有 ${x.weak} 个题型正确率低于 60%`) : null)));
  };

  const actions = rows => {
    const weak = rows.filter(r => A.level(r) >= 2).slice(0, 3);
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(A.report());
        TM.App.toast('分析报告已复制，可以粘贴给老师或保存');
      } catch (e) {
        TM.App.toast('复制失败，请检查浏览器权限');
      }
    };
    return h('div', { class: 'an-actions' },
      weak.length ? h('button', { class: 'btn green', onclick: () => TM.Play.practice(weak.map(r => r.t), 6) },
        `🎯 练一练：${weak.map(r => r.name).join('、')}`) : null,
      h('button', { class: 'btn blue', onclick: copy }, '📋 复制分析报告'));
  };

  A.body = () => {
    const rows = A.rows();
    const body = h('div', { class: 'an-body' });
    if (!rows.length) {
      body.append(h('div', { class: 'empty-tip' }, h('b', null, '📊'), '还没有做过题。', '打几关以后，这里会分析哪些题型容易错、错在哪儿。'));
      return body;
    }
    // 两列各自排列，卡片高度不一样也不会留空白
    body.append(overview(rows));
    body.append(h('div', { class: 'an-cols' },
      h('div', { class: 'an-col-box' }, ...[rowsCard(rows), weekCard()].filter(Boolean)),
      h('div', { class: 'an-col-box' }, ...[historyCard(), kindsCard(), zonesCard()].filter(Boolean))));
    body.append(actions(rows));
    return body;
  };

  // ---------- 一句话总结 ----------
  A.summary = () => {
    const rows = A.rows(), all = A.all(rows);
    if (!all.n) return '还没有做过题。打几关以后，这里会告诉你哪些题型要加练。';
    const parts = [`一共做了 ${all.n} 道题，第一次就答对 ${pct(all.ok / all.n)}`];
    const weak = rows.filter(r => A.level(r) === 3);
    if (weak.length) parts.push(`最要加练${weak.slice(0, 3).map(r => `「${r.name}」`).join('')}`);
    const ks = A.kinds();
    if (ks.length && ks[0].n >= 2) parts.push(`错得最多的是「${KINDS[ks[0].k].name}」（${ks[0].n} 次）`);
    return parts.join('，') + '。';
  };

  // ---------- 纯文字报告：复制给家长看/存档 ----------
  A.report = () => {
    const rows = A.rows(), all = A.all(rows), Ls = [];
    Ls.push(`坦克大作战学习分析　${U.today()}`);
    Ls.push(A.summary());
    Ls.push('');
    Ls.push('【各题型】按需要加练排序');
    rows.forEach((r, i) => {
      Ls.push(`${i + 1}. ${r.name}（${r.zone ? r.zone.name : '—'}）：做了 ${r.n} 次，对 ${r.ok} 次，正确率 ${pct(r.acc)}，${LEVEL[A.level(r)]}`);
      if (r.d) Ls.push('   难度：' + DIFF.map((n, j) => {
        const c = r.d[j] || [0, 0];
        return `${n} ${c[0] ? pct(c[1] / c[0]) + `(${c[0]})` : '没做过'}`;
      }).join('　'));
      if (r.main) Ls.push(`   最近错题：${KINDS[r.main].name} ${r.mainN} 次`);
      if (r.recent != null) Ls.push(`   最近 10 次正确率 ${pct(r.recent)}`);
    });
    const ks = A.kinds();
    if (ks.length) {
      const tot = ks.reduce((s, k) => s + k.n, 0);
      Ls.push('');
      Ls.push('【错的都是什么】');
      ks.forEach(k => {
        Ls.push(`- ${KINDS[k.k].name}：${k.n} 次（${Math.round((k.n / tot) * 100)}%）`);
        if (k.sample) Ls.push(`  例：${k.sample.p} → 选了 ${k.sample.g}，应该是 ${k.sample.a}`);
        if (KINDS[k.k].tip) Ls.push(`  建议：${KINDS[k.k].tip}`);
      });
    }
    const hs = A.history();
    if (hs.length) {
      Ls.push('');
      Ls.push('【历史错题】按错的次数排序');
      hs.forEach(h => {
        const wk = A.weeks(h.t);
        Ls.push(`- ${Q.names[h.t] || h.t}：${h.n} 次（${h.first.slice(5)} 起，最近 ${h.last.slice(5)}）` +
          (wk.some(x => x) ? `，近 4 周 ${wk.join(' / ')}` : ''));
      });
    }
    const zs = A.zones();
    if (zs.length) {
      Ls.push('');
      Ls.push('【按单元】');
      zs.forEach(x => Ls.push(`- ${x.z.name}：${pct(x.acc)}（${x.n} 题）${x.weak ? `，${x.weak} 个题型低于 60%` : ''}`));
    }
    const ds = A.week(7).filter(d => d.n);
    if (ds.length) {
      Ls.push('');
      Ls.push('【最近 7 天】');
      ds.forEach(d => Ls.push(`- ${d.key}：${d.n} 题，对 ${d.ok} 题，${Math.round(d.sec / 60)} 分钟${d.top ? `，最常错 ${d.top}` : ''}`));
    }
    const rep = D().repair || [];
    Ls.push('');
    Ls.push(`【维修厂】待修 ${rep.filter(x => !x.fixed).length} 辆，已修好 ${rep.filter(x => x.fixed).length} 辆`);
    const weak = rows.filter(r => A.level(r) >= 2);
    if (weak.length) {
      Ls.push('');
      Ls.push('【建议】');
      weak.slice(0, 3).forEach(r => {
        const k = r.main ? KINDS[r.main] : null;
        Ls.push(`- ${r.name}：${k ? k.tip : '多练几道，先把基础题做熟。'}`);
      });
    }
    return Ls.join('\n');
  };

  TM.Analysis = A;
})(window.TM);
