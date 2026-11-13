// 英语词库：整词认读，不拆字母。每个词带中文、图片、类别
// 类别用来出「同类干扰项」和「归类题」；picOk 表示有能直接当选项的图片
(function (TM) {
  const W = {};

  W.CATS = {
    animal: { name: '动物', icon: '🐾' },
    color: { name: '颜色', icon: '🎨' },
    number: { name: '数字', icon: '🔢' },
    fruit: { name: '水果', icon: '🍎' },
    school: { name: '学习用品', icon: '🎒' },
    body: { name: '身体', icon: '🙂' },
  };

  // w 单词，zh 中文，e 图片，cat 类别，picOk 能不能当图片选项
  const list = (cat, rows) => rows.map(([w, zh, e]) => ({ w, zh, e, cat, picOk: !!e }));

  W.LIST = [
    ...list('animal', [
      ['cat', '猫', '🐱'], ['dog', '狗', '🐶'], ['bird', '鸟', '🐦'], ['fish', '鱼', '🐟'],
      ['monkey', '猴子', '🐵'], ['panda', '熊猫', '🐼'], ['tiger', '老虎', '🐯'], ['elephant', '大象', '🐘'],
      ['rabbit', '兔子', '🐰'], ['duck', '鸭子', '🦆'],
    ]),
    ...list('fruit', [
      ['apple', '苹果', '🍎'], ['banana', '香蕉', '🍌'], ['orange', '橘子', '🍊'], ['pear', '梨', '🍐'],
      ['grape', '葡萄', '🍇'], ['peach', '桃子', '🍑'], ['watermelon', '西瓜', '🍉'], ['strawberry', '草莓', '🍓'],
    ]),
    ...list('school', [
      ['book', '书', '📕'], ['bag', '书包', '🎒'], ['pencil', '铅笔', '✏️'], ['ruler', '尺子', '📏'],
      ['eraser', '橡皮', '🧽'], ['crayon', '蜡笔', '🖍️'], ['pen', '钢笔', '🖊️'], ['pencil box', '铅笔盒', '🧰'],
    ]),
    ...list('body', [
      ['face', '脸', '🙂'], ['eye', '眼睛', '👁️'], ['ear', '耳朵', '👂'], ['nose', '鼻子', '👃'],
      ['mouth', '嘴巴', '👄'], ['hand', '手', '✋'], ['arm', '手臂', '💪'], ['leg', '腿', '🦵'], ['foot', '脚', '🦶'],
    ]),
    // 颜色和数字不给图片选项（颜色用色块、数字用数字），只当文字干扰项
    ...list('color', [
      ['red', '红色'], ['yellow', '黄色'], ['blue', '蓝色'], ['green', '绿色'], ['black', '黑色'],
      ['white', '白色'], ['pink', '粉色'], ['orange', '橙色'], ['purple', '紫色'], ['brown', '棕色'],
    ]).map(x => Object.assign(x, { picOk: false })),
    ...list('number', [
      ['one', '一'], ['two', '二'], ['three', '三'], ['four', '四'], ['five', '五'],
      ['six', '六'], ['seven', '七'], ['eight', '八'], ['nine', '九'], ['ten', '十'],
    ]).map(x => Object.assign(x, { picOk: false })),
  ];

  // 每个战区用哪几类词
  W.zone = {
    e1: ['animal'],
    e2: ['color', 'number'],
    e3: ['fruit'],
    e4: ['school'],
    e5: ['body'],
  };

  const inCats = cats => W.LIST.filter(x => cats.includes(x.cat));
  W.zoneWords = zoneId => inCats(W.zone[zoneId] || []);
  W.words = cats => (cats ? inCats(cats) : W.LIST.slice());
  W.other = cats => W.LIST.filter(x => !cats.includes(x.cat));
  // 有图片、能当选项的别的类别（水果、学习用品、身体），颜色和数字不给英语词选项
  W.concrete = cats => W.LIST.filter(x => !cats.includes(x.cat) && x.picOk);
  W.pics = cats => W.LIST.filter(x => x.picOk && (!cats || cats.includes(x.cat)));
  W.find = w => W.LIST.find(x => x.w === w);

  TM.Words = W;
})(window.TM);
