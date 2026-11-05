// 关卡配置（按北师大版一年级数学的知识点组织）与出题
(function (TM) {
  const { Q, U } = TM;

  // after：打败哪个战区的 Boss 后解锁；grade：上册 / 下册
  // 关卡的 id 用来存档。没写 id 的按顺序编 0~5；调整顺序或换内容时写上旧的 id，旧存档的星星才对得上
  const ZONES = [
    {
      id: 'z1', name: '新兵营', icon: '🏕️', color: '#7cc576', grade: '上册',
      desc: '20 以内数的认识',
      levels: [
        { name: '数一数', types: ['count'] },
        { name: '比大小', types: ['cmpnum'] },
        { name: '排第几', types: ['order'] },
        { name: '分与合', types: ['bond'] },
        { name: '认识十几', types: ['tens'] },
        { name: '数的顺序', types: ['seq'] },
      ],
    },
    {
      id: 'z2', name: '加减阵地', icon: '🛡️', color: '#5bb6e8', grade: '上册', after: 0,
      desc: '10 以内加减法',
      levels: [
        { name: '加法', types: ['add10'] },
        { name: '减法', types: ['sub10'] },
        { name: '填空 □', types: ['missing'] },
        { name: '连加连减', types: ['chain'] },
        { name: '算式比大小', types: ['cmpexp'] },
        { name: '看图解题', types: ['word10'] },
      ],
    },
    {
      id: 'z3', name: '进位要塞', icon: '🏰', color: '#f0a04b', grade: '上册', after: 1,
      desc: '20 以内进位加法',
      levels: [
        { name: '十几加减几', types: ['teen'] },
        { name: '凑十法', types: ['maketen'] },
        { name: '进位加法', types: ['carry'] },
        { name: '进位填空', types: ['carrymiss'] },
        { name: '比大小', types: ['cmp20'] },
        { name: '解决问题', types: ['word20'] },
      ],
    },
    {
      id: 'z4', name: '侦察营', icon: '🔭', color: '#e87fb0', grade: '上册', after: 0,
      desc: '位置、图形、钟表、分类',
      levels: [
        { id: 0, name: '上下前后', types: ['pos'] },
        { id: 4, name: '左右', types: ['lr'] },
        { id: 1, name: '认识图形', types: ['shape'] },
        { id: 2, name: '认识钟表', types: ['clock'] },
        { id: 3, name: '分一分', types: ['sort'] },
        { id: 5, name: '图形钟表分类', types: ['shape', 'clock', 'sort'] },
      ],
    },
    {
      id: 'z5', name: '退位峡谷', icon: '⛰️', color: '#c0785a', grade: '下册', after: 2,
      desc: '20 以内退位减法',
      levels: [
        { name: '十几减 9', types: ['sub9'] },
        { name: '破十法', types: ['borrow'] },
        { name: '想加算减', types: ['thinkadd'] },
        { name: '退位减法', types: ['borrow', 'sub9'] },
        { name: '比大小', types: ['cmpsub'] },
        { name: '解决问题', types: ['word20s'] },
      ],
    },
    {
      id: 'z6', name: '百数高地', icon: '💯', color: '#4a8fe0', grade: '下册', after: 2,
      desc: '100 以内的数',
      levels: [
        { name: '数小棒', types: ['count100'] },
        { name: '比大小', types: ['cmp100'] },
        { name: '数的顺序', types: ['seq100'] },
        { name: '整十数', types: ['tens100'] },
        { name: '综合练习', types: ['count100', 'cmp100', 'seq100'] },
        { name: '算一算', types: ['tens100', 'seq100'] },
      ],
    },
    // ---------- 英语 ----------
    // subject: 'en'；第一条英语线默认开放，后面按 Boss 解锁，和数学进度互不影响
    {
      id: 'e1', name: '字母乐园', icon: '🔤', color: '#7c8cf8', grade: '英语', subject: 'en',
      desc: '字母 A～Z',
      levels: [
        { name: '大写字母', types: ['en-upper'] },
        { name: '小写字母', types: ['en-lower'] },
        { name: '大小写配对', types: ['en-pair'] },
        { name: '字母顺序', types: ['en-order'] },
        { name: '首字母', types: ['en-first'] },
        { name: '字母大闯关', types: ['en-upper', 'en-lower', 'en-order', 'en-first'] },
      ],
    },
    {
      id: 'e2', name: '颜色数字', icon: '🎨', color: '#ff9f43', grade: '英语', subject: 'en', after: 6,
      desc: '颜色和数字 1～10',
      levels: [
        { name: '颜色', types: ['en-color'] },
        { name: '数字', types: ['en-num'] },
        { name: '数一数', types: ['en-count'] },
        { name: '找不同', types: ['en-odd'] },
        { name: '数字顺序', types: ['en-numorder'] },
        { name: '颜色数字大闯关', types: ['en-color', 'en-num', 'en-count', 'en-numorder'] },
      ],
    },
  ];
  // 每个战区最后：一个小游戏关「敌机编队」，再加一个 Boss 关考所有题型
  // Boss 关 id 还是 6，和旧存档对得上
  ZONES.forEach(z => {
    const all = [...new Set(z.levels.flatMap(l => l.types))];
    z.levels.forEach((l, i) => { if (l.id == null) l.id = i; });
    z.levels.push({ id: 'm', name: '敌机编队', mini: true, types: [] });
    z.levels.push({ id: 6, name: 'Boss 决战', types: all, boss: true });
  });

  const L = { ZONES };
  L.HEARTS = 3;

  // 每个战区的特殊小兵（第 2 关起，普通关第 4 题出现一个）：
  // shield 盾牌兵、flyer 飞行兵、counter 反击兵，见 battle.js
  L.TRAIT = ['shield', 'flyer', 'counter', 'shield', 'counter', 'flyer', 'shield', 'flyer'];

  L.key = (zi, li) => `${ZONES[zi].id}-${ZONES[zi].levels[li].id}`;
  L.get = (zi, li) => ZONES[zi].levels[li];
  L.bossKey = zi => `${ZONES[zi].id}-6`;

  // 最近 10 次的正确率（少于 5 次不算）
  L.rate = type => {
    const r = TM.Store.data.recent[type] || [];
    return r.length < 5 ? null : r.filter(Boolean).length / r.length;
  };
  // 这个题型有点吃力：多给基础题，答题前就能看提示
  L.weak = type => { const r = L.rate(type); return r != null && r < 0.6; };
  L.strong = type => { const r = L.rate(type); return r != null && r >= 0.9; };

  // 普通关 6 题：4 基础、1 提高、1 挑战；掌握得好多给挑战题，吃力就多给基础题
  // Boss 关 8 题：3 基础、3 提高、2 挑战
  L.diffs = lv => {
    if (lv.boss) return [0, 0, 0, 1, 1, 1, 2, 2];
    if (lv.types.every(L.strong)) return [0, 0, 1, 1, 2, 2];
    if (lv.types.some(L.weak)) return [0, 0, 0, 0, 0, 1];
    return [0, 0, 0, 0, 1, 2];
  };
  L.build = (zi, li) => {
    const lv = L.get(zi, li);
    const zone = ZONES[zi];
    const diffs = L.diffs(lv);
    // 本战区前面学过的题型，普通关里偶尔复习一题
    const prev = zone.levels.slice(0, li).filter(l => !l.boss && !l.mini).flatMap(l => l.types);
    let pool = lv.types.slice();
    const qs = diffs.map((d, i) => {
      let type;
      if (lv.boss) {
        if (!pool.length) pool = U.shuffle(lv.types);
        type = pool.splice(U.rand(0, pool.length - 1), 1)[0];
      } else if (prev.length && d === 0 && i === 2) {
        type = U.pick(prev);
      } else {
        type = U.pick(lv.types);
      }
      return Q.make(type, d);
    });
    // 基础题在前，挑战题压轴
    return dedupe(qs);
  };

  // 同一关里尽量不出现一模一样的题
  const dedupe = qs => {
    const seen = new Set();
    return qs.map(q => {
      for (let t = 0; t < 8 && seen.has(q.prompt); t++) q = Q.make(q.type, q.diff);
      seen.add(q.prompt);
      return q;
    });
  };

  // 入营测试：10 题，看能直接开放到哪个战区
  L.placement = () => dedupe([
    Q.make('count', 0), Q.make('cmpnum', 0), Q.make('bond', 0),
    Q.make('add10', 0), Q.make('sub10', 0), Q.make('missing', 0), Q.make('chain', 0),
    Q.make('teen', 0), Q.make('carry', 0), Q.make('carry', 1),
  ].map(q => Object.assign(q, { zone: q.type in { count: 1, cmpnum: 1, bond: 1 } ? 0 : ['teen', 'carry'].includes(q.type) ? 2 : 1 })));

  // 根据入营测试结果开放战区。返回开放到的战区序号（0~2）
  L.applyPlacement = results => {
    const ok = z => results.filter(r => r.zone === z && r.ok).length;
    let reach = 0;
    if (ok(0) >= 2) reach = 1;
    if (reach === 1 && ok(1) >= 3) reach = 2;
    const S = TM.Store.data;
    S.placed = true;
    for (let z = 0; z <= reach; z++) S.open[ZONES[z].id] = true;
    // 跳过了新兵营，侦察营也一起开放
    if (reach >= 1) S.open.z4 = true;
    TM.Store.save();
    return reach;
  };

  // 家长设置里“学校还没学到”的战区先藏起来
  L.hidden = zi => !!TM.Store.data.settings.hide[ZONES[zi].id];

  L.zoneOpen = zi => {
    const S = TM.Store.data;
    if (L.hidden(zi)) return false;
    // 每一条科目线只有第一个战区没有前置（数学 z1、英语 e1），默认开放
    if (ZONES[zi].subject === 'en' ? ZONES[zi].after == null : zi === 0) return true;
    if (S.open[ZONES[zi].id]) return true;
    return (S.levels[L.bossKey(ZONES[zi].after)]?.stars || 0) > 0;
  };

  // 打过的关一直开着；否则要打过前一关
  L.levelOpen = (zi, li) => {
    if (!L.zoneOpen(zi)) return false;
    const lv = TM.Store.data.levels;
    if (li === 0 || TM.Store.data.open[ZONES[zi].id] || lv[L.key(zi, li)]) return true;
    return (lv[L.key(zi, li - 1)]?.stars || 0) > 0;
  };

  // 星级：过关 1 星；首次答对 ≥ 70% 得 2 星；挑战题全对且最多错 1 题得 3 星
  L.stars = (results, passed) => {
    if (!passed) return 0;
    const n = results.length;
    const first = results.filter(r => r.firstOk).length;
    const hard = results.filter(r => r.diff === 2);
    if (hard.every(r => r.firstOk) && first >= n - 1) return 3;
    if (first / n >= 0.7) return 2;
    return 1;
  };

  TM.Levels = L;
})(window.TM);
