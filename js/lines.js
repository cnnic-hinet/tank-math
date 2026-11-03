// 作战台词（温柔老师）
// {n} = 昵称，{k} = 数字
(function (TM) {
  const { U, Audio } = TM;

  const LINES = {
    start: ['{n}，出发！', '坦克部队，出发啦！', '{n}，准备好了吗？出发！'],
    bossStart: ['Boss 决战！{n}，准备战斗！'],
    spawn: [''],
    super: ['能量满啦！呼叫空中支援！', '飞机来帮忙啦！'],
    crate: ['补给箱来啦，点一下打开它！'],
    heart: ['补给箱里有一颗红心！'],
    charge: ['补给箱里有能量，必杀技准备好啦！'],
    unlock: ['{n}解锁了新装备！快去装备库看看吧！'],
    elite: ['金色敌人来了，这是一道挑战题哦。', '挑战题来啦，慢慢想。'],
    boss: ['Boss 出现了！'],
    hit: ['打中啦！', '太棒了！', '漂亮！', '真厉害！', '命中目标！'],
    combo: ['{k}连胜！', '{k}连胜！{n}太厉害了！', '连续答对{k}道，能量涨起来啦！'],
    combo3: ['三连击！火力变强啦！', '连续答对三道，炮弹变大了！'],
    combo5: ['五连击！双发齐射！', '连续答对五道，双发炮弹来啦！'],
    combo8: ['八连击！呼叫空中支援！', '连续答对八道，飞机来帮忙啦！'],
    // 特殊小兵
    trait_shield: ['盾牌兵来了！它有护盾，要多打一下。'],
    trait_flyer: ['飞行兵来了！它会躲，要追着打。'],
    trait_counter: ['反击兵来了！答错会被打掉两颗心。'],
    shieldBreak: ['护盾碎啦！再打一下就消灭它！'],
    flyerDodge: ['它躲开啦！再打一下就掉下来！'],
    counter: ['反击兵打回来啦！掉了两颗心！'],
    // 复仇兵（以前答错的题，现在回来再考一次）
    revenge: ['{k}的老对手不服气，又回来啦！'],
    revengeWin: ['打退它啦！真棒！'],
    revengeMaster: ['它服啦，再也不敢来了！'],
    revengeStay: ['这次答对啦，再打它一次就服了！'],
    revengeEscape: ['它跑掉啦，下次还会来哦。'],
    bossHurt: ['打中 Boss 啦！', 'Boss 快撑不住了！'],
    bossDown: ['Boss 被打败啦！'],
    retry: ['再想一想。'],
    baseHit: ['没关系，我们一起看看。'],
    win: ['任务完成！', '胜利啦！'],
    lose: ['基地被攻破了。没关系，{n}，我们再来一次！'],
    warmup: ['出发前，先去维修厂修{k}辆坦克！'],
    fixed: ['修好啦！{n}真厉害！'],
    fixHalf: ['修好一半，再修一次就好！'],
    fixRetry: ['再想一想。'],
    fixMiss: ['没关系，我们一起看看。'],
    fixHint: ['用提示修好了，明天再来巩固一下！'],
    warmDone: ['热身完成，出发！'],
    garage: ['有{k}辆坦克等着修理！'],
    welcome: ['欢迎{n}来到坦克数学大作战！先做一个入营测试吧。'],
    placeDone: ['测试完成！{n}答对了{k}道题。'],
    rest: ['{n}，今天已经玩了很久啦，让眼睛休息一下，明天再来吧！'],
    hello: ['{n}你好，我们一起打坦克吧！'],
    mini: ['敌机编队来啦！看准了再开炮！'],
    medal: ['今天的任务全部完成，{n}拿到一枚勋章！'],
    goal: ['{n}攒满勋章啦！奖励是：'],
    // Boss 技能
    smoke: ['Boss 放烟雾弹啦！等烟散了再看题。'],
    minion: ['Boss 叫来了小兵！先打掉小兵！'],
    shield: ['Boss 打开了护盾！要多打一下才行。'],
    shuffle: ['Boss 把答案打乱啦！看仔细哦。'],
  };

  const Lines = {};
  const last = {};

  // 取一句台词（同一类不连着重复）
  Lines.get = (key, k) => {
    const pool = LINES[key] || [''];
    let s = U.pick(pool);
    if (pool.length > 1) for (let t = 0; t < 4 && s === last[key]; t++) s = U.pick(pool);
    last[key] = s;
    return s.replace(/\{n\}/g, TM.Store.data.nick).replace(/\{k\}/g, k);
  };

  // 说一句（作战画面上同时冒出字幕气泡）。
  // follow：说完再读的内容（题目、提示、讲解），中途被别的声音打断就不读了
  Lines.onSay = null;
  Lines.say = async (key, k, follow) => {
    const s = Lines.get(key, k);
    if (!s) return follow ? Audio.speak(follow) : undefined;
    if (Lines.onSay) Lines.onSay(s);
    const done = await Audio.speak(s);
    if (follow && done) await Audio.speak(follow);
  };

  TM.Lines = Lines;
})(window.TM);
