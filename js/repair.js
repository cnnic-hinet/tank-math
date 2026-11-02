// 坦克维修厂（错题本）：答错的题按间隔复习，隔天连续答对 2 次算修好
(function (TM) {
  const { Q, U } = TM;
  const S = () => TM.Store.data;
  const NEED = 2;          // 需要连续答对的次数
  const GAP = [1, 2];      // 第 1 天复习，答对后再隔 2 天（第 3 天）复习

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

  // 热身：每次出征前最多修 3 辆
  R.warmup = () => R.due().slice(0, 3);

  R.name = item => Q.names[item.type] || item.type;

  TM.Repair = R;
})(window.TM);
