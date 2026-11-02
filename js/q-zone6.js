// 战区 6 百数高地：100 以内数的认识、比大小、数的顺序、整十数加减
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick } = U;

  const sticks = n => ({ kind: 'tens', tens: Math.floor(n / 10), ones: n % 10, small: true });
  // 两位数的常见错误：十位和个位弄反
  const swap = n => (n % 10) * 10 + Math.floor(n / 10);
  const near = n => [swap(n), n + 10, n - 10, n + 1, n - 1].filter(x => x >= 0 && x <= 100 && x !== n);

  Q.register('count100', '数的组成', d => {
    const t = rand(2, 9), o = rand(1, 9), n = t * 10 + o;
    if (d === 0) {
      return Q.num({
        prompt: '一共有多少根小棒？',
        sub: '一捆是 10 根',
        scene: sticks(n),
        answer: n, max: 100, near: near(n),
        hint: { text: `先数有几捆：${t} 捆就是 ${t} 个十。再数单根的。`, visual: sticks(n) },
        explain: [`${t} 捆是 ${t} 个十，就是 ${t * 10}`, `还有 ${o} 根`, `${t * 10} 和 ${o} 合起来是 ${n}`],
      });
    }
    if (d === 1) {
      return Q.num({
        prompt: `${t} 个十和 ${o} 个一组成的数是 □`,
        speak: `${t}个十和${o}个一组成的数是几？`,
        answer: n, max: 100, near: near(n).concat([t + o]),
        hint: { text: '几个十写在十位（左边），几个一写在个位（右边）。', visual: sticks(n) },
        explain: [`十位写 ${t}，个位写 ${o}`, `组成 ${n}`],
      });
    }
    const askTen = Math.random() < 0.5;
    return Q.num({
      prompt: `${n} 里面有几个${askTen ? '十' : '一'}？`,
      sub: '个位和十位要分清哦',
      answer: askTen ? t : o, max: 10, near: [askTen ? o : t, n % 10 + 1, t + 1],
      hint: { text: `${n} 的左边一位是十位，右边一位是个位。`, visual: sticks(n) },
      explain: [`${n} 的十位是 ${t}，个位是 ${o}`, `所以有 ${t} 个十和 ${o} 个一`],
    });
  }, '两位数的组成很清楚');

  Q.register('cmp100', '100以内比大小', d => {
    const hint = (a, b) => ({
      text: '先比十位，十位大的数就大；十位一样，再比个位。',
      visual: { kind: 'rows', rows: [{ e: '🟦', n: Math.floor(a / 10) }, { e: '🟦', n: Math.floor(b / 10) }] },
    });
    const exp = (a, b, s) => [Math.floor(a / 10) !== Math.floor(b / 10)
      ? `十位：${Math.floor(a / 10)} 和 ${Math.floor(b / 10)}，十位大的数大`
      : `十位一样，比个位：${a % 10} 和 ${b % 10}`, `所以 ${a} ${s} ${b}`];
    let a, b;
    if (d === 0) { a = rand(2, 9) * 10 + rand(0, 9); do b = rand(2, 9) * 10 + rand(0, 9); while (Math.floor(b / 10) === Math.floor(a / 10)); }
    else if (d === 1) { const t = rand(2, 9); a = t * 10 + rand(0, 9); b = t * 10 + rand(0, 9); }
    else { a = rand(1, 9) * 10 + rand(1, 9); b = a % 10 === Math.floor(a / 10) ? a + 1 : swap(a); }
    const q = Q.cmp(String(a), String(b), a, b);
    q.hint = hint(a, b);
    q.explain = exp(a, b, q.answer);
    return q;
  }, '大数比大小也不怕');

  Q.register('seq100', '数的顺序', d => {
    if (d === 0) {
      const n = rand(21, 98), before = Math.random() < 0.5, ans = before ? n - 1 : n + 1;
      return Q.num({
        prompt: before ? `□ 的后面是 ${n}` : `${n} 的后面一个数是 □`,
        speak: before ? `哪个数的后面是${n}？` : `${n}的后面一个数是几？`,
        answer: ans, max: 100, near: [before ? n + 1 : n - 1, n + 10, n - 10],
        hint: { text: '往后数一个数，就是多 1；往前数一个数，就是少 1。', visual: { kind: 'line', from: Math.floor(n / 10) * 10, to: Math.min(100, Math.floor(n / 10) * 10 + 10), marks: [n] } },
        explain: [`${before ? ans + ' 往后数一个是 ' + n : n + ' 往后数一个是 ' + ans}`],
      });
    }
    const step = d === 1 ? pick([10, 5]) : pick([2, 5, 10]);
    const start = step === 10 ? rand(1, 59) : step === 5 ? rand(1, 8) * 5 : rand(10, 40) * 2;
    const seq = [0, 1, 2, 3, 4].map(i => start + i * step);
    const k = rand(1, 4), ans = seq[k];
    const shown = seq.map((x, i) => (i === k ? '□' : x)).join('，');
    return Q.num({
      prompt: shown,
      sub: `${step} 个 ${step} 个地数`,
      speak: `${step}个${step}个地数，${seq.map((x, i) => (i === k ? '空格' : x)).join('，')}，空格里是几？`,
      answer: ans, max: 100, near: [ans + 1, ans - 1, ans + step],
      hint: { text: `每次都多 ${step}。从前一个数往后数 ${step}。`, visual: null },
      explain: [`后一个数比前一个多 ${step}`, `${seq[k - 1]} + ${step} = ${ans}`],
    });
  }, '数的顺序记得牢');

  Q.register('tens100', '整十数加减', d => {
    if (d === 2) {
      // 两位数加减整十数：个位不动，只算十位
      const t = rand(1, 8), o = rand(1, 9), add = Math.random() < 0.5;
      const k = add ? rand(1, 9 - t) : rand(1, t), n = t * 10 + o, ans = add ? n + k * 10 : n - k * 10;
      return Q.num({
        prompt: `${n} ${add ? '+' : '−'} ${k * 10} = □`,
        answer: ans, max: 100, near: [add ? n + k : n - k, ans + 1, ans - 10].filter(x => x >= 0 && x <= 100),
        hint: { text: `${k * 10} 是 ${k} 个十。个位不动，十位 ${t} ${add ? '+' : '−'} ${k}。`, visual: sticks(n) },
        explain: [`十位：${t} ${add ? '+' : '−'} ${k} = ${add ? t + k : t - k}`, `个位还是 ${o}，所以是 ${ans}`],
      });
    }
    if (d === 1) {
      // 两位数加减一位数（不进位、不退位）
      const t = rand(2, 9), o = rand(1, 8), add = Math.random() < 0.5;
      const k = add ? rand(1, 9 - o) : rand(1, o), n = t * 10 + o, ans = add ? n + k : n - k;
      return Q.num({
        prompt: `${n} ${add ? '+' : '−'} ${k} = □`,
        answer: ans, max: 100, near: [add ? n + k * 10 : n - k * 10, ans + 1, ans - 1].filter(x => x >= 0 && x <= 100),
        hint: { text: `十位不动，只算个位：${o} ${add ? '+' : '−'} ${k}。`, visual: sticks(n) },
        explain: [`个位：${o} ${add ? '+' : '−'} ${k} = ${add ? o + k : o - k}`, `十位还是 ${t}，所以是 ${ans}`],
      });
    }
    const add = Math.random() < 0.6;
    let a = rand(1, 8), b = rand(1, 9 - a);
    if (!add) { a = rand(3, 9); b = rand(1, a - 1); }
    const ans = add ? a + b : a - b;
    return Q.num({
      prompt: `${a * 10} ${add ? '+' : '−'} ${b * 10} = □`,
      answer: ans * 10, max: 100, near: [ans, ans * 10 + 10, ans * 10 - 10].filter(x => x >= 0),
      hint: { text: `${a * 10} 是 ${a} 个十，${b * 10} 是 ${b} 个十。${a} 个十 ${add ? '加' : '减'} ${b} 个十是几个十？`, visual: sticks(a * 10) },
      explain: [`${a} 个十 ${add ? '+' : '−'} ${b} 个十 = ${ans} 个十`, `${ans} 个十是 ${ans * 10}`],
    });
  }, '整十数算得真快');
})(window.TM);
