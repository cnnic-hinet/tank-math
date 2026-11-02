// 界面总控：页面切换、弹层、计时、地图首页
(function (TM) {
  const { U, Store, Audio, Levels: L, Repair } = TM;
  const h = U.h;
  const App = {};
  const root = () => document.getElementById('app');

  // keepVoice：换到作战画面时不打断还没说完的话（比如上一关的表扬）
  App.show = (el, { keepVoice } = {}) => {
    if (!keepVoice) Audio.stop();
    App.closeOverlay();
    App.noClock = false;
    TM.Lines.onSay = null;
    const r = root();
    r.innerHTML = '';
    r.append(el);
  };

  App.closeOverlay = () => {
    if (App._ov) App._ov.remove();
    App._ov = null;
  };

  // 弹一个对话框，返回点中按钮的 value
  App.ask = ({ emoji, title, text, buttons, cls }) => new Promise(resolve => {
    App.closeOverlay();
    const box = h('div', { class: 'dialog ' + (cls || '') },
      emoji ? h('div', { class: 'big-emoji' }, emoji) : null,
      title ? h('h2', null, title) : null,
      text ? h('div', { class: 'dtext' }, text) : null,
      h('div', { class: 'actions' }, buttons.map(b => h('button', {
        class: 'btn ' + (b.cls || ''),
        onclick: () => { Audio.sfx.tap(); App.closeOverlay(); resolve(b.value); },
      }, b.label))));
    App._ov = h('div', { class: 'overlay' }, box);
    root().append(App._ov);
  });

  App.toast = (msg, ms = 1800) => {
    const t = h('div', { class: 'toast' }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), ms);
  };

  App.starsEl = n => h('span', { class: 'n-stars' }, [0, 1, 2].map(i => h('span', { class: i < n ? '' : 'off' }, '★')));

  // 记录每天玩的时间：页面在前台、不在家长页时才算
  let last = Date.now();
  setInterval(() => {
    const now = Date.now();
    const dt = Math.min(10, (now - last) / 1000);
    last = now;
    if (document.hidden || App.noClock) return;
    Store.addTime(dt);
    Store.save();
  }, 5000);

  // 超过每日时长就劝休息。返回 true 表示不能再开新关
  App.restIfOver = () => {
    if (!Store.overLimit()) return false;
    const m = Math.round(Store.day().sec / 60);
    TM.Lines.say('rest');
    App.ask({
      emoji: '😴', title: '今天的任务完成啦',
      text: `今天已经玩了 ${m} 分钟。让眼睛休息一下，明天再来战斗！`,
      buttons: [{ label: '好的', value: 1, cls: 'green' }],
    });
    return true;
  };

  // ---------- 地图 ----------
  App.map = () => {
    const S = Store.data;
    const due = Repair.due().length;
    const lock = h('button', { class: 'lock', 'aria-label': '家长入口' }, '🔒');
    U.longPress(lock, 3000, () => TM.Parent.show());
    lock.addEventListener('click', () => App.toast('家长请长按 3 秒'));

    // 备份超过 7 天没做，家长入口上亮个小红点
    if (App.backupOld()) lock.append(h('span', { class: 'dot-red' }));
    const left = TM.Tasks.left(), g = TM.Tasks.goal(), RW = TM.Rewards;
    const canBuy = [...RW.MODELS, ...RW.SKINS, ...RW.WEAPONS].some(RW.canBuy);
    const top = h('div', { class: 'topbar' },
      h('div', { class: 'brand' }, '🪖 坦克数学大作战'),
      h('div', { class: 'pill', title: '可以花的星星' }, '⭐ ', String(RW.wallet())),
      g ? h('div', { class: 'pill goal-pill' }, '🎁 ', `${g.got}/${g.need}`) : null,
      h('button', { class: 'btn small gray', onclick: () => { Audio.sfx.tap(); TM.Tasks.show(); } },
        '📅 任务', left ? h('span', { class: 'badge' }, String(left)) : h('span', { class: 'badge ok' }, '🏅')),
      h('button', { class: 'btn small gray', onclick: () => { Audio.sfx.tap(); TM.Garage.show(); } },
        '🔧 维修厂', due ? h('span', { class: 'badge' }, String(due)) : null),
      h('button', { class: 'btn small gray', onclick: () => { Audio.sfx.tap(); TM.Hangar.show(); } },
        h('span', { class: 'top-tank', html: TM.V.tank('me') }), '装备库', canBuy ? h('span', { class: 'badge ok' }, '🛒') : null),
      lock);

    const zones = h('div', { class: 'zones' }, L.ZONES.map((z, zi) => {
      const open = L.zoneOpen(zi);
      const got = z.levels.reduce((s, _, li) => s + (S.levels[L.key(zi, li)]?.stars || 0), 0);
      let marked = false;
      const nodes = z.levels.map((lv, li) => {
        const lo = open && L.levelOpen(zi, li);
        const st = S.levels[L.key(zi, li)]?.stars || 0;
        const next = lo && !st && !marked;
        if (next) marked = true;
        return h('button', {
          class: 'node' + (lv.boss ? ' boss' : lv.mini ? ' mini' : '') + (lo ? '' : ' locked') + (next ? ' next' : ''),
          onclick: () => { Audio.sfx.tap(); TM.Play.level(zi, li); },
        },
        h('span', { class: 'n-idx' }, lv.boss ? '👑' : lv.mini ? '🛩️' : String(li + 1)),
        h('span', { class: 'n-name' }, lv.name),
        App.starsEl(st));
      });
      return h('div', { class: 'zone' + (open ? '' : ' locked'), style: '--zc:' + z.color },
        h('div', { class: 'zone-head' },
          h('span', { class: 'icon' }, z.icon),
          h('div', null, h('div', { class: 'name' }, z.name), h('div', { class: 'desc' }, z.desc)),
          h('span', { class: 'zstars' }, `★ ${got}/${z.levels.length * 3}`)),
        h('div', { class: 'nodes' }, nodes),
        open ? null : h('div', { class: 'zone-lock' }, h('b', null, L.hidden(zi) ? '📚' : '🔒'),
          L.hidden(zi) ? `${z.grade}的内容，学校学到了再来` : `打败「${L.ZONES[z.after].name}」的 Boss 就能解锁`));
    }));

    App.show(h('div', { class: 'screen map' }, top, zones));
    // 滚到正在打的战区
    const cur = zones.querySelector('.node.next');
    if (cur) zones.scrollLeft = Math.max(0, cur.closest('.zone').offsetLeft - 20);
    if (!S.placed) App.welcome();
    else TM.Tasks.celebrate();
  };

  App.welcome = async () => {
    const nick = Store.data.nick;
    TM.Lines.say('welcome');
    const v = await App.ask({
      emoji: '🪖', title: `欢迎${nick}入营！`,
      text: '先做 10 道入营测试题，看看你已经会哪些本领。不会的题猜一个就行，没关系！',
      buttons: [
        { label: '开始入营测试', value: 'test', cls: 'green' },
        { label: '直接从新兵营开始', value: 'skip', cls: 'gray' },
      ],
    });
    if (v === 'test') return TM.Play.placement();
    Store.data.placed = true;
    Store.save();
  };

  App.backupOld = () => {
    const b = Store.data.lastBackup || Store.data.created;
    return U.daysBetween(b, U.today()) > 7 && Store.totalStars() > 0;
  };
  // 从主屏幕图标打开的（Safari 不会自动清掉这种网页的数据）
  App.standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

  App.boot = () => {
    Store.load();
    // 请求持久存储，减少被浏览器清理的可能
    navigator.storage?.persist?.().catch(() => {});
    App.map();
    // 阻止双指缩放、双击放大
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  };
  document.addEventListener('DOMContentLoaded', App.boot);

  TM.App = App;
})(window.TM);
