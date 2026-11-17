// 英语课本 Unit 1、2 的题型
// Unit 1 Hello!：hello, hi, bye；日常打招呼和礼貌用语
// Unit 2 My first class：pencil, book, show, open；课堂指令
// 原则：整词整句认读，不出单独字母；不考课本人物是谁、谁叫什么名字；题目都落在生活场景里
(function (TM) {
  const { Q, U } = TM;
  const { pick, shuffle } = U;

  const EN = t => ({ text: t, lang: 'en' });
  const ZH = t => ({ text: t });
  const art = key => ({ kind: 'art', key });
  // 正确答案 + 两个干扰项，打乱
  const three = (ans, pool) => shuffle([ans, ...shuffle(pool.filter(x => x !== ans)).slice(0, 2)]);

  // ---------- Unit 1：见面、道别、谢谢、对不起 ----------
  // lv 是这个场景最早出现在哪一档，基础档只用最常用的三个
  const SAY = [
    { en: ['Hello!', 'Hi!'], zh: '你好', scene: 's:greet:chen:li', lv: 0, what: '见面打招呼' },
    { en: ['Bye!', 'Goodbye!'], zh: '再见', scene: 's:bye:john', lv: 0, what: '说再见' },
    { en: ['Good morning!'], zh: '早上好', scene: 's:morning:miss:chen', lv: 0, what: '早上问好' },
    { en: ['Thank you!'], zh: '谢谢', scene: 's:thank:li:chen', lv: 0, what: '道谢' },
    { en: ['Here you are.'], zh: '给你', scene: 's:here:li', lv: 1, what: '把东西递给别人' },
    { en: ["I'm sorry."], zh: '对不起', scene: 's:sorry:wu', lv: 2, what: '道歉' },
  ];
  const sayPool = d => SAY.filter(x => x.lv <= d);
  const sayKey = p => p.en.join(' / ');

  // 听一句日常用语，选出对应的场景
  Q.register('u1-say', '听句子选场景', d => {
    const p = pick(sayPool(d));
    const said = pick(p.en);
    const others = sayPool(d).filter(x => x.scene !== p.scene);
    return {
      prompt: '听一听，选哪幅图？',
      speech: [ZH('听一听，选哪幅图？'), EN(said)],
      saidZh: p.zh,
      subEn: said,
      pic: 'art',
      choices: three(p.scene, others.map(x => x.scene)),
      answer: p.scene,
      topic: 'sentence',
      hint: { text: `“${sayKey(p)}” 是${p.what}的意思。`, visual: art(p.scene) },
      explain: [`刚才说的是 “${said}”。`, `意思是「${p.zh}」，${p.what}。`],
    };
  }, '场景听懂了');

  // 听音选词：听懂是 hello、hi、bye 还是 please
  Q.register('u1-word', '听音选词', d => {
    const WORDS = [
      { en: 'hello', zh: '你好', lv: 0 },
      { en: 'hi', zh: '嗨', lv: 0 },
      { en: 'bye', zh: '再见', lv: 0 },
      { en: 'good morning', zh: '早上好', lv: 0 },
      { en: 'thank you', zh: '谢谢', lv: 1 },
      { en: 'please', zh: '请', lv: 2 },
    ];
    const pool = WORDS.filter(x => x.lv <= d);
    const ans = pick(pool);
    return {
      prompt: '听一听，是哪一个？',
      speech: [ZH('听一听，是哪一个？'), EN(ans.en)],
      choices: three(ans.en, pool.map(x => x.en)),
      answer: ans.en,
      topic: 'listen',
      hint: { text: `“${ans.en}” 是「${ans.zh}」。` },
      explain: [`刚才读的是 “${ans.en}”，意思是「${ans.zh}」。`],
    };
  }, '听得很准');

  // 看场景选话：这个场景该说什么
  Q.register('u1-pick', '场景选话', d => {
    const p = pick(sayPool(d));
    const others = sayPool(d).filter(x => x.scene !== p.scene);
    const ans = pick(p.en);
    return {
      prompt: '看图，该说什么？',
      speech: [ZH('看图，该说什么？')],
      scene: art(p.scene),
      choices: three(ans, others.flatMap(x => x.en)),
      answer: ans,
      topic: 'sentence',
      hint: { text: `图上是${p.what}，用英语说 “${ans}”。` },
      explain: [`图上是${p.what}。`, `英语说 “${ans}”，意思是「${p.zh}」。`],
    };
  }, '场景话说得对');

  // 英文选中文意思
  Q.register('u1-mean', '意思配对', d => {
    const pool = sayPool(d);
    const ans = pick(pool);
    const said = pick(ans.en);
    return {
      prompt: '听一听，什么意思？',
      speech: [ZH('听一听，中文是什么意思？'), EN(said)],
      subEn: said,
      choices: three(ans.zh, pool.map(x => x.zh)),
      answer: ans.zh,
      topic: 'word',
      hint: { text: `“${sayKey(ans)}” 就是「${ans.zh}」。` },
      explain: [`刚才说的是 “${said}”。`, `意思是「${ans.zh}」，${ans.what}。`],
    };
  }, '意思抓得准');

  // 找不同：哪一句是道别、道谢、道歉。每档多备几个问法，同一关不重样
  Q.register('u1-odd', '找不同', d => {
    const MD = [
      [
        { q: '哪一个是「你好」？', a: 'Hello!', pool: ['Hello!', 'Bye!', 'Thank you!'], h: 'Hello 是你好，见面打招呼的时候说。' },
        { q: '哪一个是「再见」？', a: 'Bye!', pool: ['Hello!', 'Hi!', 'Bye!'], h: 'Bye 是再见，Hello 和 Hi 都是见面打招呼。' },
        { q: '哪一个是「早上好」？', a: 'Good morning!', pool: ['Good morning!', 'Hello!', 'Bye!'], h: 'Good morning 是早上好，只有早上才说。' },
        { q: '哪一个是「谢谢」？', a: 'Thank you!', pool: ['Thank you!', 'Hello!', 'Bye!'], h: 'Thank you 是谢谢，别人给你东西的时候说。' },
      ],
      [
        { q: '哪一个是「谢谢」？', a: 'Thank you!', pool: ['Thank you!', 'I\'m sorry.', 'Bye!'], h: 'Thank you 是谢谢，别人帮了你的时候说。' },
        { q: '哪一个是「对不起」？', a: "I'm sorry.", pool: ['Here you are.', "I'm sorry.", 'Thank you!'], h: 'I\'m sorry 是对不起，做错事的时候说。' },
        { q: '哪一个是「早上好」？', a: 'Good morning!', pool: ['Good morning!', 'Thank you!', 'Bye!'], h: 'Good morning 是早上好，早上见到人时说。' },
      ],
      [
        { q: '哪一个是「对不起」？', a: "I'm sorry.", pool: ['Here you are.', "I'm sorry.", 'Thank you!'], h: 'I\'m sorry 是对不起，做错事的时候说。' },
        { q: '哪一个是「给你」？', a: 'Here you are.', pool: ['Here you are.', 'Good morning!', 'Thank you!'], h: 'Here you are 是给你，把东西递过去的时候说。' },
        { q: '哪一个是「谢谢」？', a: 'Thank you!', pool: ['Thank you!', "I'm sorry.", 'Bye!'], h: 'Thank you 是谢谢，别人给你东西的时候说。' },
      ],
    ];
    const m = pick(MD[d]);
    return {
      prompt: m.q,
      speech: [ZH(m.q)],
      choices: shuffle(m.pool.slice()),
      answer: m.a,
      topic: 'sentence',
      hint: { text: m.h },
      explain: [`“${m.a}” 就是这一句。`, m.h],
    };
  }, '分得真清楚');

  // ---------- Unit 2：课堂和学校生活 ----------
  // 学习用品：听音选物、看图选词共用这一组答案，一关 6 题能全不重样
  const ITEMS = [
    { key: 'pencil', en: 'pencil', zh: '铅笔' },
    { key: 'book', en: 'book', zh: '书' },
    { key: 'bag', en: 'bag', zh: '书包' },
    { key: 'pencilcase', en: 'pencil box', zh: '铅笔盒' },
    { key: 'ruler', en: 'ruler', zh: '尺子' },
    { key: 'eraser', en: 'eraser', zh: '橡皮' },
  ];
  const DO = [
    { en: 'Open your book, please.', zh: '请打开你的书', scene: 's:openbook:li', lv: 0 },
    { en: 'Show me your pencil, please.', zh: '请把你的铅笔给我看看', scene: 's:showpencil:wu', lv: 0 },
    { en: 'Look at the board.', zh: '看黑板', scene: 's:board:miss', lv: 0 },
    { en: 'Close your book, please.', zh: '请合上你的书', scene: 's:closebook:wu', lv: 0 },
    { en: 'Good morning!', zh: '早上好', scene: 's:morning:miss:chen', lv: 1 },
    { en: 'Listen to me.', zh: '听我说', scene: 's:listen:miss', lv: 2 },
  ];
  const doPool = d => DO.filter(x => x.lv <= d);

  // 听 pencil / book，选东西
  Q.register('u2-item', '听音选物', d => {
    const t = pick(ITEMS);
    const pool = ITEMS.map(x => 'i:' + x.key).concat(['i:desk', 'i:board', 'i:apple']);
    return {
      prompt: '听一听，是哪一个？',
      speech: [ZH('听一听，是哪一个？'), EN(t.en)],
      pic: 'art',
      choices: three('i:' + t.key, pool),
      answer: 'i:' + t.key,
      topic: 'listen',
      hint: { text: `${t.en} 是${t.zh}。`, visual: art('i:' + t.key) },
      explain: [`刚才读的是 “${t.en}”。`, `${t.en} 是${t.zh}。`],
    };
  }, '学习用品认得快');

  // 听老师的话，选画面
  Q.register('u2-cmd', '老师的指令', d => {
    const ans = pick(doPool(d));
    const others = doPool(d).filter(x => x.scene !== ans.scene);
    return {
      prompt: '听一听，选哪幅图？',
      speech: [ZH('听一听，选哪幅图？'), EN(ans.en)],
      saidZh: ans.zh,
      subEn: ans.en,
      pic: 'art',
      choices: three(ans.scene, others.map(x => x.scene)),
      answer: ans.scene,
      topic: 'sentence',
      hint: { text: `${ans.en} 的意思是「${ans.zh}」。` },
      explain: [`老师说的是 “${ans.en}”。`, `意思是「${ans.zh}」。`, '选对应的那幅图。'],
    };
  }, '老师的指令都听懂了');

  // 看画面选指令：这幅图对应的指令是哪一句
  Q.register('u2-pick', '看画面选指令', d => {
    const ans = pick(doPool(d));
    const others = doPool(d).filter(x => x.scene !== ans.scene);
    return {
      prompt: '看图，老师在说什么？',
      speech: [ZH('看图，老师在说什么？')],
      scene: art(ans.scene),
      choices: three(ans.en, others.map(x => x.en)),
      answer: ans.en,
      topic: 'sentence',
      hint: { text: `图上是「${ans.zh}」，英语说 “${ans.en}”。` },
      explain: [`图上是「${ans.zh}」。`, `英语是 “${ans.en}”。`],
    };
  }, '看图就能说出指令');

  // 听英文，选中文意思
  Q.register('u2-mean', '听句子选中文', d => {
    const WORDS = [
      { en: 'pencil', zh: '铅笔' },
      { en: 'book', zh: '书' },
      { en: 'open', zh: '打开' },
      { en: 'show', zh: '给我看' },
    ];
    const SENT = DO;
    const pool = d === 0 ? WORDS : d === 1 ? WORDS.concat(SENT) : SENT.concat(WORDS);
    const ans = d === 0 ? pick(WORDS) : pick(d === 1 ? pool : SENT);
    return {
      prompt: '听一听，什么意思？',
      speech: [ZH('听一听，中文是什么意思？'), EN(ans.en)],
      subEn: ans.en,
      choices: three(ans.zh, pool.map(x => x.zh)),
      answer: ans.zh,
      topic: 'sentence',
      hint: { text: `“${ans.en}” 就是「${ans.zh}」。把整句连起来想。` },
      explain: [`刚才说的是 “${ans.en}”。`, `意思是「${ans.zh}」。`],
    };
  }, '意思抓得很准');

  // 看图选词
  Q.register('u2-word', '看图选词', d => {
    const t = pick(ITEMS);
    const key = 'i:' + t.key;
    const pool = ITEMS.map(x => x.en).concat(d === 0 ? [pick(['open', 'show'])] : ['open', 'show']);
    return {
      prompt: '看图，选单词。',
      speech: [ZH('看图，选单词。')],
      scene: art(key),
      choices: three(t.en, pool),
      answer: t.en,
      topic: 'word',
      hint: { text: `图上是${t.zh}，英文是 ${t.en}。` },
      explain: [`图上是${t.zh}。`, `英文是 ${t.en}。`],
    };
  }, '单词和图片对得上');

  // 找不同：混一个不是学习用品的东西。每档多备几个问法，同一关不重样
  Q.register('u2-odd', '找不同', d => {
    const MD = [
      [
        { q: '哪一个不是上学要带的？', a: 'i:apple', pool: ['i:pencil', 'i:book', 'i:apple'], h: '铅笔和书都是学习用品，苹果是吃的。' },
        { q: '哪一个不是学习用品？', a: 'i:ball', pool: ['i:bag', 'i:ruler', 'i:ball'], h: '书包和尺子是学习用品，皮球是玩的。' },
        { q: '哪一个是上学要带的？', a: 'i:pencil', pool: ['i:pencil', 'i:apple', 'i:ball'], h: '铅笔是学习用品，苹果和皮球不是。' },
        { q: '哪一个是吃的？', a: 'i:apple', pool: ['i:apple', 'i:book', 'i:ruler'], h: '苹果是吃的，书和尺子是学习用品。' },
      ],
      [
        { q: '哪一个不是学习用品？', a: 'i:cup', pool: ['i:pencilcase', 'i:eraser', 'i:cup'], h: '铅笔盒和橡皮是学习用品，杯子不是。' },
        { q: '哪一个是学习用品？', a: 'i:ruler', pool: ['i:ruler', 'i:apple', 'i:cup'], h: '尺子是学习用品，苹果和杯子不是。' },
        { q: '哪一个不是上学要带的？', a: 'i:cap', pool: ['i:book', 'i:ruler', 'i:cap'], h: '书和尺子是上学用的，帽子不是。' },
      ],
      [
        { q: '哪一个是学习用品？', a: 'i:eraser', pool: ['i:eraser', 'i:apple', 'i:ball'], h: '橡皮是学习用品，苹果和皮球不是。' },
        { q: '哪一个不是学习用品？', a: 'i:cup', pool: ['i:pencilcase', 'i:bag', 'i:cup'], h: '铅笔盒和书包是学习用品，杯子不是。' },
        { q: '哪一个是上学要带的？', a: 'i:bag', pool: ['i:bag', 'i:apple', 'i:cup'], h: '书包是上学要带的，苹果和杯子不是。' },
      ],
    ];
    const m = pick(MD[d]);
    return {
      prompt: m.q,
      speech: [ZH(m.q)],
      pic: 'art',
      choices: shuffle(m.pool.slice()),
      answer: m.a,
      topic: 'word',
      hint: { text: m.h },
      explain: [m.h],
    };
  }, '学习用品分得清');
})(window.TM);
