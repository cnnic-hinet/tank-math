// 题目框架：注册题型、通用构造器、提示与讲解
// 一道题的结构：
// { type, diff(0基础/1提高/2挑战), prompt, sub, speak, scene, choices, answer,
//   hint: {text, visual}, explain: [步骤...] }
(function (TM) {
  const U = TM.U;
  const Q = { gens: {}, names: {}, praise: {} };

  // praise：战报里具体表扬用的话，比如“凑十法用得真棒”
  Q.register = (type, name, gen, praise) => {
    Q.gens[type] = gen;
    Q.names[type] = name;
    Q.praise[type] = praise || `${name}做得真棒`;
  };

  Q.make = (type, diff) => {
    const q = Q.gens[type](diff);
    return Object.assign(q, { type, diff, id: U.uid() });
  };

  // 把算式变成朗读文字：8 + 5 = □ → 8加5等于几。问号留着，读起来才是问句的语气
  Q.say = s => String(s)
    .replace(/\s*\+\s*/g, '加')
    .replace(/\s*[−-]\s*/g, '减')
    .replace(/\s*=\s*/g, '等于')
    .replace(/\s*>\s*/g, '大于')
    .replace(/\s*<\s*/g, '小于')
    .replace(/□/g, '几')
    .replace(/\?/g, '？')
    .replace(/\s+/g, '');

  // 以“几”结尾的算式补一个问号
  const ask = s => (/几$/.test(s) ? s + '？' : s);

  // 数字选择题
  Q.num = o => ({
    prompt: o.prompt,
    sub: o.sub || '',
    speak: o.speak || ask(Q.say(o.prompt)),
    scene: o.scene || null,
    answer: o.answer,
    choices: U.numChoices(o.answer, { min: o.min ?? 0, max: o.max ?? 20, near: o.near || [] }),
    hint: o.hint,
    explain: o.explain,
  });

  // 选项直接给定的选择题（符号、动物、"4和6" 这类）
  Q.pick = o => Object.assign({ sub: '', scene: null, speak: ask(Q.say(o.prompt)) }, o);

  // 比较题：left/right 是显示文字，lv/rv 是对应数值
  const sym = (l, r) => (l > r ? '>' : l < r ? '<' : '=');
  Q.cmp = (left, right, lv, rv, extra = {}) => {
    const ans = sym(lv, rv);
    const steps = [];
    if (left !== String(lv)) steps.push(`${left} = ${lv}`);
    if (right !== String(rv)) steps.push(`${right} = ${rv}`);
    steps.push(`${lv} ${ans} ${rv}，所以填“${ans}”`);
    return {
      prompt: `${left} ○ ${right}`,
      sub: extra.sub || '○ 里填 >、< 还是 = ？',
      speak: `${Q.say(left)}，和，${Q.say(right)}，比一比，圆圈里填什么？`,
      scene: null,
      choices: ['>', '<', '='],
      answer: ans,
      hint: extra.hint || {
        text: '先算出两边各是几，再比大小。大于号、小于号的开口朝着大的数。',
        visual: lv <= 10 && rv <= 10
          ? { kind: 'rows', rows: [{ e: '🔵', n: lv }, { e: '🔴', n: rv }] }
          : { kind: 'line', from: 0, to: 20, marks: [lv, rv] },
      },
      explain: extra.explain || steps,
    };
  };

  // 加减法的提示和讲解
  Q.addHint = (a, b) => ({
    text: `先摆 ${a} 个，再摆 ${b} 个，合起来数一数。`,
    visual: { kind: 'dots', groups: [a, b] },
  });
  Q.subHint = (a, b) => ({
    text: `摆 ${a} 个，划掉 ${b} 个，数一数还剩几个。`,
    visual: { kind: 'cross', n: a, cross: b },
  });
  Q.addExplain = (a, b) => [`${a} 和 ${b} 合起来`, `${a} + ${b} = ${a + b}`];
  Q.subExplain = (a, b) => [`从 ${a} 里去掉 ${b}`, `${a} − ${b} = ${a - b}`];

  // 凑十法：拆小数，凑大数
  Q.tenHint = (a, b) => {
    const big = Math.max(a, b), small = Math.min(a, b), need = 10 - big;
    return {
      text: `${big} 还差 ${need} 就是 10。把 ${small} 分成 ${need} 和 ${small - need}，先凑成 10。`,
      visual: { kind: 'tenframe', a: big, b: small },
    };
  };
  Q.tenExplain = (a, b) => {
    const big = Math.max(a, b), small = Math.min(a, b), need = 10 - big, rest = small - need;
    const steps = [];
    if (a < b) steps.push(`${a} + ${b} 和 ${b} + ${a} 一样大`);
    return steps.concat([
      `${big} 还差 ${need} 凑成 10`,
      `把 ${small} 分成 ${need} 和 ${rest}`,
      `${big} + ${need} = 10`,
      `10 + ${rest} = ${10 + rest}`,
    ]);
  };

  // 题目里用到的东西：[图标, 名称, 量词]
  Q.THINGS = [
    ['🍎', '苹果', '个'], ['⭐', '星星', '颗'], ['🐟', '小鱼', '条'], ['🚗', '小汽车', '辆'],
    ['🎈', '气球', '个'], ['🐤', '小鸡', '只'], ['🌸', '花', '朵'], ['🍓', '草莓', '个'],
  ];

  // 朗读时把图标换成名字，几个图标挨着就用顿号隔开
  const NAMES = {
    '🐶': '小狗', '🐱': '小猫', '🐰': '小兔', '🐼': '熊猫', '🐯': '老虎', '🐵': '猴子', '🐷': '小猪', '🐸': '青蛙',
    '🐻': '小熊', '🦊': '狐狸', '🐔': '公鸡', '🐮': '小牛', '🐨': '考拉', '🐤': '小黄鸡',
    '🍎': '红苹果', '🍏': '青苹果', '🍌': '香蕉', '🍇': '葡萄', '🍉': '西瓜', '🍑': '桃子', '🍐': '梨', '🍓': '草莓',
    '🍒': '樱桃', '🍋': '柠檬', '🍊': '橘子', '🥕': '胡萝卜', '🥦': '西兰花', '🌽': '玉米', '🍆': '茄子', '🥒': '黄瓜',
    '🚗': '小汽车', '🚌': '公交车', '🚲': '自行车', '✈': '飞机', '🚂': '火车', '🚢': '轮船', '🚒': '消防车', '🚕': '出租车',
    '✏': '铅笔', '📏': '尺子', '📒': '本子', '🖍': '蜡笔', '🌹': '玫瑰花', '🌻': '向日葵',
    '🧱': '砖头', '📦': '箱子', '🧃': '果汁盒', '🎲': '骰子', '🧊': '冰块', '🥫': '罐头', '🔋': '电池', '🧻': '卷纸',
    '⚽': '足球', '🏀': '篮球', '⚾': '棒球', '🧸': '小熊玩具', '📚': '书', '🎨': '颜料', '🧩': '拼图', '🎈': '气球',
    '📕': '红色的书', '📘': '蓝色的书', '🎁': '礼物盒', '⭐': '星星', '🐟': '小鱼', '🌸': '花',
  };
  Q.speech = s => Q.say(String(s).replace(/\p{Extended_Pictographic}\uFE0F?/gu, m => `‹${NAMES[m.replace('\uFE0F', '')] || ''}›`))
    .replace(/›‹/g, '、').replace(/[‹›]/g, '').replace(/、{2,}/g, '、').replace(/○/g, '圆圈').replace(/△/g, '三角形')
    .replace(/①/g, '一').replace(/②/g, '二');

  TM.Q = Q;
})(window.TM);
