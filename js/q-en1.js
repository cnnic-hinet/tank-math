// 英语 · 单词乐园：听音选图、看图选词、词义配对、归类、听句子选图、找不同
// 整词认读，不拆字母：题目里不出现单独的字母，也不教拼写
(function (TM) {
  const { Q, U, Words: W } = TM;
  const EN = t => ({ text: t, lang: 'en' });
  const ZH = t => ({ text: t, lang: 'zh' });

  const q = o => Object.assign({ sub: '', scene: null, topic: 'word' }, o);
  // 正确答案 + 两个干扰项（去重、打乱）
  const three = (ans, pool) => U.shuffle([ans, ...U.shuffle([...new Set(pool.filter(x => x !== ans))]).slice(0, 2)]);
  const picOf = ws => ws.filter(x => x.picOk).map(x => x.e);
  const zhOf = ws => ws.map(x => x.zh);
  const wordOf = ws => ws.map(x => x.w);
  // 同一个单词可能出现在两个类别里（orange 既是颜色也是水果），按单词去重
  const uniqW = ws => {
    const out = [];
    ws.forEach(x => { if (!out.some(y => y.w === x.w)) out.push(x); });
    return out;
  };

  // 复数：fish 不变，其余加 s（词库里都够简单）
  const plural = w => (w === 'fish' ? 'fish' : w + 's');

  // 给一个战区生成一套题型。cats：这个战区包含的类别
  const makeZone = (prefix, cats, label) => {
    const zoneWords = () => W.words(cats);
    const catName = W.CATS[cats[0]].name;
    const isOnePic = w => w.picOk;

    // ---------- 听音选图：读一个单词，三张图选一张 ----------
    const listen = d => {
      const w = U.pick(zoneWords().filter(isOnePic));
      const pool = d === 0
        ? W.pics().filter(x => x.cat !== w.cat)
        : zoneWords().filter(isOnePic);
      return q({
        prompt: '听一听，是哪一个？',
        speech: [ZH('听一听，是哪一个？'), EN(w.w)],
        topic: 'listen',
        pic: true,
        choices: three(w.e, picOf(pool)),
        answer: w.e,
        hint: { text: `听到的是 ${w.w}，${w.w} 就是${w.zh}。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh }, speech: [EN(w.w), ZH(`是${w.zh}`)] },
        explain: [`听到的是 ${w.w}`, `${w.w} 是${w.zh}，所以选 ${w.e}`],
        explainSpeech: [ZH('听到的是'), EN(w.w), ZH(`就是${w.zh}`)],
      });
    };

    // ---------- 看图选词：给图，选单词（不读答案） ----------
    const pic = d => {
      const w = U.pick(zoneWords().filter(isOnePic));
      // 选项都是这个战区的词，孩子都见过，只是看图认单词
      const pool = zoneWords();
      return q({
        prompt: '这个用英语怎么说？',
        speech: [ZH('这个用英语怎么说？')],
        scene: { kind: 'pic', e: w.e, zh: d === 2 ? '' : w.zh },
        choices: three(w.w, wordOf(pool)),
        answer: w.w,
        hint: { text: `这个是${w.zh}，英语叫 ${w.w}。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh }, speech: [ZH(`这个是${w.zh}，英语叫`), EN(w.w)] },
        explain: [`${w.e} 是${w.zh}`, `英语是 ${w.w}`],
        explainSpeech: [ZH(`这个是${w.zh}，英语是`), EN(w.w)],
      });
    };

    // ---------- 词义配对：单词选中文，挑战档反过来 ----------
    const mean = d => {
      const w = U.pick(zoneWords());
      if (d < 2) {
        const pool = d === 0 ? W.other(cats) : zoneWords();
        return q({
          prompt: `${w.w} 是什么意思？`,
          speech: [EN(w.w), ZH('是什么意思？')],
          scene: { kind: 'word', w: w.w },
          choices: three(w.zh, zhOf(pool)),
          answer: w.zh,
          hint: { text: `${w.w} 读作「${w.zh}」。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh }, speech: [EN(w.w), ZH(`是${w.zh}`)] },
          explain: [`${w.w} 是${w.zh}`],
          explainSpeech: [EN(w.w), ZH(`是${w.zh}`)],
        });
      }
      return q({
        prompt: `「${w.zh}」用英语怎么说？`,
        speech: [ZH(`「${w.zh}」用英语怎么说？`)],
        choices: three(w.w, wordOf(zoneWords())),
        answer: w.w,
        hint: { text: `${w.zh}的英语是 ${w.w}。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh }, speech: [EN(w.w), ZH(`是${w.zh}`)] },
        explain: [`${w.zh}的英语是 ${w.w}`],
        explainSpeech: [ZH(`${w.zh}的英语是`), EN(w.w)],
      });
    };

    // ---------- 归类：这个词属于哪一类 / 哪一个是这一类 ----------
    const sort = d => {
      const cat = cats[0];
      if (d < 2) {
        const w = U.pick(zoneWords());
        const others = Object.keys(W.CATS).filter(k => k !== cat)
          .map(k => `${W.CATS[k].icon} ${W.CATS[k].name}`);
        return q({
          prompt: `${w.w} 是哪一类？`,
          speech: [EN(w.w), ZH('是哪一类？')],
          scene: { kind: 'card', text: w.w },
          choices: three(`${W.CATS[cat].icon} ${catName}`, others),
          answer: `${W.CATS[cat].icon} ${catName}`,
          hint: { text: `${w.w} 是${w.zh}，${w.zh}属于${catName}。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh } },
          explain: [`${w.w} 是${w.zh}`, `${w.zh}属于${catName}`],
          explainSpeech: [EN(w.w), ZH(`是${w.zh}，属于${catName}`)],
        });
      }
      const w = U.pick(zoneWords());
      const pool = W.concrete(cats);
      return q({
        prompt: `哪一个是${catName}？`,
        speech: [ZH(`哪一个是${catName}？`)],
        choices: three(w.w, wordOf(pool)),
        answer: w.w,
        hint: { text: `${catName}有 ${wordOf(zoneWords()).slice(0, 4).join('、')}。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh } },
        explain: [`${w.w} 是${w.zh}，属于${catName}`],
        explainSpeech: [EN(w.w), ZH(`是${w.zh}，属于${catName}`)],
      });
    };

    // ---------- 听句子选图 ----------
    const sentence = d => {
      if (d < 2) {
        const w = U.pick(zoneWords().filter(isOnePic));
        const text = d === 0 ? `It's ${/^[aeiou]/i.test(w.w) ? 'an' : 'a'} ${w.w}.` : `I like ${plural(w.w)}.`;
        const pool = d === 0 ? W.pics().filter(x => x.cat !== w.cat) : zoneWords().filter(isOnePic);
        return q({
          prompt: '听一听，选哪幅图？',
          subEn: text,
          scene: d === 0 ? { kind: 'card', text: '🔊', sub: '听句子' } : null,
          speech: [ZH('听一听，选哪幅图？'), EN(text)],
          saidZh: w.zh,
          pic: true,
          choices: three(w.e, picOf(pool)),
          answer: w.e,
          hint: { text: `句子里说的是 ${w.w}，就是${w.zh}。`, visual: { kind: 'word', e: w.e, w: w.w, zh: w.zh }, speech: [EN(text)] },
          explain: [`句子是 ${text}`, `说的是${w.zh}`],
          explainSpeech: [EN(text), ZH(`意思是${w.zh}`)],
        });
      }
      // 挑战：一句话里两个词
      const a = U.pick(zoneWords().filter(isOnePic));
      const b = U.pick(zoneWords().filter(x => isOnePic(x) && x.w !== a.w));
      const text = `I like ${plural(a.w)} and ${plural(b.w)}.`;
      const pool = W.pics().filter(x => x.e !== a.e && x.e !== b.e);
      const c = U.pick(pool), e = U.pick(pool.filter(x => x.e !== c.e));
      const right = a.e + b.e, r1 = a.e + c.e, r2 = b.e + e.e;
      return q({
        prompt: '听一听，选哪两幅图？',
        subEn: text,
        scene: { kind: 'card', text: '🔊', sub: '听句子' },
        speech: [ZH('听一听，选哪两幅图？'), EN(text)],
        saidZh: `${a.zh}和${b.zh}`,
        pic: true,
        choices: U.shuffle([right, r1, r2]),
        answer: right,
        hint: { text: `句子里说了 ${a.w} 和 ${b.w}，就是${a.zh}和${b.zh}。`, visual: { kind: 'word', e: a.e + b.e, w: `${a.w} + ${b.w}`, zh: `${a.zh}和${b.zh}` }, speech: [EN(text)] },
        explain: [`句子是 ${text}`, `说的是${a.zh}和${b.zh}`],
        explainSpeech: [EN(text), ZH(`意思是${a.zh}和${b.zh}`)],
      });
    };

    // ---------- 找不同：混一个别的类别 ----------
    const odd = d => {
      const cat = cats[0];
      const zone = zoneWords();
      const other = W.concrete(cats);
      if (d < 2) {
        const two = U.shuffle(zone).slice(0, 2);
        const o = U.pick(other);
        return q({
          prompt: `哪一个不是${catName}？`,
          speech: [ZH(`哪一个不是${catName}？`)],
          choices: U.shuffle([two[0].w, two[1].w, o.w]),
          answer: o.w,
          hint: { text: `${catName}是 ${wordOf(zone).slice(0, 4).join('、')} 这样的词。` },
          explain: [`${two[0].w} 和 ${two[1].w} 都是${catName}`, `${o.w} 是${W.CATS[o.cat].name}，不是${catName}`],
          explainSpeech: [EN(o.w), ZH(`是${o.zh}，不是${catName}`)],
        });
      }
      const w = U.pick(zone);
      const pool = U.shuffle(uniqW(other)).slice(0, 2);
      return q({
        prompt: `哪一个是${catName}？`,
        speech: [ZH(`哪一个是${catName}？`)],
        choices: U.shuffle([w.w, pool[0].w, pool[1].w]),
        answer: w.w,
        hint: { text: `${catName}是 ${wordOf(zone).slice(0, 4).join('、')} 这样的词。` },
        explain: [`${w.w} 是${w.zh}，属于${catName}`],
        explainSpeech: [EN(w.w), ZH(`是${w.zh}，属于${catName}`)],
      });
    };

    Q.register(prefix + '-listen', '听音选图', listen, '一听就知道是哪个单词');
    Q.register(prefix + '-pic', '看图选词', pic, '看到图片就能说出英语');
    Q.register(prefix + '-mean', '词义配对', mean, '单词的意思记得真清楚');
    Q.register(prefix + '-sort', '归类', sort, '单词是哪一类分得清');
    Q.register(prefix + '-sentence', '听句子选图', sentence, '句子也听得懂了');
    Q.register(prefix + '-odd', '找不同', odd, '一眼就能找出不同类');
    return label;
  };

  makeZone('en1', ['animal'], '动物朋友');

  TM.EnWordZone = makeZone;
})(window.TM);
