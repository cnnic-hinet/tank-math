// 战区 4 侦察营：认识图形、认识钟表、分类（位置题在 q-pos.js）
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick, shuffle } = U;

  // 正确答案 + 几个干扰项，打乱顺序
  const opts = (ans, others, n = 4) => shuffle([ans].concat(shuffle([...new Set(others)].filter(x => x !== ans)).slice(0, n - 1)));

  // ---------- 认识图形 ----------
  const SHAPES = { 长方体: ['🧱', '📦', '🧃'], 正方体: ['🎲', '🧊'], 圆柱: ['🥫', '🔋', '🧻'], 球: ['⚽', '🏀', '🍊', '⚾'] };
  const NAMES = Object.keys(SHAPES);
  const shapeOf = e => NAMES.find(k => SHAPES[k].includes(e));
  const FACTS = [
    ['哪种图形从哪个方向都能滚来滚去？', '球', '球没有平平的面，怎么放都能滚。'],
    ['哪种图形躺下能滚，竖起来能站稳？', '圆柱', '圆柱上下是两个圆圆的平面，侧面是弯弯的。'],
    ['哪种图形的面都是一样大的正方形？', '正方体', '正方体像骰子，6 个面一样大。'],
    ['哪种图形像砖头，面有长有短？', '长方体', '长方体像砖头、牛奶盒，相对的面一样大。'],
    ['哪种图形最难一个一个堆起来？', '球', '球到处都是弯弯的，放上去就会滚下来。'],
  ];
  // 按 {图形: 个数} 摆一堆东西，返回 items 和每种的下标
  const pileOf = counts => shuffle(Object.entries(counts).flatMap(([k, n]) => Array.from({ length: n }, () => pick(SHAPES[k]))));
  const where = (items, test) => items.map((e, i) => (test(e) ? i : -1)).filter(i => i >= 0);
  const shapeHint = (text, ask) => ({ text, visual: { kind: 'shapes', hl: ask } });
  const SHAPE = [
    [
      () => {
        const ans = pick(NAMES), e = pick(SHAPES[ans]);
        return Q.pick({
          prompt: `${e} 是什么形状的？`, speak: '图上的东西是什么形状的？',
          scene: { kind: 'emoji', e, n: 1 }, choices: shuffle(NAMES), answer: ans,
          hint: shapeHint('看看它是平平的面多，还是弯弯的面多，和下面哪个最像？'),
          explain: [`${e} 和${ans}一样`, `答案是${ans}`],
        });
      },
      () => {
        const ask = pick(NAMES), n = rand(2, 4);
        const counts = Object.fromEntries(NAMES.map(k => [k, k === ask ? n : rand(1, 2)]));
        const items = pileOf(counts), hl = where(items, e => shapeOf(e) === ask);
        return Q.num({
          prompt: `下面有几个是${ask}？`, scene: { kind: 'pile', items },
          answer: n, max: 12, near: [n + 1, n - 1, items.length - n],
          hint: shapeHint(`${ask}长这样，一个一个找出来数一数。`, ask),
          explain: [`${ask}有：${hl.map(i => items[i]).join(' ')}`, `一共 ${n} 个`],
        });
      },
      () => {
        const [a, b] = shuffle(['长方体', '圆柱', '球']), odd = pick(SHAPES[b]), same = shuffle(SHAPES[a]).slice(0, 3);
        return Q.pick({
          prompt: '哪一个和其他三个形状不一样？', speak: '哪一个和其他三个形状不一样？',
          choices: shuffle([odd, ...same]), answer: odd,
          hint: shapeHint('先看看哪三个是同一种形状。'),
          explain: [`${same.join(' ')} 都是${a}`, `${odd} 是${b}`],
        });
      },
    ],
    [
      () => {
        const [prompt, ans, why] = pick(FACTS);
        return Q.pick({ prompt, choices: shuffle(NAMES), answer: ans, hint: shapeHint('想一想它们摸起来是平平的，还是弯弯的。'), explain: [why, `答案是${ans}`] });
      },
      () => {
        const counts = Object.fromEntries(NAMES.map(k => [k, rand(1, 3)]));
        const items = pileOf(counts), ans = counts.圆柱 + counts.球;
        return Q.num({
          prompt: '把它们放在斜坡上，能滚下去的有几个？', scene: { kind: 'pile', items },
          answer: ans, max: 12, near: [counts.球, items.length - ans, counts.圆柱],
          hint: shapeHint('有弯弯的面才能滚：球能滚，圆柱躺下也能滚。'),
          explain: ['球和圆柱都能滚', `球有 ${counts.球} 个，圆柱有 ${counts.圆柱} 个`, `${counts.球} + ${counts.圆柱} = ${ans}`],
        });
      },
      () => {
        const [a, b] = shuffle(NAMES), counts = Object.fromEntries(NAMES.map(k => [k, rand(1, 3)]));
        const items = pileOf(counts), ans = counts[a] + counts[b];
        return Q.num({
          prompt: `${a}和${b}一共有几个？`, scene: { kind: 'pile', items },
          answer: ans, max: 12, near: [counts[a], counts[b], items.length - ans],
          hint: shapeHint(`先数${a}，再数${b}，最后合起来。`),
          explain: [`${a}有 ${counts[a]} 个，${b}有 ${counts[b]} 个`, `${counts[a]} + ${counts[b]} = ${ans}`],
        });
      },
    ],
    [
      () => {
        const [a, b, c] = shuffle(NAMES), x = rand(3, 5), y = rand(1, x - 1);
        const counts = { [a]: x, [b]: y, [c]: rand(1, 2) }, items = pileOf(counts), ans = x - y;
        return Q.num({
          prompt: `${a}比${b}多几个？`, scene: { kind: 'pile', items },
          answer: ans, max: 10, near: [x + y, x, y],
          hint: shapeHint(`先数出${a}和${b}各有几个，再用多的减少的。`),
          explain: [`${a}有 ${x} 个，${b}有 ${y} 个`, `${x} − ${y} = ${ans}`, `${a}比${b}多 ${ans} 个`],
        });
      },
      () => {
        const ns = shuffle([1, 2, 3, 4]), counts = Object.fromEntries(NAMES.map((k, i) => [k, ns[i]]));
        const items = pileOf(counts), ans = NAMES[ns.indexOf(4)];
        return Q.pick({
          prompt: '哪种形状的东西最多？', scene: { kind: 'pile', items },
          choices: shuffle(NAMES), answer: ans,
          hint: shapeHint('四种形状分别数一数，再比一比。'),
          explain: [NAMES.map(k => `${k} ${counts[k]} 个`).join('，'), `${ans}最多`],
        });
      },
      () => {
        const counts = Object.fromEntries(NAMES.map(k => [k, rand(1, 3)]));
        const items = pileOf(counts), ans = counts.圆柱;
        return Q.num({
          prompt: '竖起来能站稳、躺下来又能滚的有几个？', scene: { kind: 'pile', items },
          answer: ans, max: 12, near: [counts.圆柱 + counts.球, counts.球, counts.长方体 + counts.正方体],
          hint: shapeHint('两个条件都要满足。球能滚，可是站不稳哦。'),
          explain: ['能站稳又能滚的只有圆柱', `圆柱有 ${ans} 个`],
        });
      },
    ],
  ];
  Q.register('shape', '认识图形', d => pick(SHAPE[d])(), '各种图形都认得');

  // ---------- 认识钟表 ----------
  const wrap12 = x => ((x - 1 + 120) % 12) + 1;
  const tname = (hh, half) => `${hh}时${half ? '半' : ''}`;
  const nick = () => TM.Store?.data?.nick || '可可';
  const clockHint = (text, hh, m) => ({ text, visual: { kind: 'clock', h: hh, m, labels: true } });
  const read = (hh, half) => {
    const ans = tname(hh, half);
    return Q.pick({
      prompt: '钟面上是几时？', scene: { kind: 'clock', h: hh, m: half ? 30 : 0 },
      choices: half ? opts(ans, [tname(wrap12(hh + 1), true), tname(hh), tname(wrap12(hh + 1)), tname(wrap12(hh - 1), true)])
        : opts(ans, [tname(wrap12(hh + 1)), tname(wrap12(hh - 1)), tname(hh, true), tname(hh === 12 ? 6 : 12)]),
      answer: ans,
      hint: half ? clockHint('分针指着 6 是半时。时针刚走过几，就是几时半。', hh, 30) : clockHint('长长的分针指着 12，就是整时。看短短的时针指着几。', hh, 0),
      explain: half
        ? ['长长的分针指着 6，是“半”', `短短的时针在 ${hh} 和 ${wrap12(hh + 1)} 中间，刚走过 ${hh}`, `所以是 ${ans}（不是 ${wrap12(hh + 1)} 时半哦）`]
        : ['分针指着 12，是整时', `时针指着 ${hh}，所以是 ${ans}`],
    });
  };
  const CLOCK = [
    [() => read(rand(1, 12), false), () => read(rand(1, 12), true), () => read(rand(1, 12), true)],
    [
      () => {
        const hh = rand(1, 11), k = rand(1, 3), ans = tname(wrap12(hh + k));
        return Q.pick({
          prompt: `现在是 ${hh} 时，再过 ${k} 小时是几时？`, scene: { kind: 'clock', h: hh, m: 0 },
          choices: opts(ans, [tname(wrap12(hh + k - 1)), tname(wrap12(hh + k + 1)), tname(wrap12(hh - k)), tname(wrap12(hh + k), true)]), answer: ans,
          hint: clockHint(`时针每走一大格就是 1 小时。从 ${hh} 往后数 ${k} 个数。`, hh, 0),
          explain: [`现在是 ${hh} 时`, `往后数 ${k} 个数：${Array.from({ length: k }, (_, i) => wrap12(hh + i + 1)).join('、')}`, `再过 ${k} 小时是 ${ans}`],
        });
      },
      () => {
        // 快到几时 / 刚过几时
        const hh = rand(1, 11), soon = Math.random() < 0.5, m = soon ? rand(50, 56) : rand(3, 9);
        const H = soon ? hh + 1 : hh, ans = soon ? `快到${H}时了` : `刚过${H}时`;
        const others = soon ? [`刚过${H}时`, `快到${hh}时了`, `刚过${hh}时`] : [`快到${H}时了`, `刚过${wrap12(H - 1)}时`, `快到${H + 1}时了`];
        return Q.pick({
          prompt: '钟面上的时间，下面哪一句说得对？', scene: { kind: 'clock', h: hh, m },
          choices: opts(ans, others), answer: ans,
          hint: clockHint(soon ? '分针还差一点点就走到 12 了。时针快走到几了？' : '分针刚刚走过 12 一点点。时针刚走过几？', hh, m),
          explain: soon ? ['分针快走到 12 了，还没到整时', `时针快到 ${H} 了`, `所以是“${ans}”`] : ['分针刚过 12 一点点', `时针刚走过 ${H}`, `所以是“${ans}”`],
        });
      },
      () => {
        const hh = rand(1, 11), ans = tname(hh + 1);
        return Q.pick({
          prompt: `现在是 ${hh} 时半，再过半小时是几时？`, scene: { kind: 'clock', h: hh, m: 30 },
          choices: opts(ans, [tname(hh), tname(hh + 1, true), tname(wrap12(hh + 2)), tname(hh, true)]), answer: ans,
          hint: clockHint('分针从 6 走到 12 是半小时，走回 12 就是整时了。', hh, 30),
          explain: [`${hh} 时半，分针指着 6`, '再过半小时，分针走到 12', `时针走到 ${hh + 1}，是 ${ans}`],
        });
      },
    ],
    [
      () => {
        // 说出指针的位置，不给图
        const hh = rand(1, 11), half = Math.random() < 0.6, ans = tname(hh, half);
        return Q.pick({
          prompt: half ? `分针指着 6，时针在 ${hh} 和 ${hh + 1} 的中间，是几时？` : `分针指着 12，时针指着 ${hh}，是几时？`,
          choices: opts(ans, half ? [tname(hh + 1, true), tname(hh), tname(6)] : [tname(12), tname(hh, true), tname(wrap12(hh - 1), true)]), answer: ans,
          hint: clockHint('在脑子里画一个钟面：分针指着 12 是整时，指着 6 是半时。', hh, half ? 30 : 0),
          explain: half ? ['分针指着 6，是半时', `时针刚走过 ${hh}`, `是 ${ans}`] : ['分针指着 12，是整时', `是 ${ans}`],
        });
      },
      () => {
        const hh = rand(1, 10), back = Math.random() < 0.4, ans = back ? tname(hh - 1 || 12, true) : tname(hh + 1, true);
        return Q.pick({
          prompt: back ? `现在是 ${hh} 时，半小时以前是几时？` : `现在是 ${hh} 时半，再过 1 小时是几时？`,
          scene: { kind: 'clock', h: hh, m: back ? 0 : 30 },
          choices: opts(ans, back ? [tname(hh, true), tname(hh - 1 || 12), tname(hh + 1)] : [tname(hh + 1), tname(hh + 2), tname(hh, true)]), answer: ans,
          hint: clockHint(back ? '半小时以前，分针要往回走到 6，时针也往回退一点。' : '过 1 小时，时针走一大格，分针转一整圈又回到 6。', hh, back ? 0 : 30),
          explain: back ? [`${hh} 时往回半小时`, `分针回到 6，时针在 ${hh - 1 || 12} 和 ${hh} 中间`, `是 ${ans}`]
            : [`${hh} 时半过 1 小时`, '分针转一圈还是指着 6', `时针走过 ${hh + 1}，是 ${ans}`],
        });
      },
      () => {
        const [act, k] = pick([['写作业', '半小时'], ['看动画片', '半小时'], ['踢球', '1小时'], ['去公园玩', '2小时']]);
        const hh = rand(7, 9), start = Math.random() < 0.5 ? tname(hh) : tname(hh, true);
        const half = start.endsWith('半'), endH = hh + (k === '半小时' ? (half ? 1 : 0) : parseInt(k));
        const endHalf = k === '半小时' ? !half : half, ans = tname(endH, endHalf);
        return Q.pick({
          prompt: `${nick()} ${start}开始${act}，用了${k}。结束时是几时？`,
          speak: `${nick()}${start}开始${act}，用了${k}。结束时是几时？`,
          choices: opts(ans, [tname(endH, !endHalf), tname(endH + 1, endHalf), start, tname(endH - 1, endHalf)]), answer: ans,
          hint: clockHint('先在钟面上找到开始的时间，再让指针往后走。', hh, half ? 30 : 0),
          explain: [`从 ${start} 开始`, `过了${k}`, `结束时是 ${ans}`],
        });
      },
    ],
  ];
  Q.register('clock', '认识钟表', d => pick(CLOCK[d])(), '认钟表又快又准');

  // ---------- 分类 ----------
  const KINDS = {
    水果: ['🍎', '🍌', '🍇', '🍉', '🍑', '🍐', '🍓'],
    动物: ['🐶', '🐱', '🐰', '🐼', '🐯', '🐵', '🐷'],
    交通工具: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢'],
    蔬菜: ['🥕', '🥦', '🌽', '🍆'],
    文具: ['✏️', '📏', '📒', '🖍️'],
  };
  const KN = Object.keys(KINDS);
  // 又有颜色又有种类的东西，用来按不同的标准分
  const COLORED = [
    ['🍎', '红', '水果'], ['🍓', '红', '水果'], ['🍒', '红', '水果'], ['🚒', '红', '车'], ['🌹', '红', '花'],
    ['🍌', '黄', '水果'], ['🍋', '黄', '水果'], ['🚕', '黄', '车'], ['🌻', '黄', '花'], ['🐤', '黄', '动物'],
    ['🍏', '绿', '水果'], ['🐸', '绿', '动物'], ['🥦', '绿', '蔬菜'], ['🥒', '绿', '蔬菜'],
  ];
  const pileHint = (text, items, hl) => ({ text, visual: { kind: 'pile', items, hl } });
  const mixed = (a, na, b, nb) => shuffle([...Array.from({ length: na }, () => pick(KINDS[a])), ...Array.from({ length: nb }, () => pick(KINDS[b]))]);
  const SORT = [
    [
      () => {
        const [a, b] = shuffle(KN), odd = pick(KINDS[b]), same = shuffle(KINDS[a]).slice(0, 3);
        return Q.pick({
          prompt: '哪一个和其他三个不是一类？', speak: '哪一个和其他三个不是一类？',
          choices: shuffle([odd, ...same]), answer: odd,
          hint: { text: '想一想：哪三个是同一类东西？剩下的那个就是。', visual: null },
          explain: [`${same.join(' ')} 都是${a}`, `${odd} 是${b}，和它们不是一类`],
        });
      },
      () => {
        const [a, b] = shuffle(KN), n = rand(3, 6), items = mixed(a, n, b, rand(3, 5));
        const hl = where(items, e => KINDS[a].includes(e));
        return Q.num({
          prompt: `下面有几个是${a}？`, scene: { kind: 'pile', items },
          answer: n, max: 12, near: [items.length - n, n + 1, n - 1],
          hint: pileHint(`把${a}一个一个圈出来，再数一数。`, items, hl),
          explain: [`${a}有：${hl.map(i => items[i]).join(' ')}`, `一共 ${n} 个`],
        });
      },
    ],
    [
      () => {
        const [a, b] = shuffle(KN), x = rand(4, 7), y = rand(2, x - 1), items = mixed(a, x, b, y), ans = x - y;
        return Q.num({
          prompt: `${a}比${b}多几个？`, scene: { kind: 'pile', items },
          answer: ans, max: 12, near: [x + y, x, y],
          hint: pileHint(`先分一分，数出${a}和${b}各有几个。`, items, where(items, e => KINDS[a].includes(e))),
          explain: [`${a} ${x} 个，${b} ${y} 个`, `${x} − ${y} = ${ans}`],
        });
      },
      () => {
        // 一筐东西里混进了一个别的
        const [a, b] = shuffle(KN), same = shuffle(KINDS[a]).slice(0, 4), odd = pick(KINDS[b]);
        const items = shuffle([...same, odd]);
        return Q.pick({
          prompt: `这一筐是${a}，哪一个放错了？`, speak: `这一筐是${a}，哪一个放错了？`,
          scene: { kind: 'pile', items }, choices: opts(odd, same), answer: odd,
          hint: pileHint(`一个一个看，哪一个不是${a}？`, items),
          explain: [`${odd} 是${b}，不是${a}`, '所以它放错了'],
        });
      },
      () => {
        const items = shuffle(COLORED).slice(0, rand(7, 9)), color = pick(['红', '黄']);
        const ok = it => it[1] === color && it[2] === '水果', ans = items.filter(ok).length;
        const es = items.map(x => x[0]);
        return Q.num({
          prompt: `又是${color}色的、又是水果的，有几个？`, scene: { kind: 'pile', items: es },
          answer: ans, max: 10, near: [items.filter(x => x[1] === color).length, items.filter(x => x[2] === '水果').length, ans + 1],
          hint: pileHint(`先找出水果，再看看哪些是${color}色的。`, es, where(items, ok)),
          explain: [`${color}色的水果有：${items.filter(ok).map(x => x[0]).join(' ') || '没有'}`, `一共 ${ans} 个`],
        });
      },
    ],
    [
      () => {
        // 同一堆东西，按颜色分和按种类分，分出来不一样
        const items = shuffle(COLORED).slice(0, rand(6, 8)), es = items.map(x => x[0]);
        const colors = [...new Set(items.map(x => x[1]))], kinds = [...new Set(items.map(x => x[2]))];
        const byColor = Math.random() < 0.5, ans = byColor ? colors.length : kinds.length;
        return Q.num({
          prompt: `按${byColor ? '颜色' : '种类'}来分，这些东西可以分成几类？`, scene: { kind: 'pile', items: es },
          answer: ans, min: 1, max: 9, near: [byColor ? kinds.length : colors.length, es.length],
          hint: pileHint(byColor ? '只看颜色：有哪几种颜色？' : '只看是什么东西：水果、车、花、动物、蔬菜，有哪几种？', es),
          explain: byColor ? [`颜色有：${colors.map(c => c + '色').join('、')}`, `分成 ${ans} 类`] : [`种类有：${kinds.join('、')}`, `分成 ${ans} 类`],
        });
      },
      () => {
        const color = pick(['红', '黄', '绿']), kind = pick([...new Set(COLORED.filter(x => x[1] === color).map(x => x[2]))]);
        let items;
        do { items = shuffle(COLORED).slice(0, 8); } while (!items.some(x => x[1] === color && x[2] !== kind));
        const ok = it => it[1] === color && it[2] !== kind, ans = items.filter(ok).length, es = items.map(x => x[0]);
        return Q.num({
          prompt: `是${color}色的、但不是${kind}的，有几个？`, scene: { kind: 'pile', items: es },
          answer: ans, max: 10, near: [items.filter(x => x[1] === color).length, items.filter(x => x[1] === color && x[2] === kind).length, ans + 1],
          hint: pileHint(`先找出${color}色的，再把里面的${kind}去掉。`, es, where(items, x => x[1] === color)),
          explain: [`${color}色的有：${items.filter(x => x[1] === color).map(x => x[0]).join(' ')}`, `去掉${kind}，剩下：${items.filter(ok).map(x => x[0]).join(' ')}`, `一共 ${ans} 个`],
        });
      },
      () => {
        // 两个标准一起用：只在水果里比颜色，红色的车和花不算
        const of = (c, fruit) => COLORED.filter(x => x[1] === c && (x[2] === '水果') === fruit);
        const rf = rand(2, 3), yf = rand(1, rf - 1);
        const items = shuffle([...shuffle(of('红', true)).slice(0, rf), ...shuffle(of('黄', true)).slice(0, yf),
          ...shuffle([...of('红', false), ...of('黄', false)]).slice(0, 3), ...shuffle(of('绿', true)).slice(0, 1)]);
        const es = items.map(x => x[0]), ans = rf - yf;
        const red = items.filter(x => x[1] === '红').length, yel = items.filter(x => x[1] === '黄').length;
        return Q.num({
          prompt: '在水果里面，红色的比黄色的多几个？', scene: { kind: 'pile', items: es },
          answer: ans, max: 10, near: [Math.abs(red - yel), rf + yf, rf],
          hint: pileHint('只看水果！红色的车和花不算。', es, where(items, x => x[2] === '水果')),
          explain: [`红色的水果 ${rf} 个，黄色的水果 ${yf} 个`, `${rf} − ${yf} = ${ans}`],
        });
      },
    ],
  ];
  Q.register('sort', '分类', d => pick(SORT[d])(), '分类分得又快又对');
})(window.TM);
