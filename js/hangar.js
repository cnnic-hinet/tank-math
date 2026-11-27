// 改装工厂：用彩色星星买零件自己拼坦克；普通星星买涂装、武器和经典车型；试射
(function (TM) {
  const { U, Audio, V, Rewards: RW } = TM;
  const h = U.h;
  const H = {};

  const TABS = [['chassis', '🛞 底盘'], ['body', '🛡️ 车身'], ['turret', '🎯 炮塔'], ['gun', '💥 主炮'],
    ['addon', '📡 挂件'], ['hat', '🎩 头饰'], ['skin', '🎨 涂装'], ['weapon', '🚀 武器'], ['classic', '🚜 经典车型']];
  const LIST = {
    skin: () => RW.SKINS,
    weapon: () => RW.WEAPONS,
    classic: () => [RW.custom(), ...RW.MODELS.filter(m => m.cat !== 'air'), ...RW.MODELS.filter(m => m.cat === 'air')],
  };
  RW.SLOTS.forEach(([s]) => (LIST[s] = () => RW.slotParts(s)));
  let tab = 'chassis';

  // 星星图标：普通星星 ⭐，彩色星星是带颜色的 ★，拼图星是 🧩
  H.gem = cur => (!cur ? h('span', { class: 'gem' }, '⭐') : cur === 'puzzle' ? h('span', { class: 'gem' }, '🧩')
    : h('span', { class: 'gem g-' + cur }, '★'));
  H.cost = (cur, n) => h('span', { class: 'cost' }, H.gem(cur), String(n));

  // 给孩子看的战力条
  const POWER = ['火力', '装甲', '速度'];
  const bars = x => h('div', { class: 'h-power' }, POWER.map((name, i) => h('div', { class: 'p-row' }, h('span', null, name),
    h('span', { class: 'p-bar' }, [0, 1, 2, 3, 4].map(k => h('i', { class: k < x.power[i] ? 'on' : '' }))))));

  // 东西的样子：零件、车型、涂装都画成坦克，武器用图标
  H.look = (x, cls = 'h-tank') => {
    if (x.kind === 'weapon') return h('span', { class: cls === 'h-tank' ? 'h-icon' : cls + ' w-icon' }, x.icon);
    const html = x.kind === 'part' ? V.tank('me', null, RW.custom({ [x.slot]: x.id }))
      : x.kind === 'model' ? V.tank('me', null, x) : V.tank('me', x);
    return h('span', { class: cls, html });
  };

  const using = x => RW.has(x) && (x.kind === 'weapon' ? RW.carrying(x)
    : x.kind === 'part' ? RW.usingCustom() && RW.build()[x.slot] === x.id
      : x.kind === 'model' ? RW.model().id === x.id : RW.skin().id === x.id);
  const slotName = s => (RW.SLOTS.find(r => r[0] === s) || [])[1];
  const all = () => [...RW.PARTS, ...RW.MODELS, ...RW.SKINS, ...RW.WEAPONS];

  // 钱包：普通星星加 5 种彩色星星
  const walletEl = () => h('div', { class: 'wallets' },
    h('span', { class: 'pill wallet' }, H.cost(null, RW.wallet())),
    RW.GEM_IDS.map(k => h('span', { class: 'pill wallet gem-pill', title: RW.GEMS[k].name }, H.cost(k, RW.balance(k)))));

  // 没选东西时，告诉孩子每种星星在哪儿攒、能买什么
  const legend = () => h('div', { class: 'gem-legend' }, RW.GEM_IDS.map(k => h('div', null,
    H.gem(k), h('b', null, RW.GEMS[k].name), ` ${RW.GEMS[k].from} → ${RW.GEMS[k].buys}`)),
  h('div', null, H.gem(null), h('b', null, '星星'), ' 所有关卡 → 头饰、涂装、武器、经典车型'));

  H.show = startTab => {
    if (startTab) tab = startTab;
    const fieldEl = h('div');
    let f = null, busy = false, sel = null;

    const wallet = h('div');
    const top = h('div', { class: 'topbar' },
      h('button', { class: 'btn-icon', onclick: () => { Audio.sfx.tap(); TM.App.map(); } }, '←'),
      h('div', { class: 'title' }, '🏭 改装工厂'), wallet);
    const tabsEl = h('div', { class: 'h-tabs f-tabs' });
    const grid = h('div', { class: 'h-grid' });
    const info = h('div', { class: 'h-info' });
    const note = h('div', { class: 'note' });

    // 试射场上的坦克：选中还没买的零件、车型、涂装先套上看看
    const drawMe = () => {
      const m = sel && sel.kind === 'model' ? sel : sel && sel.kind === 'part' ? RW.custom({ [sel.slot]: sel.id }) : null;
      f.me.innerHTML = V.tank('me', sel && sel.kind === 'skin' ? sel : null, m);
    };

    const drawTabs = () => {
      tabsEl.innerHTML = '';
      TABS.forEach(([k, label]) => {
        const xs = LIST[k](), can = xs.some(RW.canBuy);
        tabsEl.append(h('button', {
          class: 'h-tab' + (tab === k ? ' on' : ''),
          onclick: () => { Audio.sfx.tap(); tab = k; sel = null; drawAll(); },
        }, label, can ? h('i', { class: 'tab-dot' }) : h('small', null, `${xs.filter(RW.has).length}/${xs.length}`)));
      });
    };

    const card = x => {
      const got = RW.has(x);
      let tag;
      if (x.streak && !got) tag = h('span', { class: 'tag lock' }, `🔥 ${x.streak} 天`);
      else if (!got) tag = h('span', { class: 'tag price' + (RW.canBuy(x) ? ' can' : '') }, H.cost(x.cur, x.price));
      else if (using(x)) tag = h('span', { class: 'tag on' }, x.kind === 'weapon' ? '出战' : '使用中');
      else tag = h('span', { class: 'tag got' }, '已拥有');
      return h('button', {
        class: 'h-item' + (x.streak && !got ? ' streak' : '') + (using(x) ? ' on' : '') + (sel && sel.id === x.id && sel.kind === x.kind ? ' sel' : '')
          + (x.cur === 'puzzle' ? ' pz' : ''),
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
        info.append(h('div', { class: 'i-tip' }, tab === 'weapon' ? '点一下武器就能试射。打仗时，从「出战」的武器里随机挑一种开炮。'
          : RW.slotParts(tab).length ? `点一下零件就能先装上看看。有了的点一下就换上，六个部位随便搭！` : '点一下看看装上是什么样。已经有的点一下就换上。'),
        legend());
        return;
      }
      const got = RW.has(x), btns = [];
      if (x.kind === 'weapon') {
        btns.push(h('button', { class: 'btn small blue', onclick: () => tryFire(x) }, '🎯 试射'));
        if (got) btns.push(h('button', { class: 'btn small ' + (RW.carrying(x) ? 'gray' : 'green'), onclick: () => carry(x) }, RW.carrying(x) ? '不带它' : '带上出战'));
      }
      if (!got && !x.streak) {
        const have = RW.balance(x.cur);
        btns.push(RW.canBuy(x)
          ? h('button', { class: 'btn small green', onclick: () => buy(x) }, '用 ', H.cost(x.cur, x.price), ' 买下')
          : h('button', { class: 'btn small gray', onclick: () => short(x) }, '还差 ', H.cost(x.cur, x.price - have)));
      }
      const status = got ? (x.kind !== 'weapon' ? (using(x) ? '✅ 正在使用' : '已拥有') : RW.carrying(x) ? '✅ 带着出战' : '已拥有，这次不带')
        : x.streak ? '🔒 ' + RW.needText(x) : '👀 先装上看看';
      const where = x.kind === 'part' ? h('div', { class: 'i-where' }, H.gem(x.cur),
        x.cur ? `${slotName(x.slot)}零件，用${RW.unit(x.cur)}买。${RW.GEMS[x.cur].from}能攒${RW.unit(x.cur)}。`
          : `${slotName(x.slot)}，用星星买。所有关卡都能攒星星。`) : null;
      info.append(...[
        h('div', { class: 'i-head' }, h('b', null, (x.icon ? x.icon + ' ' : '') + x.name), h('span', { class: 'i-status' }, status)),
        x.desc ? h('div', { class: 'i-desc' }, x.desc) : null,
        where,
        x.power ? bars(x) : null,
        btns.length ? h('div', { class: 'i-btns' }, btns) : null].filter(Boolean));
    };

    const drawNote = () => {
      wallet.innerHTML = '';
      wallet.append(walletEl());
      const can = all().filter(RW.canBuy).length, nx = RW.next();
      note.textContent = can ? `有 ${can} 样东西买得起，挑一个吧！`
        : nx ? `再攒 ${nx.price - RW.wallet()} 颗星星，就能买「${nx.name}」` : '普通星星的东西都买齐啦！';
    };

    const drawAll = () => { drawMe(); drawTabs(); drawGrid(); drawInfo(); drawNote(); };

    const sayPrice = x => `${x.name}，${x.price}颗${RW.unit(x.cur)}`;
    const pick = x => {
      Audio.sfx.tap();
      sel = x;
      // 已经有的零件、车型、涂装点一下就换上
      if (RW.has(x) && x.kind !== 'weapon') RW.equip(x);
      drawAll();
      Audio.speak(RW.has(x) ? x.name : x.streak ? `${x.name}，${RW.needText(x)}` : sayPrice(x));
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
      const have = RW.balance(x.cur), need = x.price - have, u = RW.unit(x.cur);
      Audio.speak(`你有${have}颗${u}，${x.name}要${x.price}颗，还差${need}颗。${x.cur ? `去${RW.GEMS[x.cur].from}攒吧！` : '再去打几关吧！'}`);
      TM.App.toast(`${x.price} − ${have} = ${need}，还差 ${need} 颗${u}`, 2600);
    };

    // 买之前把减法算给孩子看
    const buy = async x => {
      const have = RW.balance(x.cur), left = have - x.price, u = RW.unit(x.cur);
      Audio.speak(`你有${have}颗${u}，${x.name}要${x.price}颗。${have}减${x.price}等于${left}，买完还剩${left}颗。`);
      const v = await TM.App.ask({
        cls: 'buy', title: `买「${x.name}」吗？`,
        text: [
          h('div', { class: 'buy-look' }, H.look(x)),
          h('div', { class: 'buy-math' }, `${have} − ${x.price} = ${left}`),
          h('div', null, `你有 ${have} 颗`, H.gem(x.cur), `${u}，${x.name}要 ${x.price} 颗，买完还剩 ${left} 颗。`),
        ],
        buttons: [{ label: '买下！', value: 1, cls: 'green' }, { label: '再想想', value: 0, cls: 'gray' }],
      });
      if (!v || !RW.buy(x)) return Audio.stop();
      Audio.sfx.buy();
      Audio.speak(`买到了${x.name}！${x.kind === 'part' ? '已经装上啦！' : ''}`);
      sel = x;
      drawAll();
      f.sparks(f.center(f.me), 14, 110, ['⭐', '✨', '🎉', '🌟']);
      if (x.kind === 'weapon') setTimeout(() => tryFire(x), 600);
    };

    // 第一次打开：说一下按以前的关卡星补发了多少彩色星星、送了哪些零件
    const gift = async () => {
      const g = RW.takeGift();
      if (!g) return Audio.speak(`欢迎来到改装工厂！你有${RW.wallet()}颗星星。`);
      const got = RW.GEM_IDS.filter(k => g.gems[k]);
      const parts = (g.parts || []).map(RW.part).filter(Boolean);
      Audio.speak(`欢迎来到改装工厂！以前打下的关卡星，换成了彩色星星。${parts.length ? '你以前买的车，也送了对应的零件！' : ''}用它们拼一辆自己的坦克吧！`);
      await TM.App.ask({
        emoji: '🏭', title: '改装工厂开张啦！',
        text: [
          h('div', null, '以前拿到的关卡星，每颗换 1 颗彩色星星：'),
          h('div', { class: 'gift-row' }, got.map(k => h('span', { class: 'unlock-item' }, H.cost(k, g.gems[k]), RW.GEMS[k].name))),
          parts.length ? h('div', null, '以前买的车型，送你这些零件：') : null,
          parts.length ? h('div', { class: 'gift-row' }, parts.map(p => h('span', { class: 'unlock-item' }, H.look(p, 'mini-tank'), p.name))) : null,
          h('div', { class: 'dtext' }, '普通星星一颗都没少，还是用来买涂装和武器。'),
        ],
        buttons: [{ label: '开始改装！', value: 1, cls: 'green' }],
      });
    };

    const left = h('div', { class: 'h-left' }, fieldEl, info, note,
      h('div', { class: 'h-earn' }, '过关、维修厂、特训答对都能攒星星；哪个战区的题，就得哪种彩色星星'));
    const right = h('div', { class: 'h-right' }, tabsEl, grid);
    TM.App.show(h('div', { class: 'screen hangar' }, top, h('div', { class: 'h-body' }, left, right)));
    f = new TM.Battle(fieldEl, 0);
    f.base.style.display = 'none';
    drawAll();
    gift();
  };

  // 战报里「得到的星星」和新买得起的东西
  H.payEl = pay => (pay.rows.length ? h('div', { class: 'pay' },
    pay.rows.map(([t, n, cur]) => h('div', { class: 'pay-row' }, h('span', null, t), h('b', null, '+', H.cost(cur, n)))),
    h('div', { class: 'pay-sum' }, '现在有 ', H.cost(null, pay.after),
      Object.keys(pay.gems).map(k => h('span', null, ' ', H.cost(k, RW.balance(k)))), ' 可以花'),
    pay.canBuy.length ? h('div', { class: 'unlock-row' }, h('span', null, '🏭 买得起啦：'),
      pay.canBuy.slice(0, 4).map(x => h('span', { class: 'unlock-item' }, H.look(x, 'mini-tank'), x.name))) : null) : null);

  TM.Hangar = H;
})(window.TM);
