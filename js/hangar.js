// 装备库：花星星买车型、涂装和武器，换装备，试射
(function (TM) {
  const { U, Audio, V, Rewards: RW } = TM;
  const h = U.h;
  const H = {};

  // 陆战和空中都是「车型」，分开两栏方便翻
  const TABS = [['land', '🚜 陆战'], ['air', '✈️ 空中'], ['skin', '🎨 涂装'], ['weapon', '💥 武器']];
  const LIST = {
    land: () => RW.MODELS.filter(m => m.cat !== 'air'),
    air: () => RW.MODELS.filter(m => m.cat === 'air'),
    skin: () => RW.SKINS,
    weapon: () => RW.WEAPONS,
  };
  let tab = 'land';

  // 给孩子看的战力条
  const POWER = ['火力', '装甲', '速度'];
  const bars = x => h('div', { class: 'h-power' }, POWER.map((name, i) => h('div', { class: 'p-row' }, h('span', null, name),
    h('span', { class: 'p-bar' }, [0, 1, 2, 3, 4].map(k => h('i', { class: k < x.power[i] ? 'on' : '' }))))));

  // 装备的样子：车型和涂装画坦克，武器用图标
  H.look = (x, cls = 'h-tank') => (x.kind === 'weapon' ? h('span', { class: 'h-icon' }, x.icon)
    : h('span', { class: cls, html: x.kind === 'model' ? V.tank('me', null, x) : V.tank('me', x) }));

  const using = x => RW.has(x) && (x.kind === 'weapon' ? RW.carrying(x) : x.kind === 'model' ? RW.model().id === x.id : RW.skin().id === x.id);

  H.show = startTab => {
    if (startTab) tab = startTab;
    const fieldEl = h('div');
    let f = null, busy = false, sel = null;

    const wallet = h('div', { class: 'pill wallet' });
    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: () => { Audio.sfx.tap(); TM.App.map(); } }, '←'),
      h('div', { class: 'title' }, '🛒 装备库'), wallet);
    const tabsEl = h('div', { class: 'h-tabs' });
    const grid = h('div', { class: 'h-grid' });
    const info = h('div', { class: 'h-info' });
    const note = h('div', { class: 'note' });

    // 试射场上的坦克：选中还没买的车型、涂装时先套上看看
    const drawMe = () => {
      const m = sel && sel.kind === 'model' ? sel : null, s = sel && sel.kind === 'skin' ? sel : null;
      f.me.innerHTML = V.tank('me', s, m);
    };

    const drawTabs = () => {
      tabsEl.innerHTML = '';
      TABS.forEach(([k, label]) => {
        const xs = LIST[k]();
        tabsEl.append(h('button', {
          class: 'h-tab' + (tab === k ? ' on' : ''),
          onclick: () => { Audio.sfx.tap(); tab = k; sel = null; drawAll(); },
        }, label, h('small', null, `${xs.filter(RW.has).length}/${xs.length}`)));
      });
    };

    const card = x => {
      const got = RW.has(x);
      let tag;
      if (x.streak && !got) tag = h('span', { class: 'tag lock' }, `🔥 ${x.streak} 天`);
      else if (!got) tag = h('span', { class: 'tag price' + (RW.canBuy(x) ? ' can' : '') }, `⭐ ${x.price}`);
      else if (using(x)) tag = h('span', { class: 'tag on' }, x.kind === 'weapon' ? '出战' : '使用中');
      else tag = h('span', { class: 'tag got' }, '已拥有');
      return h('button', {
        class: 'h-item' + (x.streak && !got ? ' streak' : '') + (using(x) ? ' on' : '') + (sel === x ? ' sel' : ''),
        onclick: () => pick(x),
      }, H.look(x), h('span', { class: 'h-name' }, x.name), tag);
    };

    const drawGrid = () => {
      grid.innerHTML = '';
      LIST[tab]().forEach(x => grid.append(card(x)));
    };

    const drawInfo = () => {
      info.innerHTML = '';
      const x = sel;
      if (!x) {
        info.append(h('div', { class: 'i-tip' }, tab === 'weapon'
          ? '点一下武器就能试射。打仗时，从「出战」的武器里随机挑一种开炮。'
          : '点一下看看装上是什么样。已经有的点一下就换上。'));
        return;
      }
      const got = RW.has(x), btns = [];
      if (x.kind === 'weapon') {
        btns.push(h('button', { class: 'btn small blue', onclick: () => tryFire(x) }, '🎯 试射'));
        if (got) btns.push(h('button', { class: 'btn small ' + (RW.carrying(x) ? 'gray' : 'green'), onclick: () => carry(x) }, RW.carrying(x) ? '不带它' : '带上出战'));
      }
      if (!got && !x.streak) {
        btns.push(RW.canBuy(x)
          ? h('button', { class: 'btn small green', onclick: () => buy(x) }, `用 ${x.price} ⭐ 买下`)
          : h('button', { class: 'btn small gray', onclick: () => short(x) }, `还差 ${x.price - RW.wallet()} ⭐`));
      }
      const status = got ? (x.kind !== 'weapon' ? '✅ 正在使用' : RW.carrying(x) ? '✅ 带着出战' : '已拥有，这次不带')
        : x.streak ? '🔒 ' + RW.needText(x) : `⭐ ${x.price}`;
      info.append(...[
        h('div', { class: 'i-head' }, h('b', null, (x.icon ? x.icon + ' ' : '') + x.name), h('span', { class: 'i-status' }, status)),
        x.desc ? h('div', { class: 'i-desc' }, x.desc) : null,
        x.power ? bars(x) : null,
        btns.length ? h('div', { class: 'i-btns' }, btns) : null].filter(Boolean));
    };

    const drawNote = () => {
      wallet.textContent = `⭐ ${RW.wallet()}`;
      const can = [...RW.MODELS, ...RW.SKINS, ...RW.WEAPONS].filter(RW.canBuy).length, nx = RW.next();
      note.textContent = can ? `有 ${can} 件装备买得起，挑一个吧！`
        : nx ? `再攒 ${nx.price - RW.wallet()} 颗星星，就能买「${nx.name}」` : '所有装备都买齐啦！';
    };

    const drawAll = () => { drawMe(); drawTabs(); drawGrid(); drawInfo(); drawNote(); };

    const pick = x => {
      Audio.sfx.tap();
      sel = x;
      // 已经有的车型、涂装点一下就换上
      if (RW.has(x) && x.kind !== 'weapon') RW.equip(x);
      drawAll();
      Audio.speak(RW.has(x) ? x.name : x.streak ? `${x.name}，${RW.needText(x)}` : `${x.name}，${x.price}颗星星`);
      if (x.kind === 'weapon') tryFire(x);
    };

    // 点武器在试射场打一个靶子（没买的也能试）
    const tryFire = async w => {
      if (busy) return;
      busy = true;
      if (!f.enemy) await f.spawn('enemy');
      await f.fire(w.id);
      await U.sleep(300);
      busy = false;
    };

    const carry = w => {
      if (!RW.toggle(w)) return TM.App.toast('至少要带一种武器哦');
      Audio.sfx.tap();
      drawAll();
    };

    const short = x => {
      const have = RW.wallet(), need = x.price - have;
      Audio.speak(`你有${have}颗星星，${x.name}要${x.price}颗，还差${need}颗。再去打几关吧！`);
      TM.App.toast(`${x.price} − ${have} = ${need}，还差 ${need} 颗星星`, 2600);
    };

    // 买之前把减法算给孩子看
    const buy = async x => {
      const have = RW.wallet(), left = have - x.price;
      Audio.speak(`你有${have}颗星星，${x.name}要${x.price}颗。${have}减${x.price}等于${left}，买完还剩${left}颗。`);
      const v = await TM.App.ask({
        cls: 'buy', title: `买「${x.name}」吗？`,
        text: [
          h('div', { class: 'buy-look' }, H.look(x)),
          h('div', { class: 'buy-math' }, `${have} − ${x.price} = ${left}`),
          h('div', null, `你有 ${have} 颗星星，买完还剩 ${left} 颗。`),
        ],
        buttons: [{ label: '买下！', value: 1, cls: 'green' }, { label: '再想想', value: 0, cls: 'gray' }],
      });
      if (!v || !RW.buy(x)) return Audio.stop();
      Audio.sfx.buy();
      Audio.speak(`买到了${x.name}！`);
      sel = x;
      drawAll();
      f.sparks(f.center(f.me), 14, 110, ['⭐', '✨', '🎉', '🌟']);
      if (x.kind === 'weapon') setTimeout(() => tryFire(x), 600);
    };

    const left = h('div', { class: 'h-left' }, fieldEl, info, note,
      h('div', { class: 'h-earn' }, '攒星星：一次答对 +1 ⭐，关卡拿到新的星 +2 ⭐，每日任务全完成 +5 ⭐'));
    const right = h('div', { class: 'h-right' }, tabsEl, grid);
    TM.App.show(h('div', { class: 'screen hangar' }, top, h('div', { class: 'h-body' }, left, right)));
    f = new TM.Battle(fieldEl, 0);
    f.base.style.display = 'none';
    drawAll();
    Audio.speak(`欢迎来到装备库！你有${RW.wallet()}颗星星。`);
  };

  // 战报里「得到的星星」和新买得起的装备
  H.payEl = pay => (pay.total ? h('div', { class: 'pay' },
    pay.rows.map(([t, n]) => h('div', { class: 'pay-row' }, h('span', null, t), h('b', null, `+${n} ⭐`))),
    h('div', { class: 'pay-sum' }, `现在有 ${pay.after} ⭐ 可以花`),
    pay.canBuy.length ? h('div', { class: 'unlock-row' }, h('span', null, '🛒 买得起啦：'),
      pay.canBuy.slice(0, 4).map(x => h('span', { class: 'unlock-item' }, H.look(x, 'mini-tank'), x.name))) : null) : null);

  TM.Hangar = H;
})(window.TM);
