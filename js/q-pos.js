// 位置：上下前后（pos）、左右（lr）
// 难度对照学校的《5·3天天练》位置单元：基础题是卷子上的简单题，提高题和卷子差不多，挑战题比卷子再难一点
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick, shuffle } = U;

  const ANIMALS = [['🐶', '小狗'], ['🐱', '小猫'], ['🐰', '小兔'], ['🐼', '熊猫'], ['🐯', '老虎'], ['🐵', '猴子'],
    ['🐷', '小猪'], ['🐸', '青蛙'], ['🐻', '小熊'], ['🦊', '狐狸'], ['🐔', '公鸡'], ['🐮', '小牛']];
  // 朗读时把图标换成名字
  const talk = s => Q.speech(String(s).replace(/ ?➡/g, '右边').replace(/ ?⬅/g, '左边'));
  const nameOf = e => talk(e);
  const team = n => shuffle(ANIMALS).slice(0, n).map(a => a[0]);
  // 正确答案 + 几个干扰项（前面的干扰项优先），打乱顺序
  const opts = (ans, first, rest = [], n = 4) => {
    const out = [ans];
    for (const x of [...first, ...shuffle(rest)]) if (x != null && !out.includes(x) && out.length < n) out.push(x);
    return shuffle(out);
  };
  const P = o => Q.pick(Object.assign({ speak: talk(o.prompt) }, o));
  const N = o => Q.num(Object.assign({ speak: talk(o.prompt), min: 0 }, o));
  const walkText = w => (w === 'right' ? '➡' : '⬅');

  // 队伍往 walk 方向走：返回从前往后的顺序（下标）
  const frontOrder = (n, walk) => Array.from({ length: n }, (_, i) => (walk === 'right' ? n - 1 - i : i));

  // ---------- 上下前后 ----------
  const posGens = {
    // 格子里按层数和个数找；基础题有标号
    grid(labels) {
      const R = 3, C = labels ? 3 : 4;
      const all = team(R * C), rows = Array.from({ length: R }, (_, r) => all.slice(r * C, r * C + C));
      const top = Math.random() < 0.5, left = labels ? Math.random() < 0.6 : Math.random() < 0.5;
      const r = rand(0, R - 1), c = rand(0, C - 1);
      const layer = top ? r + 1 : R - r, k = left ? c + 1 : C - c;
      const ans = rows[r][c];
      const vd = top ? '从上往下' : '从下往上', hd = left ? '从左往右' : '从右往左';
      const num = { top, left };
      return P({
        prompt: `${vd}数第 ${layer} 层，${hd}数第 ${k} 个是谁？`,
        scene: { kind: 'grid', rows, num: labels ? num : undefined },
        // 常见错误：数反了方向
        choices: opts(ans, [rows[r][C - 1 - c], rows[R - 1 - r][c], rows[R - 1 - r][C - 1 - c]], all), answer: ans,
        hint: { text: `先${vd}数到第 ${layer} 层，再在这一层里${hd}数。注意从哪边开始数！`, visual: { kind: 'grid', rows, num, hl: rows[r].map((_, j) => [r, j]) } },
        explain: [`${vd}数，第 ${layer} 层是：${rows[r].join(' ')}`, `${hd}数第 ${k} 个是 ${ans}`],
      });
    },
    // 队伍朝一个方向走：谁在前面、后面
    walk() {
      const n = rand(5, 6), items = team(n), walk = pick(['left', 'right']);
      const f = frontOrder(n, walk), j = rand(1, n - 2), me = items[f[j]];
      const ask = pick(['前面', '后面', '前面几', '后面几']);
      const scene = { kind: 'queue', items, walk };
      const hint = { text: `箭头指的方向是前面。${nameOf(me)}朝着箭头走，脸朝的那边就是前面。`, visual: { kind: 'queue', items, walk, hl: f[j] } };
      if (ask.length === 2) {
        const ans = items[f[ask === '前面' ? j - 1 : j + 1]], wrong = items[f[ask === '前面' ? j + 1 : j - 1]];
        return P({
          prompt: `队伍往 ${walkText(walk)} 走，${me} 的${ask}是谁？`, scene,
          choices: opts(ans, [wrong], items.filter(x => x !== me)), answer: ans, hint,
          explain: [`队伍往${walk === 'right' ? '右' : '左'}走，${walk === 'right' ? '右' : '左'}边是前面`, `${me} 的${ask}是 ${ans}`],
        });
      }
      const front = ask === '前面几', ans = front ? j : n - 1 - j;
      return N({
        prompt: `队伍往 ${walkText(walk)} 走，${me} 的${front ? '前' : '后'}面有几只？`, scene,
        answer: ans, max: 8, near: [n - 1 - ans, ans + 1], hint,
        explain: [`${walk === 'right' ? '右' : '左'}边是前面`, `${me} 的${front ? '前' : '后'}面有 ${ans} 只`],
      });
    },
    // 柜子一层一层：从上数还是从下数
    shelf() {
      const n = rand(4, 5), things = shuffle(['🧸', '📚', '⚽', '🚗', '🎨', '🧩', '🎈']).slice(0, n);
      const i = rand(0, n - 1), top = Math.random() < 0.5, ans = top ? i + 1 : n - i;
      const rows = things.map(e => [e]);
      return N({
        prompt: `柜子${top ? '从上往下' : '从下往上'}数，${things[i]} 在第几层？`,
        scene: { kind: 'grid', rows, side: false },
        answer: ans, min: 1, max: 6, near: [n + 1 - ans],
        hint: { text: `看清楚是从${top ? '上' : '下'}面开始数。`, visual: { kind: 'grid', rows, side: false, num: { top }, hl: [[i, 0]] } },
        explain: [`${top ? '从最上面' : '从最下面'}开始数`, `${things[i]} 在第 ${ans} 层`],
      });
    },
    // 两个条件：在 X 后面、Y 前面
    between(countOnly) {
      const n = 6, items = team(n), walk = pick(['left', 'right']), f = frontOrder(n, walk);
      const gap = !countOnly && Math.random() < 0.5 ? 2 : rand(3, 4), j = rand(0, n - 1 - gap);
      const x = items[f[j]], y = items[f[j + gap]];
      const mid = f.slice(j + 1, j + gap).map(i => items[i]);
      const scene = { kind: 'queue', items, walk };
      const hint = { text: `箭头那边是前面。先找到 ${nameOf(x)} 和 ${nameOf(y)}，夹在它们中间的就是。`, visual: { kind: 'queue', items, walk, hl: [f[j], f[j + gap]] } };
      const lead = `队伍往 ${walkText(walk)} 走，`;
      if (gap === 2) {
        const ans = mid[0];
        return P({
          prompt: `${lead}在 ${x} 后面、${y} 前面的是谁？`, scene,
          choices: opts(ans, [items[f[j - 1]], items[f[j + 3]]], items), answer: ans, hint,
          explain: [`${x} 的后面是 ${ans}`, `${ans} 的后面是 ${y}`, `所以夹在中间的是 ${ans}`],
        });
      }
      return N({
        prompt: `${lead}在 ${x} 后面、${y} 前面的有几只？`, scene,
        answer: gap - 1, max: 6, near: [gap, gap + 1], hint,
        explain: [`夹在中间的有：${mid.join(' ')}`, `一共 ${gap - 1} 只`],
      });
    },
    // 一摞东西：上面几个、下面几个，一共几个
    stack() {
      if (Math.random() < 0.5) {
        const a = rand(2, 5), b = rand(2, 5), ans = a + b + 1;
        const items = [...Array(a).fill('📦'), '🎁', ...Array(b).fill('📦')];
        return N({
          prompt: `一摞箱子，🎁 的上面有 ${a} 个，下面有 ${b} 个。这一摞一共有几个？`,
          speak: `一摞箱子，礼物盒的上面有${a}个，下面有${b}个。这一摞一共有几个？`,
          answer: ans, max: 15, near: [a + b, a + b + 2],
          hint: { text: '别忘了把 🎁 自己也算上！', visual: { kind: 'queue', items, ends: ['上', '下'], hl: a, cap: '把这一摞横过来看' } },
          explain: [`上面 ${a} 个，下面 ${b} 个`, '再加上 🎁 自己 1 个', `${a} + ${b} + 1 = ${ans}`],
        });
      }
      const a = rand(2, 6), b = rand(2, 6), ans = a + b - 1;
      const items = [...Array(a - 1).fill('📘'), '📕', ...Array(b - 1).fill('📘')];
      return N({
        prompt: `一摞书，📕 从上往下数是第 ${a} 本，从下往上数是第 ${b} 本。这一摞一共有几本？`,
        speak: `一摞书，红色的书从上往下数是第${a}本，从下往上数是第${b}本。这一摞一共有几本？`,
        answer: ans, max: 15, near: [a + b, a + b - 2],
        hint: { text: '📕 从上面数了一次，从下面又数了一次，被数了两次。', visual: { kind: 'queue', items, ends: ['上', '下'], hl: a - 1, cap: '把这一摞横过来看' } },
        explain: [`📕 上面有 ${a - 1} 本，下面有 ${b - 1} 本`, `${a - 1} + ${b - 1} + 1 = ${ans}`],
      });
    },
    // 公交车：下一站、上一站
    bus() {
      const names = shuffle(['学校', '公园', '医院', '超市', '书店', '车站', '少年宫', '动物园']).slice(0, 5);
      const dir = pick(['left', 'right']), s = dir === 'right' ? 1 : -1, at = rand(1, 3);
      let k = pick([1, -1, 2]);
      if (at + s * k < 0 || at + s * k > 4) k = 1;
      const ans = names[at + s * k], ask = k === 1 ? '下一站是' : k === -1 ? '上一站是' : '再过两站会到';
      return P({
        prompt: `公交车往 ${walkText(dir)} 开，现在停在“${names[at]}”。${ask}哪一站？`,
        scene: { kind: 'stops', names, at, dir },
        choices: opts(ans, [names[at - s * k], names[at]], names), answer: ans,
        hint: { text: '车往箭头那边开。还没到的站在前面，已经开过的站在后面。', visual: { kind: 'stops', names, at, dir } },
        explain: [`车往${dir === 'right' ? '右' : '左'}开，现在在“${names[at]}”`, `${ask}“${ans}”`],
      });
    },
    // 几句话排顺序：楼上楼下，或者赛跑谁在前面
    rank(n) {
      const who = team(n), up = Math.random() < 0.5;
      const [A, B] = up ? ['楼上', '楼下'] : ['前面', '后面'];
      const say = (e, o, w) => (up ? `${e} 家住在 ${o} 家${w}` : `${e} 跑在 ${o} ${w}`);
      const facts = shuffle(who.slice(0, -1).map((e, i) => (Math.random() < 0.5 ? say(e, who[i + 1], A) : say(who[i + 1], e, B))));
      const q = rand(0, n - 1), ans = who[q];
      const ask = up
        ? (q === 0 ? '家住在最上面' : q === n - 1 ? '家住在最下面' : n === 3 ? '家住在中间' : `家从上往下数是第 ${q + 1} 家`)
        : (q === 0 ? '跑第一名' : q === n - 1 ? '跑在最后' : `跑第 ${q + 1} 名`);
      return P({
        prompt: `${facts.join('，')}。谁${ask}？`,
        choices: shuffle(who), answer: ans,
        hint: { text: `一句一句看，先把两只排好，再把下一只放进去。`, visual: { kind: 'queue', items: who.map(() => '❔'), ends: up ? ['上', '下'] : ['前', '后'] } },
        explain: [`排好是：${who.join(' ')}（${up ? '从上到下' : '从前到后'}）`, `${ans} ${ask}`],
      });
    },
    // 前面几只、后面几只，反过来问
    behind() {
      const a = rand(2, 6), b = rand(2, 6), me = pick(ANIMALS)[0];
      if (Math.random() < 0.5) {
        const ans = b + 1;
        return N({
          prompt: `${me} 排队，前面有 ${a} 只，后面有 ${b} 只。从后往前数，${me} 排第几？`,
          answer: ans, min: 1, max: 14, near: [b, a + 1, a + b + 1],
          hint: { text: `从后往前数：先数后面的 ${b} 只，再数到 ${nameOf(me)} 自己。`, visual: { kind: 'queue', items: [...Array(a).fill('🐥'), me, ...Array(b).fill('🐥')], ends: ['前', '后'], hl: a } },
          explain: [`${me} 后面有 ${b} 只`, `从后往前数，数完 ${b} 只就到 ${me}`, `${b} + 1 = ${ans}，排第 ${ans}`],
        });
      }
      const ans = a + b;
      return N({
        prompt: `${me} 排队，从前往后数排第 ${a}，后面还有 ${b} 只。这一队一共有几只？`,
        answer: ans, min: 1, max: 14, near: [a + b + 1, a + b - 1],
        hint: { text: `排第 ${a}，说明到 ${nameOf(me)} 为止有 ${a} 只。`, visual: { kind: 'queue', items: [...Array(a - 1).fill('🐥'), me, ...Array(b).fill('🐥')], ends: ['前', '后'], hl: a - 1 } },
        explain: [`到 ${me} 为止有 ${a} 只`, `后面还有 ${b} 只`, `${a} + ${b} = ${ans}`],
      });
    },
  };
  Q.register('pos', '上下前后', d => {
    if (d === 0) return pick([() => posGens.grid(true), posGens.walk, posGens.shelf])();
    if (d === 1) return pick([() => posGens.between(), posGens.stack, posGens.bus, () => posGens.rank(3)])();
    return pick([() => posGens.rank(4), posGens.behind, () => posGens.grid(false), () => posGens.between(true)])();
  }, '上下前后分得清清楚楚');

  // ---------- 左右 ----------
  const other = s => (s === '左' ? '右' : '左');
  const lrGens = {
    // 一排里谁在谁的左边、右边（按你看到的）
    side() {
      const n = 5, items = team(n), j = rand(1, n - 2), me = items[j], s = pick(['左', '右']);
      const ans = items[s === '左' ? j - 1 : j + 1], wrong = items[s === '左' ? j + 1 : j - 1];
      return P({
        prompt: `${me} 的${s}边是谁？`,
        scene: { kind: 'queue', items, ends: ['左', '右'] },
        choices: opts(ans, [wrong], items.filter(x => x !== me)), answer: ans,
        hint: { text: `先找到${nameOf(me)}。拿笔的手是右手，${s}边是${s === '左' ? '不拿笔的那只手' : '拿笔的那只手'}那边。`, visual: { kind: 'queue', items, ends: ['左', '右'], hl: j } },
        explain: [`${me} 的${s}边挨着的是 ${ans}`],
      });
    },
    // 从左数、从右数
    nth() {
      const n = rand(5, 7), items = team(n), s = pick(['左', '右']), k = rand(2, n - 1);
      const i = s === '左' ? k - 1 : n - k, ans = items[i];
      return P({
        prompt: `从${s}往${other(s)}数，第 ${k} 个是谁？`,
        scene: { kind: 'queue', items, ends: ['左', '右'] },
        choices: opts(ans, [items[n - 1 - i], items[i + 1], items[i - 1]], items), answer: ans,
        hint: { text: `从${s}边开始，一个一个数到 ${k}。`, visual: { kind: 'queue', items, ends: ['左', '右'], num: s === '左' ? 'left' : 'right' } },
        explain: [`从${s}边开始数：${(s === '左' ? items : [...items].reverse()).slice(0, k).join(' ')}`, `第 ${k} 个是 ${ans}`],
      });
    },
    // 面对面或背对着你举手
    hand(back) {
      const [e, name] = pick(ANIMALS), hand = pick(['左', '右']), mine = back ? hand : other(hand);
      const v = { kind: 'face', e, hand, back, show: true };
      return P({
        prompt: back ? `${e} 背对着你，举起了${hand}手。你举哪只手，才和它举在同一边？` : `${e} 面对着你，举起了${hand}手。你举哪只手，才和它举在同一边？`,
        scene: v, choices: ['左手', '右手'], answer: mine + '手',
        hint: { text: back ? '它背对着你，和你朝着同一个方向，左右和你一样。' : '面对面站的时候，对面的左右和你正好相反。', visual: { ...v, mark: true } },
        explain: back
          ? [`${name}背对着你，和你朝一个方向`, `它的${hand}手就在你的${hand}边，你也举${hand}手`]
          : [`${name}面对着你，它的${hand}手在你的${mine}边`, `所以你要举${mine}手`],
      });
    },
    // 左边有几只、右边有几只
    count() {
      const n = rand(6, 8), items = team(n), j = rand(1, n - 2), me = items[j], s = pick(['左', '右']);
      const ans = s === '左' ? j : n - 1 - j;
      return N({
        prompt: `${me} 的${s}边有几只小动物？`,
        scene: { kind: 'queue', items, ends: ['左', '右'] },
        answer: ans, max: 8, near: [n - 1 - ans, ans + 1],
        hint: { text: `找到${nameOf(me)}，只数它${s}边的，不要把它自己算进去。`, visual: { kind: 'queue', items, ends: ['左', '右'], hl: j } },
        explain: [`${me} 的${s}边有：${(s === '左' ? items.slice(0, j) : items.slice(j + 1)).join(' ')}`, `一共 ${ans} 只`],
      });
    },
    // 两个条件：在 X 右边、Y 左边
    between() {
      const n = 6, items = team(n), j = rand(0, n - 3), x = items[j], y = items[j + 2], ans = items[j + 1];
      return P({
        prompt: `在 ${x} 右边、${y} 左边的是谁？`,
        scene: { kind: 'queue', items, ends: ['左', '右'] },
        choices: opts(ans, [items[j - 1], items[j + 3]], items), answer: ans,
        hint: { text: `先找到 ${nameOf(x)} 和 ${nameOf(y)}，夹在中间的就是。`, visual: { kind: 'queue', items, ends: ['左', '右'], hl: [j, j + 2] } },
        explain: [`${x} 的右边是 ${ans}`, `${ans} 的右边是 ${y}`, `所以是 ${ans}`],
      });
    },
    // 一排小动物面对着你（或背对着你），问它自己的左手边是谁
    own() {
      const n = 5, items = team(n), j = rand(1, n - 2), me = items[j], s = pick(['左', '右']);
      const back = Math.random() < 0.35, mine = back ? s : other(s);
      const ans = items[mine === '左' ? j - 1 : j + 1], wrong = items[mine === '左' ? j + 1 : j - 1];
      const cap = back ? '它们都背对着你' : '它们都面对着你';
      return P({
        prompt: `${cap}站成一排。${me} 自己的${s}手边是谁？`,
        scene: { kind: 'queue', items, ends: ['左', '右'], cap: `↑ 你看到的左右，${cap}` },
        choices: opts(ans, [wrong], items.filter(x => x !== me)), answer: ans,
        hint: { text: back ? '背对着你，它的左右和你一样。' : `面对着你，它的左右和你相反：它的${s}手边在你看来是${mine}边。`, visual: { kind: 'queue', items, ends: ['左', '右'], hl: j } },
        explain: [back ? `${cap}，左右和你一样` : `${cap}，左右和你相反`, `${me} 的${s}手边，在图上是它的${mine}边`, `是 ${ans}`],
      });
    },
    // 靠右走
    road() {
      const [e, name] = pick(ANIMALS), dir = pick(['away', 'toward']);
      const right = dir === 'away' ? 2 : 1;
      const v = { kind: 'road', e, dir };
      if (Math.random() < 0.5) {
        return P({
          prompt: `走路要靠右走。${e} 应该走哪条道？`, scene: v,
          choices: ['①号道', '②号道'], answer: right === 1 ? '①号道' : '②号道',
          hint: { text: dir === 'away' ? '它背对着你往前走，它的右边就是你的右边。' : '它朝你走过来，它的右边是你的左边。', visual: { ...v, hl: right } },
          explain: [dir === 'away' ? `${name}背对着你，左右和你一样` : `${name}面对着你，左右和你相反`, `它的右边是${right === 1 ? '①' : '②'}号道`],
        });
      }
      const lane = rand(1, 2), ok = lane === right;
      return P({
        prompt: `${e} 走在${lane === 1 ? '①' : '②'}号道上。它是靠右走吗？`, scene: { ...v, lane },
        choices: ['是', '不是'], answer: ok ? '是' : '不是',
        hint: { text: dir === 'away' ? '它背对着你，它的右边就是你的右边。' : '它朝你走过来，它的右边是你的左边。', visual: { ...v, lane, hl: right } },
        explain: [`${name}的右边是${right === 1 ? '①' : '②'}号道`, ok ? '它走在右边，是靠右走' : '它走在左边，不是靠右走'],
      });
    },
    // 从右数第 k 个，左边、右边各有几个，一共几个
    total() {
      const s = pick(['左', '右']), k = rand(3, 7), b = rand(2, 5), ans = k + b;
      const items = s === '右' ? [...Array(b).fill('⚪'), '⭐', ...Array(k - 1).fill('🔺')] : [...Array(k - 1).fill('🔺'), '⭐', ...Array(b).fill('⚪')];
      return N({
        prompt: `一排图形，⭐ 从${s}往${other(s)}数排第 ${k}，⭐ 的${other(s)}边还有 ${b} 个。这一排一共有几个？`,
        speak: `一排图形，星星从${s}往${other(s)}数排第${k}，星星的${other(s)}边还有${b}个。这一排一共有几个？`,
        answer: ans, max: 15, near: [ans + 1, ans - 1],
        hint: { text: `排第 ${k}，说明从${s}边数到 ⭐ 一共有 ${k} 个（⭐ 也算）。`, visual: { kind: 'queue', items, ends: ['左', '右'], hl: s === '右' ? b : k - 1 } },
        explain: [`从${s}边数到 ⭐ 有 ${k} 个`, `${other(s)}边还有 ${b} 个`, `${k} + ${b} = ${ans}`],
      });
    },
  };
  Q.register('lr', '左右', d => {
    if (d === 0) return pick([lrGens.side, lrGens.nth, () => lrGens.hand(false)])();
    if (d === 1) return pick([lrGens.count, lrGens.between, lrGens.own, () => lrGens.hand(Math.random() < 0.5)])();
    return pick([lrGens.own, lrGens.road, lrGens.total, () => lrGens.hand(true)])();
  }, '左右分得清清楚楚');
})(window.TM);
