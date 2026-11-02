// 每日任务：完成全部任务得一枚勋章，连续几天解锁特别涂装；家长设的现实奖励也按勋章算
(function (TM) {
  const { U, Store, Audio } = TM;
  const h = U.h;
  const T = {};

  const EXTRA = [
    { id: 'first', label: '一次答对 10 道题', need: 10 },
    { id: 'three', label: '拿一次 3 颗星', need: 1 },
    { id: 'combo', label: '连续答对 5 道题', need: 5 },
    { id: 'super', label: '放 1 次空中支援 ✈️', need: 1 },
  ];

  // 今天的任务：第一次打开时生成
  T.today = () => {
    const d = Store.day();
    if (!d.tasks) {
      const list = [{ id: 'win', label: '打赢 1 关', need: 1 }];
      const due = TM.Repair.due().length;
      if (due) list.push({ id: 'fix', label: `修理 ${Math.min(2, due)} 辆坦克`, need: Math.min(2, due) });
      list.push(U.pick(EXTRA));
      d.tasks = list.map(t => ({ ...t, n: 0 }));
      Store.save();
    }
    return d.tasks;
  };

  const check = () => {
    const d = Store.day();
    if (d.medal || !T.today().every(t => t.n >= t.need)) return;
    d.medal = true;
    Store.data.bestStreak = Math.max(Store.data.bestStreak || 0, T.streak());
    TM.Rewards.earn(TM.Rewards.MEDAL_PAY);
    Audio.sfx.win();
    TM.App.toast(`🏅 今日任务全部完成！+${TM.Rewards.MEDAL_PAY} ⭐`);
  };

  // 计数类任务加 n；max 为 true 时取最大值（连续答对）
  T.bump = (id, n = 1, max) => {
    const t = T.today().find(x => x.id === id);
    if (!t || t.n >= t.need) return;
    t.n = Math.min(t.need, max ? Math.max(t.n, n) : t.n + n);
    check();
    Store.save();
  };

  const medal = key => !!Store.data.daily[key]?.medal;
  // 连续拿勋章的天数（今天还没拿到就从昨天算起）
  T.streak = () => {
    let k = U.today(), n = 0;
    if (!medal(k)) k = U.addDays(k, -1);
    while (medal(k)) { n++; k = U.addDays(k, -1); }
    return n;
  };
  T.left = () => T.today().filter(t => t.n < t.need).length;

  // 现实奖励：从设目标那天起攒了几枚勋章
  T.goal = () => {
    const g = Store.data.settings.goal;
    if (!g) return null;
    const got = Object.keys(Store.data.daily).filter(k => k >= g.start && medal(k)).length;
    return { ...g, got: Math.min(got, g.need), reached: got >= g.need };
  };

  // 回到地图时，补上勋章和目标达成的庆祝
  T.celebrate = async () => {
    const d = Store.day();
    if (d.medal && !d.medalShown) {
      d.medalShown = true;
      Store.save();
      const s = T.streak();
      const played = await TM.Rec.play('daily');
      if (!played) TM.Lines.say('medal');
      await TM.App.ask({
        emoji: '🏅', title: '今日任务完成！',
        text: `${Store.data.nick}拿到了今天的勋章${s > 1 ? `，已经连续 ${s} 天啦` : ''}！还得到 ${TM.Rewards.MEDAL_PAY} 颗星星。`,
        buttons: [{ label: '太棒了', value: 1, cls: 'green' }],
      });
    }
    const g = T.goal();
    if (g && g.reached && !g.shown) {
      Store.data.settings.goal.shown = true;
      Store.save();
      Audio.sfx.win();
      TM.Lines.say('goal', 0, g.text);
      await TM.App.ask({
        emoji: '🎁', title: '奖励目标达成！',
        text: `攒满了 ${g.need} 枚勋章！快去告诉爸爸妈妈：${g.text}`,
        buttons: [{ label: '好耶！', value: 1, cls: 'green' }],
      });
    }
  };

  // 进度条
  T.bar = (n, need, label) => h('div', { class: 't-bar' },
    h('div', { class: 't-fill', style: { width: (need ? (n / need) * 100 : 0) + '%' } }),
    h('span', null, label || `${n}/${need}`));

  // 本月日历，拿到勋章的日子画 🏅
  const calendar = () => {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const first = (new Date(y, m, 1).getDay() + 6) % 7; // 周一排第一列
    const days = new Date(y, m + 1, 0).getDate();
    const today = U.today();
    const cells = ['一', '二', '三', '四', '五', '六', '日'].map(w => h('span', { class: 'c-w' }, w));
    for (let i = 0; i < first; i++) cells.push(h('span'));
    for (let dd = 1; dd <= days; dd++) {
      const k = U.dateKey(new Date(y, m, dd));
      cells.push(h('span', { class: 'c-day' + (k === today ? ' today' : '') + (medal(k) ? ' got' : '') },
        h('small', null, String(dd)), medal(k) ? '🏅' : ''));
    }
    return h('div', { class: 't-card' }, h('h3', null, `${m + 1} 月的勋章`), h('div', { class: 't-cal' }, cells));
  };

  T.show = () => {
    const tasks = T.today(), streak = T.streak(), g = T.goal();
    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: () => { Audio.sfx.tap(); TM.App.map(); } }, '←'),
      h('div', { class: 'title' }, '📅 每日任务'),
      h('div', { class: 'pill' }, `🔥 连续 ${streak} 天`));

    const list = h('div', { class: 't-card' }, h('h3', null, Store.day().medal ? '今天的任务都完成啦 🏅' : '完成全部任务，拿一枚勋章'),
      tasks.map(t => h('div', { class: 't-task' + (t.n >= t.need ? ' done' : '') },
        h('span', { class: 't-check' }, t.n >= t.need ? '✅' : '⬜'),
        h('b', null, t.label), T.bar(t.n, t.need))));

    // 连续天数解锁的涂装
    const skins = TM.Rewards.SKINS.filter(x => x.streak);
    const best = Store.data.bestStreak || 0;
    const sk = h('div', { class: 't-card' }, h('h3', null, '连续拿勋章，解锁特别涂装'),
      h('div', { class: 't-skins' }, skins.map(x => h('div', { class: 't-skin' + (best >= x.streak ? '' : ' locked') },
        h('span', { class: 'mini-tank', html: TM.V.tank('me', x) }),
        h('b', null, x.name), h('small', null, best >= x.streak ? '已解锁' : `连续 ${x.streak} 天`)))));

    const goal = g ? h('div', { class: 't-card goal' }, h('h3', null, '🎁 奖励目标'),
      h('div', { class: 't-goal' }, g.text), T.bar(g.got, g.need, `🏅 ${g.got}/${g.need}`),
      h('small', null, g.reached ? '目标达成！快去告诉爸爸妈妈' : `再拿 ${g.need - g.got} 枚勋章就能实现`)) : null;

    TM.App.show(h('div', { class: 'screen tasks' }, top,
      h('div', { class: 't-body' }, h('div', { class: 't-col' }, list, goal, sk), h('div', { class: 't-col' }, calendar()))));
  };

  TM.Tasks = T;
})(window.TM);
