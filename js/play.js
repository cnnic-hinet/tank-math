// 作战：闯关、入营测试、维修厂复习共用同一套答题流程
(function (TM) {
  const { U, Store, Audio, Levels: L, Repair, V, Q, Battle, Lines, Rewards: RW } = TM;
  const h = U.h;
  const wait = U.sleep;
  const ABORT = new Error('abort');
  const P = {};
  const nick = () => Store.data.nick;
  const TAGS = ['基础', '提高', '挑战'];

  // 搭作战画面：左边战场，右边题目
  const stage = ({ title, exitText, onExit, zi }) => {
    const sess = { dead: false };
    const fieldEl = h('div');
    const progress = h('div', { class: 'progress' });
    const card = h('div', { class: 'qcard' });
    const exit = h('button', {
      class: 'btn-icon',
      onclick: async () => {
        Audio.sfx.tap();
        const v = await TM.App.ask({
          emoji: '🏳️', title: '要退出吗？', text: exitText || '这一关的进度不会保存。',
          buttons: [{ label: '继续作战', value: 0, cls: 'green' }, { label: '退出', value: 1, cls: 'gray' }],
        });
        if (!v) return;
        sess.dead = true;
        (onExit || TM.App.map)();
      },
    }, '✖');
    TM.App.show(h('div', { class: 'screen play' },
      h('div', { class: 'left' }, fieldEl),
      h('div', { class: 'right' }, h('div', { class: 'bar' }, exit, h('div', { class: 'lv-name' }, title), progress), card)), { keepVoice: true });
    const field = new Battle(fieldEl, zi || 0);
    Lines.onSay = t => field.say(t);
    return {
      sess, card, progress, field,
      check: () => { if (sess.dead) throw ABORT; },
    };
  };

  const setProgress = (el, n, marks, cur) => {
    el.innerHTML = '';
    for (let i = 0; i < n; i++) el.append(h('i', { class: marks[i] || (i === cur ? 'cur' : '') }));
  };

  const isExpr = s => /^[\d\s+−=□○<>]+$/.test(s);
  const SYM = { '>': '大于号', '<': '小于号', '=': '等于号' };
  const explainSpeech = q => q.explainSpeech || (() => {
    const a = String(q.answer);
    const head = SYM[a] ? `答案是${SYM[a]}。` : /^\d+$/.test(a) ? `答案是${a}。` : '';
    return head + q.explain.map(s => Q.speech(s.replace(/□/g, '方框').replace(/△/g, '三角形'))).join('。');
  })();
  const hintSpeech = q => q.hint.speech || Q.speech(q.hint.text.replace(/□/g, '方框').replace(/△/g, '三角形'));

  // 把题目画到卡片上
  const render = (st, q, tag) => {
    const card = st.card;
    card.innerHTML = '';
    card.dataset.answer = q.answer; // 方便自动化测试
    const scene = V.render(q.scene);
    // 没听清可以点一下再读一遍。跟着题目一起排，压在题目下面，不跟题目区抢点击
    const say = h('button', {
      class: 'say-btn',
      onclick: () => { Audio.sfx.tap(); Audio.speakParts(Q.speechParts(q)); },
    }, '🔊 再读一遍');
    const body = h('div', { class: 'qbody' },
      scene,
      h('div', { class: 'prompt' + (isExpr(q.prompt) ? ' expr' : q.prompt.length > 24 ? ' long' : '') }, q.prompt),
      q.sub ? h('div', { class: 'sub' }, q.sub) : null,
      say);
    let resolve = null;
    // 有一个选项字多，就都用小一号的字，免得大小不一
    const txt = q.choices.some(c => String(c).length > 2);
    const btns = q.choices.map(c => {
      const s = String(c);
      const b = h('button', {
        class: 'choice' + (txt ? ' txt' : ''),
        onclick: () => {
          if (!resolve || b.classList.contains('dim')) return;
          Audio.sfx.tap();
          const r = resolve;
          resolve = null;
          r({ value: s, btn: b });
        },
      }, s);
      return b;
    });
    const choices = h('div', { class: 'choices' + (btns.length === 3 ? ' c3' : '') }, btns);
    // 这个题型最近有点吃力：答题前就能看提示
    const early = L.weak(q.type) && q.hint ? h('button', {
      class: 'btn small hint-btn',
      onclick: () => { Audio.sfx.tap(); early.remove(); help('hint'); Audio.speakParts(hintSpeech(q)); },
    }, '💡 提示') : null;
    card.append(
      h('div', { class: 'qtag ' + (tag ? 'review' : 'd' + q.diff) }, tag || TAGS[q.diff]),
      ...[early, body, choices].filter(Boolean));

    const help = kind => {
      body.querySelector('.helpbox')?.remove();
      // 有提示图就用提示图替换原图（提示图上标注更多），讲解时也带着图
      if (scene && q.hint.visual) scene.style.display = 'none';
      const box = kind === 'hint'
        ? h('div', { class: 'helpbox hint' }, h('div', { class: 'h-title' }, '💡 提示'), h('div', null, q.hint.text), V.render(q.hint.visual))
        : h('div', { class: 'helpbox explain' }, h('div', { class: 'h-title' }, '📖 一起看看'),
          V.render(q.hint.visual),
          h('ol', null, q.explain.map(s => h('li', null, s))),
          h('div', { class: 'ans' }, '答案是：' + q.answer));
      body.append(box);
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    // Boss 技能的效果
    const effect = kind => {
      if (kind === 'smoke') {
        const sm = h('div', { class: 'smoke' }, '💨', '💨', '💨');
        body.append(sm);
        setTimeout(() => sm.classList.add('clear'), 2500);
        setTimeout(() => sm.remove(), 3200);
      } else if (kind === 'shuffle') {
        setTimeout(() => {
          choices.classList.add('shuffling');
          const order = U.shuffle(btns);
          if (order.every((b, i) => b === btns[i])) order.reverse();
          order.forEach(b => choices.append(b));
          setTimeout(() => choices.classList.remove('shuffling'), 600);
        }, 1500);
      }
    };

    return {
      btns, effect,
      wait: () => new Promise(r => { resolve = r; }),
      lock: on => choices.classList.toggle('busy', on),
      help,
      // 讲解看完后点“知道了”继续
      next: label => new Promise(r => {
        choices.replaceWith(h('div', { class: 'next-row' },
          h('button', { class: 'btn green', onclick: () => { Audio.sfx.tap(); r(); } }, label)));
      }),
    };
  };

  // 答一道题。tries：最多答几次；explain：没答对时是否讲解
  // onRight(firstTry) / onWrong() / onMiss() 负责战场动画
  // 返回 {firstOk, ok, wrong}
  const answer = async (st, q, o) => {
    const ui = render(st, q, o.tag);
    if (o.effect) ui.effect(o.effect);
    // 先来一句作战播报（发现敌人），再读题
    if (o.intro) Lines.say(o.intro, o.introK || 0, Q.speechParts(q));
    else Audio.speakParts(Q.speechParts(q));
    let wrong = null;
    for (let t = 0; t < o.tries; t++) {
      const { value, btn } = await ui.wait();
      st.check();
      ui.lock(true);
      if (value === String(q.answer)) {
        btn.classList.add('right');
        ui.btns.forEach(b => b !== btn && b.classList.add('dim'));
        await o.onRight(t === 0);
        st.check();
        return { firstOk: t === 0, ok: true, wrong };
      }
      wrong = value;
      btn.classList.add('wrong', 'dim');
      Audio.sfx.bad();
      if (t < o.tries - 1) {
        ui.help('hint');
        Lines.say(o.retryLine || 'retry', 0, hintSpeech(q));
        await o.onWrong();
        st.check();
        ui.lock(false);
      }
    }
    if (!o.explain) {
      Audio.speak('没关系，看下一题。');
      await o.onMiss();
      st.check();
      return { firstOk: false, ok: false, wrong };
    }
    ui.help('explain');
    ui.btns.forEach(b => b.textContent === String(q.answer) && b.classList.add('right'));
    Lines.say(o.missLine || 'baseHit', 0, explainSpeech(q));
    await o.onMiss();
    st.check();
    await ui.next('知道了 👍');
    st.check();
    Audio.stop();
    return { firstOk: false, ok: false, wrong };
  };

  const kindOf = q => (q.diff === 2 ? 'elite' : 'enemy');

  // 顶部显示还没出场的敌人；Boss 关前 bossAt 题是小兵，后面全是 Boss 一个
  // 盾牌兵、飞行兵要打两下，占两道题，列表里只算一个
  // 复仇题用小对象带上原来战区的样子
  const queueKinds = (qs, i, bossAt) => {
    const ks = [], span = TM.Battle.TRAIT_SPAN;
    for (let j = 0; j < Math.min(qs.length, bossAt); j++) {
      const q = qs[j];
      if (q.replay) { if (j > i) ks.push({ k: 'revenge', zi: q.replayZi }); }
      else if (q.trait) { if (j > i) ks.push(q.trait); j += (span[q.trait] || 1) - 1; }
      else if (j > i) ks.push(kindOf(q));
    }
    if (i < bossAt && bossAt < qs.length) ks.push('boss');
    return ks;
  };

  // 复仇题：把维修厂里的旧错题混进这一关，最多两道
  // 位置避开特殊兵占的题和挑战题，不改这一关的题数
  const attachReplay = (qs, lv, subject) => {
    if (lv.boss || lv.mini) return [];
    const picks = Repair.replayPick(2, { types: lv.types, subject });
    if (!picks.length) return [];
    const span = TM.Battle.TRAIT_SPAN, blocked = new Set();
    qs.forEach((q, i) => {
      if (q.trait) for (let k = 0; k < (span[q.trait] || 1); k++) blocked.add(i + k);
      if (q.diff === 2) blocked.add(i);
    });
    const slots = [1, 4, 5, 2, 0].filter(i => i < qs.length && !blocked.has(i));
    const used = new Set(qs.map(q => q.prompt)), out = [];
    picks.forEach((item, k) => {
      if (k >= slots.length) return;
      let q = Repair.replayQuestion(item);
      for (let t = 0; t < 8 && used.has(q.prompt); t++) q = Q.make(item.type, item.diff);
      used.add(q.prompt);
      q.replay = true;
      q.replayItem = item;
      q.replayZi = Repair.zoneIndex(item.type);
      qs[slots[k]] = q;
      out.push(q);
    });
    return out;
  };

  // 每个战区的 Boss 技能（Boss 血量掉到一半时放一次）
  const SKILLS = ['smoke', 'minion', 'shield', 'shuffle', 'minion', 'shield', 'shuffle', 'minion'];

  // 下一关只在同一科目里走，数学最后一关不会跳进英语
  const subjectOf = zi => L.ZONES[zi].subject || 'math';
  const nextZone = zi => (zi + 1 < L.ZONES.length && subjectOf(zi + 1) === subjectOf(zi) ? zi + 1 : -1);
  const nextOf = (zi, li) => {
    if (li + 1 < L.ZONES[zi].levels.length) return L.levelOpen(zi, li + 1) ? [zi, li + 1] : null;
    const nz = nextZone(zi);
    return nz >= 0 && L.zoneOpen(nz) ? [nz, 0] : null;
  };

  // ---------- 闯关 ----------
  P.level = async (zi, li) => {
    if (TM.App.restIfOver()) return;
    if (L.get(zi, li).mini) return TM.Mini.run(zi, li);
    const warm = Repair.warmup(L.ZONES[zi].subject || 'math');
    let fixed = 0;
    if (warm.length) {
      await Audio.wait();
      Lines.say('warmup', warm.length);
      await TM.App.ask({
        emoji: '🔧', title: '出征前先修坦克',
        text: `维修厂里有 ${warm.length} 辆坦克等着${nick()}修理，修好了再出发！`,
        buttons: [{ label: '去修理', value: 1, cls: 'green' }],
      });
      fixed = await P.repair(warm, { warmup: true });
      if (fixed == null) return;
    }
    return runLevel(zi, li, fixed);
  };

  const runLevel = async (zi, li, fixedBefore) => {
    const lv = L.get(zi, li), zone = L.ZONES[zi];
    const qs = L.build(zi, li);
    // 每个战区的特殊小兵：第 2 关起放在第 4 题（提高题），Boss 关不放
    const trait = !lv.boss && li >= 1 ? L.TRAIT[zi] : null;
    if (trait && qs.length > 3) qs[3].trait = trait;
    // 把维修厂里的旧错题混进来（复仇兵）
    attachReplay(qs, lv, zone.subject || 'math');
    const bossAt = lv.boss ? 3 : Infinity;
    const st = stage({ title: `${zone.icon} ${lv.name}`, zi });
    const f = st.field;
    const t0 = Date.now();
    const nz = nextZone(zi);
    const zoneWasOpen = nz >= 0 && L.zoneOpen(nz);
    let hearts = L.HEARTS, energy = 0;
    const results = [], marks = [];
    f.setHearts(hearts, L.HEARTS);
    f.setEnergy(energy, RW.ENERGY);
    f.setCombo(0);
    // 普通关打到一半掉一个补给箱
    const crateAt = lv.boss ? -1 : U.rand(2, 3);
    let skill = lv.boss ? SKILLS[zi % SKILLS.length] : null, effect = null;
    try {
      // 上一关的表扬还没说完时，画面先换过来，等说完再开始
      await Audio.wait();
      st.check();
      const opening = Lines.say(lv.boss ? 'bossStart' : 'start');
      let combo = 0, maxCombo = 0, airUsed = false;
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i], isBoss = i >= bossAt && !q.minion;
        setProgress(st.progress, qs.length, marks, i);
        f.setQueue(queueKinds(qs, i, bossAt));
        if (q.minion) {
          f.stash();
          await f.spawn('enemy');
        } else if (!f.enemy) {
          if (isBoss) await f.spawn('boss', qs.length - bossAt);
          else if (q.replay) await f.spawn('revenge', 1, { zi: q.replayZi });
          else await f.spawn(q.trait || kindOf(q));
        }
        st.check();
        // 第一题、精英、Boss、特殊小兵、复仇兵出场都播报；普通小兵偶尔播报，免得太啰嗦
        const intro = q.replay ? 'revenge'
          : q.trait ? 'trait_' + q.trait
          : isBoss ? (i === bossAt ? 'boss' : null)
          : q.diff === 2 ? 'elite'
          : i === 0 || Math.random() < 0.35 ? 'spawn' : null;
        const introK = q.replay ? (Repair.zone(q.type)?.name || '以前') : 0;
        const fx = effect;
        effect = null;
        if (i === 0) { await opening; st.check(); }
        const r = await answer(st, q, {
          tries: 2, explain: true, intro, introK, effect: fx,
          tag: q.replay ? '😤 老对手' : null,
          onRight: async firstTry => {
            // 复仇题：一次答对才算打退；不打连击、不给能量
            if (q.replay) {
              const retired = Repair.replayResult(q.replayItem, { firstOk: firstTry, ok: true });
              Lines.say(retired ? 'revengeMaster' : firstTry ? 'revengeWin' : 'revengeStay');
              await f.fire(RW.pickWeapon(), 0);
              return;
            }
            combo = firstTry ? combo + 1 : 0;
            maxCombo = Math.max(maxCombo, combo);
            f.setCombo(combo);
            if (firstTry) TM.Tasks.bump('first');
            TM.Tasks.bump('combo', combo, true);
            // 能量满了就放必杀技；8 连也送一次空中支援（本关一次）；否则随机用一件已解锁的武器
            const sup = energy >= RW.ENERGY;
            const air = sup || (combo >= 8 && !airUsed);
            if (air && !sup) airUsed = true;
            if (sup) { Lines.say('super'); TM.Tasks.bump('super'); }
            else if (air) Lines.say('combo8');
            else if (isBoss) Lines.say(f.hpBar && f.hp > 1 && !f.shield ? 'bossHurt' : f.shield ? 'hit' : 'bossDown');
            else if (combo >= 5) Lines.say('combo5');
            else if (combo >= 3) Lines.say('combo3');
            else Lines.say('hit');
            const killed = await f.fire(air ? 'air' : RW.pickWeapon(), combo);
            // 盾牌碎了 / 飞行兵躲开：还要再打一下
            if (!killed && !f.blocked && (q.trait === 'shield' || q.trait === 'flyer')) {
              Lines.say(q.trait === 'shield' ? 'shieldBreak' : 'flyerDodge');
            }
            energy = sup ? 0 : Math.min(RW.ENERGY, energy + (firstTry ? 1 : 0));
            f.setEnergy(energy, RW.ENERGY);
            // 护盾挡住了这一炮，Boss 的血没掉，多补一题
            if (f.blocked) { f.blocked = false; qs.push(Q.make(q.type, q.diff)); }
            // Boss 血量掉到一半，放技能
            if (isBoss && skill && f.enemy && f.hp <= f.maxHp / 2) {
              await bossSkill(f, skill, qs, i, lv);
              if (skill === 'smoke' || skill === 'shuffle') effect = skill;
              skill = null;
            }
          },
          onWrong: () => f.advance(),
          onMiss: async () => {
            // 复仇题：不扣心，它跑掉，题目留在维修厂
            if (q.replay) {
              Repair.replayResult(q.replayItem, { firstOk: false, ok: false });
              Lines.say('revengeEscape');
              await f.advance();
              await f.retreat();
              return;
            }
            await f.advance();
            // 反击兵：两题都没答对，扣 2 颗心
            const dmg = q.trait === 'counter' ? 2 : 1;
            if (dmg > 1) Lines.say('counter');
            for (let d = 0; d < dmg; d++) await f.enemyFire();
            hearts -= dmg;
            combo = 0;
            f.setCombo(0);
            f.setHearts(hearts, L.HEARTS);
          },
        });
        // 复仇题是旧错题的复现，不重复计入题型正确率（免得拉低自动调难度）
        if (!q.replay) {
          Store.record(q.type, r.firstOk, { diff: q.diff, prompt: q.prompt, answer: q.answer, got: r.wrong, kind: q.topic, src: 'play' });
          if (!r.ok) Repair.add(q, r.wrong);
          Store.save();
        }
        results.push({ type: q.type, diff: q.diff, firstOk: r.firstOk, ok: r.ok, replay: !!q.replay });
        marks.push(r.ok ? 'ok' : 'miss');
        if (hearts <= 0) return fail(zi, li);
        if (!r.ok) {
          // Boss 没打中就再补一题，Boss 的血量不变
          if (isBoss) { qs.push(Q.make(q.type, q.diff)); await f.pushBack(); }
          else await f.retreat();
        }
        if (q.minion) await f.unstash();
        st.check();
        if (i === crateAt) {
          // 补给箱：少了红心就补红心，否则把能量充满
          const heal = hearts < L.HEARTS;
          Lines.say('crate');
          await f.supply(heal ? '❤️ +1' : '⚡ 能量满');
          st.check();
          if (heal) { hearts++; f.setHearts(hearts, L.HEARTS); } else { energy = RW.ENERGY; f.setEnergy(energy, RW.ENERGY); }
          Lines.say(heal ? 'heart' : 'charge');
          await wait(600);
          st.check();
        }
      }
      setProgress(st.progress, qs.length, marks, -1);
      // 复仇题不影响这一关的星级和纪录
      const real = results.filter(r => !r.replay);
      const stars = L.stars(real, true);
      const key = L.key(zi, li);
      const old = Store.data.levels[key] || { stars: 0, best: 0 };
      const first = real.filter(r => r.firstOk).length;
      Store.data.levels[key] = { stars: Math.max(old.stars, stars), best: Math.max(old.best || 0, first) };
      Store.save();
      TM.Tasks.bump('win');
      if (stars === 3) TM.Tasks.bump('three');
      const nn = nextZone(zi);
      const newZone = !zoneWasOpen && nn >= 0 && L.zoneOpen(nn) ? L.ZONES[nn] : null;
      // 发星星：一次答对的题每题 1 颗，新拿到的关卡星每颗 2 颗，打退老对手每只 1 颗，最高连击到 5 再奖 2 颗
      const gain = Math.max(0, stars - old.stars);
      const comboPay = maxCombo >= 5 ? 2 : 0;
      const replayWins = results.filter(r => r.replay && r.firstOk).length;
      const pay = RW.pay([
        [`一次答对 ${first} 题`, first],
        [`新拿到 ${gain} 颗关卡星`, gain * 2],
        replayWins ? [`打退老对手 ${replayWins} 只`, replayWins] : ['', 0],
        comboPay ? [`最高连击 ×${maxCombo}`, comboPay] : ['', 0],
      ]);
      await wait(400);
      return report({ zi, li, results, stars, sec: (Date.now() - t0) / 1000, fixedBefore, newZone, pay, maxCombo, replayWins });
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  };

  // Boss 放技能：先播报，再生效
  const bossSkill = async (f, skill, qs, i, lv) => {
    Lines.say(skill);
    f.enemy.classList.add('casting');
    await wait(900);
    f.enemy.classList.remove('casting');
    if (skill === 'shield') f.shieldUp();
    // 小兵是一道基础题，不算 Boss 的血
    if (skill === 'minion') qs.splice(i + 1, 0, Object.assign(Q.make(U.pick(lv.types), 0), { minion: true }));
    await wait(400);
  };

  const fail = async (zi, li) => {
    Audio.sfx.lose();
    Lines.say('lose', 0, '做错的题已经送进维修厂了。');
    const v = await TM.App.ask({
      emoji: '💥', title: '基地被攻破了',
      text: '别灰心！做错的题已经送进维修厂。看懂了讲解，再来一次会更厉害。',
      buttons: [{ label: '再来一次', value: 1, cls: 'green' }, { label: '回地图', value: 0, cls: 'gray' }],
    });
    v ? P.level(zi, li) : TM.App.map();
  };

  // ---------- 战报 ----------
  const report = async ({ zi, li, results, stars, sec, fixedBefore, newZone, pay, maxCombo = 0, replayWins = 0 }) => {
    const real = results.filter(r => !r.replay);
    const n = real.length, first = real.filter(r => r.firstOk).length;
    const types = [...new Set(real.map(r => r.type))];
    // 具体表扬：这一关里全部一次答对的题型
    const lines = types.filter(t => real.filter(r => r.type === t).every(r => r.firstOk)).slice(0, 2).map(t => Q.praise[t] + '！');
    if (real.some(r => r.diff === 2 && r.firstOk)) lines.push('挑战题也一下子打下来了，真了不起！');
    if (real.some(r => r.ok && !r.firstOk)) lines.push('看了提示马上就想明白了，很会动脑筋！');
    if (maxCombo >= 5) lines.push(`最高连击 ×${maxCombo}，火力全开！`);
    if (replayWins) lines.push(`打退老对手 ×${replayWins} 只，旧仇已报！`);
    if (fixedBefore) lines.push(`出征前还修好了 ${fixedBefore} 辆坦克！`);
    if (!lines.length) lines.push('坚持打完了这一关，很勇敢！');
    const missed = [...new Set(real.filter(r => !r.ok).map(r => Q.names[r.type]))];
    const next = nextOf(zi, li);

    Audio.sfx.win();
    const boss = L.get(zi, li).boss;
    const rec = (boss && await TM.Rec.play('boss')) || await TM.Rec.play('win');
    if (!rec) Lines.say('win', 0, `${nick()}，${lines.join('')}${stars === 3 ? '拿到了三颗星！' : ''}${newZone ? '新战区' + newZone.name + '解锁啦！' : ''}${pay.total ? `得到${pay.total}颗星星！` : ''}${pay.canBuy.length ? '星星够买新装备啦，快去装备库看看吧！' : ''}`);
    const v = await TM.App.ask({
      cls: 'report', title: `${nick()}的战报`,
      text: [
        h('div', { class: 'stars' }, [0, 1, 2].map(i => h('span', { class: i < stars ? '' : 'off' }, '⭐'))),
        h('div', { class: 'stat-row' },
          h('div', { class: 'stat' }, h('b', null, `${first}/${n}`), h('span', null, '一次答对')),
          h('div', { class: 'stat' }, h('b', null, U.fmtTime(sec)), h('span', null, '用时')),
          h('div', { class: 'stat' }, h('b', null, `+${pay.total}`), h('span', null, '得到星星'))),
        h('div', { class: 'praise' }, h('span', { class: 'who' }, `${nick()}，`), lines.join(' ')),
        newZone ? h('div', { class: 'praise' }, `🎉 新战区解锁：${newZone.icon} ${newZone.name}！`) : null,
        TM.Hangar.payEl(pay),
        missed.length ? h('div', { class: 'to-repair' }, '送进维修厂的坦克（明天再来修）：',
          h('ul', null, missed.map(m => h('li', null, m)))) : null,
      ],
      buttons: [
        next ? { label: '下一关 ▶', value: 'next', cls: 'green' } : null,
        { label: '再玩一次', value: 'again', cls: 'blue' },
        pay.canBuy.length ? { label: '🛒 装备库', value: 'hangar', cls: 'blue' } : null,
        { label: '回地图', value: 'map', cls: 'gray' },
      ].filter(Boolean),
    });
    if (v === 'next') P.level(...next);
    else if (v === 'again') P.level(zi, li);
    else if (v === 'hangar') TM.Hangar.show();
    else TM.App.map();
  };

  // ---------- 入营测试 ----------
  P.placement = async () => {
    const qs = L.placement();
    const st = stage({ title: '🎖️ 入营测试', exitText: '下次打开时可以重新测试。' });
    const f = st.field;
    const results = [], marks = [];
    try {
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        setProgress(st.progress, qs.length, marks, i);
        f.setQueue(qs.slice(i + 1).map(kindOf));
        await f.spawn(kindOf(q));
        st.check();
        const r = await answer(st, q, {
          tries: 1, explain: false, intro: i === 0 ? 'spawn' : null,
          onRight: async () => { Lines.say('hit'); await f.fire(RW.pickWeapon()); },
          onMiss: () => f.retreat(),
        });
        results.push({ zone: q.zone, ok: r.ok });
        marks.push(r.ok ? 'ok' : 'miss');
      }
      setProgress(st.progress, qs.length, marks, -1);
      const reach = L.applyPlacement(results);
      const ok = results.filter(r => r.ok).length;
      const names = L.ZONES.slice(0, reach + 1).map(z => z.icon + ' ' + z.name).join('、');
      Audio.sfx.win();
      Lines.say('placeDone', ok, reach ? '可以直接去' + L.ZONES[reach].name + '啦！' : '我们从新兵营开始！');
      await TM.App.ask({
        emoji: '🎉', title: '入营测试完成！',
        text: `答对了 ${ok} / ${qs.length} 题。已经为${nick()}开放：${names}`,
        buttons: [{ label: '去地图', value: 1, cls: 'green' }],
      });
      TM.App.map();
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  };

  // ---------- 维修厂复习 ----------
  // 返回修好了几辆；中途退出返回 null
  P.repair = async (items, { warmup } = {}) => {
    const st = stage({
      title: warmup ? '🔧 出征前热身' : '🔧 坦克维修厂',
      exitText: '已经修过的坦克会保存。',
      onExit: warmup ? TM.App.map : TM.Garage.show,
    });
    const f = st.field;
    f.garage();
    let fixed = 0, earned = 0;
    const marks = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress(st.progress, items.length, marks, i);
        await f.showBroken();
        st.check();
        const q = Repair.question(item);
        const r = await answer(st, q, {
          tries: 2, explain: true, tag: '🔧 ' + Repair.name(item), retryLine: 'fixRetry', missLine: 'fixMiss',
          onRight: async firstTry => {
            const done = Repair.review(item, firstTry);
            if (done) fixed++;
            Lines.say(done ? 'fixed' : firstTry ? 'fixHalf' : 'fixHint');
            await f.repaired(done ? '修好啦！' : firstTry ? '再修一次就好' : '明天再巩固一次');
          },
          onWrong: () => wait(300),
          onMiss: async () => { Repair.review(item, false); await wait(300); },
        });
        Store.record(q.type, r.firstOk, { diff: q.diff, prompt: q.prompt, answer: q.answer, got: r.wrong, kind: q.topic, src: 'review' });
        if (r.ok) TM.Tasks.bump('fix');
        if (r.firstOk) { TM.Tasks.bump('first'); RW.earn(1); earned++; }
        Store.save();
        marks.push(r.firstOk ? 'ok' : 'miss');
      }
      setProgress(st.progress, items.length, marks, -1);
      Audio.sfx.win();
      if (warmup) {
        Lines.say('warmDone');
        await TM.App.ask({
          emoji: '🛠️', title: '热身完成！', text: fixed ? `彻底修好了 ${fixed} 辆坦克，出发去战斗！` : '维修完成，出发去战斗！',
          buttons: [{ label: '出发 ▶', value: 1, cls: 'green' }],
        });
        return fixed;
      }
      const got = earned ? `得到 ${earned} 颗星星，现在有 ${RW.wallet()} ⭐ 可以花。` : '';
      Audio.speak((fixed ? `${nick()}今天修好了${fixed}辆坦克！` : '维修完成！') + (earned ? `得到${earned}颗星星！` : ''));
      await TM.App.ask({
        emoji: '🛠️', title: '维修完成！',
        text: (fixed ? `彻底修好了 ${fixed} 辆坦克。没修好的过几天再来。` : '还差一点点，过几天再来修，就能彻底修好。') + got,
        buttons: [{ label: '好的', value: 1, cls: 'green' }],
      });
      TM.Garage.show();
      return fixed;
    } catch (e) {
      if (e !== ABORT) throw e;
      return null;
    }
  };

  // ---------- 弱项特训：针对不熟的题型出几道题 ----------
  // types：题型列表；n：题数。答对一次给 1 颗星星，做错送进维修厂
  P.practice = async (types, n = 5) => {
    const list = (types || []).filter(t => Q.gens[t]);
    if (!list.length) return;
    const qs = [];
    for (let i = 0; i < n; i++) qs.push(Q.make(list[i % list.length], i < n - 1 ? 0 : 1));
    const st = stage({ title: '🎯 弱项特训', exitText: '这次练习的进度不会保存。' });
    const f = st.field;
    const results = [], marks = [];
    let earned = 0;
    try {
      await Audio.wait();
      st.check();
      Audio.speak(`练一练${list.map(t => Q.names[t]).join('、')}，一共${n}道题。`);
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        setProgress(st.progress, qs.length, marks, i);
        f.setQueue(qs.slice(i + 1).map(kindOf));
        await f.spawn(kindOf(q));
        st.check();
        const r = await answer(st, q, {
          tries: 2, explain: true,
          onRight: async firstTry => { Lines.say(firstTry && i === qs.length - 1 ? 'win' : 'hit'); await f.fire(RW.pickWeapon()); },
          onWrong: () => f.advance(),
          onMiss: async () => { await f.advance(); await f.enemyFire(); },
        });
        Store.record(q.type, r.firstOk, { diff: q.diff, prompt: q.prompt, answer: q.answer, got: r.wrong, kind: q.topic, src: 'practice' });
        if (!r.ok) Repair.add(q, r.wrong);
        if (r.firstOk) { TM.Tasks.bump('first'); RW.earn(1); earned++; }
        Store.save();
        results.push(r);
        marks.push(r.ok ? 'ok' : 'miss');
        if (!r.ok) await f.retreat();
        st.check();
      }
      setProgress(st.progress, qs.length, marks, -1);
      const first = results.filter(r => r.firstOk).length;
      Audio.sfx.win();
      const v = await TM.App.ask({
        emoji: '🎯', title: '特训完成！',
        text: [
          h('div', { class: 'stat-row' },
            h('div', { class: 'stat' }, h('b', null, `${first}/${results.length}`), h('span', null, '一次答对')),
            h('div', { class: 'stat' }, h('b', null, `+${earned}`), h('span', null, '得到星星'))),
          h('div', { class: 'praise' }, first === results.length ? '全部一次答对，这个题型已经拿下啦！' : first * 2 >= results.length ? '大部分都对了，再练几次就熟了。' : '没关系，做错的已经送到维修厂，明天再修一次。'),
          h('div', { class: 'note' }, '在维修厂「📊 学习分析」里可以随时再练。'),
        ],
        buttons: [{ label: '回地图', value: 0, cls: 'green' }, { label: '再练一组', value: 1, cls: 'blue' }],
      });
      if (v) P.practice(types, n);
      else TM.App.map();
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  };

  TM.Play = P;
})(window.TM);
