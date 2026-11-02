// 战区 3 进位要塞：十几加减几、20 以内进位加法、凑十法
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick } = U;

  // 进位加法：基础题有 9 或 8，提高题大数 6~8，挑战题两个数都在 5~8（离 10 都远，最难凑）
  const carryPair = d => {
    if (d === 2) {
      const a = rand(5, 8), b = rand(Math.max(5, 11 - a), 8);
      return Math.random() < 0.5 ? [a, b] : [b, a];
    }
    const big = d === 0 ? rand(8, 9) : rand(6, 8);
    const small = rand(11 - big, 9);
    // 提高和挑战题里一半把小数放前面，练“交换位置”
    return d > 0 && Math.random() < 0.5 ? [small, big] : [big, small];
  };

  Q.register('teen', '十几加减几', d => {
    const t = rand(1, 8);
    if (d === 2) {
      const sub = Math.random() < 0.5;
      if (sub) {
        const a = rand(1, t), ans = 10 + t;
        return Q.num({
          prompt: `□ − ${a} = ${ans - a}`,
          answer: ans, near: [ans - a - a, ans + 1],
          hint: { text: `减掉 ${a} 剩 ${ans - a}，原来有几个？算 ${ans - a} + ${a}。`, visual: { kind: 'tens', tens: 1, ones: ans - a - 10 } },
          explain: [`${ans - a} + ${a} = ${ans}`, `□ 里填 ${ans}`],
        });
      }
      const a = rand(1, 9 - t);
      return Q.num({
        prompt: `${10 + t} + □ = ${10 + t + a}`,
        answer: a, max: 10, near: [a + 1, a - 1, t + a],
        hint: { text: `十位不变，只看个位：${t} 加几等于 ${t + a}？`, visual: { kind: 'tens', tens: 1, ones: t } },
        explain: [`个位：${t} + ${a} = ${t + a}`, `□ 里填 ${a}`],
      });
    }
    const a = 10 + t, b = rand(1, 9 - t);
    const sub = d === 1 && Math.random() < 0.6;
    if (sub) {
      const s = a + b, k = rand(1, s - 10);
      return Q.num({
        prompt: `${s} − ${k} = □`,
        answer: s - k, near: [s - k + 1, s + k <= 20 ? s + k : s - k - 1],
        hint: { text: `${s} 是 1 个十和 ${s - 10} 个一。十不动，个位 ${s - 10} − ${k}。`, visual: { kind: 'tens', tens: 1, ones: s - 10 } },
        explain: [`个位：${s - 10} − ${k} = ${s - 10 - k}`, `再加上 10：10 + ${s - 10 - k} = ${s - k}`],
      });
    }
    return Q.num({
      prompt: `${a} + ${b} = □`,
      answer: a + b, near: [a + b - 1, t + b],
      hint: { text: `${a} 是 1 个十和 ${t} 个一。先算 ${t} + ${b}，再加 10。`, visual: { kind: 'tens', tens: 1, ones: t } },
      explain: [`个位：${t} + ${b} = ${t + b}`, `再加上 10：10 + ${t + b} = ${a + b}`],
    });
  }, '十几的加减法算得又准又快');

  Q.register('carry', '进位加法', d => {
    const [a, b] = carryPair(d);
    return Q.num({
      prompt: `${a} + ${b} = □`,
      answer: a + b, near: [a + b - 10, a + b - 1, a + b + 1],
      hint: Q.tenHint(a, b), explain: Q.tenExplain(a, b),
    });
  }, '凑十法用得真棒');

  Q.register('maketen', '凑十法', d => {
    const [a, b] = carryPair(d === 2 ? 1 : d);
    const big = Math.max(a, b), small = Math.min(a, b), need = 10 - big, rest = small - need;
    if (d === 2) {
      // 凑十法的第二步：10 + □
      return Q.num({
        prompt: `${big} + ${small}：先算 ${big} + ${need} = 10，再算 10 + □`,
        speak: `${big}加${small}，先算${big}加${need}等于10，再算10加几？`,
        answer: rest, max: 10, near: [need, small],
        hint: { text: `${small} 用掉了 ${need}，还剩几？`, visual: { kind: 'tenframe', a: big, b: small } },
        explain: [`${small} 分成 ${need} 和 ${rest}`, `${need} 已经和 ${big} 凑成 10 了`, `还剩 ${rest}，所以算 10 + ${rest} = ${10 + rest}`],
      });
    }
    return Q.num({
      prompt: `${big} + ${small}：把 ${small} 分成 □ 和 ${rest}`,
      sub: `想一想：${big} 和几凑成 10？`,
      speak: `${big}加${small}，用凑十法，把${small}分成几和${rest}？`,
      scene: { kind: 'bond', whole: small, parts: ['?', rest] },
      answer: need, max: 10, near: [rest, small - 1, need + 1],
      hint: { text: `${big} 还差几个就是 10？看看十格里空着几格。`, visual: { kind: 'tenframe', a: big, b: 0 } },
      explain: [`${big} + ${need} = 10`, `所以把 ${small} 分成 ${need} 和 ${rest}`],
    });
  }, '凑十法的每一步都很清楚');

  Q.register('carrymiss', '进位填空', d => {
    const [a, b] = carryPair(d);
    const s = a + b;
    const first = d === 2;
    const known = first ? b : a, ans = first ? a : b;
    return Q.num({
      prompt: first ? `□ + ${b} = ${s}` : `${a} + □ = ${s}`,
      answer: ans, max: 10, near: [s - 10, ans + 1, ans - 1],
      hint: { text: `${known} 先加几到 10，再加几到 ${s}？两段合起来。`, visual: { kind: 'line', from: 0, to: 20, marks: [known, 10, s] } },
      explain: [`${known} 加 ${10 - known} 到 10`, `10 再加 ${s - 10} 到 ${s}`, `${10 - known} + ${s - 10} = ${ans}，□ 里填 ${ans}`],
    });
  }, '进位填空想得很巧妙');

  Q.register('cmp20', '20以内比大小', d => {
    const [a, b] = carryPair(d);
    if (d === 2) {
      const [c, e] = carryPair(1);
      return Q.cmp(`${a} + ${b}`, `${c} + ${e}`, a + b, c + e);
    }
    const r = a + b + pick([-2, -1, 0, 1, 2]);
    return Q.cmp(`${a} + ${b}`, String(r), a + b, r);
  }, '比大小又细心又准确');

  Q.register('word20', '解决问题', d => {
    const [e, name, unit] = pick(Q.THINGS);
    if (d === 0) {
      const [a, b] = carryPair(0);
      return Q.num({
        prompt: `左边有 ${a} ${unit}${name}，右边有 ${b} ${unit}，一共有几${unit}？`,
        scene: { kind: 'emoji2', e, a, b },
        answer: a + b, near: [Math.abs(a - b), a + b - 1],
        hint: Q.tenHint(a, b),
        explain: [`求一共有几${unit}，用加法`, `${a} + ${b} = ${a + b}`],
      });
    }
    if (d === 1) {
      const total = rand(11, 18), a = rand(total - 9, 9);
      return Q.num({
        prompt: `一共有 ${total} ${unit}${name}，左边 ${a} ${unit}，右边有几${unit}？`,
        answer: total - a, near: [total + a <= 20 ? total + a : total - a + 1, total - a - 1],
        hint: { text: `想一想：${a} 加几等于 ${total}？`, visual: { kind: 'line', from: 0, to: 20, marks: [a, total] } },
        explain: [`求右边有几${unit}，用减法`, `${total} − ${a} = ${total - a}`, `验算：${a} + ${total - a} = ${total}`],
      });
    }
    // 挑战：多几、少几
    const a = rand(5, 9), k = rand(3, 8), b = a + k;
    const people = pick([['可可', '弟弟'], ['可可', '小明'], ['小红', '可可']]);
    return Q.num({
      prompt: `${people[0]}有 ${a} ${unit}${name}，${people[1]}比${people[0]}多 ${k} ${unit}，${people[1]}有几${unit}？`,
      answer: b, near: [a + k - 1, k, Math.abs(a - k)],
      hint: { text: `${people[1]}的和${people[0]}一样多的部分是 ${a} ${unit}，还多出 ${k} ${unit}。`, visual: { kind: 'rows', rows: [{ e, n: a }, { e, n: b }] } },
      explain: [`${people[1]}比${people[0]}多 ${k} ${unit}`, `${a} + ${k} = ${b}`],
    });
  }, '解决问题会动脑筋');
})(window.TM);
