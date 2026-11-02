// 战区 1 新兵营：20 以内数的认识
// 每个题型分三档，每档有几种问法，出题时随机挑一种
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick, shuffle } = U;

  const ANIMALS = [
    ['🐶', '小狗'], ['🐱', '小猫'], ['🐰', '小兔'], ['🐼', '熊猫'], ['🐵', '小猴'],
    ['🦊', '狐狸'], ['🐸', '青蛙'], ['🐯', '老虎'], ['🐷', '小猪'], ['🐨', '考拉'],
  ];
  const nick = () => TM.Store?.data?.nick || '可可';
  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const by5 = n => {
    const fives = range(1, Math.floor(n / 5)).map(k => k * 5), rest = range((fives[fives.length - 1] || 0) + 1, n);
    return [fives.length ? `5 个 5 个地数：${fives.join('、')}` : null, rest.length ? `再接着数：${rest.join('、')}` : null].filter(Boolean);
  };
  const reg = (type, name, tiers, praise) => Q.register(type, name, d => pick(tiers[d])(), praise);

  // ---------- 数一数 ----------
  reg('count', '数一数', [
    [
      () => {
        const n = rand(11, 20), [e, name, unit] = pick(Q.THINGS);
        return Q.num({
          prompt: `一共有几${unit}${name}？`, speak: `数一数，一共有几${unit}${name}？`,
          scene: { kind: 'emoji', e, n, group: 5 }, answer: n, min: 1, max: 20,
          hint: { text: '一排有 5 个，5 个 5 个地数更快。', visual: { kind: 'emoji', e, n, group: 5, mark5: true } },
          explain: [...by5(n), `一共 ${n} ${unit}`],
        });
      },
      () => {
        const n = rand(11, 18), [e, name, unit] = pick(Q.THINGS);
        return Q.num({
          prompt: `一共有几${unit}${name}？`, speak: `这次一排是4${unit}，数一数，一共有几${unit}${name}？`,
          scene: { kind: 'emoji', e, n, group: 4 }, answer: n, min: 1, max: 20, near: [n - 1, n + 1, n - 4],
          hint: { text: '这次一排是 4 个，不是 5 个哦。换成 5 个一排再数一数。', visual: { kind: 'emoji', e, n, group: 5, mark5: true } },
          explain: ['一排是 4 个，可以 4 个 4 个地数', ...by5(n), `一共 ${n} ${unit}`],
        });
      },
    ],
    [
      () => {
        const [A, B] = shuffle(Q.THINGS).slice(0, 2), a = rand(8, 14), b = a - rand(2, 5);
        return Q.num({
          prompt: `${A[1]}比${B[1]}多几${A[2]}？`, scene: { kind: 'rows', rows: [{ e: A[0], n: a }, { e: B[0], n: b }] },
          answer: a - b, min: 0, max: 20, near: [a + b > 20 ? a : a + b, a, b],
          hint: { text: '上下一个对一个，多出来的就是多的。', visual: { kind: 'rows', rows: [{ e: A[0], n: a }, { e: B[0], n: b }] } },
          explain: [`${A[1]} ${a} ${A[2]}，${B[1]} ${b} ${B[2]}`, `一个对一个，多出 ${a - b} ${A[2]}`, `${a} − ${b} = ${a - b}`],
        });
      },
      () => {
        const n = rand(11, 16), k = rand(2, 4), [e, name, unit] = pick(Q.THINGS);
        return Q.num({
          prompt: `数一数有几${unit}${name}，再添上 ${k} ${unit}，一共是几${unit}？`,
          scene: { kind: 'emoji', e, n, group: 5 }, answer: n + k, min: 1, max: 20, near: [n, n + k - 1],
          hint: { text: `先数出有几${unit}，再往后数 ${k} 个。`, visual: { kind: 'emoji', e, n, group: 5, mark5: true } },
          explain: [`图上有 ${n} ${unit}`, `往后数 ${k} 个：${range(n + 1, n + k).join('、')}`, `一共 ${n + k} ${unit}`],
        });
      },
    ],
    [
      () => {
        const n = rand(12, 18), [e, name, unit] = pick(Q.THINGS);
        return Q.num({
          prompt: `数一数有几${unit}${name}。还差几${unit}就是 20 ${unit}？`,
          scene: { kind: 'emoji', e, n, group: 5 }, answer: 20 - n, min: 0, max: 20, near: [n, 20 - n + 1, 20 - n - 1],
          hint: { text: `先数出有几${unit}，再从这个数往后数到 20。`, visual: { kind: 'emoji', e, n, group: 5, mark5: true } },
          explain: [`图上有 ${n} ${unit}`, `从 ${n} 往后数到 20：${range(n + 1, 20).join('、')}`, `还差 ${20 - n} ${unit}`],
        });
      },
      () => {
        const [A, B] = shuffle(Q.THINGS).slice(0, 2), a = rand(6, 10), b = rand(5, 9), ans = a + b;
        return Q.num({
          prompt: `${A[1]}和${B[1]}一共有几个？`, scene: { kind: 'rows', rows: [{ e: A[0], n: a }, { e: B[0], n: b }] },
          answer: ans, min: 1, max: 20, near: [ans - 1, ans + 1, Math.max(a, b)],
          hint: { text: `数完${A[1]}，不要停，接着数${B[1]}。`, visual: { kind: 'rows', rows: [{ e: A[0], n: a }, { e: B[0], n: b }] } },
          explain: [`${A[1]} ${a} 个`, `接着数${B[1]}：${range(a + 1, ans).join('、')}`, `一共 ${ans} 个`],
        });
      },
      () => {
        const n = rand(13, 19), k = rand(3, 6), [e, name, unit] = pick(Q.THINGS);
        return Q.num({
          prompt: `数一数有几${unit}${name}，拿走 ${k} ${unit}以后，还剩几${unit}？`,
          scene: { kind: 'emoji', e, n, group: 5 }, answer: n - k, min: 0, max: 20, near: [n, n - k + 1, k],
          hint: { text: `先数出一共几${unit}，再往回数 ${k} 个。`, visual: { kind: 'emoji', e, n, group: 5, mark5: true, cross: k } },
          explain: [`图上有 ${n} ${unit}`, `往回数 ${k} 个：${range(n - k, n - 1).reverse().join('、')}`, `还剩 ${n - k} ${unit}`],
        });
      },
    ],
  ], '数数又快又准');
  // ---------- 比大小 ----------
  const lineHint = (text, marks, from = 0) => ({ text, visual: { kind: 'line', from, to: 20, marks } });
  reg('cmpnum', '比大小', [
    [
      () => {
        const a = rand(10, 20), b = Math.random() < 0.15 ? a : Math.min(20, Math.max(1, a + pick([rand(-4, 4), rand(-9, 9)])));
        return Q.cmp(String(a), String(b), a, b);
      },
      () => {
        const bigger = Math.random() < 0.5, k = rand(1, 3), a = bigger ? rand(9, 20 - k) : rand(10 + k, 20), ans = bigger ? a + k : a - k;
        return Q.num({
          prompt: `比 ${a} ${bigger ? '大' : '小'} ${k} 的数是几？`, answer: ans, near: [bigger ? a - k : a + k, a],
          hint: lineHint(`从 ${a} 开始，往${bigger ? '后' : '前'}数 ${k} 个。`, [a]),
          explain: [`比 ${a} ${bigger ? '大' : '小'} ${k}，就是从 ${a} 往${bigger ? '后' : '前'}数 ${k} 个`, `是 ${ans}`],
        });
      },
    ],
    [
      () => {
        const ns = shuffle(range(8, 20)).slice(0, 4), big = Math.random() < 0.5, ans = big ? Math.max(...ns) : Math.min(...ns);
        return Q.pick({
          prompt: `${ns.join('、')} 里面，最${big ? '大' : '小'}的是几？`, choices: [...ns].sort((x, y) => x - y), answer: ans,
          hint: lineHint('先看是不是十几，十几比几大；都是十几就比个位。', ns),
          explain: [`从小到大排：${[...ns].sort((x, y) => x - y).join(' < ')}`, `最${big ? '大' : '小'}的是 ${ans}`],
        });
      },
      () => {
        const a = rand(10, 15), b = a + rand(3, 4), ok = range(a + 1, b - 1), ans = pick(ok);
        const bad = shuffle([a, b, a - 1, b + 1].filter(x => x >= 0 && x <= 20)).slice(0, 3);
        return Q.pick({
          prompt: `□ 比 ${a} 大，又比 ${b} 小。□ 里可以填几？`, speak: `方框里的数比${a}大，又比${b}小。方框里可以填几？`, choices: [ans, ...bad].sort((x, y) => x - y), answer: ans,
          hint: lineHint(`在 ${a} 和 ${b} 中间找，${a} 和 ${b} 自己不行。`, [a, b]),
          explain: [`比 ${a} 大又比 ${b} 小的数有：${ok.join('、')}`, `选项里只有 ${ans} 可以`],
        });
      },
      () => {
        const bigger = Math.random() < 0.5, k = rand(3, 6), a = bigger ? rand(8, 20 - k) : rand(10 + k, 20), ans = bigger ? a + k : a - k;
        return Q.num({
          prompt: `比 ${a} ${bigger ? '大' : '小'} ${k} 的数是几？`, answer: ans, near: [bigger ? a - k : a + k, bigger ? ans + 1 : ans - 1],
          hint: lineHint(`从 ${a} 开始，往${bigger ? '后' : '前'}数 ${k} 个。`, [a]),
          explain: [`从 ${a} 往${bigger ? '后' : '前'}数 ${k} 个`, `${a} ${bigger ? '+' : '−'} ${k} = ${ans}`],
        });
      },
    ],
    [
      () => {
        // 离得近的是答案，离得远的做干扰
        const t = rand(11, 17), offs = shuffle([1, 2, 3, 4]).map(o => (Math.random() < 0.5 ? -o : o));
        const ns = offs.map(o => (t + o > 20 ? t - Math.abs(o) : t + o)), ans = ns[offs.findIndex(o => Math.abs(o) === 1)];
        return Q.pick({
          prompt: `${ns.join('、')} 里面，哪个数最接近 ${t}？`, choices: [...ns].sort((x, y) => x - y), answer: ans,
          hint: lineHint(`在数轴上找到 ${t}，看哪个数离它最近。`, [t, ...ns]),
          explain: ns.map(x => `${x} 和 ${t} 相差 ${Math.abs(x - t)}`).concat(`${ans} 最接近 ${t}`),
        });
      },
      () => {
        const a = rand(10, 14), b = a + rand(4, 7), ans = b - a - 1;
        return Q.num({
          prompt: `比 ${a} 大、比 ${b} 小的数有几个？`, answer: ans, min: 0, max: 10, near: [b - a, b - a + 1],
          hint: lineHint(`把中间的数一个一个写出来，${a} 和 ${b} 自己不算。`, [a, b], 10),
          explain: [`中间的数是：${range(a + 1, b - 1).join('、')}`, `一共 ${ans} 个`],
        });
      },
      () => {
        const ns = shuffle(range(6, 20)).slice(0, 5), up = Math.random() < 0.5, k = rand(2, 4);
        const sorted = [...ns].sort((x, y) => (up ? x - y : y - x)), ans = sorted[k - 1];
        return Q.pick({
          prompt: `把 ${ns.join('、')} 按从${up ? '小到大' : '大到小'}排，排第 ${k} 的是几？`, answer: ans,
          // 干扰项：反方向数的第 k 个、挨着的两个
          choices: [...new Set([ans, sorted[5 - k], sorted[k - 2], sorted[k], ...ns])].slice(0, 4).sort((x, y) => x - y),
          hint: lineHint(`先找最${up ? '小' : '大'}的，再找第二${up ? '小' : '大'}的……一个一个排。`, ns),
          explain: [`从${up ? '小到大' : '大到小'}：${sorted.join(up ? ' < ' : ' > ')}`, `排第 ${k} 的是 ${ans}`],
        });
      },
    ],
  ], '比大小一眼就看出来了');
  // ---------- 排第几 ----------
  const line = n => shuffle(ANIMALS).slice(0, n);
  const kids = (n, at) => Array.from({ length: n }, (_, i) => (i === at ? '👦' : '🧒'));
  reg('order', '排第几', [
    [
      () => {
        const n = rand(6, 8), row = line(n), i = rand(1, n - 1), [e, name] = row[i], items = row.map(r => r[0]), right = Math.random() < 0.6;
        const ans = right ? n - i : i + 1;
        return Q.num({
          prompt: `从${right ? '右' : '左'}边数，${e} 排第几？`, speak: `从${right ? '右' : '左'}边数，${name}排第几？`,
          scene: { kind: 'queue', items, ends: ['左', '右'] }, answer: ans, min: 1, max: n, near: [right ? i + 1 : n - i],
          hint: { text: `从${right ? '右' : '左'}边第一个开始，1、2、3……数到${name}。`, visual: { kind: 'queue', items, ends: ['左', '右'], num: right ? 'right' : 'left', hl: i } },
          explain: [`从${right ? '右往左' : '左往右'}数`, `${name}排第 ${ans}`],
        });
      },
      () => {
        const n = rand(6, 8), row = line(n), items = row.map(r => r[0]), k = rand(2, n - 1), i = n - k;
        return Q.pick({
          prompt: `从右边数，第 ${k} 个是谁？`, speak: `从右边数，第${k}个是谁？`,
          scene: { kind: 'queue', items, ends: ['左', '右'] }, answer: items[i],
          // 干扰项：从左边数的第 k 个，以及挨着的
          choices: shuffle([...new Set([items[i], items[k - 1], items[i - 1], items[i + 1] || items[0], ...items])].slice(0, 4)),
          hint: { text: '从右边第一个开始数：1、2、3……', visual: { kind: 'queue', items, ends: ['左', '右'], num: 'right' } },
          explain: [`从右往左数，第 ${k} 个是 ${items[i]}`],
        });
      },
    ],
    [
      () => {
        const a = rand(3, 7), b = rand(3, 7), total = a + b - 1;
        return Q.num({
          prompt: `${nick()}排队，从前往后数排第 ${a}，从后往前数排第 ${b}。这一队有几人？`,
          answer: total, near: [a + b, a + b + 1],
          hint: { text: `${nick()}被数了两次哦。`, visual: { kind: 'queue', items: kids(total, a - 1), hl: a - 1, ends: ['前', '后'] } },
          explain: [`${nick()}前面有 ${a - 1} 人，后面有 ${b - 1} 人`, `再加上${nick()}自己：${a - 1} + ${b - 1} + 1 = ${total}`],
        });
      },
      () => {
        const a = rand(3, 7), b = rand(3, 7), total = a + b + 1;
        return Q.num({
          prompt: `${nick()}前面有 ${a} 人，后面有 ${b} 人，这一队一共有几人？`,
          answer: total, near: [a + b, a + b - 1],
          hint: { text: `前面的、后面的，还有${nick()}自己，都要算上。`, visual: { kind: 'queue', items: kids(total, a), hl: a, ends: ['前', '后'] } },
          explain: [`前面 ${a} 人，后面 ${b} 人`, `再加上${nick()}自己：${a} + ${b} + 1 = ${total}`],
        });
      },
      () => {
        const n = rand(8, 12), a = rand(2, n - 2), ans = n - a + 1;
        return Q.num({
          prompt: `一队有 ${n} 人，${nick()}从前往后数排第 ${a}。从后往前数，${nick()}排第几？`,
          answer: ans, min: 1, near: [n - a, n - a + 2, a],
          hint: { text: `${nick()}后面有几人？再数到${nick()}自己。`, visual: { kind: 'queue', items: kids(n, a - 1), hl: a - 1, ends: ['前', '后'] } },
          explain: [`${nick()}后面有 ${n} − ${a} = ${n - a} 人`, `从后往前数，数完 ${n - a} 人就到${nick()}`, `排第 ${ans}`],
        });
      },
    ],
    [
      () => {
        const a = rand(2, 6), b = a + rand(3, 7), ans = b - a - 1;
        return Q.num({
          prompt: `一队小朋友，从前往后数，第 ${a} 个和第 ${b} 个中间有几人？`,
          answer: ans, near: [b - a, b - a + 1],
          hint: { text: `第 ${a} 个和第 ${b} 个自己不算，只数中间的。`, visual: { kind: 'queue', items: kids(b, -1), hl: [a - 1, b - 1], num: 'left', ends: ['前', '后'] } },
          explain: [`中间的是第 ${range(a + 1, b - 1).join('、')} 个`, `一共 ${ans} 人`],
        });
      },
      () => {
        const n = rand(9, 15), a = rand(2, n - 3), ans = n - a - 1;
        return Q.num({
          prompt: `一队有 ${n} 人，${nick()}前面有 ${a} 人。${nick()}后面有几人？`,
          answer: ans, near: [n - a, n - a + 1],
          hint: { text: `别忘了${nick()}自己也站在队里。`, visual: { kind: 'queue', items: kids(n, a), hl: a, ends: ['前', '后'] } },
          explain: [`${n} 人里，去掉前面 ${a} 人，再去掉${nick()}自己 1 人`, `${n} − ${a} − 1 = ${ans}`],
        });
      },
      () => {
        const n = rand(9, 12), a = rand(2, 4), b = rand(2, 4), p = a - 1, q = n - b, ans = q - p - 1;
        return Q.num({
          prompt: `一排有 ${n} 个人。从左数第 ${a} 个是小红，从右数第 ${b} 个是小明。他们中间有几人？`,
          answer: ans, near: [ans + 2, ans + 1, ans - 1],
          hint: { text: '画一画：先找到小红，再找到小明，数中间的。', visual: { kind: 'queue', items: kids(n, -1), hl: [p, q], ends: ['左', '右'] } },
          explain: [`小红从左数第 ${a}，小明从左数是第 ${q + 1}`, `中间是第 ${a + 1} 到第 ${q} 个`, `一共 ${ans} 人`],
        });
      },
    ],
  ], '排第几一下就数对了');
  // ---------- 分与合 ----------
  const bondHint = (n, text) => ({ text, visual: { kind: 'bond', whole: n, parts: ['?', '?'] } });
  reg('bond', '分与合', [
    [
      () => {
        const n = rand(6, 10), a = rand(1, n - 1), b = n - a, left = Math.random() < 0.5;
        return Q.num({
          prompt: left ? `□ 和 ${a} 合成 ${n}` : `${n} 可以分成 ${a} 和几？`, speak: left ? `几和${a}合成${n}？` : `${n}可以分成${a}和几？`,
          scene: { kind: 'bond', whole: n, parts: left ? ['?', a] : [a, '?'] },
          answer: b, max: 10, near: [n, Math.min(10, n + a)],
          hint: { text: `一共 ${n} 个，先圈出 ${a} 个，剩下几个？`, visual: { kind: 'dots', groups: [a, b] } },
          explain: [`${a} 和 ${b} 合起来是 ${n}`, `所以填 ${b}`],
        });
      },
      () => {
        const n = rand(6, 10), a = rand(1, n - 1), b = n - a, right = `${a}和${b}`;
        const wrong = shuffle([`${a}和${b + 1}`, `${a + 1}和${b + 1}`, a > 1 ? `${a - 1}和${b}` : `${a}和${b - 1}`, `${a + 2}和${b}`]).slice(0, 3);
        return Q.pick({
          prompt: `哪一组合起来是 ${n}？`, choices: shuffle([right, ...wrong]), answer: right,
          hint: bondHint(n, `每一组都加一加，看哪组正好是 ${n}。`), explain: [`${a} + ${b} = ${n}`, `所以是 ${right}`],
        });
      },
    ],
    [
      () => {
        const n = rand(5, 10), ans = n - 1;
        return Q.num({
          prompt: `${n} 分成两个数（0 不算），一共有几种分法？`, speak: `${n}分成两个数，0不算，一共有几种分法？`,
          answer: ans, min: 1, max: 10, near: [Math.floor(n / 2), n, n - 2],
          hint: bondHint(n, `按顺序写：1 和 ${n - 1}、2 和 ${n - 2}……写到 ${n - 1} 和 1。`),
          explain: [range(1, n - 1).map(a => `${a}和${n - a}`).join('、'), `一共 ${ans} 种`],
        });
      },
      () => {
        const h = rand(2, 5), n = h * 2;
        return Q.num({
          prompt: `${n} 可以分成两个同样的数，每个是几？`, answer: h, max: 10, near: [n, h + 1, h - 1],
          hint: bondHint(n, `两个数一样大，试一试：几加几等于 ${n}？`), explain: [`${h} + ${h} = ${n}`, `所以每个是 ${h}`],
        });
      },
      () => {
        const n = rand(7, 10), a = rand(1, n - 3), b = rand(1, n - a - 1), c = n - a - b;
        return Q.num({
          prompt: `${n} 可以分成 ${a}、${b} 和几？`, speak: `${n}可以分成${a}、${b}和几？`,
          answer: c, max: 10, near: [n - a, n - b, c + 1],
          hint: { text: `先从 ${n} 里分出 ${a}，剩下的再分出 ${b}。`, visual: { kind: 'dots', groups: [a + b, c], ghost: 1 } },
          explain: [`${n} 分出 ${a}，还剩 ${n - a}`, `${n - a} 再分出 ${b}，还剩 ${c}`],
        });
      },
    ],
    [
      () => {
        const s = rand(2, 4), k = pick([1, 2]), n = s * 2 + k, right = `${s}和${s + k}`;
        return Q.pick({
          prompt: `两个数合起来是 ${n}，一个比另一个多 ${k}，这两个数是？`,
          choices: shuffle([right, `${s - 1}和${s + k + 1}`, `${s}和${s + k + 1}`, `${s + 1}和${s + k}`]), answer: right,
          hint: bondHint(n, `先找合起来是 ${n} 的，再看是不是正好差 ${k}。`),
          explain: [`${s} + ${s + k} = ${n}`, `${s + k} 比 ${s} 多 ${k}`, `所以是 ${right}`],
        });
      },
      () => {
        const n = rand(6, 10), a = rand(2, n - 2), b = n - a, k = rand(1, Math.min(a - 1, 3));
        return Q.num({
          prompt: `${n} 分成 ${a} 和 ${b}。如果 ${a} 变成 ${a - k}，另一个要变成几，合起来才还是 ${n}？`,
          answer: b + k, max: 10, near: [b - k, b, b + k + 1],
          hint: bondHint(n, `一个少了 ${k}，另一个就要多 ${k}。`),
          explain: [`${a} 少了 ${k}`, `${b} 就要多 ${k}：${b} + ${k} = ${b + k}`, `${a - k} + ${b + k} = ${n}`],
        });
      },
      () => {
        const n = rand(7, 10), m = rand(2, 3), ok = range(m, n - m), ans = ok.length;
        return Q.num({
          prompt: `${n} 颗糖分到两个盘子里，每个盘子至少放 ${m} 颗。一共有几种放法？`,
          answer: ans, min: 1, max: 10, near: [n - 1, ans + 1, ans - 1],
          hint: bondHint(n, `左边的盘子放 ${m} 颗、${m + 1} 颗……一个一个试，右边也不能少于 ${m} 颗。`),
          explain: [ok.map(a => `${a}和${n - a}`).join('、'), `一共 ${ans} 种`],
        });
      },
    ],
  ], '分与合记得特别牢');
  // ---------- 认识十几 ----------
  const sticks = (k, text) => ({ text, visual: { kind: 'tens', tens: 1, ones: k } });
  reg('tens', '认识十几', [
    [
      () => {
        const k = rand(1, 9), ask = Math.random() < 0.5;
        return ask
          ? Q.num({
              prompt: `${10 + k} 里面有 1 个十和几个一？`, answer: k, min: 0, max: 10, near: [10, k + 1, 1],
              hint: sticks(k, `${10 + k} 的十位是 1，个位是几就有几个一。`), explain: [`${10 + k} = 10 + ${k}`, `有 1 个十和 ${k} 个一`],
            })
          : Q.num({
              prompt: '图上的小棒一共是几根？', scene: { kind: 'tens', tens: 1, ones: k },
              answer: 10 + k, near: [k + 1, 11, k], hint: sticks(k, `捆起来的一捆是 10 根，再加上 ${k} 根。`),
              explain: ['1 捆是 10 根', `10 + ${k} = ${10 + k}`],
            });
      },
      () => {
        const k = rand(1, 9), n = 10 + k, ten = Math.random() < 0.5;
        return Q.num({
          prompt: `${n} 的${ten ? '十位' : '个位'}上是几？`, answer: ten ? 1 : k, min: 0, max: 10, near: [ten ? k : 1, 10],
          hint: sticks(k, '右边是个位，左边是十位。'), explain: [`${n}：十位是 1，个位是 ${k}`],
        });
      },
    ],
    [
      () => {
        const k = rand(1, 8), ans = 11 + k;
        return Q.num({
          prompt: `一个数，十位上是 1，个位上的数比十位多 ${k}，这个数是几？`, answer: ans, near: [10 + k, ans + 1, k + 1],
          hint: sticks(k + 1, `个位上是 1 + ${k}。十位上的 1 表示 1 个十。`),
          explain: [`个位：1 + ${k} = ${k + 1}`, `十位是 1，个位是 ${k + 1}`, `这个数是 ${ans}`],
        });
      },
      () => {
        const k = rand(2, 9), n = 10 + k, minus = Math.random() < 0.5;
        return Q.num({
          prompt: minus ? `${n} 去掉 ${k} 个一，剩下几？` : `${n} 去掉 1 个十，剩下几？`,
          answer: minus ? 10 : k, min: 0, near: minus ? [n - 1, 1, k] : [n - 1, 10, 1],
          hint: sticks(k, minus ? `把单根的 ${k} 根拿走，还剩一捆。` : '把一捆拿走，还剩单根的。'),
          explain: minus ? [`${n} = 10 + ${k}`, `去掉 ${k} 个一，剩下 10`] : [`${n} = 10 + ${k}`, `去掉 1 个十，剩下 ${k}`],
        });
      },
      () => {
        const a = rand(11, 18), ans = `${a - 1}和${a + 1}`;
        return Q.pick({
          prompt: `和 ${a} 相邻的两个数是？`,
          choices: shuffle([ans, `${a}和${a + 1}`, `${a - 1}和${a}`, `${a - 2}和${a + 2}`]), answer: ans,
          hint: { text: `相邻就是挨着：${a} 前面一个、后面一个。`, visual: { kind: 'line', from: 10, to: 20, marks: [a] } },
          explain: [`${a} 前面是 ${a - 1}，后面是 ${a + 1}`, `所以是 ${ans}`],
        });
      },
    ],
    [
      () => {
        const a = rand(11, 13), b = a + rand(4, 7), inner = range(a + 1, b - 1), odd = Math.random() < 0.5;
        const ok = inner.filter(x => x % 2 === (odd ? 1 : 0));
        return Q.num({
          prompt: `比 ${a} 大、比 ${b} 小的${odd ? '单数' : '双数'}有几个？`, answer: ok.length, min: 0, max: 10, near: [inner.length, ok.length + 1, b - a],
          hint: { text: `先把中间的数写出来，再挑出${odd ? '单数（个位是 1、3、5、7、9）' : '双数（个位是 0、2、4、6、8）'}。`, visual: { kind: 'line', from: 10, to: 20, marks: [a, b] } },
          explain: [`中间的数：${inner.join('、')}`, `${odd ? '单数' : '双数'}：${ok.join('、') || '没有'}`, `一共 ${ok.length} 个`],
        });
      },
      () => {
        const k = rand(1, 9), n = 10 + k, ans = 20 - n;
        return Q.num({
          prompt: `${n} 再添上几个一就是 2 个十？`, answer: ans, min: 0, near: [n, ans + 1, 20 - k],
          hint: sticks(k, `2 个十是 20。${n} 还差几到 20？`), explain: ['2 个十是 20', `${n} + ${ans} = 20`, `要添 ${ans} 个一`],
        });
      },
      () => {
        const x = rand(2, 9), n = 10 + x;
        return Q.num({
          prompt: `一个十几的数，十位和个位加起来是 ${1 + x}。这个数是几？`, answer: n, near: [x, 10 + x + 1, 10 + x - 1],
          hint: { text: `十几的数，十位一定是 1。那个位是几？`, visual: { kind: 'tens', tens: 1, ones: x } },
          explain: [`十位是 1`, `个位是 ${1 + x} − 1 = ${x}`, `这个数是 ${n}`],
        });
      },
    ],
  ], '十几的数认得真清楚');
  // ---------- 数的顺序 ----------
  // 一列数，step 是每次变多少（负数是变少），blank 是挖掉的位置
  const seqQ = (nums, blank, rule) => {
    const ans = nums[blank], shown = nums.map((x, i) => (i === blank ? '□' : x)), step = nums[1] - nums[0];
    return Q.num({
      prompt: shown.join('，'), sub: '□ 里是几？',
      speak: shown.map(x => (x === '□' ? '空格' : x)).join('，') + '，空格里是几？',
      answer: ans, near: [ans + 1, ans - 1, ans - step * (blank ? 1 : -1)].filter(x => x !== ans),
      hint: { text: `看看这些数是怎么变的：${rule}吗？`, visual: { kind: 'line', from: 0, to: 20, marks: nums.filter((_, i) => i !== blank) } },
      explain: [`这些数${rule}`, shown.join('，').replace('□', String(ans)), `□ 里是 ${ans}`],
    });
  };
  const ruleOf = s => (s > 0 ? `一个比一个多 ${s}` : `一个比一个少 ${-s}`);
  const arith = (len, steps, blanks) => {
    const s = pick(steps), span = Math.abs(s) * (len - 1);
    const start = s > 0 ? rand(0, 20 - span) : rand(span, 20);
    const nums = range(0, len - 1).map(i => start + s * i);
    return seqQ(nums, pick(blanks(len)), ruleOf(s));
  };
  reg('seq', '数的顺序', [
    [
      () => arith(5, [-1, 2], n => range(1, n - 1)),
      () => arith(5, [1, -1, -2], n => range(0, n - 1)),
    ],
    [
      () => arith(5, [2, -2, 3], n => range(0, n - 1)),
      () => {
        // 单数、双数排一排
        const odd = Math.random() < 0.5, down = Math.random() < 0.4, k = rand(odd ? 0 : 1, 5);
        let nums = range(0, 4).map(i => (k + i) * 2 + (odd ? 1 : 0)).filter(x => x <= 20);
        if (nums.length < 5) nums = range(0, 4).map(i => i * 2 + (odd ? 1 : 2));
        if (down) nums.reverse();
        return seqQ(nums, rand(1, 4), down ? '一个比一个少 2' : '一个比一个多 2');
      },
      () => {
        const a = rand(5, 18), before = Math.random() < 0.5, ans = before ? a - 1 : a + 1;
        return Q.num({
          prompt: `${a} ${before ? '前面' : '后面'}的一个数是几？`, answer: ans, near: [before ? a + 1 : a - 1, a],
          hint: { text: '从小往大数：前面的数小，后面的数大。', visual: { kind: 'line', from: 0, to: 20, marks: [a] } },
          explain: [`从小往大数：${a - 1}、${a}、${a + 1}`, `${a} ${before ? '前面' : '后面'}是 ${ans}`],
        });
      },
    ],
    [
      () => arith(5, [3, -3, 4, -4], n => range(0, n - 1)),
      () => {
        // 两种变法轮流：+1、+2、+1、+2……
        const [p, q] = pick([[1, 2], [2, 1], [1, 3], [3, 1]]), start = rand(0, 5), nums = [start];
        for (let i = 1; i < 6; i++) nums.push(nums[i - 1] + (i % 2 ? p : q));
        if (nums[5] > 20) return arith(5, [3, -3], n => range(0, n - 1));
        return seqQ(nums, rand(3, 5), `轮流多 ${p}、多 ${q}`);
      },
      () => {
        const k = Math.random() < 0.5 ? 2 : 3, a = rand(2, 7), n = rand(4, k === 2 ? 6 : 5), nums = range(0, n - 1).map(i => a + k * i), last = nums[n - 1];
        return Q.num({
          prompt: `从 ${a} 开始，${k} 个 ${k} 个地往后数，数到第 ${n} 个数是几？`, answer: last, near: [last - k, last + k, a + n],
          hint: { text: `${a} 是第 1 个，再往后跳 ${k}、${k}……`, visual: { kind: 'line', from: 0, to: 20, marks: [a] } },
          explain: [`${nums.join('、')}`, `第 ${n} 个数是 ${last}`],
        });
      },
    ],
  ], '找规律的本领很厉害');
})(window.TM);
