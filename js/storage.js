// 本地存档（localStorage），含统计、导入导出
(function (TM) {
  const U = TM.U;
  const KEY = 'tankmath.v1';

  const defaults = () => ({
    version: 1,
    nick: '可可',
    placed: false,      // 是否做过入营测试
    open: {},           // 整个战区直接开放（入营测试跳过的战区）{z1: true}
    levels: {},         // 'z1-0': {stars, best}
    repair: [],         // 维修厂（错题本）
    stats: {},          // 题型统计 {type: {n, ok, d:[[n,ok],[n,ok],[n,ok]]}}，按首次作答计，d 是按难度分开的
    mistakes: {},       // 错题样本 {type: [{d, p, a, g, t, s}]}，每种题型最近 12 道
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
    settings: { limitMin: 20, voice: true, hide: { z5: true, z6: true }, goal: null },
    created: U.today(),
  });

  const S = { data: defaults() };

  S.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S.data = Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {
      console.warn('存档读取失败', e);
    }
    S.data.settings = Object.assign(defaults().settings, S.data.settings);
  };

  S.save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S.data));
    } catch (e) {
      console.warn('存档写入失败', e);
    }
  };

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
  S.miss = (type, { diff, prompt, answer, got, src }) => {
    const m = (S.data.mistakes = S.data.mistakes || {});
    const list = (m[type] = m[type] || []);
    list.push({
      d: diff == null ? 0 : diff, p: String(prompt == null ? '' : prompt),
      a: String(answer == null ? '' : answer), g: String(got),
      t: U.today(), s: src || 'play',
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
    S.data = Object.assign(defaults(), d);
    S.data.settings = Object.assign(defaults().settings, S.data.settings);
    S.save();
  };
  S.reset = () => { S.data = defaults(); S.save(); };

  TM.Store = S;
})(window.TM);
