// 英语课本 Unit 1、2 的题型
// Unit 1 Hello!：hello, hi, bye；Hello! I'm Chen Jie.
// Unit 2 My first class：pencil, book, show, open；Open your book, please. / Show me your pencil, please.
// 原则：整词认读，不出单独字母；图全部用 Art 插画
(function (TM) {
  const { Q, U } = TM;
  const { pick, shuffle } = U;

  const EN = t => ({ text: t, lang: 'en' });
  const ZH = t => ({ text: t });
  const art = key => ({ kind: 'art', key });
  // 正确答案 + 两个干扰项，打乱
  const three = (ans, pool) => shuffle([ans, ...shuffle(pool.filter(x => x !== ans)).slice(0, 2)]);

  const KIDS = [
    { k: 'chen', en: 'Chen Jie', zh: '陈杰' },
    { k: 'li', en: 'Li Dong', zh: '李东' },
    { k: 'wu', en: 'Wu Binbin', zh: '吴斌斌' },
    { k: 'john', en: 'John', zh: 'John' },
    { k: 'sarah', en: 'Sarah', zh: 'Sarah' },
  ];
  const kidOf = k => KIDS.find(x => x.k === k) || KIDS[0];

  // ---------- Unit 1 ----------
  // 听句子，认人：Hello! I'm Chen Jie.
  Q.register('u1-who', '听音选人', d => {
    const p = pick(KIDS);
    const greet = d === 2 ? pick(['Hello', 'Hi']) : 'Hello';
    return {
      prompt: '听一听，他是谁？',
      speech: [ZH('听一听，他是谁？'), EN(`${greet}! I'm ${p.en}.`)],
      pic: 'art',
      choices: three('p:' + p.k + ':wave', KIDS.map(x => 'p:' + x.k + ':wave')),
      answer: 'p:' + p.k + ':wave',
      topic: 'listen',
      hint: { text: `听到 “I'm …” 后面的名字，就选那个人。${p.en} 就是${p.zh}。`, visual: art('p:' + p.k + ':wave') },
      explain: [`刚才说的是 “${greet}! I'm ${p.en}.”`, `${p.en} 是${p.zh}。`, `所以选${p.zh}。`],
    };
  }, '听得真仔细');

  // 听 hello / hi / bye，选整个词
  Q.register('u1-word', '听音选词', d => {
    const w = pick(['hello', 'hi', 'bye']);
    return {
      prompt: '听一听，是哪个词？',
      speech: [ZH('听一听，是哪个词？'), EN(w)],
      choices: three(w, ['hello', 'hi', 'bye']),
      answer: w,
      topic: 'listen',
      hint: { text: 'hello 和 hi 都是打招呼，bye 是再见。听清楚开头的声音。' },
      explain: [`刚才读的是 “${w}”。`, w === 'bye' ? 'bye 是再见，挥手说再见。' : `${w} 是打招呼，见面时说。`],
    };
  }, '单词听得很准');

  // 听句子，选画面：打招呼 / 道别
  Q.register('u1-say', '听句子选图', d => {
    const bye = Math.random() < 0.35;
    const p = pick(KIDS);
    const sceneOf = k => 's:greet:' + k;
    if (bye) {
      const others = shuffle(KIDS.filter(x => x.k !== p.k)).slice(0, 2).map(x => sceneOf(x.k));
      return {
        prompt: '听一听，是哪一幅图？',
        speech: [ZH('听一听，是哪一幅图？'), EN('Bye!')],
        pic: 'art',
        choices: shuffle(['s:bye:john', ...others]),
        answer: 's:bye:john',
        topic: 'sentence',
        hint: { text: '打招呼是两个小朋友互相挥手；说再见是挥着手往外走。' },
        explain: ['刚才说的是 “Bye!”，是再见。', '画面里只有一个人在挥手往外走，就是道别。'],
      };
    }
    const greet = d === 0 ? 'Hello' : pick(['Hello', 'Hi']);
    const others = shuffle(KIDS.filter(x => x.k !== p.k)).slice(0, 2).map(x => sceneOf(x.k));
    return {
      prompt: '听一听，是哪一幅图？',
      speech: [ZH('听一听，是哪一幅图？'), EN(`${greet}! I'm ${p.en}.`)],
      pic: 'art',
      choices: shuffle([sceneOf(p.k), ...others]),
      answer: sceneOf(p.k),
      topic: 'sentence',
      hint: { text: `先听名字：“I'm ${p.en}.” 就是${p.zh}。看哪幅图里是${p.zh}在挥手。` },
      explain: [`刚才说的是 “${greet}! I'm ${p.en}.”`, `图里前面的人是${p.zh}。`, '打招呼的两个小朋友都在挥手。'],
    };
  }, '句子听懂了');

  // 中文名字配英文名字
  Q.register('u1-name', '名字配对', d => {
    const p = pick(KIDS);
    return {
      prompt: `“${p.zh}”的英文名字是哪个？`,
      speech: [ZH(`“${p.zh}”的英文名字是哪个？`), EN(p.en)],
      choices: three(p.en, KIDS.map(x => x.en)),
      answer: p.en,
      topic: 'word',
      hint: { text: `课本里${p.zh}的英文名字是 ${p.en}。`, visual: art('p:' + p.k + ':wave') },
      explain: [`${p.zh} 的英文名字是 ${p.en}。`, '英文名字和人是对应的，多念两遍就记住了。'],
    };
  }, '名字记得真牢');

  // 找不同
  Q.register('u1-odd', '找不同', d => {
    if (d === 2) {
      const p = pick(KIDS);
      const ans = `I'm ${p.en}.`;
      return {
        prompt: '哪一句话是在介绍自己？',
        speech: [ZH('哪一句话是在介绍自己？'), EN(ans)],
        choices: shuffle([ans, 'Hello!', 'Bye!']),
        answer: ans,
        topic: 'sentence',
        hint: { text: '“I\'m …” 后面跟名字，就是在说“我是谁”。' },
        explain: [`“${ans}” 意思是“我是${p.zh}”，是在介绍自己。`, 'Hello! 是打招呼，Bye! 是再见。'],
      };
    }
    return {
      prompt: '哪一个是「再见」？',
      speech: [ZH('哪一个是「再见」？')],
      choices: three('bye', ['hello', 'hi', 'bye']),
      answer: 'bye',
      topic: 'word',
      hint: { text: 'bye 是再见，hello 和 hi 都是见面打招呼。', visual: art('s:bye:john') },
      explain: ['bye 是再见。', 'hello 和 hi 都是见面打招呼的话。'],
    };
  }, '分得真清楚');

  // ---------- Unit 2 ----------
  // 听 pencil / book，选东西
  Q.register('u2-item', '听音选物', d => {
    const t = pick(['pencil', 'book']);
    const pool = ['i:pencil', 'i:book', 'i:desk', 'i:board', 'i:bag', 'i:apple'];
    return {
      prompt: '听一听，是哪一个？',
      speech: [ZH('听一听，是哪一个？'), EN(t)],
      pic: 'art',
      choices: three('i:' + t, pool),
      answer: 'i:' + t,
      topic: 'listen',
      hint: { text: 'pencil 是铅笔，长长的；book 是书，方方的。', visual: art('i:' + t) },
      explain: [`刚才读的是 “${t}”。`, t === 'pencil' ? 'pencil 是铅笔。' : 'book 是书。'],
    };
  }, '学习用品认得快');

  // 听老师的话，选画面
  Q.register('u2-cmd', '老师的指令', d => {
    const MAIN = [
      { key: 's:openbook:li', en: 'Open your book, please.', zh: '打开你的书' },
      { key: 's:showpencil:wu', en: 'Show me your pencil, please.', zh: '把你的铅笔给我看看' },
      { key: 's:morning:miss:chen', en: 'Good morning!', zh: '早上好' },
    ];
    const ans = pick(MAIN);
    const pool = MAIN.map(x => x.key).concat(d === 0 ? [] : ['s:board:miss', 's:classbook:miss']);
    return {
      prompt: '听一听，小朋友在做什么？',
      speech: [ZH('听一听，小朋友在做什么？'), EN(ans.en)],
      pic: 'art',
      choices: three(ans.key, pool),
      answer: ans.key,
      topic: 'sentence',
      hint: { text: `${ans.en} 的意思是「${ans.zh}」。` },
      explain: [`老师说的是 “${ans.en}”。`, `意思是「${ans.zh}」。`, '选对应的那幅图。'],
    };
  }, '老师的指令都听懂了');

  // 听英文，选中文意思
  Q.register('u2-mean', '听句子选中文', d => {
    const WORDS = [
      { en: 'pencil', zh: '铅笔' },
      { en: 'book', zh: '书' },
      { en: 'open', zh: '打开' },
      { en: 'show', zh: '给我看' },
    ];
    const SENT = [
      { en: 'Open your book, please.', zh: '请打开你的书' },
      { en: 'Show me your pencil, please.', zh: '请把你的铅笔给我看看' },
      { en: 'Good morning!', zh: '早上好' },
    ];
    const pool = d === 0 ? WORDS : d === 1 ? WORDS.concat(SENT) : SENT.concat(WORDS);
    const ans = d === 0 ? pick(WORDS) : pick(d === 1 ? pool : SENT);
    return {
      prompt: '听一听，是什么意思？',
      speech: [ZH('听一听，中文是什么意思？'), EN(ans.en)],
      choices: three(ans.zh, pool.map(x => x.zh)),
      answer: ans.zh,
      topic: 'sentence',
      hint: { text: `“${ans.en}” 就是「${ans.zh}」。把整句连起来想。` },
      explain: [`刚才说的是 “${ans.en}”。`, `意思是「${ans.zh}」。`],
    };
  }, '意思抓得很准');

  // 看图选词
  Q.register('u2-word', '看图选词', d => {
    const t = pick(['pencil', 'book']);
    const key = 'i:' + t;
    const pool = ['pencil', 'book'].concat(d === 0 ? [pick(['open', 'show'])] : ['open', 'show']);
    return {
      prompt: '看图，选出对应的单词。',
      speech: [ZH('看图，选出对应的单词。')],
      scene: art(key),
      choices: three(t, pool),
      answer: t,
      topic: 'word',
      hint: { text: `图上是${t === 'pencil' ? '铅笔' : '书'}，英文是 ${t}。` },
      explain: [`图上是${t === 'pencil' ? '铅笔' : '一本书'}。`, `英文是 ${t}。`],
    };
  }, '单词和图片对得上');

  // 找不同：哪个不是上学要带的
  Q.register('u2-odd', '找不同', d => {
    if (d === 2) {
      return {
        prompt: '哪一个是上学要带的？',
        speech: [ZH('哪一个是上学要带的？')],
        pic: 'art',
        choices: shuffle(['i:pencil', 'i:apple', 'i:ball']),
        answer: 'i:pencil',
        topic: 'word',
        hint: { text: '铅笔是学习用品，苹果和皮球不是。' },
        explain: ['铅笔是上学要带的。', '苹果是吃的，皮球是玩的。'],
      };
    }
    return {
      prompt: '哪一个不是上学要带的？',
      speech: [ZH('哪一个不是上学要带的？')],
      pic: 'art',
      choices: shuffle(['i:pencil', 'i:book', 'i:apple']),
      answer: 'i:apple',
      topic: 'word',
      hint: { text: '铅笔和书都是学习用品，苹果是吃的。' },
      explain: ['铅笔和书都是上学要用的。', '苹果是吃的，不是学习用品。'],
    };
  }, '学习用品分得清');
})(window.TM);
