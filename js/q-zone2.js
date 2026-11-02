// 战区 2 加减阵地：10 以内加减法
// 每个题型分三档，每档有几种问法，出题时随机挑一种
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick, shuffle } = U;
  const nick = () => TM.Store?.data?.nick || '可可';
  const reg = (type, name, tiers, praise) => Q.register(type, name, d => pick(tiers[d])(), praise);
  const sign = (l, r) => (l > r ? '>' : l < r ? '<' : '=');
  // 不重复的选项，答案一定在里面
  const uniq = (ans, others, n = 4) => shuffle([...new Set([ans, ...others])].slice(0, n));

  // 生成和不超过 max 的加法，两个加数都不是 0
  const addPair = (max, minSum = 2) => {
    const s = rand(Math.max(2, minSum), max), a = rand(1, s - 1);
    return [a, s - a];
  };

  // ---------- 加法 ----------
  reg('add10', '10以内加法', [
    [
      () => {
        const [a, b] = addPair(10, 6);
        return Q.num({ prompt: `${a} + ${b} = □`, answer: a + b, max: 10, near: [a + b + 1, a + b - 1, Math.abs(a - b)], hint: Q.addHint(a, b), explain: Q.addExplain(a, b) });
      },
      () => {
        // 看图选算式
        const [e, name, u] = pick(Q.THINGS), [a, b] = addPair(10, 5), s = a + b;
        return Q.pick({
          prompt: `左边 ${a} ${u}，右边 ${b} ${u}。哪个算式能算出一共有几${u}？`, speak: `左边${a}${u}${name}，右边${b}${u}，哪个算式能算出一共有几${u}？`,
          scene: { kind: 'emoji2', e, a, b },
          choices: uniq(`${a} + ${b}`, [`${a} + ${a}`, `${s} − ${b}`, `${a} + ${b + 1}`, `${b} + ${b}`, `${a + 1} + ${b}`]), answer: `${a} + ${b}`,
          hint: Q.addHint(a, b), explain: ['求一共有几个，把两边合起来，用加法', `${a} + ${b} = ${s}`],
        });
      },
    ],
    [
      () => {
        const a = rand(2, 6), b = rand(1, 8 - a), k = rand(1, Math.min(3, 10 - a - b));
        return Q.num({
          prompt: `${a} + ${b} = ${a + b}，那么 ${a + k} + ${b} = □`, speak: `${a}加${b}等于${a + b}，那么${a + k}加${b}等于几？`,
          answer: a + b + k, max: 10, near: [a + b, a + b + k + 1, a + b - k],
          hint: { text: `${a + k} 比 ${a} 多 ${k}，和也会多 ${k}。`, visual: { kind: 'dots', groups: [a + k, b] } },
          explain: [`${a + k} 比 ${a} 多 ${k}`, `所以和也多 ${k}：${a + b} + ${k} = ${a + b + k}`],
        });
      },
      () => {
        // 一图四式：哪个算式不对
        const [a, b] = addPair(10, 5), s = a + b;
        if (a === b) return Q.make('add10', 1);
        const good = [`${a} + ${b} = ${s}`, `${b} + ${a} = ${s}`, `${s} − ${a} = ${b}`, `${s} − ${b} = ${a}`];
        const bad = pick([`${s} − ${a} = ${a}`, `${a} + ${s} = ${b}`, `${b} − ${a} = ${s}`].filter(x => !good.includes(x)));
        return Q.pick({
          prompt: `红点 ${a} 个、蓝点 ${b} 个。下面哪个算式和这幅图不对应？`, scene: { kind: 'dots', groups: [a, b] },
          choices: shuffle([bad, ...shuffle(good).slice(0, 3)]), answer: bad,
          hint: { text: `一幅图能写 2 个加法、2 个减法。减法要从一共的 ${s} 里减。`, visual: { kind: 'dots', groups: [a, b] } },
          explain: [`对的算式：${good.join('，')}`, `“${bad}”不对`],
        });
      },
      () => {
        const a = rand(1, 4), b = rand(1, 4), c = rand(1, 10 - a - b), ans = a + b + c;
        return Q.num({
          prompt: `${a} + ${b} + ${c} = □`, answer: ans, max: 10, near: [a + b, ans - 1, ans + 1],
          hint: { text: `先算 ${a} + ${b}，再加 ${c}。`, visual: { kind: 'dots', groups: [a + b, c] } },
          explain: [`${a} + ${b} = ${a + b}`, `${a + b} + ${c} = ${ans}`],
        });
      },
    ],
    [
      () => {
        // 两边相等：a + b = c + □
        const s = rand(6, 10), a = rand(1, s - 1), c = rand(1, s - 1);
        if (c === a) return Q.make('add10', 2);
        return Q.num({
          prompt: `${a} + ${s - a} = ${c} + □`, speak: `${a}加${s - a}，等于${c}加几？`,
          answer: s - c, max: 10, near: [s, s - a, Math.abs(s - c - 1)],
          hint: { text: `先算左边是几，右边也要一样多。`, visual: { kind: 'dots', groups: [c, s - c], ghost: 1 } },
          explain: [`左边：${a} + ${s - a} = ${s}`, `右边也要是 ${s}：${c} + ${s - c} = ${s}`, `□ 里填 ${s - c}`],
        });
      },
      () => {
        const k = rand(1, 3), small = rand(1, Math.floor((10 - k) / 2)), big = small + k, s = small + big;
        return Q.num({
          prompt: `□ + △ = ${s}，□ 比 △ 多 ${k}。□ 是几？`, speak: `方框加三角形等于${s}，方框比三角形多${k}，方框是几？`,
          answer: big, max: 10, near: [small, s - k, big + 1],
          hint: { text: `一个一个试：${s} 可以分成几和几？哪一组正好差 ${k}？`, visual: { kind: 'bond', whole: s, parts: ['?', '?'] } },
          explain: [`${big} + ${small} = ${s}`, `${big} 比 ${small} 多 ${k}`, `□ 是 ${big}`],
        });
      },
      () => {
        const [a, b] = addPair(9, 4), k = rand(1, Math.min(a - 1, 3) || 1);
        if (a - k < 1) return Q.make('add10', 2);
        return Q.num({
          prompt: `${a} + ${b} = ${a + b}，那么 ${a - k} + ${b + k} = □`, speak: `${a}加${b}等于${a + b}，那么${a - k}加${b + k}等于几？`,
          answer: a + b, max: 10, near: [a + b + k, a + b - k, a + b + 1],
          hint: { text: `一个加数少了 ${k}，另一个多了 ${k}，和会变吗？`, visual: { kind: 'dots', groups: [a - k, b + k] } },
          explain: [`${a - k} 比 ${a} 少 ${k}，${b + k} 比 ${b} 多 ${k}`, '一少一多，和不变', `还是 ${a + b}`],
        });
      },
    ],
  ], '加法算得又快又对');
  // ---------- 减法 ----------
  reg('sub10', '10以内减法', [
    [
      () => {
        const a = rand(6, 10), b = rand(1, a - 1);
        return Q.num({ prompt: `${a} − ${b} = □`, answer: a - b, max: 10, near: [a - b + 1, a + b <= 10 ? a + b : a - b - 1], hint: Q.subHint(a, b), explain: Q.subExplain(a, b) });
      },
      () => {
        const [e, name] = pick(Q.THINGS), a = rand(5, 10), b = rand(1, a - 2), c = a - b;
        return Q.pick({
          prompt: `一共 ${a} 个，划掉 ${b} 个。哪个算式能算出还剩几个？`, speak: `一共${a}个，划掉${b}个，哪个算式能算出还剩几个？`,
          scene: { kind: 'emoji', e, n: a, group: 5, cross: b },
          choices: uniq(`${a} − ${b}`, [`${a} − ${c}`, `${a} + ${b}`, `${b} + ${c}`, `${a} − ${b + 1}`].filter(x => x !== `${a} − ${b}`)), answer: `${a} − ${b}`,
          hint: Q.subHint(a, b), explain: ['从一共的里面去掉划掉的，用减法', `${a} − ${b} = ${c}`],
        });
      },
    ],
    [
      () => {
        const a = rand(6, 10), b = rand(2, a - 2), k = rand(1, Math.min(2, a - b));
        return Q.num({
          prompt: `${a} − ${b} = ${a - b}，那么 ${a} − ${b + k} = □`, speak: `${a}减${b}等于${a - b}，那么${a}减${b + k}等于几？`,
          answer: a - b - k, max: 10, near: [a - b, a - b + k, a - b + 1],
          hint: { text: `多减了 ${k}，剩下的就少 ${k}。`, visual: { kind: 'cross', n: a, cross: b + k } },
          explain: [`${b + k} 比 ${b} 多 ${k}，多减了 ${k}`, `所以结果少 ${k}：${a - b} − ${k} = ${a - b - k}`],
        });
      },
      () => {
        const a = rand(7, 10), b = rand(1, 4), c = rand(1, a - b - 1), ans = a - b - c;
        return Q.num({
          prompt: `${a} − ${b} − ${c} = □`, answer: ans, max: 10, near: [a - b, ans + 1, a - b + c],
          hint: { text: `先算 ${a} − ${b}，再减 ${c}。`, visual: { kind: 'cross', n: a, cross: b + c } },
          explain: [`${a} − ${b} = ${a - b}`, `${a - b} − ${c} = ${ans}`],
        });
      },
      () => {
        // 得数相同的算式
        const t = rand(2, 6), a = rand(t + 1, 10), ans = `${a} − ${a - t}`;
        const others = shuffle([1, 2, -1, -2]).map(k => a + k).filter(x => x <= 10 && x > t + 1).map(x => `${x} − ${a - t}`);
        return Q.pick({
          prompt: `哪个算式的得数是 ${t}？`, choices: uniq(ans, [...others, `${a} − ${t + 1}`, `${a - t} + ${t}`]), answer: ans,
          hint: { text: `每个算式都算一算。`, visual: { kind: 'cross', n: a, cross: a - t } },
          explain: [`${ans} = ${t}`],
        });
      },
    ],
    [
      () => {
        // 被减数、减数同时多 1：差不变
        const a = rand(5, 9), b = rand(1, a - 1), k = rand(1, 10 - a);
        return Q.num({
          prompt: `${a} − ${b} = ${a - b}，那么 ${a + k} − ${b + k} = □`, speak: `${a}减${b}等于${a - b}，那么${a + k}减${b + k}等于几？`,
          answer: a - b, max: 10, near: [a - b + k, a - b - k, a - b + 1],
          hint: { text: `前面多了 ${k}，减掉的也多了 ${k}，剩下的会变吗？`, visual: { kind: 'cross', n: a + k, cross: b + k } },
          explain: [`${a + k} 比 ${a} 多 ${k}，${b + k} 比 ${b} 也多 ${k}`, '多出来的又被减掉了', `还是 ${a - b}`],
        });
      },
      () => {
        const a = rand(7, 10), t = rand(2, a - 3), ans = a - t - 1;
        return Q.num({
          prompt: `${a} − □ > ${t}，□ 里最大能填几？`, speak: `${a}减几大于${t}，方框里最大能填几？`,
          answer: ans, max: 10, near: [a - t, ans - 1, t],
          hint: { text: `先想 ${a} − 几 = ${t}，要比 ${t} 大，就得少减一点。`, visual: { kind: 'cross', n: a, cross: ans } },
          explain: [`${a} − ${a - t} = ${t}，等于 ${t}，不行`, `${a} − ${ans} = ${t + 1}，比 ${t} 大`, `最大填 ${ans}`],
        });
      },
      () => {
        const s = rand(7, 10), a = rand(2, s - 3), c = rand(s - a + 1, 10), ans = c - (s - a);
        if (c === s) return Q.make('sub10', 2);
        return Q.num({
          prompt: `${s} − ${a} = ${c} − □`, speak: `${s}减${a}，等于${c}减几？`,
          answer: ans, max: 10, near: [s - a, a, ans + 1],
          hint: { text: `先算左边是几。右边 ${c} 减几才能一样？`, visual: { kind: 'cross', n: c, cross: ans } },
          explain: [`左边：${s} − ${a} = ${s - a}`, `${c} − ${ans} = ${s - a}`, `□ 里填 ${ans}`],
        });
      },
    ],
  ], '减法一点都难不倒你');
  // ---------- 填空 □ ----------
  const addMissing = (s, first) => {
    const a = rand(1, s - 1), b = s - a, known = first ? b : a, ans = first ? a : b;
    return Q.num({
      prompt: first ? `□ + ${b} = ${s}` : `${a} + □ = ${s}`,
      answer: ans, max: 10, near: [s, s + known <= 10 ? s + known : ans + 1, ans - 1],
      hint: { text: `${known} 再添上几个就是 ${s}？也可以算 ${s} − ${known}。`, visual: { kind: 'dots', groups: [known, ans], ghost: 1 } },
      explain: [`${s} − ${known} = ${ans}`, `□ 里填 ${ans}`],
    });
  };
  reg('missing', '填空□', [
    [() => addMissing(rand(6, 10), false), () => addMissing(rand(6, 10), true)],
    [
      () => {
        const a = rand(5, 10), b = rand(1, a - 1), c = a - b;
        return Q.num({
          prompt: `${a} − □ = ${c}`, answer: b, max: 10, near: [a + c <= 10 ? a + c : c + 1, c],
          hint: { text: `${a} 去掉几个剩 ${c}？想一想：${c} 加几等于 ${a}。`, visual: { kind: 'cross', n: a, cross: b, hide: true } },
          explain: [`${c} + ${b} = ${a}`, `所以 ${a} − ${b} = ${c}`, `□ 里填 ${b}`],
        });
      },
      () => {
        const c = rand(1, 6), b = rand(1, 10 - c), a = b + c;
        return Q.num({
          prompt: `□ − ${b} = ${c}`, answer: a, max: 10, near: [Math.abs(c - b), c, a + 1],
          hint: { text: `减掉 ${b} 还剩 ${c}，原来是几？把它们合起来。`, visual: { kind: 'dots', groups: [c, b] } },
          explain: [`原来的 = 剩下的 + 减掉的`, `${c} + ${b} = ${a}`, `□ 里填 ${a}`],
        });
      },
      () => {
        // ○ 里填 + 还是 −
        const plus = Math.random() < 0.5, a = rand(2, 8), b = plus ? rand(1, 10 - a) : rand(1, a - 1), c = plus ? a + b : a - b;
        return Q.pick({
          prompt: `${a} ○ ${b} = ${c}`, sub: '○ 里填 + 还是 − ？', speak: `${a}，圆圈，${b}，等于${c}，圆圈里填加号还是减号？`,
          choices: ['+', '−'], answer: plus ? '+' : '−',
          hint: { text: `得数 ${c} 比 ${a} ${plus ? '大' : '小'}，是变多了还是变少了？`, visual: null },
          explain: [`${a} ${plus ? '+' : '−'} ${b} = ${c}`, `${c} 比 ${a} ${plus ? '大，用加号' : '小，用减号'}`],
        });
      },
    ],
    [
      () => {
        // 两个 ○
        const ops = pick([['+', '+'], ['+', '−'], ['−', '+'], ['−', '−']]);
        let a, b, c, mid, r, tries = 0;
        do {
          a = rand(2, 9); b = rand(1, 5); c = rand(1, 5);
          mid = ops[0] === '+' ? a + b : a - b; r = ops[1] === '+' ? mid + c : mid - c;
        } while ((mid < 0 || mid > 10 || r < 0 || r > 10 || alt(a, b, c, r).length !== 1) && ++tries < 200);
        const ans = `${ops[0]} ${ops[1]}`;
        return Q.pick({
          prompt: `${a} ○ ${b} ○ ${c} = ${r}`, sub: '两个 ○ 里依次填什么？', speak: `${a}，圆圈，${b}，圆圈，${c}，等于${r}，两个圆圈里填什么？`,
          choices: ['+ +', '+ −', '− +', '− −'], answer: ans,
          hint: { text: '一个一个试，从左往右算，看哪个正好等于 ' + r + '。', visual: null },
          explain: [`${a} ${ops[0]} ${b} = ${mid}`, `${mid} ${ops[1]} ${c} = ${r}`, `依次填 ${ans}`],
        });
      },
      () => {
        const k = rand(1, 4), small = rand(0, Math.floor((10 - k) / 2)), big = small + k, s = small + big;
        if (s < 4) return Q.make('missing', 2);
        return Q.num({
          prompt: `□ + △ = ${s}，□ − △ = ${k}。□ 是几？`, speak: `方框加三角形等于${s}，方框减三角形等于${k}，方框是几？`,
          answer: big, max: 10, near: [small, s - k, k],
          hint: { text: `${s} 分成两个数，哪两个数相差 ${k}？`, visual: { kind: 'bond', whole: s, parts: ['?', '?'] } },
          explain: [`${big} + ${small} = ${s}`, `${big} − ${small} = ${k}`, `□ 是 ${big}`],
        });
      },
      () => {
        const a = rand(1, 5), b = rand(1, 5), s = a + b, k = rand(1, Math.min(4, 10 - s)), ans = b + k;
        return Q.num({
          prompt: `${a} + ${b} + ${k} = ${a} + □`, speak: `${a}加${b}加${k}，等于${a}加几？`,
          answer: ans, max: 10, near: [s + k, b, k],
          hint: { text: `两边都有 ${a}，剩下的部分也要一样多。`, visual: { kind: 'dots', groups: [a, b + k] } },
          explain: [`左边：${a} + ${b} + ${k} = ${s + k}`, `${a} + ${ans} = ${s + k}`, `□ 里填 ${ans}`],
        });
      },
    ],
  ], '填空题想得很明白');
  // 能让 a ○ b ○ c = r 成立的符号组合
  const alt = (a, b, c, r) => [['+', '+'], ['+', '−'], ['−', '+'], ['−', '−']].filter(([p, q]) => {
    const m = p === '+' ? a + b : a - b;
    return m >= 0 && (q === '+' ? m + c : m - c) === r;
  });
  // ---------- 连加连减 ----------
  // 出一个从左往右算、中间结果都在 0~10 的三个数算式
  const chain3 = (ops, lo = 1) => {
    for (;;) {
      const a = rand(lo, 10), b = rand(1, 6), c = rand(1, 6);
      const mid = ops[0] === '+' ? a + b : a - b, r = ops[1] === '+' ? mid + c : mid - c;
      if (mid >= 0 && mid <= 10 && r >= 0 && r <= 10) return { a, b, c, mid, r };
    }
  };
  const chainSteps = ({ a, b, c, mid, r }, ops) => [`先算 ${a} ${ops[0]} ${b} = ${mid}`, `再算 ${mid} ${ops[1]} ${c} = ${r}`];
  const MIX = [['+', '−'], ['−', '+']];
  reg('chain', '连加连减', [
    [
      () => {
        const ops = pick(MIX), x = chain3(ops, 3);
        return Q.num({
          prompt: `${x.a} ${ops[0]} ${x.b} ${ops[1]} ${x.c} = □`, answer: x.r, max: 10, near: [x.mid, x.r + 1, x.r - 1],
          hint: { text: `从左往右算，先算 ${x.a} ${ops[0]} ${x.b}。`, visual: null }, explain: chainSteps(x, ops),
        });
      },
      () => {
        const ops = pick([['+', '+'], ['−', '−']]), x = chain3(ops, 3);
        return Q.num({
          prompt: `${x.a} ${ops[0]} ${x.b} ${ops[1]} ${x.c} = □`, answer: x.r, max: 10, near: [x.mid, x.r + 1, x.r - 1],
          hint: { text: `从左往右算，先算 ${x.a} ${ops[0]} ${x.b}。`, visual: null }, explain: chainSteps(x, ops),
        });
      },
    ],
    [
      () => {
        const ops = pick(MIX), x = chain3(ops, 2), [e, name, unit] = pick(Q.THINGS);
        const v = o => (o === '+' ? '放进来' : '拿走');
        return Q.num({
          prompt: `筐里有 ${x.a} ${unit}${name}，${v(ops[0])} ${x.b} ${unit}，又${v(ops[1])} ${x.c} ${unit}，现在有几${unit}？`,
          scene: { kind: 'emoji', e, n: x.a, group: 5 }, answer: x.r, max: 10, near: [x.mid, x.a],
          hint: { text: `一步一步来：先算 ${x.a} ${ops[0]} ${x.b}，再${ops[1] === '+' ? '加' : '减'} ${x.c}。`, visual: { kind: 'emoji', e, n: x.a, group: 5 } },
          explain: [`列式：${x.a} ${ops[0]} ${x.b} ${ops[1]} ${x.c}`, ...chainSteps(x, ops)],
        });
      },
      () => {
        const ops = pick(MIX), x = chain3(ops, 3);
        return Q.num({
          prompt: `车上有 ${x.a} 人，到站后${ops[0] === '+' ? '上来' : '下去'} ${x.b} 人，又${ops[1] === '+' ? '上来' : '下去'} ${x.c} 人。车上现在有几人？`,
          answer: x.r, max: 10, near: [x.mid, x.a, x.r + 1],
          hint: { text: '上来是变多，用加法；下去是变少，用减法。', visual: null },
          explain: [`列式：${x.a} ${ops[0]} ${x.b} ${ops[1]} ${x.c}`, ...chainSteps(x, ops)],
        });
      },
      () => {
        // 中间挖空：a + □ − c = r
        const ops = pick(MIX), x = chain3(ops, 3);
        return Q.num({
          prompt: `${x.a} ${ops[0]} □ ${ops[1]} ${x.c} = ${x.r}`, speak: Q.say(`${x.a} ${ops[0]} □ ${ops[1]} ${x.c} = ${x.r}`) + '？',
          answer: x.b, max: 10, near: [x.mid, x.b + 1, x.c],
          hint: { text: `先想：□ 那一步算完是几？${x.mid} ${ops[1]} ${x.c} = ${x.r}。`, visual: null },
          explain: [`要先得到 ${x.mid}，因为 ${x.mid} ${ops[1]} ${x.c} = ${x.r}`, `${x.a} ${ops[0]} ${x.b} = ${x.mid}`, `□ 里填 ${x.b}`],
        });
      },
    ],
    [
      () => {
        // 倒着想：现在有几个，求原来
        const ops = pick(MIX), x = chain3(ops, 3), [name, unit] = pick([['苹果', '个'], ['草莓', '个'], ['饼干', '块'], ['糖', '颗']]);
        const v = o => (o === '+' ? '又买来' : '吃掉了');
        return Q.num({
          prompt: `${nick()}${v(ops[0]).replace('又', '先')} ${x.b} ${unit}${name}，${v(ops[1])} ${x.c} ${unit}，现在有 ${x.r} ${unit}。原来有几${unit}？`,
          answer: x.a, max: 16, near: [x.mid, x.r, ops[0] === '+' ? x.r + x.b - x.c : x.r - x.b + x.c],
          hint: { text: '倒着想：从现在的数往回推，买来的要减回去，吃掉的要加回来。', visual: null },
          explain: [`最后一步${v(ops[1])} ${x.c}，往回推：${x.r} ${ops[1] === '+' ? '−' : '+'} ${x.c} = ${x.mid}`, `第一步${v(ops[0]).replace('又', '')} ${x.b}，往回推：${x.mid} ${ops[0] === '+' ? '−' : '+'} ${x.b} = ${x.a}`, `原来有 ${x.a} ${unit}`],
        });
      },
      () => {
        const ops = pick(MIX), x = chain3(ops, 4);
        return Q.num({
          prompt: `${x.a} ${ops[0]} ${x.b} ${ops[1]} □ = ${x.r}`, speak: Q.say(`${x.a} ${ops[0]} ${x.b} ${ops[1]} □ = ${x.r}`) + '？',
          answer: x.c, max: 10, near: [x.mid, x.r, x.c + 1],
          hint: { text: `先算 ${x.a} ${ops[0]} ${x.b} = ${x.mid}，再想 ${x.mid} ${ops[1]} 几 = ${x.r}。`, visual: null },
          explain: [`${x.a} ${ops[0]} ${x.b} = ${x.mid}`, `${x.mid} ${ops[1]} ${x.c} = ${x.r}`, `□ 里填 ${x.c}`],
        });
      },
      () => {
        const a = rand(1, 4), b = rand(1, 3), c = rand(1, 3), d = rand(1, 10 - a - b - c), ans = a + b + c + d;
        if (ans > 10) return Q.make('chain', 2);
        return Q.num({
          prompt: `${a} + ${b} + ${c} + ${d} = □`, answer: ans, max: 10, near: [ans - 1, ans + 1, a + b + c],
          hint: { text: '可以先把能凑成整数的两个先加起来，再算剩下的。', visual: { kind: 'dots', groups: [a + b, c + d] } },
          explain: [`${a} + ${b} = ${a + b}`, `${c} + ${d} = ${c + d}`, `${a + b} + ${c + d} = ${ans}`],
        });
      },
    ],
  ], '连加连减一步一步算得很仔细');
  // ---------- 算式比大小 ----------
  const exp = () => {
    if (Math.random() < 0.5) { const [a, b] = addPair(10, 3); return [`${a} + ${b}`, a + b]; }
    const a = rand(3, 10), b = rand(1, a - 1); return [`${a} − ${b}`, a - b];
  };
  reg('cmpexp', '算式比大小', [
    [
      () => { const [l, lv] = exp(), [r, rv] = exp(); return Q.cmp(l, r, lv, rv); },
      () => { const [l, lv] = exp(), r = rand(Math.max(0, lv - 1), Math.min(10, lv + 1)); return Q.cmp(l, String(r), lv, r); },
    ],
    [
      () => {
        // 不用算：加的数大，和就大
        const a = rand(2, 6), b = rand(1, 9 - a), b2 = pick([1, 2, -1, -2].map(k => b + k).filter(x => x >= 1 && a + x <= 10));
        return Q.cmp(`${a} + ${b}`, `${a} + ${b2}`, a + b, a + b2, {
          sub: '不算出结果，能比出来吗？',
          hint: { text: `两边都有 ${a}，只要比 ${b} 和 ${b2}。`, visual: null },
          explain: [`两边都是 ${a} 加一个数`, `${b} ${sign(b, b2)} ${b2}`, `所以填“${sign(b, b2)}”`],
        });
      },
      () => {
        // 减的数大，剩下的反而小
        const a = rand(6, 10), b = rand(1, a - 2), b2 = pick([1, 2, -1].map(k => b + k).filter(x => x >= 1 && x <= a));
        return Q.cmp(`${a} − ${b}`, `${a} − ${b2}`, a - b, a - b2, {
          sub: '不算出结果，能比出来吗？',
          hint: { text: `两边都是从 ${a} 里减。减得多，剩下的就少。`, visual: { kind: 'cross', n: a, cross: Math.max(b, b2) } },
          explain: [`两边都从 ${a} 里减`, `${b > b2 ? '左边' : '右边'}减得多，剩下的少`, `所以填“${sign(a - b, a - b2)}”`],
        });
      },
      () => {
        const [a, b] = addPair(10, 4);
        if (a === b) return Q.make('cmpexp', 1);
        return Q.cmp(`${a} + ${b}`, `${b} + ${a}`, a + b, a + b, {
          hint: { text: '两个加数换了位置，和会变吗？', visual: { kind: 'dots', groups: [a, b] } },
          explain: [`${a} + ${b} = ${a + b}`, `${b} + ${a} = ${a + b}`, '交换加数的位置，和不变，填“=”'],
        });
      },
    ],
    [
      () => {
        const a = rand(2, 7), t = rand(a + 2, 10), ans = t - a - 1;
        return Q.num({
          prompt: `${a} + □ < ${t}，□ 里最大能填几？`, speak: `${a}加几小于${t}，方框里最大能填几？`,
          answer: ans, max: 10, near: [t - a, ans - 1, t],
          hint: { text: `先想 ${a} + 几 = ${t}，要比 ${t} 小，就得少加一点。`, visual: { kind: 'dots', groups: [a, ans] } },
          explain: [`${a} + ${t - a} = ${t}，等于 ${t}，不行`, `${a} + ${ans} = ${t - 1}，比 ${t} 小`, `最大填 ${ans}`],
        });
      },
      () => {
        // 三个算式里哪个最大 / 最小
        const big = Math.random() < 0.5, es = [];
        while (es.length < 3) { const e = exp(); if (!es.some(x => x[1] === e[1])) es.push(e); }
        const best = es.reduce((m, x) => (big ? x[1] > m[1] : x[1] < m[1]) ? x : m);
        return Q.pick({
          prompt: `哪个算式的得数最${big ? '大' : '小'}？`, choices: shuffle(es.map(x => x[0])), answer: best[0],
          hint: { text: '每个算式都算出来，再比一比。', visual: null },
          explain: [...es.map(x => `${x[0]} = ${x[1]}`), `${best[0]} 最${big ? '大' : '小'}`],
        });
      },
      () => {
        // 两边都要算：a + b ○ c − d
        let l, lv, r, rv;
        do { [l, lv] = exp(); const c = rand(6, 10), d = rand(1, c - 1); r = `${c} − ${d}`; rv = c - d; } while (Math.abs(lv - rv) > 1);
        return Q.cmp(l, r, lv, rv, { sub: '两边相差很少，要算仔细！' });
      },
    ],
  ], '算式比大小很有方法');
  // ---------- 解决问题 ----------
  reg('word10', '解决问题', [
    [
      () => {
        const [e, name, u] = pick(Q.THINGS), [a, b] = addPair(10, 5);
        return Q.num({
          prompt: `左边 ${a} ${u}${name}，右边 ${b} ${u}。一共有几${u}？`, scene: { kind: 'emoji2', e, a, b },
          answer: a + b, max: 10, near: [Math.abs(a - b), a + b + 1, a + b - 1], hint: Q.addHint(a, b), explain: Q.addExplain(a, b),
        });
      },
      () => {
        const [e, name, u] = pick(Q.THINGS), a = rand(5, 10), b = rand(1, a - 1);
        return Q.num({
          prompt: `有 ${a} ${u}${name}，拿走了 ${b} ${u}。还剩几${u}？`, scene: { kind: 'emoji', e, n: a, cross: b },
          answer: a - b, max: 10, near: [a + b, a - b + 1, b], hint: Q.subHint(a, b), explain: Q.subExplain(a, b),
        });
      },
      () => {
        const [e, name, u] = pick(Q.THINGS), s = rand(5, 10), a = rand(1, s - 1);
        return Q.num({
          prompt: `一共有 ${s} ${u}${name}，外面有 ${a} ${u}，盒子里藏着几${u}？`, scene: { kind: 'emoji', e, n: a, box: true },
          answer: s - a, max: 10, near: [s + a, a, s - a + 1],
          hint: { text: `一共 ${s} ${u}，去掉外面看得见的 ${a} ${u}。`, visual: { kind: 'cross', n: s, cross: a } },
          explain: [`一共 ${s} ${u}，外面 ${a} ${u}`, `${s} − ${a} = ${s - a}`, `盒子里藏着 ${s - a} ${u}`],
        });
      },
    ],
    [
      () => {
        // 原来有几个
        const [, name, u] = pick(Q.THINGS), [b, c] = addPair(10, 4), a = b + c;
        return Q.num({
          prompt: `${nick()}有一些${name}，送给弟弟 ${b} ${u}，还剩 ${c} ${u}。${nick()}原来有几${u}？`,
          answer: a, max: 10, near: [Math.abs(c - b), a + 1, a - 1],
          hint: { text: '送出去的和剩下的合起来，就是原来的。', visual: { kind: 'dots', groups: [b, c] } },
          explain: ['原来的 = 送出去的 + 剩下的', `${b} + ${c} = ${a}`, `原来有 ${a} ${u}`],
        });
      },
      () => {
        const [e, name, u] = pick(Q.THINGS), a = rand(5, 9), b = rand(1, a - 2), d = a - b;
        return Q.num({
          prompt: `红队有 ${a} ${u}${name}，蓝队有 ${b} ${u}。红队比蓝队多几${u}？`,
          answer: d, max: 10, near: [Math.min(10, a + b), d + 1, d - 1],
          hint: { text: '一个对一个排好，多出来的就是多的。', visual: { kind: 'rows', rows: [{ e, n: a }, { e, n: b }] } },
          explain: [`红队 ${a} ${u}，蓝队 ${b} ${u}`, `求多几，用减法：${a} − ${b} = ${d}`, `红队多 ${d} ${u}（不是 ${a} + ${b} 哦）`],
        });
      },
      () => {
        const [, name, u] = pick(Q.THINGS), a = rand(2, 6), k = rand(1, 10 - a), b = a + k;
        return Q.num({
          prompt: `第一排有 ${a} ${u}${name}，第二排比第一排多 ${k} ${u}。第二排有几${u}？`,
          answer: b, max: 10, near: [k, a, Math.abs(a - k)],
          hint: { text: `第二排多，要在 ${a} ${u}的基础上再加 ${k} ${u}。`, visual: { kind: 'dots', groups: [a, k] } },
          explain: [`第二排比第一排多 ${k} ${u}`, `${a} + ${k} = ${b}`, `第二排有 ${b} ${u}`],
        });
      },
    ],
    [
      () => {
        // 给几个才一样多
        const [, name, u] = pick(Q.THINGS), g = rand(1, 3), b = rand(1, 4), a = b + 2 * g;
        return Q.num({
          prompt: `哥哥有 ${a} ${u}${name}，${nick()}有 ${b} ${u}。哥哥给${nick()}几${u}，两人就一样多？`,
          answer: g, min: 0, max: 10, near: [a - b, g + 1, a - b - 1],
          hint: { text: `哥哥多 ${a - b} ${u}。多出来的分成两半，一半给${nick()}。`, visual: { kind: 'rows', rows: [{ e: '🔵', n: a }, { e: '🔴', n: b }] } },
          explain: [`哥哥比${nick()}多 ${a} − ${b} = ${a - b} ${u}`, `${a - b} 分成 ${g} 和 ${g}`, `给 ${g} ${u}，两人都是 ${b + g} ${u}`],
        });
      },
      () => {
        const [e, name, u] = pick(Q.THINGS), a = rand(1, 4), b = rand(1, 4), s = rand(a + b + 1, 10), c = s - a - b;
        return Q.num({
          prompt: `一共有 ${s} ${u}${name}，左边 ${a} ${u}，右边 ${b} ${u}，剩下的藏在盒子里。盒子里有几${u}？`,
          scene: { kind: 'emoji2', e, a, b },
          answer: c, max: 10, near: [s - a, s - b, c + 1],
          hint: { text: `先把看得见的合起来：${a} + ${b}，再从 ${s} 里减掉。`, visual: { kind: 'cross', n: s, cross: a + b } },
          explain: [`看得见的：${a} + ${b} = ${a + b}`, `${s} − ${a + b} = ${c}`, `盒子里有 ${c} ${u}`],
        });
      },
      () => {
        // 两步倒着想
        const [name, u] = pick([['苹果', '个'], ['草莓', '个'], ['饼干', '块'], ['糖', '颗']]), x = rand(4, 9), b = rand(1, x - 1), c = rand(1, 10 - (x - b)), r = x - b + c;
        if (c === b) return Q.make('word10', 2);
        return Q.num({
          prompt: `${nick()}有一些${name}，吃了 ${b} ${u}，妈妈又买来 ${c} ${u}，现在有 ${r} ${u}。原来有几${u}？`,
          answer: x, max: 12, near: [r, r + b + c > 12 ? r - 1 : r + b + c, Math.abs(r - b + c)],
          hint: { text: `倒着想：先把妈妈买来的 ${c} ${u}拿掉，再把吃掉的 ${b} ${u}加回去。`, visual: null },
          explain: [`现在 ${r} ${u}，拿掉买来的：${r} − ${c} = ${r - c}`, `加回吃掉的：${r - c} + ${b} = ${x}`, `原来有 ${x} ${u}`],
        });
      },
    ],
  ], '解决问题想得很清楚');
})(window.TM);
