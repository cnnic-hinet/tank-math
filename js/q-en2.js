// 英语 · 颜色数字：颜色、数字、数一数、找不同、数字顺序
(function (TM) {
  const { Q, U } = TM;
  const EN = t => ({ text: t, lang: 'en' });
  const ZH = t => ({ text: t, lang: 'zh' });
  const NUM = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const COLORS = [
    { w: 'red', zh: '红色', hex: '#e84a4a' }, { w: 'yellow', zh: '黄色', hex: '#f5c518' },
    { w: 'blue', zh: '蓝色', hex: '#3b82f6' }, { w: 'green', zh: '绿色', hex: '#3fae5a' },
    { w: 'black', zh: '黑色', hex: '#2b2b2b' }, { w: 'white', zh: '白色', hex: '#ffffff' },
    { w: 'pink', zh: '粉色', hex: '#ff8ec7' }, { w: 'orange', zh: '橙色', hex: '#f08a24' },
    { w: 'purple', zh: '紫色', hex: '#8b5cf6' }, { w: 'brown', zh: '棕色', hex: '#8b5a2b' },
  ];
  const three = (ans, pool) => {
    const others = U.shuffle([...new Set(pool.filter(x => x !== ans))]).slice(0, 2);
    return U.shuffle([ans, ...others]);
  };
  const q = o => Object.assign({ sub: '', scene: null, topic: 'word' }, o);

  // 颜色：看色块选单词
  const color = d => {
    const pool = d === 0 ? COLORS.slice(0, 4) : d === 2 ? COLORS.filter(c => ['red', 'blue', 'green', 'black', 'pink', 'purple', 'brown', 'white'].includes(c.w)) : COLORS;
    const c = U.pick(pool);
    return q({
      prompt: '这个颜色用英语怎么说？',
      speech: [ZH('这个颜色用英语怎么说？'), EN('What color is it?')],
      scene: { kind: 'color', hex: c.hex },
      choices: three(c.w, pool.map(x => x.w)), answer: c.w,
      hint: { text: `先想一想课本里的颜色词。红色是 red，蓝色是 blue，黄色是 yellow。`, speech: [ZH('红色是'), EN('red'), ZH('蓝色是'), EN('blue')] },
      explain: [`这个颜色是${c.zh}`, `英语是 ${c.w}`],
      explainSpeech: [ZH(`这个颜色是${c.zh}，英语是`), EN(c.w)],
    });
  };

  // 数字：数字 → 单词；挑战档反过来
  const num = d => {
    if (d === 2) {
      const n = U.rand(3, 10), a = String(n);
      return q({
        prompt: `单词 ${NUM[n - 1]} 是数字几？`,
        speech: [ZH('这个单词是数字几？'), EN(NUM[n - 1])],
        scene: { kind: 'card', text: NUM[n - 1], sub: '数字单词' },
        choices: three(a, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']), answer: a,
        hint: { text: '从 one 开始数：one、two、three、four……', speech: [ZH('从'), EN('one'), ZH('开始数一数。')] },
        explain: [`${NUM[n - 1]} 就是 ${n}`, `${n} 的英语是 ${NUM[n - 1]}`],
      });
    }
    const max = d === 0 ? 5 : 10, n = U.rand(1, max);
    return q({
      prompt: `数字 ${n} 用英语怎么说？`,
      speech: [ZH(`数字${CN[n - 1]}用英语怎么说？`)],
      scene: { kind: 'card', text: String(n), sub: '数字' },
      choices: three(NUM[n - 1], NUM.slice(0, max)), answer: NUM[n - 1],
      hint: { text: `数一数：${NUM.slice(0, n).join('、')}。`, visual: { kind: 'card', text: NUM[n - 1] } },
      explain: [`${n} 的英语是 ${NUM[n - 1]}`],
      explainSpeech: [ZH(`${CN[n - 1]}的英语是`), EN(NUM[n - 1])],
    });
  };

  // 数一数：看图选数字单词
  const ITEMS = [{ e: '🍎', zh: '苹果' }, { e: '⭐', zh: '星星' }, { e: '🐟', zh: '小鱼' }, { e: '🎈', zh: '气球' }];
  const count = d => {
    const n = d === 0 ? U.rand(1, 5) : d === 2 ? U.rand(6, 10) : U.rand(1, 10);
    const it = U.pick(ITEMS);
    return q({
      prompt: `${it.e} 有几个？用英语说。`,
      speech: [ZH('数一数，有几个？用英语说。')],
      scene: { kind: 'emoji', e: it.e, n, group: 5 },
      choices: three(NUM[n - 1], NUM), answer: NUM[n - 1],
      hint: { text: `用手指着一个一个数：one、two、three……数到几就是几。`, visual: { kind: 'emoji', e: it.e, n, group: 5, mark5: true } },
      explain: [`一共有 ${n} 个${it.zh}`, `${n} 的英语是 ${NUM[n - 1]}`],
      explainSpeech: [ZH(`一共有${n}个，英语是`), EN(NUM[n - 1])],
    });
  };

  // 找不同：颜色词里混一个数字词，或反过来
  const odd = d => {
    if (d === 0) {
      const n = U.shuffle(NUM.slice(0, 5)).slice(0, 2);
      const c = U.pick(COLORS).w;
      return q({
        prompt: '哪一个不是数字？',
        speech: [ZH('哪一个不是数字？')],
        choices: U.shuffle([...n, c]), answer: c,
        hint: { text: '数字词是 one、two、three 这样的，颜色词是 red、blue 这样的。' },
        explain: [`${n[0]} 和 ${n[1]} 都是数字`, `${c} 不是数字，是颜色`],
      });
    }
    if (d === 1) {
      const c = U.shuffle(COLORS).slice(0, 2).map(x => x.w);
      const n = U.pick(NUM);
      return q({
        prompt: '哪一个不是颜色？',
        speech: [ZH('哪一个不是颜色？')],
        choices: U.shuffle([...c, n]), answer: n,
        hint: { text: '颜色词用来形容东西是什么颜色，数字词用来数东西。' },
        explain: [`${c[0]} 和 ${c[1]} 都是颜色`, `${n} 是数字，不是颜色`],
      });
    }
    const n = U.shuffle(NUM.slice(0, 5)).slice(0, 2);
    const target = U.pick(COLORS).w;
    return q({
      prompt: '哪一个是颜色？',
      speech: [ZH('哪一个是颜色？')],
      choices: U.shuffle([...n, target]), answer: target,
      hint: { text: '数字词是 one、two、three 这样的，其他的是颜色。' },
      explain: [`${n[0]} 和 ${n[1]} 都是数字`, `${target} 是颜色`],
    });
  };

  // 数字顺序：补空、后面是谁、前面是谁
  const numorder = d => {
    if (d === 0) {
      const s = U.rand(0, 6), miss = U.rand(1, 2);
      const items = [0, 1, 2, 3].map(i => i === miss ? '_' : NUM[s + i]);
      const a = NUM[s + miss];
      return q({
        prompt: `${items.map(x => x === '_' ? '＿' : x).join(' ')}，缺少哪个数字？`,
        speech: [ZH('按顺序数，缺少哪个数字？'), EN(items.filter(x => x !== '_').join(' '))],
        scene: { kind: 'seq', items },
        choices: three(a, NUM), answer: a,
        hint: { text: '从 one 开始按顺序数：one、two、three、four……', visual: { kind: 'seq', items } },
        explain: [`按顺序是 ${NUM.slice(s, s + 4).join('、')}`, `缺少的是 ${a}`],
      });
    }
    const isAfter = d === 1;
    const n = U.rand(isAfter ? 1 : 2, isAfter ? 9 : 10);
    const a = NUM[isAfter ? n : n - 2];
    return q({
      prompt: `数字 ${NUM[n - 1]} 的${isAfter ? '后面' : '前面'}是哪一个？`,
      speech: [ZH('数字'), EN(NUM[n - 1]), ZH(`的${isAfter ? '后面' : '前面'}是哪一个？`)],
      scene: { kind: 'card', text: NUM[n - 1], sub: isAfter ? '后面是谁？' : '前面是谁？' },
      choices: three(a, NUM), answer: a,
      hint: { text: `从 one 数到 ten，找一找 ${NUM[n - 1]} 的${isAfter ? '后面' : '前面'}。`, speech: [ZH('按顺序数一数。')] },
      explain: [`${NUM[Math.max(0, n - 2)]}、${NUM[n - 1]}、${NUM[Math.min(9, n)]}`, `所以答案是 ${a}`],
    });
  };

  Q.register('en-color', '颜色单词', color, '颜色词记得真准');
  Q.register('en-num', '数字单词', num, '数字的英语说得很溜');
  Q.register('en-count', '数一数（英语）', count, '数得又对又快');
  Q.register('en-odd', '找不同', odd, '一眼就能找出不同类');
  Q.register('en-numorder', '数字顺序', numorder, '数字顺序记得真清楚');
})(window.TM);
