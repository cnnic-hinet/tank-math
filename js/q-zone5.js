// 战区 5 退位峡谷：20 以内退位减法（一年级下册）
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick } = U;

  // 十几减几（要退位）：a 是 11~18，b 比 a 的个位大；挑战题减 5~8，个位至少是 2
  const pair = d => {
    const b = d === 0 ? rand(7, 9) : d === 1 ? rand(4, 8) : rand(5, 8);
    const a = rand(d === 2 ? 12 : 11, 9 + b);
    return [a, b];
  };
  // 破十法提示和讲解
  const bHint = (a, b) => ({
    text: `${a} 的个位 ${a - 10} 不够减 ${b}。先从 10 里减 ${b}，再加上 ${a - 10}。`,
    visual: { kind: 'borrow', a, b },
  });
  const bExplain = (a, b) => [
    `${a} 分成 10 和 ${a - 10}`,
    `10 − ${b} = ${10 - b}`,
    `${10 - b} + ${a - 10} = ${a - b}`,
  ];
  const GONE = { 小鸡: '跑走了', 气球: '飞走了', 小鱼: '游走了', 小汽车: '开走了' };
  // 常见错误：个位倒着减（13−8 算成 5）
  const flip = (a, b) => b - (a - 10);

  Q.register('sub9', '十几减9', d => {
    const a = rand(11, 18), b = 9;
    if (d === 2) {
      const ans = rand(2, 9);
      return Q.num({
        prompt: `□ − 9 = ${ans}`,
        answer: ans + 9, near: [ans + 10, ans + 8, 9 - ans],
        hint: { text: `想一想：9 加几等于几？算 9 + ${ans}。`, visual: Q.tenHint(9, ans).visual },
        explain: [`减 9 剩 ${ans}，原来是 ${ans} + 9`, `9 + ${ans} = ${ans + 9}`],
      });
    }
    if (d === 1) {
      // 十几减 9 的规律：得数比个位多 1
      return Q.num({
        prompt: `${a} − 9 = □`,
        sub: `小窍门：十几减 9，就是个位加 1`,
        answer: a - 9, max: 10, near: [a - 10, flip(a, 9), a - 8],
        hint: bHint(a, 9), explain: bExplain(a, 9).concat([`个位 ${a - 10} 加 1 也是 ${a - 9}`]),
      });
    }
    return Q.num({
      prompt: `${a} − ${b} = □`,
      answer: a - b, max: 10, near: [a - 10, flip(a, b), a - b + 1],
      hint: bHint(a, b), explain: bExplain(a, b),
    });
  }, '十几减 9 算得飞快');

  Q.register('borrow', '退位减法', d => {
    const [a, b] = pair(d);
    return Q.num({
      prompt: `${a} − ${b} = □`,
      answer: a - b, max: 10, near: [flip(a, b), a - b + 1, a - b - 1],
      hint: bHint(a, b), explain: bExplain(a, b),
    });
  }, '破十法用得真棒');

  Q.register('thinkadd', '想加算减', d => {
    const [a, b] = pair(d), c = a - b;
    if (d === 0) {
      return Q.num({
        prompt: `因为 ${b} + ${c} = ${a}，所以 ${a} − ${b} = □`,
        speak: `因为${b}加${c}等于${a}，所以${a}减${b}等于几？`,
        answer: c, max: 10, near: [b, flip(a, b), c + 1],
        hint: { text: `${b} 和几合起来是 ${a}？上面的加法算式已经告诉你啦。`, visual: { kind: 'bond', whole: a, parts: [b, '?'] } },
        explain: [`${b} + ${c} = ${a}`, `所以 ${a} 去掉 ${b}，剩下 ${c}`],
      });
    }
    if (d === 1) {
      return Q.num({
        prompt: `想：${b} + □ = ${a}，${a} − ${b} = □`,
        speak: `想一想，${b}加几等于${a}？那么${a}减${b}等于几？`,
        answer: c, max: 10, near: [flip(a, b), c + 1, c - 1],
        hint: { text: `从 ${b} 往后数到 ${a}，数了几下？`, visual: { kind: 'line', from: 0, to: 20, marks: [b, a] } },
        explain: [`${b} + ${c} = ${a}`, `所以 ${a} − ${b} = ${c}`],
      });
    }
    return Q.num({
      prompt: `${a} − □ = ${c}`,
      answer: b, max: 10, near: [c, b + 1, b - 1],
      hint: { text: `${a} 减掉几剩 ${c}？想：${c} 加几等于 ${a}。`, visual: { kind: 'line', from: 0, to: 20, marks: [c, a] } },
      explain: [`${c} + ${b} = ${a}`, `所以 ${a} − ${b} = ${c}，□ 里填 ${b}`],
    });
  }, '想加算减很会动脑');

  Q.register('cmpsub', '减法比大小', d => {
    const [a, b] = pair(d);
    if (d === 2) {
      const [c, e] = pair(1);
      return Q.cmp(`${a} − ${b}`, `${c} − ${e}`, a - b, c - e);
    }
    const r = Math.max(0, a - b + pick([-2, -1, 0, 1, 2]));
    return Q.cmp(`${a} − ${b}`, String(r), a - b, r);
  }, '比大小又细心又准确');

  Q.register('word20s', '减法解决问题', d => {
    const [e, name, unit] = pick(Q.THINGS);
    const [a, b] = pair(d);
    if (d === 0) {
      return Q.num({
        prompt: `有 ${a} ${unit}${name}，${GONE[name] || '拿走了'} ${b} ${unit}，还剩几${unit}？`,
        scene: { kind: 'emoji', e, n: a, cross: b, group: 10 },
        answer: a - b, max: 10, near: [flip(a, b), a - b + 1],
        hint: bHint(a, b),
        explain: [`求还剩几${unit}，用减法`, `${a} − ${b} = ${a - b}`],
      });
    }
    if (d === 1) {
      return Q.num({
        prompt: `可可有 ${a} ${unit}${name}，送给小明 ${b} ${unit}，可可还有几${unit}？`,
        answer: a - b, max: 10, near: [flip(a, b), a - b + 1, a - b - 1],
        hint: bHint(a, b),
        explain: [`送出去了要用减法`, `${a} − ${b} = ${a - b}`],
      });
    }
    // 挑战：比多少
    const people = pick([['可可', '弟弟'], ['可可', '小明'], ['小红', '可可']]);
    return Q.num({
      prompt: `${people[0]}有 ${a} ${unit}${name}，${people[1]}有 ${b} ${unit}，${people[0]}比${people[1]}多几${unit}？`,
      answer: a - b, max: 10, near: [a + b <= 20 ? a + b : flip(a, b), flip(a, b), a - b + 1],
      hint: { text: `把一样多的部分去掉，看${people[0]}多出来几${unit}。`, visual: { kind: 'line', from: 0, to: 20, marks: [b, a] } },
      explain: [`求多几，用大数减小数`, `${a} − ${b} = ${a - b}`],
    });
  }, '解决问题会动脑筋');
})(window.TM);
