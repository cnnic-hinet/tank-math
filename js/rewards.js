// 奖励：答题攒星星，在改装工厂花星星买零件、车型、涂装和武器
(function (TM) {
  const { U } = TM;
  const R = {};

  // 车型：车身形状不同，颜色跟着涂装走。power 是给孩子看的 [火力, 装甲, 速度]，只是好玩，不影响答题
  R.MODELS = [
    { id: 'basic', name: '小坦克', price: 0, power: [2, 2, 2], desc: '一直陪着你的老伙计' },
    { id: 'scout', name: '侦察车', price: 20, power: [1, 2, 5], desc: '四个大轮子，跑得最快' },
    { id: 'cannon', name: '加农炮车', price: 25, power: [5, 2, 2], desc: '一根长长的炮管，能打很远' },
    { id: 'heli', name: '武装直升机', price: 35, cat: 'air', power: [4, 3, 4], desc: '旋翼呼呼转，能飞到天上去' },
    { id: 'twin', name: '双管坦克', price: 40, power: [4, 3, 2], desc: '两根炮管，一次打两发' },
    { id: 'apc', name: '装甲运兵车', price: 45, power: [2, 5, 2], desc: '方方正正，装甲特别厚' },
    { id: 'shark', name: '鲨鱼坦克', price: 60, power: [3, 4, 3], desc: '一口大白牙，敌人都怕它' },
    { id: 'prop', name: '螺旋桨飞机', price: 60, cat: 'air', power: [3, 2, 5], desc: '螺旋桨转得飞快' },
    { id: 'flamer', name: '喷火坦克', price: 70, power: [4, 3, 3], desc: '车头会喷火，敌人都不敢靠近' },
    { id: 'rocket', name: '火箭炮车', price: 80, power: [5, 2, 3], desc: '背着四枚大火箭' },
    { id: 'jet', name: '喷气战斗机', price: 90, cat: 'air', power: [4, 2, 5], desc: '开炮的时候嗖地往前冲' },
    { id: 'missile', name: '导弹发射车', price: 100, power: [5, 3, 3], desc: '背着两枚大导弹' },
    { id: 'heavy', name: '重型坦克', price: 110, power: [4, 5, 1], desc: '又大又重，装甲最厚' },
    { id: 'bomber', name: '轰炸机', price: 120, cat: 'air', power: [5, 4, 2], desc: '又大又胖，能装好多炸弹' },
    { id: 'dozer', name: '推土机', price: 140, power: [2, 5, 1], desc: '前面一把大铲子，什么都能推平' },
    { id: 'mech', name: '机甲战车', price: 140, power: [5, 4, 3], desc: '肩膀上还扛着两门炮' },
    { id: 'drone', name: '无人机', price: 150, cat: 'air', power: [3, 1, 5], desc: '四个小旋翼，悄悄地飞' },
    { id: 'hover', name: '悬浮坦克', price: 180, power: [5, 5, 5], desc: '飘在空中，什么路都能走' },
    { id: 'laser', name: '激光战车', price: 180, power: [5, 3, 4], desc: '炮塔顶着一颗亮亮的激光球' },
    { id: 'ufo', name: '飞碟', price: 200, cat: 'air', power: [5, 5, 5], desc: '从外星来的，飘着走' },
  ];

  // pal = [车身, 亮色, 暗色]；deco = 车身上的花纹；grad = 车身渐变色
  R.SKINS = [
    { id: 'green', name: '小绿', price: 0, pal: ['#4caf50', '#81d67f', '#2e7d32'] },
    { id: 'blue', name: '海军蓝', price: 5, pal: ['#3d8bfd', '#7db4ff', '#1f5fbf'] },
    { id: 'sand', name: '沙漠黄', price: 6, pal: ['#d9b25f', '#f0d79a', '#a5832f'], deco: 'desert' },
    { id: 'mint', name: '薄荷', price: 8, pal: ['#3cc9a7', '#a5f0dc', '#1f8a70'], deco: 'dots' },
    { id: 'pink', name: '草莓粉', price: 10, pal: ['#ff7eb6', '#ffb3d4', '#d9488a'] },
    { id: 'city', name: '城市灰', price: 10, pal: ['#8b95a3', '#b8c1cc', '#5b6470'], deco: 'city' },
    { id: 'camo', name: '迷彩', price: 15, pal: ['#7a8c4a', '#a5b56e', '#4f5c2c'], deco: 'camo' },
    { id: 'racing', name: '赛车条纹', price: 16, pal: ['#e03a3a', '#ff7a7a', '#8f1f1f'], deco: 'stripes' },
    { id: 'star', name: '星星队长', price: 25, pal: ['#4a5fc1', '#8094f0', '#2c3a8a'], deco: 'star' },
    { id: 'candy', name: '糖果', price: 25, pal: ['#ff8ac0', '#ffd6e8', '#d9528a'], deco: 'candy' },
    { id: 'panda', name: '熊猫', price: 30, pal: ['#f2f2f2', '#ffffff', '#2b2b2b'], deco: 'panda' },
    { id: 'flame', name: '火焰', price: 35, pal: ['#ff7a2f', '#ffb067', '#c94d10'], deco: 'flame' },
    { id: 'jelly', name: '果冻', price: 35, pal: ['#5ad1c8', '#c9fff8', '#2a9d94'], deco: 'jelly' },
    { id: 'snow', name: '冰雪', price: 45, pal: ['#a9dcff', '#ffffff', '#3f86c4'], deco: 'snow' },
    { id: 'zebra', name: '斑马', price: 45, pal: ['#f5f3ee', '#ffffff', '#3b3355'], deco: 'zebra' },
    { id: 'night', name: '夜空', price: 55, pal: ['#26305e', '#5a6bb8', '#121838'], deco: 'night' },
    { id: 'aurora', name: '极光', price: 60, pal: ['#1f6f6b', '#8ff0d6', '#0f4542'], grad: ['#0f4542', '#2fd6b0', '#7b6bff', '#0f4542'], deco: 'night' },
    { id: 'gold', name: '黄金', price: 70, pal: ['#e6b422', '#ffe27a', '#a87c00'], deco: 'shine' },
    { id: 'diamond', name: '钻石', price: 80, pal: ['#bfe9ff', '#ffffff', '#5fa8d3'], deco: 'diamond' },
    { id: 'bolt', name: '闪电', price: 85, pal: ['#33334a', '#ffe14d', '#17172a'], deco: 'bolt' },
    { id: 'lava', name: '熔岩', price: 100, pal: ['#4a1f1a', '#ff8a3d', '#22100c'], deco: 'lava' },
    { id: 'molten', name: '熔金', price: 100, pal: ['#7a4a12', '#ffd166', '#3d2408'], grad: ['#3d2408', '#ff9f1c', '#ffe08a', '#7a4a12'], deco: 'lava' },
    { id: 'rainbow', name: '彩虹', price: 120, pal: ['#9b6bff', '#fff3a8', '#5d35a0'], grad: ['#ff6b6b', '#ffb84d', '#6bd66b', '#4da3ff', '#b86bff'] },
    { id: 'galaxy', name: '银河', price: 150, pal: ['#3a2a8a', '#c9b8ff', '#1a1050'], grad: ['#1a1050', '#5b3fc4', '#c04dd8', '#2b6fd6'], deco: 'night' },
    // 连续几天完成每日任务才能拿到，不能买
    { id: 'medal', name: '勋章战车', streak: 3, pal: ['#d94848', '#ffd84d', '#9c2020'], deco: 'star' },
    { id: 'hero', name: '超级英雄', streak: 7, pal: ['#1e88e5', '#ff5252', '#0d47a1'], deco: 'shine' },
    { id: 'legend', name: '传奇战车', streak: 14, pal: ['#ffcc33', '#fff6d6', '#a67000'], deco: 'shine' },
  ];

  R.WEAPONS = [
    { id: 'shell', icon: '💥', name: '普通炮弹', price: 0, desc: '最可靠的老伙计' },
    { id: 'missile', icon: '🚀', name: '导弹', price: 8, desc: '拖着烟飞过去，爆炸更大' },
    { id: 'snowman', icon: '⛄', name: '雪人弹', price: 10, desc: '一个雪人飞过去，把敌人冻住' },
    { id: 'ice', icon: '❄️', name: '冰冻弹', price: 15, desc: '把敌人冻成冰块，再敲碎' },
    { id: 'egg', icon: '🥚', name: '彩蛋弹', price: 15, desc: '砰！炸出一堆彩蛋' },
    { id: 'melon', icon: '🍉', name: '西瓜炮', price: 20, desc: '啪！敌人糊了一脸西瓜汁' },
    { id: 'banana', icon: '🍌', name: '香蕉皮', price: 22, desc: '敌人一脚踩上去，滑倒了' },
    { id: 'bubble', icon: '🫧', name: '泡泡弹', price: 25, desc: '把敌人装进泡泡飘走' },
    { id: 'laser', icon: '⚡', name: '激光炮', price: 30, desc: '一道光，瞬间命中' },
    { id: 'balloon', icon: '🎈', name: '气球弹', price: 30, desc: '把敌人挂在气球上飞走' },
    { id: 'firework', icon: '🎆', name: '烟花弹', price: 40, desc: '砰！炸开满天彩色烟花' },
    { id: 'chicken', icon: '🐔', name: '小鸡弹', price: 40, desc: '变！敌人变成小鸡跑掉' },
    { id: 'fire', icon: '🔥', name: '火球', price: 50, desc: '把敌人烤得黑乎乎' },
    { id: 'magnet', icon: '🧲', name: '磁铁炮', price: 52, desc: '把敌人吸过来再炸一下' },
    { id: 'rainbow', icon: '🌈', name: '彩虹炮', price: 60, desc: '满天都是星星' },
    { id: 'ink', icon: '🐙', name: '墨汁弹', price: 65, desc: '喷一脸墨汁，什么都看不见' },
    { id: 'tornado', icon: '🌪️', name: '龙卷风', price: 75, desc: '把敌人转晕了吹走' },
    { id: 'dino', icon: '🦖', name: '恐龙弹', price: 80, desc: '大脚掌从天而降，一脚踩扁' },
    { id: 'bunny', icon: '🐰', name: '变身弹', price: 90, desc: '把敌人变成小兔子跑掉' },
    { id: 'ufo', icon: '🛸', name: '飞碟炮', price: 100, desc: '飞碟把敌人吸到天上去' },
    { id: 'thunder', icon: '🌩️', name: '雷电', price: 110, desc: '天上劈下一道大闪电' },
    { id: 'dragon', icon: '🐉', name: '火龙弹', price: 120, desc: '一条火龙飞过去，烧得干干净净' },
    { id: 'hole', icon: '🌀', name: '黑洞炮', price: 130, desc: '把敌人吸进漩涡里' },
    { id: 'meteor', icon: '☄️', name: '流星雨', price: 160, desc: '一串流星从天上砸下来' },
  ];

  // ---------- 改装工厂：坦克拆成 5 个部位，零件用彩色星星买 ----------
  // 彩色星星：每种只能在对应战区攒，买对应部位的零件；拼图星在数独训练营攒
  R.GEMS = {
    green: { name: '绿星', color: '#2fa84f', from: '新兵营、侦察营', buys: '底盘' },
    blue: { name: '蓝星', color: '#2f7fe8', from: '加减阵地、退位峡谷', buys: '车身' },
    orange: { name: '橙星', color: '#ff8a1c', from: '进位要塞、百数高地', buys: '炮塔和主炮' },
    purple: { name: '紫星', color: '#9b4fd6', from: '智慧营', buys: '挂件' },
    puzzle: { name: '拼图星', color: '#e0508f', from: '数独训练营', buys: '拼图零件' },
  };
  R.GEM_IDS = Object.keys(R.GEMS);
  R.ZONE_GEM = { z1: 'green', z4: 'green', z2: 'blue', z5: 'blue', z3: 'orange', z6: 'orange', z7: 'purple' };
  // [部位 id, 名字, 默认用哪种星星]
  R.SLOTS = [['chassis', '底盘', 'green'], ['body', '车身', 'blue'], ['turret', '炮塔', 'orange'], ['gun', '主炮', 'orange'], ['addon', '挂件', 'purple']];
  const SLOT_GEM = Object.fromEntries(R.SLOTS.map(([s, , g]) => [s, g]));
  // 每个部位第一个免费；pz 开头的是数独专属，用拼图星买
  const PART_ROWS = {
    chassis: [['track', '小履带', 0, '两条小履带，稳稳当当'], ['wide', '宽履带', 6, '又宽又厚，什么路都压得过'], ['wheel4', '四轮', 10, '四个大轮子，跑得飞快'],
      ['wheel6', '六轮', 16, '六个轮子，越野最稳'], ['hover', '悬浮垫', 28, '飘在空中走'], ['legs', '机械腿', 40, '四条机械腿，一步一步走'],
      ['pzTrack', '数字履带', 8, '履带上印着 1 到 6', 'puzzle']],
    body: [['round', '圆角车身', 0, '圆圆的，很可爱'], ['box', '方块装甲', 6, '方方正正，装甲很厚'], ['sharkhead', '鲨鱼头', 12, '一口大白牙，敌人都怕'],
      ['sleek', '流线型', 18, '尖尖的车头，跑起来带风'], ['fort', '堡垒', 28, '像一座小城堡'], ['beetle', '甲虫壳', 40, '亮亮的硬壳，还有小圆点'],
      ['pzArmor', '拼图装甲', 12, '四块拼图拼成的装甲', 'puzzle']],
    turret: [['tround', '圆炮塔', 0, '圆圆的炮塔'], ['tmini', '迷你炮塔', 4, '小小的，转得快'], ['tsquare', '方炮塔', 8, '方方的炮塔'],
      ['dome', '大圆顶', 15, '又大又圆的顶盖'], ['double', '双层炮塔', 26, '炮塔上面还有一层'], ['cube', '魔方炮塔', 18, '一个会转的魔方', 'puzzle']],
    gun: [['short', '短炮', 0, '短短的炮管'], ['long', '长炮', 6, '长长的炮管，打得远'], ['twin', '双管', 12, '两根炮管，一次打两发'],
      ['rockets', '火箭巢', 18, '背着四枚小火箭'], ['missiles', '导弹架', 24, '两枚大导弹'], ['laser', '激光炮', 32, '顶着一颗亮亮的激光球'],
      ['flame', '喷火口', 38, '车头会喷火'], ['pzGun', '九宫炮', 25, '炮口是一个九宫格', 'puzzle']],
    addon: [['none', '不挂', 0, '什么都不挂，清清爽爽'], ['antenna', '天线', 3, '会闪红灯的天线'], ['flag', '小旗', 5, '插一面小红旗'],
      ['radar', '雷达', 8, '雷达找敌人'], ['horn', '喇叭', 12, '嘟嘟嘟，开道啦'], ['shield', '盾牌', 16, '车头挡一面大盾牌'],
      ['wings', '小翅膀', 22, '一对白色小翅膀'], ['badge', '星徽', 30, '车身上一颗金色大星星'], ['pzCube', '小魔方', 5, '车尾挂一个小魔方', 'puzzle']],
  };
  R.PARTS = R.SLOTS.flatMap(([slot]) => PART_ROWS[slot].map(([id, name, price, desc, cur]) =>
    ({ id, name, price, desc, slot, cur: cur || SLOT_GEM[slot], kind: 'part' })));
  R.part = id => R.PARTS.find(p => p.id === id);
  R.slotParts = slot => R.PARTS.filter(p => p.slot === slot);
  // 老车型买过了，送对应的零件
  const GRANT = { cannon: 'long', twin: 'twin', shark: 'sharkhead', flamer: 'flame', rocket: 'rockets', missile: 'missiles', hover: 'hover', laser: 'laser' };

  const KINDS = { model: R.MODELS, skin: R.SKINS, weapon: R.WEAPONS };
  Object.entries(KINDS).forEach(([k, xs]) => xs.forEach(x => (x.kind = k)));
  R.KIND_NAME = { model: '车型', skin: '涂装', weapon: '武器', part: '零件' };

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
    d.parts = Array.isArray(d.parts) ? d.parts : [];
    d.build = d.build && typeof d.build === 'object' ? d.build : {};
    // 改装工厂第一次用：按每个战区已经拿到的关卡星补发彩色星星（每颗关卡星 1 颗），
    // 拼图星按数独星补发，买过的老车型送对应零件。gemGift 留给工厂弹一次说明
    if (!d.gems || typeof d.gems !== 'object') {
      const g = Object.fromEntries(R.GEM_IDS.map(k => [k, 0]));
      Object.entries(d.levels || {}).forEach(([k, l]) => {
        const cur = R.ZONE_GEM[k.split('-')[0]];
        if (cur) g[cur] += (l && l.stars) || 0;
      });
      g.puzzle = Object.values((d.sudoku && d.sudoku.done) || {}).reduce((s, x) => s + ((x && x.stars) || 0), 0);
      const before = d.parts.length;
      (d.owned.model || []).forEach(grant);
      d.gems = g;
      if (R.GEM_IDS.some(k => g[k]) || d.parts.length > before) d.gemGift = { gems: { ...g }, parts: d.parts.slice(before) };
      TM.Store.save();
    }
    R.GEM_IDS.forEach(k => (d.gems[k] = d.gems[k] || 0));
    return d;
  };
  const grant = modelId => {
    const id = GRANT[modelId], d = TM.Store.data;
    if (id && !d.parts.includes(id)) d.parts.push(id);
  };

  R.wallet = () => data().wallet || 0;
  // 某种星星还有几颗；cur 不写就是普通星星
  R.balance = cur => (cur ? data().gems[cur] || 0 : R.wallet());
  R.unit = cur => (cur ? R.GEMS[cur].name : '星星');
  R.has = x => (x.streak ? (TM.Store.data.bestStreak || 0) >= x.streak
    : x.price === 0 || (x.kind === 'part' ? data().parts : data().owned[x.kind]).includes(x.id));
  R.canBuy = x => !x.streak && !R.has(x) && R.balance(x.cur) >= x.price;
  // 没拥有时的提示文字
  R.needText = x => (x.streak ? `连续 ${x.streak} 天完成每日任务就能拿到`
    : R.balance(x.cur) >= x.price ? `${x.price} 颗${R.unit(x.cur)}就能买` : `还差 ${x.price - R.balance(x.cur)} 颗${R.unit(x.cur)}`);

  // 加星星
  R.earn = n => {
    if (!(n > 0)) return;
    const d = data();
    d.wallet = (d.wallet || 0) + n;
    TM.Store.save();
  };
  // 加彩色星星
  R.earnGem = (cur, n) => {
    if (!(n > 0) || !R.GEMS[cur]) return;
    const d = data();
    d.gems[cur] = (d.gems[cur] || 0) + n;
    TM.Store.save();
  };
  // 战区、题型对应哪种彩色星星
  R.zoneGem = zi => { const z = TM.Levels.ZONES[zi]; return (z && R.ZONE_GEM[z.id]) || null; };
  R.typeGem = type => R.zoneGem(TM.Repair.zoneIndex(type));

  // 买下并马上用上。星星不够、买过了都返回 false
  R.buy = x => {
    if (!R.canBuy(x)) return false;
    const d = data();
    if (x.cur) d.gems[x.cur] -= x.price;
    else d.wallet -= x.price;
    if (x.kind === 'part') d.parts.push(x.id);
    else d.owned[x.kind].push(x.id);
    if (x.kind === 'model') grant(x.id);
    R.equip(x);
    return true;
  };

  // 换上车型、涂装或零件（换零件就改用自己拼的坦克）；武器是带上出战
  R.equip = x => {
    const d = data();
    if (x.kind === 'model') d.model = x.id;
    else if (x.kind === 'skin') d.skin = x.id;
    else if (x.kind === 'part') { d.build[x.slot] = x.id; d.model = 'custom'; }
    else d.benched = d.benched.filter(id => id !== x.id);
    TM.Store.save();
  };

  // 自己拼的坦克：每个部位用买过的零件，没有就用免费的那个。over 用来先套上看看
  R.build = (over = {}) => {
    const d = data(), b = {};
    R.SLOTS.forEach(([s]) => {
      const p = R.part(over[s] || d.build[s]);
      b[s] = p && p.slot === s && (over[s] || R.has(p)) ? p.id : R.slotParts(s)[0].id;
    });
    return b;
  };
  R.custom = over => ({ id: 'custom', kind: 'model', name: '我的坦克', price: 0, build: R.build(over) });
  R.usingCustom = () => data().model === 'custom';
  // 双管：老车型「双管坦克」或者自己拼的坦克装了双管
  R.twin = () => { const m = R.model(); return m.id === 'twin' || (m.id === 'custom' && m.build.gun === 'twin'); };
  // {green: 2, blue: 1} → 「2 颗绿星、1 颗蓝星」；add 把一次答对的彩色星星记进去
  R.gemText = gems => R.GEM_IDS.filter(k => gems[k]).map(k => `${gems[k]} 颗${R.GEMS[k].name}`).join('、');
  R.gemAdd = (gems, cur, n = 1) => { if (cur) { R.earnGem(cur, n); gems[cur] = (gems[cur] || 0) + n; } };
  // 工厂第一次打开时弹的补发说明，看过就清掉
  R.takeGift = () => { const d = data(), g = d.gemGift; if (g) { delete d.gemGift; TM.Store.save(); } return g || null; };

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
  R.model = () => (data().model === 'custom' ? R.custom()
    : R.MODELS.find(m => m.id === data().model && R.has(m)) || R.MODELS[0]);

  const shop = () => [...R.MODELS, ...R.SKINS, ...R.WEAPONS, ...R.PARTS].filter(x => !x.streak && !R.has(x));
  const balances = () => Object.fromEntries([['', R.wallet()], ...R.GEM_IDS.map(k => [k, R.balance(k)])]);
  // 星星从 before 涨到 after（每种星星各算各的），新买得起了哪些
  R.affordable = (before, after) => shop().filter(x => x.price > before[x.cur || ''] && x.price <= after[x.cur || '']);
  // 普通星星还没买的里面最便宜的一个
  R.next = () => shop().filter(x => !x.cur).sort((a, b) => a.price - b.price)[0] || null;

  // 发奖励：rows = [[说明, 数量, 彩色星星种类(不写是普通星星)]]
  // 返回普通星星总数 total、彩色星星 gems {green: 3}、发奖前后的普通星星和新买得起的东西
  R.pay = rows => {
    rows = rows.filter(r => r[1] > 0 && (r.length < 3 || R.GEMS[r[2]]));
    const b = balances(), gems = {};
    let total = 0;
    rows.forEach(([, n, cur]) => {
      if (cur) { R.earnGem(cur, n); gems[cur] = (gems[cur] || 0) + n; } else total += n;
    });
    R.earn(total);
    return { rows, total, gems, before: b[''], after: R.wallet(), canBuy: R.affordable(b, balances()) };
  };

  TM.Rewards = R;
})(window.TM);
