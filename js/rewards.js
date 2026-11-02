// 奖励：答题攒星星，在装备库花星星买车型、涂装和武器
(function (TM) {
  const { U } = TM;
  const R = {};

  // 车型：车身形状不同，颜色跟着涂装走。power 是给孩子看的 [火力, 装甲, 速度]，只是好玩，不影响答题
  R.MODELS = [
    { id: 'basic', name: '小坦克', price: 0, power: [2, 2, 2], desc: '一直陪着你的老伙计' },
    { id: 'scout', name: '侦察车', price: 20, power: [1, 2, 5], desc: '四个大轮子，跑得最快' },
    { id: 'twin', name: '双管坦克', price: 40, power: [4, 3, 2], desc: '两根炮管，一次打两发' },
    { id: 'shark', name: '鲨鱼坦克', price: 60, power: [3, 4, 3], desc: '一口大白牙，敌人都怕它' },
    { id: 'rocket', name: '火箭炮车', price: 80, power: [5, 2, 3], desc: '背着四枚大火箭' },
    { id: 'heavy', name: '重型坦克', price: 110, power: [4, 5, 1], desc: '又大又重，装甲最厚' },
    { id: 'mech', name: '机甲战车', price: 140, power: [5, 4, 3], desc: '肩膀上还扛着两门炮' },
    { id: 'hover', name: '悬浮坦克', price: 180, power: [5, 5, 5], desc: '飘在空中，什么路都能走' },
  ];

  // pal = [车身, 亮色, 暗色]；deco = 车身上的花纹；grad = 车身渐变色
  R.SKINS = [
    { id: 'green', name: '小绿', price: 0, pal: ['#4caf50', '#81d67f', '#2e7d32'] },
    { id: 'blue', name: '海军蓝', price: 5, pal: ['#3d8bfd', '#7db4ff', '#1f5fbf'] },
    { id: 'mint', name: '薄荷', price: 8, pal: ['#3cc9a7', '#a5f0dc', '#1f8a70'], deco: 'dots' },
    { id: 'pink', name: '草莓粉', price: 10, pal: ['#ff7eb6', '#ffb3d4', '#d9488a'] },
    { id: 'camo', name: '迷彩', price: 15, pal: ['#7a8c4a', '#a5b56e', '#4f5c2c'], deco: 'camo' },
    { id: 'star', name: '星星队长', price: 25, pal: ['#4a5fc1', '#8094f0', '#2c3a8a'], deco: 'star' },
    { id: 'panda', name: '熊猫', price: 30, pal: ['#f2f2f2', '#ffffff', '#2b2b2b'], deco: 'panda' },
    { id: 'flame', name: '火焰', price: 35, pal: ['#ff7a2f', '#ffb067', '#c94d10'], deco: 'flame' },
    { id: 'snow', name: '冰雪', price: 45, pal: ['#a9dcff', '#ffffff', '#3f86c4'], deco: 'snow' },
    { id: 'night', name: '夜空', price: 55, pal: ['#26305e', '#5a6bb8', '#121838'], deco: 'night' },
    { id: 'gold', name: '黄金', price: 70, pal: ['#e6b422', '#ffe27a', '#a87c00'], deco: 'shine' },
    { id: 'bolt', name: '闪电', price: 85, pal: ['#33334a', '#ffe14d', '#17172a'], deco: 'bolt' },
    { id: 'lava', name: '熔岩', price: 100, pal: ['#4a1f1a', '#ff8a3d', '#22100c'], deco: 'lava' },
    { id: 'rainbow', name: '彩虹', price: 120, pal: ['#9b6bff', '#fff3a8', '#5d35a0'], grad: ['#ff6b6b', '#ffb84d', '#6bd66b', '#4da3ff', '#b86bff'] },
    { id: 'galaxy', name: '银河', price: 150, pal: ['#3a2a8a', '#c9b8ff', '#1a1050'], grad: ['#1a1050', '#5b3fc4', '#c04dd8', '#2b6fd6'], deco: 'night' },
    // 连续几天完成每日任务才能拿到，不能买
    { id: 'medal', name: '勋章战车', streak: 3, pal: ['#d94848', '#ffd84d', '#9c2020'], deco: 'star' },
    { id: 'hero', name: '超级英雄', streak: 7, pal: ['#1e88e5', '#ff5252', '#0d47a1'], deco: 'shine' },
  ];

  R.WEAPONS = [
    { id: 'shell', icon: '💥', name: '普通炮弹', price: 0, desc: '最可靠的老伙计' },
    { id: 'missile', icon: '🚀', name: '导弹', price: 8, desc: '拖着烟飞过去，爆炸更大' },
    { id: 'ice', icon: '❄️', name: '冰冻弹', price: 15, desc: '把敌人冻成冰块，再敲碎' },
    { id: 'melon', icon: '🍉', name: '西瓜炮', price: 20, desc: '啪！敌人糊了一脸西瓜汁' },
    { id: 'bubble', icon: '🫧', name: '泡泡弹', price: 25, desc: '把敌人装进泡泡飘走' },
    { id: 'laser', icon: '⚡', name: '激光炮', price: 30, desc: '一道光，瞬间命中' },
    { id: 'firework', icon: '🎆', name: '烟花弹', price: 40, desc: '砰！炸开满天彩色烟花' },
    { id: 'fire', icon: '🔥', name: '火球', price: 50, desc: '把敌人烤得黑乎乎' },
    { id: 'rainbow', icon: '🌈', name: '彩虹炮', price: 60, desc: '满天都是星星' },
    { id: 'tornado', icon: '🌪️', name: '龙卷风', price: 75, desc: '把敌人转晕了吹走' },
    { id: 'bunny', icon: '🐰', name: '变身弹', price: 90, desc: '把敌人变成小兔子跑掉' },
    { id: 'thunder', icon: '🌩️', name: '雷电', price: 110, desc: '天上劈下一道大闪电' },
    { id: 'hole', icon: '🌀', name: '黑洞炮', price: 130, desc: '把敌人吸进漩涡里' },
    { id: 'meteor', icon: '☄️', name: '流星雨', price: 160, desc: '一串流星从天上砸下来' },
  ];

  const KINDS = { model: R.MODELS, skin: R.SKINS, weapon: R.WEAPONS };
  Object.entries(KINDS).forEach(([k, xs]) => xs.forEach(x => (x.kind = k)));
  R.KIND_NAME = { model: '车型', skin: '涂装', weapon: '武器' };

  // 必杀技不用买：攒满能量就会出现
  R.SUPER = { id: 'air', icon: '✈️', name: '空中支援', desc: '能量攒满 3 格，下一炮飞机来帮忙' };
  R.ENERGY = 3;

  // 每日任务全部完成奖励的星星
  R.MEDAL_PAY = 5;

  // 以前是「星星总数攒到多少自动解锁」。老存档第一次打开时：
  // 按老门槛解锁过的装备直接算买过了，星星总数全部变成可以花的星星
  const OLD = { blue: 4, pink: 9, camo: 15, star: 22, flame: 30, gold: 40, rainbow: 52, missile: 3, ice: 8, bubble: 14, laser: 20 };
  const OLD_WEAPON_RAINBOW = 28;
  const data = () => {
    const d = TM.Store.data;
    if (!d.owned) {
      const t = TM.Store.totalStars();
      d.owned = {
        model: [],
        skin: R.SKINS.filter(x => OLD[x.id] != null && OLD[x.id] <= t).map(x => x.id),
        weapon: R.WEAPONS.filter(x => (x.id === 'rainbow' ? OLD_WEAPON_RAINBOW : OLD[x.id]) <= t).map(x => x.id),
      };
      d.wallet = t;
      TM.Store.save();
    }
    d.benched = d.benched || [];
    return d;
  };

  R.wallet = () => data().wallet || 0;
  R.has = x => (x.streak ? (TM.Store.data.bestStreak || 0) >= x.streak : x.price === 0 || data().owned[x.kind].includes(x.id));
  R.canBuy = x => !x.streak && !R.has(x) && R.wallet() >= x.price;
  // 没拥有时的提示文字
  R.needText = x => (x.streak ? `连续 ${x.streak} 天完成每日任务就能拿到`
    : R.wallet() >= x.price ? `${x.price} 颗星星就能买` : `还差 ${x.price - R.wallet()} 颗星星`);

  // 加星星
  R.earn = n => {
    if (!(n > 0)) return;
    const d = data();
    d.wallet = (d.wallet || 0) + n;
    TM.Store.save();
  };

  // 买下并马上用上。星星不够、买过了都返回 false
  R.buy = x => {
    if (!R.canBuy(x)) return false;
    const d = data();
    d.wallet -= x.price;
    d.owned[x.kind].push(x.id);
    R.equip(x);
    return true;
  };

  // 换上车型或涂装；武器是带上出战
  R.equip = x => {
    const d = data();
    if (x.kind === 'model') d.model = x.id;
    else if (x.kind === 'skin') d.skin = x.id;
    else d.benched = d.benched.filter(id => id !== x.id);
    TM.Store.save();
  };

  // 武器带不带出战。至少要带一种，最后一种不能取下
  R.carrying = w => R.has(w) && !data().benched.includes(w.id);
  R.carried = () => R.WEAPONS.filter(R.carrying);
  R.toggle = w => {
    const d = data();
    if (R.carrying(w)) {
      if (R.carried().length <= 1) return false;
      d.benched.push(w.id);
    } else if (R.has(w)) d.benched = d.benched.filter(id => id !== w.id);
    TM.Store.save();
    return true;
  };

  R.pickWeapon = () => (U.pick(R.carried()) || R.WEAPONS[0]).id;
  R.weapon = id => R.WEAPONS.find(w => w.id === id) || R.SUPER;
  R.skin = () => R.SKINS.find(s => s.id === TM.Store.data.skin && R.has(s)) || R.SKINS[0];
  R.model = () => R.MODELS.find(m => m.id === data().model && R.has(m)) || R.MODELS[0];

  const shop = () => [...R.MODELS, ...R.SKINS, ...R.WEAPONS].filter(x => !x.streak && !R.has(x));
  // 星星从 before 涨到 after，新买得起了哪些
  R.affordable = (before, after) => shop().filter(x => x.price > before && x.price <= after);
  // 还没买的里面最便宜的一个
  R.next = () => shop().sort((a, b) => a.price - b.price)[0] || null;

  // 发奖励：rows = [[说明, 星星数]]，返回发奖前后的星星和新买得起的装备
  R.pay = rows => {
    rows = rows.filter(r => r[1] > 0);
    const before = R.wallet(), total = rows.reduce((s, r) => s + r[1], 0);
    R.earn(total);
    return { rows, total, before, after: R.wallet(), canBuy: R.affordable(before, R.wallet()) };
  };

  TM.Rewards = R;
})(window.TM);
