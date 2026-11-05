// 英语 · 字母乐园：大写、小写、配对、字母顺序、首字母
(function (TM) {
  const { Q, U } = TM;
  const EN = t => ({ text: t, lang: 'en' });
  const ZH = t => ({ text: t, lang: 'zh' });
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const LOW = ALPHA.map(x => x.toLowerCase());
  // 长得像、容易看错的字母
  const CONF = ['b', 'd', 'p', 'q', 'm', 'n', 'u', 'w', 'i', 'l'];

  const three = (ans, pool) => {
    const others = U.shuffle([...new Set(pool.filter(x => x !== ans))]).slice(0, 2);
    return U.shuffle([ans, ...others]);
  };
  const q = o => Object.assign({ sub: '', scene: null, topic: 'letter' }, o);

  // 小写 → 大写
  const upper = d => {
    const l = d === 0 ? U.pick('abcdef'.split('')) : d === 2 ? U.pick(CONF) : U.pick(LOW);
    const a = l.toUpperCase();
    const pool = d === 0 ? 'ABCDEF'.split('') : d === 2 ? CONF.map(x => x.toUpperCase()) : ALPHA;
    return q({
      prompt: `小写字母 ${l} 的大写是哪一个？`,
      speech: [ZH('小写字母'), EN(l), ZH('的大写是哪一个？')],
      scene: { kind: 'card', text: l, sub: '小写' },
      choices: three(a, pool), answer: a,
      hint: { text: `大写字母和小写字母是一对。${l} 和 ${a} 长得像，只是大一号。`, speech: [ZH('大写字母和小写字母是一对。'), EN(a), ZH('就是它的大写。')], visual: { kind: 'card', text: a, sub: '大写' } },
      explain: [`小写 ${l} 和大写 ${a} 是一对`, `所以选 ${a}`],
      explainSpeech: [ZH('小写'), EN(l), ZH('的大写是'), EN(a)],
    });
  };

  // 大写 → 小写
  const lower = d => {
    const L = d === 0 ? U.pick('ABCDEF'.split('')) : d === 2 ? U.pick(CONF).toUpperCase() : U.pick(ALPHA);
    const a = L.toLowerCase();
    const pool = d === 0 ? 'abcdef'.split('') : d === 2 ? CONF : LOW;
    return q({
      prompt: `大写字母 ${L} 的小写是哪一个？`,
      speech: [ZH('大写字母'), EN(L), ZH('的小写是哪一个？')],
      scene: { kind: 'card', text: L, sub: '大写' },
      choices: three(a, pool), answer: a,
      hint: { text: `大写 ${L} 和小写 ${a} 是一对，样子差不多。`, speech: [ZH('大写'), EN(L), ZH('的小写是'), EN(a)], visual: { kind: 'card', text: a, sub: '小写' } },
      explain: [`大写 ${L} 和小写 ${a} 是一对`, `所以选 ${a}`],
      explainSpeech: [ZH('大写'), EN(L), ZH('的小写是'), EN(a)],
    });
  };

  // 字母顺序：补空、后面是谁、前面是谁
  const order = d => {
    if (d === 0) {
      const s = U.rand(0, 19), miss = U.rand(1, 2);
      const items = [0, 1, 2, 3].map(i => i === miss ? '_' : ALPHA[s + i]);
      const a = ALPHA[s + miss];
      const pool = ALPHA.slice(Math.max(0, s - 2), s + 7);
      return q({
        prompt: `${items.map(x => x === '_' ? '＿' : x).join(' ')}，缺少哪个字母？`,
        speech: [ZH('按字母表顺序，缺少哪个字母？'), EN(items.filter(x => x !== '_').join(' '))],
        scene: { kind: 'seq', items },
        choices: three(a, pool), answer: a,
        hint: { text: '按字母歌的顺序数一数，空的前面是谁，后面是谁。', visual: { kind: 'seq', items } },
        explain: [`按顺序是 ${ALPHA.slice(s, s + 4).join(' ')}`, `缺少的是 ${a}`],
      });
    }
    const isAfter = d === 1;
    const s = U.rand(isAfter ? 0 : 1, isAfter ? 24 : 25);
    const base = ALPHA[s], a = ALPHA[isAfter ? s + 1 : s - 1];
    return q({
      prompt: `字母 ${base} 的${isAfter ? '后面' : '前面'}是哪一个？`,
      speech: [ZH('字母'), EN(base), ZH(`的${isAfter ? '后面' : '前面'}是哪一个？`)],
      scene: { kind: 'card', text: base, sub: isAfter ? '后面是谁？' : '前面是谁？' },
      choices: three(a, ALPHA), answer: a,
      hint: { text: `唱一遍字母歌：${ALPHA.slice(Math.max(0, s - 2), s + 3).join(' ')}。`, visual: { kind: 'card', text: base } },
      explain: [`按顺序：${ALPHA.slice(Math.max(0, s - 1), s + 2).join(' ')}`, `所以 ${base} 的${isAfter ? '后面' : '前面'}是 ${a}`],
    });
  };

  // 首字母：图片 + 单词
  const WORDS = [
    { w: 'apple', zh: '苹果', e: '🍎' }, { w: 'bag', zh: '书包', e: '🎒' }, { w: 'banana', zh: '香蕉', e: '🍌' },
    { w: 'bird', zh: '小鸟', e: '🐦' }, { w: 'black', zh: '黑色', e: '⚫' }, { w: 'blue', zh: '蓝色', e: '🔵' },
    { w: 'book', zh: '书', e: '📕' }, { w: 'cat', zh: '小猫', e: '🐱' }, { w: 'crayon', zh: '蜡笔', e: '🖍️' },
    { w: 'dog', zh: '小狗', e: '🐶' }, { w: 'duck', zh: '鸭子', e: '🦆' }, { w: 'ear', zh: '耳朵', e: '👂' },
    { w: 'elephant', zh: '大象', e: '🐘' }, { w: 'eraser', zh: '橡皮', e: '🧽' }, { w: 'eye', zh: '眼睛', e: '👁️' },
    { w: 'face', zh: '脸', e: '🙂' }, { w: 'fish', zh: '小鱼', e: '🐟' }, { w: 'grape', zh: '葡萄', e: '🍇' },
    { w: 'green', zh: '绿色', e: '🟢' }, { w: 'monkey', zh: '猴子', e: '🐵' }, { w: 'mouth', zh: '嘴巴', e: '👄' },
    { w: 'nose', zh: '鼻子', e: '👃' }, { w: 'orange', zh: '橘子', e: '🍊' }, { w: 'panda', zh: '熊猫', e: '🐼' },
    { w: 'pear', zh: '梨', e: '🍐' }, { w: 'pencil', zh: '铅笔', e: '✏️' }, { w: 'pink', zh: '粉色', e: '💗' },
    { w: 'purple', zh: '紫色', e: '🟣' }, { w: 'rabbit', zh: '兔子', e: '🐰' }, { w: 'red', zh: '红色', e: '🔴' },
    { w: 'ruler', zh: '尺子', e: '📏' }, { w: 'six', zh: '六', e: '6️⃣' }, { w: 'ten', zh: '十', e: '🔟' },
    { w: 'three', zh: '三', e: '3️⃣' }, { w: 'tiger', zh: '老虎', e: '🐯' }, { w: 'white', zh: '白色', e: '⚪' },
    { w: 'yellow', zh: '黄色', e: '🟡' },
  ];
  const EASY = ['apple', 'cat', 'dog', 'fish', 'monkey', 'tiger'];
  const TRICKY = ['bag', 'banana', 'bird', 'black', 'blue', 'book', 'panda', 'pear', 'pencil', 'pink', 'purple', 'rabbit', 'red', 'ruler', 'ten', 'three', 'tiger'];

  const first = d => {
    const pool = d === 0 ? EASY : d === 2 ? TRICKY : WORDS.map(x => x.w);
    const x = U.pick(WORDS.filter(y => pool.includes(y.w)));
    const a = x.w[0].toUpperCase();
    const like = { B: ['D', 'P'], D: ['B', 'P'], P: ['B', 'D'], M: ['N', 'W'], N: ['M', 'U'], R: ['P', 'B'], T: ['F', 'D'], G: ['J', 'C'], E: ['I', 'A'], A: ['E', 'O'], C: ['G', 'S'], F: ['T', 'V'], W: ['M', 'V'], Y: ['V', 'W'], O: ['A', 'U'], U: ['V', 'W'], S: ['C', 'Z'], L: ['I', 'T'], I: ['L', 'E'], K: ['C', 'X'], V: ['W', 'U'], Z: ['S', 'X'], J: ['G', 'Y'], H: ['N', 'A'], Q: ['P', 'G'] }[a] || ['A', 'B'];
    return q({
      prompt: `单词 ${x.w} 的第一个字母是？`,
      speech: [ZH('这个单词的第一个字母是哪一个？'), EN(x.w)],
      scene: { kind: 'word', w: x.w, zh: x.zh, e: x.e },
      choices: three(a, [...like, ...ALPHA]), answer: a,
      hint: { text: `${x.w} 读作「${x.zh}」，开头的声音是 ${a}。`, speech: [EN(x.w), ZH('开头的字母是'), EN(a)] },
      explain: [`${x.w} 以 ${a} 开头`, `${a} for ${x.w}`],
      explainSpeech: [ZH('这个单词以'), EN(a), ZH('开头'), EN(x.w)],
    });
  };

  Q.register('en-upper', '大写字母', upper, '大小写一对一对，记得真牢');
  Q.register('en-lower', '小写字母', lower, '大小写一对一对，记得真牢');
  Q.register('en-pair', '大小写配对', d => (Math.random() < 0.5 ? upper(d) : lower(d)), '大小写配对又快又准');
  Q.register('en-order', '字母顺序', order, '字母歌的顺序记得真清楚');
  Q.register('en-first', '首字母', first, '一听就知道开头是哪个字母');
})(window.TM);
