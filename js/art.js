// 英语插画：课本人物、道具、场景全部用 SVG 画，比 emoji 能表达动作
// 用法：Art.svg('p:chen:wave') 画一个人；'i:book' 画一个东西；'s:greet:chen' 画一个场景
(function (TM) {
  const A = {};

  // 课本里的人物：陈杰、李东、吴斌斌、John、Sarah、White 老师
  const WHO = {
    chen: { skin: '#ffd9b8', hair: '#2b2b33', cut: 'bob', shirt: '#e8645a', pants: '#3b5b8c', bow: '#ff5f7e' },
    li: { skin: '#ffd9b8', hair: '#2b2b33', cut: 'short', shirt: '#4aa8ff', pants: '#3b3355' },
    wu: { skin: '#f0c39b', hair: '#2b2b33', cut: 'short', shirt: '#ff9f43', pants: '#2f6b4f' },
    john: { skin: '#a9714b', hair: '#1f1a17', cut: 'curly', shirt: '#7cc576', pants: '#3b3355' },
    sarah: { skin: '#ffe0c2', hair: '#f0c060', cut: 'pigtail', shirt: '#ff7eb6', pants: '#5bb6e8' },
    miss: { skin: '#ffe6cf', hair: '#d9694a', cut: 'curly', shirt: '#7c5cff', pants: '#3b3355', glasses: true },
  };

  // 手臂：从肩膀画到手，一条线，末端加个手掌
  const POSE = {
    stand: [['M45 64 Q41 76 44 84'], ['M75 64 Q79 76 76 84']],
    wave: [['M45 64 Q41 76 44 84'], ['M75 64 Q87 55 89 41', 89, 40]],
    wave2: [['M45 64 Q33 55 31 41', 31, 40], ['M75 64 Q87 55 89 41', 89, 40]],
    point: [['M45 64 Q41 76 44 84'], ['M75 63 Q90 61 99 57', 100, 57]],
    up: [['M45 64 Q41 76 44 84'], ['M75 64 Q89 54 94 30', 95, 28]],
    hold: [['M45 64 Q41 76 44 84'], ['M75 64 Q84 53 86 41', 86, 39]],
    show: [['M45 64 Q33 53 31 39', 31, 38], ['M75 64 Q87 53 89 39', 89, 38]],
    book: [['M45 64 Q52 71 55 77'], ['M75 64 Q68 71 65 77']],
    listen: [['M45 64 Q41 76 44 84'], ['M75 64 Q85 49 73 42', 72, 41]],
    self: [['M45 64 Q41 76 44 84'], ['M75 64 Q68 70 65 61', 64, 60]],
    run: [['M45 64 Q37 71 33 79'], ['M75 64 Q83 71 87 79']],
  };

  const face = (w, mood) => {
    const c = w.glasses ? '#2b2b33' : '#3b3355';
    const mouth = mood === 'sad'
      ? `<path d="M55 49 q5 -5 10 0" stroke="#b5574a" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : `<path d="M55 47 q5 5 10 0" stroke="#b5574a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return `
      <circle cx="54" cy="39" r="2.4" fill="${c}"/>
      <circle cx="66" cy="39" r="2.4" fill="${c}"/>
      ${mouth}
      <circle cx="48" cy="45" r="3" fill="#ffb0a0" opacity=".5"/>
      <circle cx="72" cy="45" r="3" fill="#ffb0a0" opacity=".5"/>
      ${w.glasses ? `<circle cx="54" cy="39" r="6.5" fill="none" stroke="#3b3355" stroke-width="1.6"/>
        <circle cx="66" cy="39" r="6.5" fill="none" stroke="#3b3355" stroke-width="1.6"/>
        <path d="M60.5 39 h-.5 M46 38 l-4 2 M74 38 l4 2" stroke="#3b3355" stroke-width="1.6" fill="none"/>` : ''}`;
  };

  // 刘海只盖到额头，眼睛留出来
  const bangs = w => {
    const c = w.hair;
    if (w.cut === 'short' || w.cut === 'curly') {
      return `<path d="M44 37 a16 16 0 0 1 32 0 Q72 32 67 35 Q61 30 55 35 Q50 32 44 37Z" fill="${c}"/>`;
    }
    return `<path d="M44 37 a16 16 0 0 1 32 0 Q73 32 68 35 Q62 30 56 35 Q50 31 44 37Z" fill="${c}"/>`;
  };

  const hairBack = w => {
    const c = w.hair;
    if (w.cut === 'short') return '';
    let s = `<circle cx="60" cy="41" r="19" fill="${c}"/>`;
    if (w.cut === 'bob') {
      s += `<path d="M42 39 q-3 18 3 23 l6 -4 q-3 -8 -2 -19Z" fill="${c}"/>
            <path d="M78 39 q3 18 -3 23 l-6 -4 q3 -8 2 -19Z" fill="${c}"/>`;
    }
    if (w.cut === 'pigtail') {
      s += `<circle cx="37" cy="54" r="8" fill="${c}"/><circle cx="83" cy="54" r="8" fill="${c}"/>
            <circle cx="42" cy="45" r="2.6" fill="#ff7eb6"/><circle cx="78" cy="45" r="2.6" fill="#ff7eb6"/>`;
    }
    if (w.cut === 'curly') {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.08 + i * 0.14);
        s += `<circle cx="${(60 - Math.cos(a) * 18).toFixed(1)}" cy="${(41 - Math.sin(a) * 18).toFixed(1)}" r="6.5" fill="${c}"/>`;
      }
    }
    return s;
  };

  // 一个人：who 是人物，pose 是姿势，k 是大小，dx/dy 是整体挪动，mood 是表情
  const person = (who, pose = 'stand', k = 1, dx = 0, dy = 0, mood) => {
    const w = WHO[who] || WHO.li;
    const arms = POSE[pose] || POSE.stand;
    const arm = ([d, hx, hy]) => `<path d="${d}" stroke="${w.skin}" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${hx == null ? '' : `<circle cx="${hx}" cy="${hy}" r="4.6" fill="${w.skin}"/>`}`;
    return `<g transform="translate(${dx} ${dy}) translate(60 60) scale(${k}) translate(-60 -60)">
      ${hairBack(w)}
      <rect x="50" y="86" width="9" height="19" rx="4" fill="${w.pants}"/>
      <rect x="61" y="86" width="9" height="19" rx="4" fill="${w.pants}"/>
      <ellipse cx="54.5" cy="106" rx="7.5" ry="3.6" fill="#5c5470"/>
      <ellipse cx="65.5" cy="106" rx="7.5" ry="3.6" fill="#5c5470"/>
      <rect x="43" y="58" width="34" height="30" rx="9" fill="${w.shirt}"/>
      <circle cx="45" cy="63" r="6" fill="${w.shirt}"/>
      <circle cx="75" cy="63" r="6" fill="${w.shirt}"/>
      <path d="M60 58 v30" stroke="#000" stroke-opacity=".07" stroke-width="2"/>
      ${arms.map(arm).join('')}
      <rect x="55" y="49" width="10" height="9" rx="2" fill="${w.skin}"/>
      <circle cx="60" cy="38" r="16" fill="${w.skin}"/>
      ${bangs(w)}
      ${face(w, mood)}
      ${w.bow ? `<path d="M71 24 l9 -6 v12Z" fill="${w.bow}"/><circle cx="80" cy="24" r="2.4" fill="${w.bow}"/>` : ''}
    </g>`;
  };

  // ---------- 道具 ----------
  const P = {
    book: `<g>
      <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#4aa8ff"/>
      <rect x="-15" y="-10" width="6" height="20" rx="3" fill="#2b7fc4"/>
      <rect x="-6" y="-5" width="18" height="3" rx="1.5" fill="#fff" opacity=".85"/>
      <rect x="-6" y="1" width="12" height="3" rx="1.5" fill="#fff" opacity=".6"/>
    </g>`,
    openbook: `<g>
      <path d="M0 -4 L-20 -10 L-20 8 L0 14Z" fill="#fff" stroke="#4aa8ff" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M0 -4 L20 -10 L20 8 L0 14Z" fill="#f2f8ff" stroke="#4aa8ff" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M-15 -3 h9 M-15 2 h7 M6 -3 h9 M9 2 h6" stroke="#b8cbe0" stroke-width="1.8" stroke-linecap="round"/>
    </g>`,
    pencil: `<g transform="rotate(-24)">
      <rect x="-4" y="-26" width="8" height="34" rx="2" fill="#ffcf3f"/>
      <rect x="-4" y="-26" width="8" height="6" fill="#ff7eb6"/>
      <rect x="-4" y="8" width="8" height="6" fill="#ffb84d"/>
      <path d="M-4 14 L0 24 L4 14Z" fill="#f0c39b"/>
      <path d="M-1.5 20 L0 24 L1.5 20Z" fill="#3b3355"/>
    </g>`,
    pencilcase: `<g>
      <rect x="-21" y="-10" width="42" height="20" rx="7" fill="#ff9f43"/>
      <rect x="-21" y="-10" width="42" height="8" rx="4" fill="#ffbd76"/>
      <path d="M-21 2 h42" stroke="#e07c2a" stroke-width="2"/>
      <circle cx="16" cy="2" r="2.6" fill="#fff" stroke="#e07c2a" stroke-width="1.4"/>
      <rect x="-24" y="-6" width="4" height="12" rx="2" fill="#e07c2a"/>
    </g>`,
    bag: `<g>
      <rect x="-16" y="-12" width="32" height="34" rx="8" fill="#5bb6e8"/>
      <path d="M-16 -2 h32" stroke="#3c8fc0" stroke-width="2"/>
      <rect x="-9" y="4" width="18" height="12" rx="4" fill="#8fd3ff"/>
      <path d="M-10 -12 q10 -8 20 0" stroke="#3c8fc0" stroke-width="3" fill="none"/>
      <rect x="-19" y="-8" width="4" height="26" rx="2" fill="#3c8fc0"/>
      <rect x="15" y="-8" width="4" height="26" rx="2" fill="#3c8fc0"/>
    </g>`,
    bottle: `<g>
      <rect x="-9" y="-18" width="18" height="36" rx="6" fill="#bfe9ff" stroke="#63b8e8" stroke-width="2"/>
      <rect x="-9" y="-2" width="18" height="20" rx="6" fill="#8fd3ff"/>
      <rect x="-5" y="-24" width="10" height="7" rx="3" fill="#4aa8ff"/>
      <rect x="-6" y="6" width="12" height="3" rx="1.5" fill="#fff" opacity=".8"/>
    </g>`,
    cap: `<g>
      <path d="M-15 0 a15 13 0 0 1 30 0Z" fill="#e8645a"/>
      <path d="M-17 0 h34 q6 4 1 8 h-36 q-5 -4 1 -8Z" fill="#c9483f"/>
      <circle cx="0" cy="-12" r="2.6" fill="#ffd84d"/>
    </g>`,
    desk: `<g>
      <rect x="-30" y="-4" width="60" height="7" rx="3" fill="#e0a866"/>
      <rect x="-26" y="3" width="6" height="22" rx="2" fill="#c98a5c"/>
      <rect x="20" y="3" width="6" height="22" rx="2" fill="#c98a5c"/>
    </g>`,
    board: `<g>
      <rect x="-36" y="-28" width="72" height="42" rx="4" fill="#2f6b4f" stroke="#d8a26a" stroke-width="5"/>
      <path d="M-24 -16 h16 M-24 -8 h24 M-24 0 h12" stroke="#eaf4ff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
      <path d="M-24 7 h10" stroke="#ffe066" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
    </g>`,
    apple: `<g>
      <circle cx="0" cy="2" r="17" fill="#e8645a"/>
      <path d="M0 -14 q-3 -7 3 -10 q2 6 -3 10Z" fill="#5fae3f"/>
      <ellipse cx="-6" cy="-4" rx="4" ry="6" fill="#fff" opacity=".35"/>
    </g>`,
    ball: `<g>
      <circle cx="0" cy="0" r="17" fill="#ffcf3f"/>
      <path d="M-17 0 h34 M0 -17 q10 17 0 34 M0 -17 q-10 17 0 34" stroke="#e8a91f" stroke-width="2" fill="none"/>
    </g>`,
    door: `<g>
      <rect x="-18" y="-33" width="36" height="66" rx="3" fill="#a9714b"/>
      <rect x="-13" y="-28" width="26" height="60" fill="#4d3324"/>
      <path d="M-13 -28 L7 -21 L7 27 L-13 32Z" fill="#e8c49a"/>
      <path d="M-4 -23 L2 -21 L2 25 L-4 24Z" fill="#d8ae80"/>
      <circle cx="2" cy="2" r="2.2" fill="#8a5a33"/>
      <ellipse cx="0" cy="34" rx="22" ry="4.5" fill="#d8b98a"/>
    </g>`,
    cup: `<g>
      <path d="M-7 -7 h14 l-1.6 12 a5.4 5.4 0 0 1 -10.8 0Z" fill="#bfe9ff" stroke="#63b8e8" stroke-width="2"/>
      <path d="M7 -3 q6 1 0 8" fill="none" stroke="#63b8e8" stroke-width="2" stroke-linecap="round"/>
    </g>`,
    blocks: `<g>
      <rect x="-10" y="-6" width="12" height="12" rx="2" fill="#ff9f43"/>
      <rect x="4" y="-2" width="12" height="12" rx="2" fill="#7c5cff"/>
    </g>`,
    spill: `<ellipse cx="0" cy="0" rx="15" ry="5" fill="#bfe9ff" opacity=".9"/>`,
  };

  // ---------- 背景 ----------
  const BG = {
    plain: `<rect width="120" height="120" rx="16" fill="#f6f9ff"/>
      <circle cx="60" cy="56" r="42" fill="#e8f1ff"/>`,
    school: `<rect width="120" height="120" rx="16" fill="#dff1ff"/>
      <path d="M0 86 h120 v34 H0Z" fill="#bfe6a0"/>
      <path d="M0 96 h120 v24 H0Z" fill="#a9d888"/>
      <circle cx="100" cy="22" r="11" fill="#ffe066"/>`,
    classroom: `<rect width="120" height="120" rx="16" fill="#f2f0ff"/>
      <path d="M0 90 h120 v30 H0Z" fill="#e7dcc5"/>
      <g transform="translate(64 12) scale(.95)">
        <rect x="-36" y="-28" width="72" height="42" rx="4" fill="#2f6b4f" stroke="#d8a26a" stroke-width="5"/>
        <path d="M-24 -16 h16 M-24 -8 h24 M-24 0 h12" stroke="#eaf4ff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
        <path d="M-24 7 h10" stroke="#ffe066" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
      </g>`,
    // 早上：太阳刚出来、小鸟飞、墙上的钟指着 7 点
    morning: `<rect width="120" height="120" rx="16" fill="#ffe8cf"/>
      <circle cx="32" cy="86" r="26" fill="#ffd15c"/>
      <path d="M0 86 h120 v34 H0Z" fill="#bfe6a0"/>
      <path d="M0 96 h120 v24 H0Z" fill="#a9d888"/>
      <path d="M20 24 q6 -5 12 0 M34 17 q6 -5 12 0" stroke="#e8a91f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g transform="translate(99 21)">
        <circle r="12" fill="#fff" stroke="#c9d6e8" stroke-width="2"/>
        <path d="M0 0 V-7 M0 0 L-4 4" stroke="#3b3355" stroke-width="2" stroke-linecap="round"/>
      </g>`,
  };

  // 说话气泡里画个笑脸，比三个点更容易看懂「在说话」
  const bubble = (x = 60, y = 18) => `<g transform="translate(${x} ${y})">
    <path d="M-17 -10 h34 a7 7 0 0 1 7 7 v6 a7 7 0 0 1 -7 7 h-20 l-9 7 l2 -7 a7 7 0 0 1 -7 -7 v-6 a7 7 0 0 1 7 -7Z"
      fill="#fff" stroke="#c9d6e8" stroke-width="2"/>
    <circle cx="-6" cy="-1" r="2.1" fill="#3b3355"/><circle cx="6" cy="-1" r="2.1" fill="#3b3355"/>
    <path d="M-5 3 q5 5 10 0" stroke="#3b3355" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>`;

  // ---------- 场景 ----------
  // 每张图都配一个能说明意思的道具：门、课桌、杯子、倒下的积木、爱心
  const SCENES = {
    // 打招呼：两个小朋友面对面挥手，气泡里是笑脸
    greet: (who = 'chen', who2 = 'li') =>
      BG.school + person(who2, 'wave', .82, -26, 4) + person(who, 'wave', .88, 22, 2) + bubble(90, 14),
    // 道别：门口，回头挥手
    bye: (who = 'john') =>
      BG.school + `<g transform="translate(99 74) scale(.95)">${P.door}</g>` +
      person(who, 'wave', .86, 4, 4),
    // 自我介绍：指着自己胸口，气泡里是笑脸
    self: (who = 'chen') => BG.school + person(who, 'self', .94, 2, 4) + bubble(94, 18),
    // 在教室：老师指黑板
    board: (who = 'miss') => BG.classroom + person(who, 'up', .86, 4, 10) + `<g transform="translate(60 98) scale(.85)">${P.desk}</g>`,
    // 打开书：书摊在课桌上
    openbook: (who = 'li') =>
      BG.classroom + person(who, 'book', .82, 4, -6) +
      `<g transform="translate(60 86) scale(.95)">${P.desk}</g>` +
      `<g transform="translate(60 76) scale(.85)">${P.openbook}</g>`,
    // 举起铅笔：在课桌边把铅笔举高，旁边加提醒线
    showpencil: (who = 'wu') =>
      BG.classroom + person(who, 'hold', .82, 4, -2) +
      `<g transform="translate(60 88) scale(.95)">${P.desk}</g>` +
      `<g transform="translate(86 40) scale(.7)">${P.pencil}</g>` +
      `<g stroke="#ffb84d" stroke-width="2.4" fill="none" stroke-linecap="round">
        <path d="M76 24 l-4 -7"/><path d="M96 25 l5 -6"/></g>`,
    // 早上好：太阳刚出来，两个人在校门口挥手，墙上的钟指 7 点
    morning: (who = 'miss', who2 = 'chen') =>
      BG.morning + person(who, 'wave', .74, -26, 18) + person(who2, 'wave', .74, 20, 18) + bubble(58, 30),
    // 上课抱着书
    classbook: (who = 'miss') =>
      BG.classroom + person(who, 'book', .88, 4, 0) +
      `<g transform="translate(60 80) scale(.8)">${P.book}</g>` +
      `<g transform="translate(60 101) scale(.8)">${P.desk}</g>`,
    // 道谢：一个把书递过去，接的人双手捧着，头顶两颗小心
    thank: (who = 'li', who2 = 'chen') =>
      BG.school + person(who, 'point', .78, -28, 6) + person(who2, 'show', .78, 26, 6) +
      `<g transform="translate(60 64) scale(.85)">${P.book}</g>` +
      `<circle cx="46" cy="70" r="4.8" fill="#ffd9b8"/><circle cx="74" cy="70" r="4.8" fill="#ffd9b8"/>` +
      `<path d="M56 24 c-4 -5 -10 -4 -10 1 c0 4 5 7 10 11 c5 -4 10 -7 10 -11 c0 -5 -6 -6 -10 -1Z" fill="#ff5f7e"/>` +
      `<path d="M72 18 c-3 -4 -8 -3 -8 1 c0 3 4 6 8 9 c4 -3 8 -6 8 -9 c0 -4 -5 -5 -8 -1Z" fill="#ff9eb5"/>`,
    // 给你：把铅笔递出去，另一只手从旁边接
    here: (who = 'li') =>
      BG.classroom + person(who, 'point', .86, -16, 2) +
      `<g transform="translate(90 52) rotate(14) scale(.66)">${P.pencil}</g>` +
      `<path d="M120 70 q-16 -4 -24 4" stroke="#ffd9b8" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<circle cx="95" cy="73" r="5.2" fill="#ffd9b8"/>`,
    // 对不起：地上倒了杯子、撒了水，积木也倒了，低头举手
    sorry: (who = 'wu') =>
      BG.classroom +
      `<g transform="translate(26 92)">${P.spill}</g>` +
      `<g transform="translate(22 86) rotate(-68) scale(.9)">${P.cup}</g>` +
      `<g transform="translate(34 91)">${P.blocks}</g>` +
      person(who, 'show', .9, 10, 2, 'sad') +
      `<path d="M90 32 q4 8 0 13 q-4 -5 0 -13Z" fill="#7cc4ff"/>`,
    // 听我说：老师手放在耳朵边，旁边是声音波纹
    listen: (who = 'miss') =>
      BG.classroom + person(who, 'listen', .86, 2, 6) +
      `<g transform="translate(60 98) scale(.8)">${P.desk}</g>` +
      `<g stroke="#8aa0bb" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9">
        <path d="M88 30 q8 7 0 14"/><path d="M96 25 q13 12 0 24"/></g>`,
  };

  const wrap = inner => `<svg viewBox="0 0 120 120" class="art-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // 单个道具画多大：宽的东西缩小一点，免得贴边被裁掉
  const ITEM_K = {
    book: 2.1, openbook: 1.9, pencil: 1.7, pencilcase: 1.8, bag: 2.0, bottle: 2.1,
    cap: 2.1, desk: 1.6, board: 1.45, apple: 2.2, ball: 2.2, door: 1.5, cup: 2.2, blocks: 2.2,
  };

  // key 的写法：
  //   p:人物:姿势      一个人，比如 p:chen:wave
  //   i:道具           一个东西，比如 i:book
  //   s:场景:人物:人物  一个场景，比如 s:greet:chen:li
  A.svg = key => {
    const [t, a, b, c] = String(key || '').split(':');
    if (t === 'p') return wrap(BG.plain + person(a, b || 'stand', 1.16, 0, 0));
    if (t === 'i') return wrap(BG.plain + `<g transform="translate(60 60) scale(${ITEM_K[a] || 1.8})">${P[a] || P.book}</g>`);
    if (t === 's' && SCENES[a]) return wrap(SCENES[a](b, c));
    return '';
  };

  // 图片的简单意思，显示在选项图片下面
  const SCENE_ZH = {
    greet: '打招呼', bye: '说再见', self: '介绍自己', board: '看黑板', openbook: '打开书',
    showpencil: '举起铅笔', morning: '早上好', classbook: '抱着书', thank: '说谢谢',
    here: '递东西', sorry: '说对不起', listen: '听我说',
  };
  const ITEM_ZH = {
    book: '书', openbook: '打开的书', pencil: '铅笔', pencilcase: '笔袋', bag: '书包',
    bottle: '水壶', cap: '帽子', desk: '桌子', board: '黑板', apple: '苹果', ball: '皮球',
    door: '门', cup: '杯子', blocks: '积木',
  };
  A.mean = key => {
    const [t, a] = String(key || '').split(':');
    if (t === 'i') return ITEM_ZH[a] || '';
    if (t === 's') return SCENE_ZH[a] || '';
    if (t === 'p') return '小朋友';
    return '';
  };

  A.who = WHO;
  A.scenes = Object.keys(SCENES);
  A.items = Object.keys(P);
  TM.Art = A;
})(window.TM);
