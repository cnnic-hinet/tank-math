// 本地存档（localStorage），含统计、导入导出
(function (TM) {
  const U = TM.U;
  const KEY = 'tankmath.v1';
  const SCHEMA = 2;               // 存档结构版本，改结构时 +1 并在 migrate 里补
  const SNAP = 'tankmath.snap.';  // 自动快照：tankmath.snap.2026-11-03 / pre-migrate / pre-restore / pre-import
  const SNAP_DAYS = 7;            // 每天的快照留几天

  const defaults = () => ({
    version: 1,         // 备份文件格式，保持不变
    schema: SCHEMA,     // 存档结构版本
    nick: '可可',
    placed: false,      // 是否做过入营测试
    open: {},           // 整个战区直接开放（入营测试跳过的战区）{z1: true}
    levels: {},         // 'z1-0': {stars, best}
    repair: [],         // 维修厂（错题本）
    stats: {},          // 题型统计 {type: {n, ok, d:[[n,ok],[n,ok],[n,ok]]}}，按首次作答计，d 是按难度分开的
    mistakes: {},       // 错题样本 {type: [{d, p, a, g, t, s}]}，每种题型最近 12 道
    mistakesBackfilled: false, // 是否已经从维修厂的历史记录里补过错题样本
    daily: {},          // 每天 {sec, n, ok, wrong: {type: count}}
    skin: 'green',      // 我方坦克涂装
    model: 'basic',     // 我方坦克车型
    wallet: 0,          // 可以花的星星
    owned: null,        // 买过的装备 {model: [], skin: [], weapon: []}；null 表示老存档，第一次用时迁移
    benched: [],        // 买了但不带出战的武器
    recent: {},         // 每个题型最近 10 次首次作答 {type: [true, false...]}，用来调难度
    bestStreak: 0,      // 每日任务最长连续天数
    lastBackup: null,   // 上次备份的日期
    // hide：学校还没学到、先藏起来的战区；goal：家长设的现实奖励 {text, need, start, done}
    settings: { limitMin: 20, voice: true, hide: { z5: true, z6: true }, goal: null, subject: 'math' },
    created: U.today(),
  });

  const S = { data: defaults(), broken: false };

  // 结构升级：只补字段，不删不改。老代码的兜底逻辑在这里写清楚，以后加字段就加一段。
  S.migrate = data => {
    const from = data.schema || 1;
    data.schema = SCHEMA;
    if (from >= SCHEMA) return data;
    // v1 → v2：v8 加的学习分析字段
    data.stats = data.stats || {};
    data.mistakes = data.mistakes || {};
    data.mistakesBackfilled = !!data.mistakesBackfilled;
    data.recent = data.recent || {};
    data.daily = data.daily || {};
    data.repair = Array.isArray(data.repair) ? data.repair : [];
    data.repair.forEach(x => { if (!Array.isArray(x.history)) x.history = []; });
    Object.values(data.stats).forEach(s => {
      if (Array.isArray(s.d)) while (s.d.length < 3) s.d.push([0, 0]);
    });
    return data;
  };

  // 结构看起来是否正常：不正常就不拿它覆盖快照
  S.check = data => !!data && typeof data === 'object' &&
    !!data.stats && typeof data.stats === 'object' &&
    Array.isArray(data.repair) && (!data.levels || typeof data.levels === 'object');

  // 快照：当天第一次打开时原样存一份；迁移/恢复/导入前也各存一份
  S.snapshot = (raw, tag) => {
    if (!raw || raw.length > 300000) return;
    try {
      const key = SNAP + (tag || U.today());
      localStorage.setItem(key, raw);
      S.prune();
    } catch (e) { console.warn('快照写入失败', e); }
  };

  S.prune = () => {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.indexOf(SNAP) !== 0) return;
        const tag = k.slice(SNAP.length);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) return;   // pre-migrate 这类不按天清理
        if (U.daysBetween(tag, U.today()) > SNAP_DAYS - 1) localStorage.removeItem(k);
      });
      // 读不出来的存档最多留 3 份
      const bad = Object.keys(localStorage).filter(k => k.indexOf(SNAP + 'broken.') === 0).sort();
      while (bad.length > 3) localStorage.removeItem(bad.shift());
    } catch (e) {}
  };

  S.SNAP_TAG = { 'pre-migrate': '升级前', 'pre-restore': '恢复前', 'pre-import': '导入前', 'pre-reset': '清空前' };
  S.snaps = () => {
    const out = [];
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.indexOf(SNAP) !== 0) return;
        const tag = k.slice(SNAP.length);
        if (tag.indexOf('broken.') === 0) return;   // 坏档只留着排查，不出现在恢复列表里
        const raw = localStorage.getItem(k) || '';
        const o = { key: k, tag, label: S.SNAP_TAG[tag] || tag.slice(5).replace('-', '/'), raw, size: raw.length };
        try {
          const x = JSON.parse(raw);
          o.n = Object.values(x.stats || {}).reduce((a, s) => a + (s.n || 0), 0);
          o.wallet = x.wallet || 0;
          o.ok = Object.values(x.stats || {}).reduce((a, s) => a + (s.ok || 0), 0);
        } catch (e) { o.broken = true; }
        out.push(o);
      });
    } catch (e) {}
    // 按日期的快照排前面（新的在前），「升级前」这类特殊快照排在后面
    const rank = t => (/^\d{4}-\d{2}-\d{2}$/.test(t) ? 0 : 1);
    return out.sort((a, b) => rank(a.tag) - rank(b.tag) || (a.tag < b.tag ? 1 : -1));
  };

  S.load = () => {
    S.broken = false;
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    let data = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch (e) { S.broken = true; S.snapshot(raw, 'broken.' + Date.now()); console.warn('存档读取失败', e); }
      if (data && !S.check(data)) { S.broken = true; S.snapshot(raw, 'broken.' + Date.now()); data = null; }
    }
    let migrated = false;
    if (data) {
      S.snapshot(raw);                       // 当天第一次打开：先把原样存一份
      if ((data.schema || 1) < SCHEMA) { S.snapshot(raw, 'pre-migrate'); migrated = true; }
      try { S.migrate(data); } catch (e) {
        S.broken = true;
        console.warn('存档升级失败', e);
        data = null;
      }
    }
    S.data = Object.assign(defaults(), data || {});
    S.data.settings = Object.assign(defaults().settings, S.data.settings);
    if (data && migrated) S.save();
  };

  S.save = () => {
    if (S.broken) return;   // 存档读不出来时不覆盖，等家长在家长页处理
    try {
      localStorage.setItem(KEY, JSON.stringify(S.data));
    } catch (e) {
      console.warn('存档写入失败', e);
    }
  };

  // 用快照恢复：先把现在这份存成「恢复前」，恢复错了还能退回来
  S.restore = raw => {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) S.snapshot(cur, 'pre-restore');
      localStorage.setItem(KEY, raw);
    } catch (e) { console.warn('恢复失败', e); return false; }
    S.load();
    return true;
  };

  // 读档失败后，家长确认用新存档继续（原来的坏档已经另存）
  S.acceptNew = () => { S.broken = false; S.save(); };

  S.size = () => { try { return (localStorage.getItem(KEY) || '').length; } catch (e) { return 0; } };

  S.day = (key = U.today()) => {
    const d = S.data.daily;
    return (d[key] = d[key] || { sec: 0, n: 0, ok: 0, wrong: {} });
  };

  // 记录一道题的首次作答结果。extra = {diff, prompt, answer, got, src} 用来做错题分析
  S.record = (type, ok, extra = {}) => {
    const st = (S.data.stats[type] = S.data.stats[type] || { n: 0, ok: 0 });
    st.n++;
    if (ok) st.ok++;
    // 按难度分开统计：d[0] 基础、d[1] 提高、d[2] 挑战，每项是 [做了几道, 对几道]
    if (extra.diff != null) {
      const d = (st.d = st.d || [[0, 0], [0, 0], [0, 0]]);
      while (d.length < 3) d.push([0, 0]);
      d[extra.diff][0]++;
      if (ok) d[extra.diff][1]++;
    }
    const r = (S.data.recent[type] = S.data.recent[type] || []);
    r.push(!!ok);
    if (r.length > 10) r.shift();
    const day = S.day();
    day.n++;
    if (ok) day.ok++;
    else {
      day.wrong[type] = (day.wrong[type] || 0) + 1;
      if (extra.got != null) S.miss(type, extra);
    }
  };

  // 记下一道错题的样子，每种题型留最近 12 道，用来分析「错在哪儿」
  S.miss = (type, { diff, prompt, answer, got, kind, src }) => {
    const m = (S.data.mistakes = S.data.mistakes || {});
    const list = (m[type] = m[type] || []);
    list.push({
      d: diff == null ? 0 : diff, p: String(prompt == null ? '' : prompt),
      a: String(answer == null ? '' : answer), g: String(got),
      k: kind || '', t: U.today(), s: src || 'play',
    });
    if (list.length > 12) list.splice(0, list.length - 12);
  };

  S.addTime = sec => { S.day().sec += sec; };
  S.overLimit = () => S.data.settings.limitMin > 0 && S.day().sec >= S.data.settings.limitMin * 60;
  S.totalStars = () => Object.values(S.data.levels).reduce((s, l) => s + (l.stars || 0), 0);

  S.exportText = () => JSON.stringify(S.data);
  S.importText = text => {
    const d = JSON.parse(text);
    if (!d || d.version !== 1 || typeof d.levels !== 'object') throw new Error('不是有效的备份文件');
    try { const cur = localStorage.getItem(KEY); if (cur) S.snapshot(cur, 'pre-import'); } catch (e) {}
    S.migrate(d);
    S.data = Object.assign(defaults(), d);
    S.data.settings = Object.assign(defaults().settings, S.data.settings);
    S.broken = false;
    S.save();
  };
  S.reset = () => {
    try { const cur = localStorage.getItem(KEY); if (cur) S.snapshot(cur, 'pre-reset'); } catch (e) {}
    S.data = defaults();
    S.broken = false;
    S.save();
  };

  TM.Store = S;
})(window.TM);
