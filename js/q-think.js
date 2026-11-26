// 智慧营：间隔问题（卷子上的思考题专项）
// 剪绳子、晾手帕、种树摆椅，都是「点数」和「间隔数」差一的关系
(function (TM) {
  const { Q, U } = TM;
  const { rand, pick, shuffle } = U;
  const reg = (type, name, tiers, praise) => Q.register(type, name, d => pick(tiers[d])(), praise);

  // 数字题，顺手带上错法分类（分析页要用）
  const gap = (o, topic) => Object.assign(Q.num(o), { topic: topic || 'gap1' });
  const uniqChoices = (ans, others) => shuffle([...new Set([ans, ...others])].slice(0, 4));

  // 剪的次数比段数少 1 的讲解
  const cutExp = (n, times) => ['剪 1 刀，绳子变成 2 段：刀数比段数少 1', `剪成 ${n} 段要剪 ${times} 次`];
  const cutHint = {
    text: '剪 1 刀变成 2 段。每多剪 1 刀就多出 1 段，所以剪的次数比段数少 1。',
    visual: { kind: 'rope', segs: 3, cuts: true },
  };

  // ---------- 剪一剪 ----------
  reg('cut', '剪一剪', [
    [
      () => {
        const n = rand(3, 4);
        return gap({
          prompt: `把一根绳子剪成 ${n} 段，需要剪几次？`,
          answer: n - 1, max: 10, near: [n, n + 1, Math.max(0, n - 2)],
          scene: { kind: 'rope', segs: n },
          hint: cutHint, explain: cutExp(n, n - 1),
        });
      },
      () => {
        const k = rand(1, 3);
        return gap({
          prompt: `把一根绳子剪 ${k} 刀，能剪成几段？`,
          answer: k + 1, max: 10, near: [k, k + 2, k + 3],
          scene: null,
          hint: { text: `剪 1 刀变成 2 段，剪 ${k} 刀就在 1 段的基础上多出 ${k} 段。`, visual: { kind: 'rope', segs: k + 1, cuts: true } },
          explain: [`1 段绳子剪 ${k} 刀，多出 ${k} 段`, `1 + ${k} = ${k + 1} 段`],
        });
      },
    ],
    [
      () => {
        const n = rand(5, 8);
        return gap({
          prompt: `把一根绳子剪成 ${n} 段，需要剪几次？`,
          answer: n - 1, max: 12, near: [n, n + 1, n - 2],
          scene: { kind: 'rope', segs: n },
          hint: cutHint, explain: cutExp(n, n - 1),
        });
      },
      () => {
        const k = rand(4, 6);
        return gap({
          prompt: `一根绳子剪了 ${k} 刀，一共剪成几段？`,
          answer: k + 1, max: 12, near: [k, k + 2, k - 1],
          scene: null,
          hint: { text: '一刀两段：刀数加 1 就是段数。', visual: { kind: 'rope', segs: 4, cuts: true } },
          explain: [`剪 ${k} 刀，比原来 1 段多出 ${k} 段`, `1 + ${k} = ${k + 1} 段`],
        });
      },
      () => {
        // 剪成同样长的段数，比直接问多绕一步
        const n = rand(4, 6);
        return gap({
          prompt: `把一根绳子剪成一样长的 ${n} 段，一共要剪几刀？`,
          answer: n - 1, max: 10, near: [n, n + 1, n - 2],
          scene: { kind: 'rope', segs: n },
          hint: cutHint, explain: [`剪成一样长的段，也要剪 ${n - 1} 刀`, `段数 ${n}，刀数 ${n - 1}`],
        });
      },
    ],
    [
      () => {
        const n = rand(5, 7);
        return gap({
          prompt: `剪成 ${n} 段，剪的次数比段数少几次？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: { kind: 'rope', segs: n },
          hint: { text: '数一数：剪 1 刀 → 2 段，剪 2 刀 → 3 段，总是差 1。', visual: { kind: 'rope', segs: 4, cuts: true } },
          explain: [`${n} 段要有 ${n - 1} 刀`, `剪的次数比段数少 1 次`],
        });
      },
      () => {
        // 两步：先剪成 4 段，再剪成 7 段
        const n = rand(6, 9);
        return gap({
          prompt: `剪 3 刀能剪成 4 段。照这样，剪成 ${n} 段要剪几次？`,
          answer: n - 1, max: 12, near: [n, n + 1, n - 2],
          scene: { kind: 'rope', segs: n },
          hint: cutHint, explain: [`段数比刀数多 1`, `${n} − 1 = ${n - 1} 次`],
        });
      },
      () => {
        const k = rand(5, 7);
        return gap({
          prompt: `一根绳子剪了 ${k} 刀，剪成的段数比刀数多几？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: null,
          hint: { text: '剪 1 刀 → 2 段，剪 2 刀 → 3 段，段数总比刀数多 1。', visual: { kind: 'rope', segs: 4, cuts: true } },
          explain: [`剪 ${k} 刀得到 ${k + 1} 段`, `段数比刀数多 1`],
        });
      },
    ],
  ], '间隔问题看得很清楚');
  // ---------- 夹一夹 ----------
  const pegHint = n => ({
    text: `每块手帕左右各夹一个。${n} 块手帕中间有 ${n - 1} 个夹子，两头再各加 1 个。`,
    visual: { kind: 'hang', n, pegs: true },
  });
  reg('peg', '夹一夹', [
    [
      () => {
        const n = rand(2, 4);
        return gap({
          prompt: `照这样，晾 ${n} 块手帕，一共要几个夹子？`,
          sub: '晾 1 块手帕要 2 个夹子，两头都夹住',
          answer: n + 1, max: 8, near: [n, n + 2, n + 1 - 2],
          scene: { kind: 'hang', n, pegs: false },
          hint: pegHint(n), explain: [`${n} 块手帕之间有 ${n - 1} 个夹子`, `两头再加 2 个：${n - 1} + 2 = ${n + 1} 个`],
        });
      },
      () => {
        const k = rand(3, 5);
        return gap({
          prompt: `一排手帕用了 ${k} 个夹子，两头都夹住了。一共有几块手帕？`,
          answer: k - 1, max: 8, near: [k, k + 1, k - 2],
          scene: null,
          hint: { text: '两头的夹子各管一块手帕，中间的夹子夹住两块。夹子比手帕多 1。', visual: { kind: 'hang', n: k - 1, pegs: true } },
          explain: [`夹子比手帕多 1`, `${k} − 1 = ${k - 1} 块手帕`],
        });
      },
    ],
    [
      () => {
        const n = rand(5, 7);
        return gap({
          prompt: `晾 ${n} 块手帕，两头都夹住，一共要几个夹子？`,
          answer: n + 1, max: 10, near: [n, n + 2, n - 1],
          scene: { kind: 'hang', n, pegs: false },
          hint: pegHint(n), explain: [`${n} 块手帕之间有 ${n - 1} 个夹子`, `两头再加 2 个，一共 ${n + 1} 个`],
        });
      },
      () => {
        const k = rand(6, 8);
        return gap({
          prompt: `用了 ${k} 个夹子晾一排手帕，两头都夹住。晾了几块手帕？`,
          answer: k - 1, max: 10, near: [k, k - 2, k + 1],
          scene: null,
          hint: { text: '夹子数比手帕数多 1，所以手帕数比夹子数少 1。', visual: { kind: 'hang', n: 3, pegs: true } },
          explain: [`手帕数 = 夹子数 − 1`, `${k} − 1 = ${k - 1} 块`],
        });
      },
      () => {
        // 两端不夹反着问：幼儿园横杆，把毛巾搭在中间
        const n = rand(4, 6);
        return gap({
          prompt: `一排 ${n} 块手帕，每两块之间夹 1 个夹子，两头不夹。一共要几个夹子？`,
          answer: n - 1, max: 10, near: [n, n + 1, n - 2],
          scene: { kind: 'hang', n, pegs: false },
          hint: { text: '只夹在中间，夹子正好比手帕少 1。', visual: { kind: 'hang', n: 3, pegs: true } },
          explain: [`${n} 块手帕之间有 ${n - 1} 个缝`, `一共要 ${n - 1} 个夹子`],
        });
      },
    ],
    [
      () => {
        const n = rand(6, 9);
        return gap({
          prompt: `晾 ${n} 块手帕，两头都夹住，一共要几个夹子？`,
          answer: n + 1, max: 12, near: [n - 1, n, n + 2],
          scene: { kind: 'hang', n, pegs: false },
          hint: pegHint(n), explain: [`手帕比夹子少 1`, `${n} + 1 = ${n + 1} 个夹子`],
        });
      },
      () => {
        const k = rand(7, 10);
        return gap({
          prompt: `一共有 ${k} 个夹子，每块手帕都用两个夹子夹住，两头都夹。晾了几块手帕？`,
          answer: k - 1, max: 12, near: [k, k - 2, k + 1],
          scene: null,
          hint: { text: '夹子总比手帕多 1。', visual: { kind: 'hang', n: 4, pegs: true } },
          explain: [`${k} 个夹子，减去多出的 1 个`, `${k} − 1 = ${k - 1} 块手帕`],
        });
      },
      () => {
        const n = rand(4, 7);
        return gap({
          prompt: `晾 ${n} 块手帕，两头都夹住。夹子比手帕多几个？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: { kind: 'hang', n, pegs: false },
          hint: pegHint(n), explain: [`${n} 块手帕用 ${n + 1} 个夹子`, `夹子比手帕多 1 个`],
        });
      },
    ],
  ], '间隔和点数的关系弄明白了');
  // ---------- 种树摆椅 ----------
  const benchHint = n => ({
    text: `${n} 棵树排成一排，两棵树之间有 ${n - 1} 个空当，每个空当摆 1 张长椅。`,
    visual: { kind: 'lineup', trees: Math.min(n, 6), benches: true },
  });
  reg('bench', '种树摆椅', [
    [
      () => {
        const n = rand(3, 4);
        return gap({
          prompt: `街道一边种了 ${n} 棵树，每相邻两棵树之间摆 1 张长椅。一共摆几张？`,
          answer: n - 1, max: 8, near: [n, n + 1, n - 2],
          scene: { kind: 'lineup', trees: n },
          hint: benchHint(n), explain: [`${n} 棵树之间有 ${n - 1} 个空当`, `一共摆 ${n - 1} 张长椅`],
        });
      },
      () => {
        const k = rand(2, 3);
        return gap({
          prompt: `摆了 ${k} 张长椅，每张都在两棵树之间。一共有几棵树？`,
          answer: k + 1, max: 8, near: [k, k + 2, k - 1],
          scene: null,
          hint: { text: '长椅摆在两棵树中间，所以树比长椅多 1。', visual: { kind: 'lineup', trees: k + 1, benches: true } },
          explain: [`长椅比树少 1`, `${k} + 1 = ${k + 1} 棵树`],
        });
      },
    ],
    [
      () => {
        const n = rand(5, 8);
        return gap({
          prompt: `街道一边种了 ${n} 棵树，每两棵树之间摆 1 张长椅。一共摆几张？`,
          answer: n - 1, max: 12, near: [n, n + 1, n - 2],
          scene: { kind: 'lineup', trees: n },
          hint: benchHint(n), explain: [`${n} 棵树之间有 ${n - 1} 个空当`, `一共 ${n - 1} 张长椅`],
        });
      },
      () => {
        const k = rand(4, 7);
        return gap({
          prompt: `街道一边摆了 ${k} 张长椅，每张都在两棵树之间。一共种了几棵树？`,
          answer: k + 1, max: 12, near: [k, k + 2, k - 1],
          scene: null,
          hint: { text: '树比长椅多 1：长椅在中间，两头还各有一棵树。', visual: { kind: 'lineup', trees: k + 1, benches: true } },
          explain: [`长椅数 + 1 = 树数`, `${k} + 1 = ${k + 1} 棵树`],
        });
      },
      () => {
        const n = rand(5, 7);
        return gap({
          prompt: `${n} 棵树排成一排，一共有几个空当？`,
          answer: n - 1, max: 10, near: [n, n + 1, n - 2],
          scene: { kind: 'lineup', trees: n },
          hint: benchHint(n), explain: [`相邻两棵树之间是 1 个空当`, `${n} 棵树有 ${n - 1} 个空当`],
        });
      },
    ],
    [
      () => {
        // 围成一圈：间隔数和人数一样多
        const n = rand(5, 8);
        return gap({
          prompt: `${n} 个小朋友围成一圈做游戏，每两个小朋友之间放 1 个球。一共要几个球？`,
          answer: n, max: 12, near: [n - 1, n + 1, n - 2],
          scene: { kind: 'ring', n, e: '🙂', label: `${n} 个小朋友围成一圈` },
          hint: { text: '围成一圈时，最后一个和第一个之间也有一个空当，所以球和小朋友一样多。',
            visual: { kind: 'ring', n, e: '🙂', between: '⚽', label: '一圈有 n 个空当，就有 n 个球' } },
          explain: [`一圈有 ${n} 个小朋友`, `中间的间隔也有 ${n} 个`, `要 ${n} 个球（不是 ${n - 1} 个哦）`],
        });
      },
      () => {
        const n = rand(6, 9);
        return gap({
          prompt: `${n} 棵树种成一圈，每两棵树之间摆 1 张长椅。一共摆几张？`,
          answer: n, max: 12, near: [n - 1, n + 1, n - 2],
          scene: { kind: 'ring', n, e: '🌳', label: `${n} 棵树种成一圈` },
          hint: { text: '排成一排时长椅比树少 1；围成一圈时，长椅和树一样多。',
            visual: { kind: 'ring', n, e: '🌳', between: '🪑', label: '一圈有 n 个空当，就有 n 张长椅' } },
          explain: [`围成一圈有 ${n} 棵树`, `${n} 段间隔，每段 1 张长椅`, `一共 ${n} 张`],
        });
      },
      () => {
        const n = rand(6, 9);
        return gap({
          prompt: `${n} 棵树排成一排，长椅比树少几张？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: { kind: 'lineup', trees: Math.min(n, 6) },
          hint: benchHint(n), explain: [`${n} 棵树之间有 ${n - 1} 张长椅`, `少 1 张`],
        });
      },
    ],
  ], '间隔和点数的关系弄明白了');
  // ---------- 找规律 ----------
  const ruleChoices = ans => uniqChoices(ans, ['多 1', '少 1', '一样多'].filter(x => x !== ans));
  reg('rule', '找规律', [
    [
      () => {
        const n = rand(3, 5);
        return Object.assign(Q.pick({
          prompt: `把绳子剪成 ${n} 段，剪的次数比段数（ ）。`,
          choices: ruleChoices('少 1'), answer: '少 1',
          scene: { kind: 'rope', segs: n },
          hint: { text: '剪 1 刀是 2 段，刀数比段数少 1。', visual: { kind: 'rope', segs: 3, cuts: true } },
          explain: [`段数 ${n}，刀数 ${n - 1}`, `剪的次数比段数少 1`],
        }), { topic: 'gapdir' });
      },
      () => {
        const n = rand(3, 5);
        return Object.assign(Q.pick({
          prompt: `晾 ${n} 块手帕，两头都夹住。夹子比手帕（ ）。`,
          choices: ruleChoices('多 1'), answer: '多 1',
          scene: { kind: 'hang', n, pegs: false },
          hint: { text: '两头各多一个夹子，所以夹子比手帕多 1。', visual: { kind: 'hang', n: 3, pegs: true } },
          explain: [`${n} 块手帕用 ${n + 1} 个夹子`, `夹子比手帕多 1`],
        }), { topic: 'gapdir' });
      },
      () => {
        const n = rand(3, 5);
        return Object.assign(Q.pick({
          prompt: `一排 ${n} 棵树，两棵之间摆 1 张长椅。长椅比树（ ）。`,
          choices: ruleChoices('少 1'), answer: '少 1',
          scene: { kind: 'lineup', trees: n },
          hint: { text: '长椅在中间，两头没有长椅，所以长椅比树少 1。', visual: { kind: 'lineup', trees: 4, benches: true } },
          explain: [`${n} 棵树之间有 ${n - 1} 张长椅`, `长椅比树少 1`],
        }), { topic: 'gapdir' });
      },
    ],
    [
      () => {
        const n = rand(5, 7);
        return gap({
          prompt: `剪成 ${n} 段，剪的次数比段数少几次？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: { kind: 'rope', segs: n },
          hint: cutHint, explain: [`${n} 段要剪 ${n - 1} 次`, `少 1 次`],
        });
      },
      () => {
        const n = rand(5, 7);
        return gap({
          prompt: `晾 ${n} 块手帕，夹子比手帕多几个？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: { kind: 'hang', n, pegs: false },
          hint: pegHint(n), explain: [`${n} 块手帕要 ${n + 1} 个夹子`, `多 1 个`],
        });
      },
      () => {
        const n = rand(5, 7);
        return gap({
          prompt: `一排 ${n} 棵树，两棵之间摆 1 张长椅。长椅比树少几张？`,
          answer: 1, min: 0, max: 4, near: [2, 0, 3],
          scene: { kind: 'lineup', trees: n },
          hint: benchHint(n), explain: [`${n} 棵树有 ${n - 1} 张长椅`, `少 1 张`],
        });
      },
    ],
    [
      () => {
        const n = rand(5, 8);
        return Object.assign(Q.pick({
          prompt: `把绳子剪成 ${n} 段。剪的次数和段数比，谁多？`,
          choices: uniqChoices('段数多', ['剪的次数多', '一样多', '不能比']), answer: '段数多',
          scene: { kind: 'rope', segs: n },
          hint: { text: '剪 1 刀 → 2 段，段数总比刀数多 1。', visual: { kind: 'rope', segs: 3, cuts: true } },
          explain: [`剪成 ${n} 段要剪 ${n - 1} 次`, `段数多，多 1`],
        }), { topic: 'gapdir' });
      },
      () => {
        const n = rand(5, 8);
        return Object.assign(Q.pick({
          prompt: `晾 ${n} 块手帕，两头都夹住。夹子和手帕比，谁多？`,
          choices: uniqChoices('夹子多', ['手帕多', '一样多', '不能比']), answer: '夹子多',
          scene: { kind: 'hang', n, pegs: false },
          hint: pegHint(n), explain: [`${n} 块手帕用 ${n + 1} 个夹子`, `夹子多，多 1`],
        }), { topic: 'gapdir' });
      },
      () => {
        const n = rand(6, 9);
        return gap({
          prompt: `剪 4 刀能剪成 5 段。照这样剪 ${n} 刀，能剪成几段？`,
          answer: n + 1, max: 14, near: [n, n + 2, n - 1],
          scene: null,
          hint: cutHint, explain: [`刀数 + 1 = 段数`, `${n} + 1 = ${n + 1} 段`],
        });
      },
    ],
  ], '会找间隔的规律了');
})(window.TM);
