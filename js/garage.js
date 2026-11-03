// 维修厂页面（错题本）
(function (TM) {
  const { U, Store, Audio, Repair, V } = TM;
  const h = U.h;
  const G = {};

  const item = (x, state, cls) => h('div', { class: 'g-item' },
    h('div', { class: 'gi-tank', html: V.tank(x.fixed ? 'me' : 'broken') }),
    h('div', { class: 'gi-main' },
      h('div', { class: 'gi-name' }, Repair.name(x)),
      h('div', { class: 'gi-q' }, x.q.prompt + (x.fixed ? '' : `（当时选了 ${x.wrong}）`))),
    h('span', { class: 'gi-state ' + (cls || '') }, state));

  let tab = 'repair';

  G.show = t => {
    if (t) tab = t;
    const today = U.today();
    const due = Repair.due();
    const active = Repair.active().sort((a, b) => (a.due < b.due ? -1 : 1));
    const fixed = Repair.fixedList().sort((a, b) => (a.fixedDate < b.fixedDate ? 1 : -1));

    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: () => { Audio.sfx.tap(); TM.App.map(); } }, '←'),
      h('div', { class: 'title' }, '🔧 坦克维修厂'),
      tab === 'repair' ? h('button', {
        class: 'btn green', disabled: due.length ? null : 'disabled',
        onclick: () => { Audio.sfx.tap(); TM.Play.repair(due); },
      }, due.length ? `开始修理（${due.length} 辆）` : '今天都修完啦') : null);

    const tabs = h('div', { class: 'g-tabs' },
      h('button', {
        class: 'g-tab' + (tab === 'repair' ? ' on' : ''),
        onclick: () => { Audio.sfx.tap(); G.show('repair'); },
      }, '🔧 修坦克', active.length ? h('span', { class: 'badge' }, String(active.length)) : null),
      h('button', {
        class: 'g-tab' + (tab === 'an' ? ' on' : ''),
        onclick: () => { Audio.sfx.tap(); G.show('an'); },
      }, '📊 学习分析'));

    const left = h('div', { class: 'g-col' },
      h('h3', null, `待修理 ${active.length} 辆`),
      active.length
        ? h('div', { class: 'g-list' }, active.map(x => {
          const d = U.daysBetween(today, x.due);
          const prog = x.streak ? `修了 ${x.streak}/2 · ` : '';
          return d <= 0 ? item(x, prog + '今天修', 'due') : item(x, prog + `${d} 天后修`);
        }))
        : h('div', { class: 'empty-tip' }, h('b', null, '✨'), '没有要修的坦克，真棒！'));

    const right = h('div', { class: 'g-col' },
      h('h3', null, `修好的坦克 🏅 ${fixed.length} 辆`),
      fixed.length
        ? h('div', { class: 'g-list' }, fixed.map(x => item(x, '修好了 ' + x.fixedDate.slice(5), 'ok')))
        : h('div', { class: 'empty-tip' }, h('b', null, '🛠️'), '答错的题会送到这里。', '隔一天再来修，连续答对 2 次就彻底修好啦。'));

    const body = tab === 'an'
      ? TM.Analysis.body()
      : h('div', { class: 'g-body' }, left, right);

    TM.App.show(h('div', { class: 'screen garage-screen' }, top, tabs, body));
    if (tab === 'repair' && due.length) TM.Lines.say('garage', due.length);
  };

  TM.Garage = G;
})(window.TM);
