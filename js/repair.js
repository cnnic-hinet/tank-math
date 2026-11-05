// 坦克维修厂（错题本）：答错的题按间隔复习，隔天连续答对 2 次算修好
(function (TM) {
  const { Q, U } = TM;
  const S = () => TM.Store.data;
  const NEED = 2;          // 需要连续答对的次数
  const GAP = [1, 2];      // 第 1 天复习，答对后再隔 2 天（第 3 天）复习
  const REPLAY_GAP = 2;    // 同一只复仇兵至少隔 2 天再来
  const REPLAY_NEED = 2;   // 在关卡里一次答对 2 次算「服了」

  const R = {};

  R.add = (q, wrong) => {
    const list = S().repair;
    // 同一题型同一难度已在修理中，就不重复送厂，只更新最近的错题
    const same = list.find(x => !x.fixed && x.type === q.type && x.diff === q.diff);
    const today = U.today();
    const item = {
      id: U.uid(), type: q.type, diff: q.diff,
      q: U.clone(q), wrong: String(wrong),
      date: today, due: U.addDays(today, GAP[0]),
      streak: 0, tries: 0, fixed: false, fixedDate: null,
      history: [{ prompt: q.prompt, answer: String(q.answer), wrong: String(wrong), date: today }],
    };
    if (same) {
      Object.assign(same, { q: item.q, wrong: item.wrong, date: today, due: item.due, streak: 0, tries: 0 });
      same.history = (same.history || []).concat(item.history).slice(-10);
    } else {
      list.push(item);
    }
    TM.Store.save();
  };

  R.active = () => S().repair.filter(x => !x.fixed);
  R.fixedList = () => S().repair.filter(x => x.fixed);
  R.due = () => R.active().filter(x => x.due <= U.today());

  // 这个题型属于哪个战区（复仇兵按原来战区的样子出现）
  R.zoneIndex = type => TM.Levels.ZONES.findIndex(z => z.levels.some(l => !l.boss && !l.mini && l.types.includes(type)));
  R.zone = type => TM.Levels.ZONES[R.zoneIndex(type)];

  // 复仇题：从维修厂挑还没修好、战区已开放、隔了至少 2 天的旧错题
  // 本关正在练的题型排最后，优先最久没回来的；最多两道，题型不重复
  // subject：只挑同一科目的错题，数学关里不会冒出英语题
  R.replayPick = (n = 1, { types = [], subject = null } = {}) => {
    const today = U.today(), L = TM.Levels;
    const cand = R.active().filter(x => {
      const zi = R.zoneIndex(x.type);
      if (zi < 0 || !L.zoneOpen(zi)) return false;
      if (subject && (L.ZONES[zi].subject || 'math') !== subject) return false;
      return !(x.lastReplay && U.daysBetween(x.lastReplay, today) < REPLAY_GAP);
    }).map(x => ({
      x,
      same: types.includes(x.type) ? 1 : 0,
      gap: x.lastReplay ? U.daysBetween(x.lastReplay, today) : 999,
    }));
    cand.sort((a, b) => a.same - b.same || b.gap - a.gap || (a.x.date < b.x.date ? -1 : 1));
    const out = [], used = new Set();
    for (const c of cand) {
      if (out.length >= n) break;
      if (used.has(c.x.type)) continue;
      used.add(c.x.type);
      out.push(c.x);
    }
    return out;
  };

  // 复仇题第一次出原题，之后换数字出同类题
  R.replayQuestion = item => {
    const q = item.replayN ? Q.make(item.type, item.diff) : U.clone(item.q);
    // 原来的题可能带着特殊兵/Boss 小兵的标记，复仇兵不需要
    delete q.trait;
    delete q.minion;
    q.id = U.uid();
    return q;
  };

  // 记一次复仇结果。一次答对才算打退，打退 2 次就「服了」（fixed）
  R.replayResult = (item, { firstOk, ok }) => {
    const today = U.today();
    item.replayN = (item.replayN || 0) + 1;
    item.lastReplay = today;
    item.lastReplayOk = !!firstOk;
    if (firstOk) {
      item.replayOk = (item.replayOk || 0) + 1;
      if (item.replayOk >= REPLAY_NEED) {
        item.fixed = true;
        item.fixedDate = today;
      }
    } else if (!ok) {
      // 两遍都没答对：它跑掉了，题目留在维修厂，下次还会来
      item.replayOk = 0;
      item.due = today;
    }
    TM.Store.save();
    return !!item.fixed;
  };

  // 复习题：第一次出原题，之后换数字出同类题
  R.question = item => {
    const q = item.streak === 0 && item.tries === 0 ? U.clone(item.q) : Q.make(item.type, item.diff);
    q.id = U.uid();
    return q;
  };

  // 记录一次复习结果，返回是否修好
  R.review = (item, ok) => {
    const today = U.today();
    item.tries++;
    if (ok) {
      item.streak++;
      if (item.streak >= NEED) {
        item.fixed = true;
        item.fixedDate = today;
      } else {
        item.due = U.addDays(today, GAP[Math.min(item.streak, GAP.length - 1)]);
      }
    } else {
      item.streak = 0;
      item.due = U.addDays(today, GAP[0]);
    }
    TM.Store.save();
    return item.fixed;
  };

  // 热身：每次出征前最多修 3 辆（只修同一科目的）
  R.warmup = subject => R.due().filter(x => {
    const z = R.zone(x.type);
    return !subject || (z && (z.subject || 'math') === subject);
  }).slice(0, 3);

  R.name = item => Q.names[item.type] || item.type;

  TM.Repair = R;
})(window.TM);
