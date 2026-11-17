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
    hold: [['M45 64 Q41 76 44 84'], ['M75 64 Q84 53 86 41', 86, 39]],
    show: [['M45 64 Q33 53 31 39', 31, 38], ['M75 64 Q87 53 89 39', 89, 38]],
    book: [['M45 64 Q52 71 55 77'], ['M75 64 Q68 71 65 77']],
    listen: [['M45 64 Q41 76 44 84'], ['M75 64 Q85 49 73 42', 72, 41]],
    self: [['M45 64 Q41 76 44 84'], ['M75 64 Q68 70 65 61', 64, 60]],
    run: [['M45 64 Q37 71 33 79'], ['M75 64 Q83 71 87 79']],
  };

  const face = w => {
    const c = w.glasses ? '#2b2b33' : '#3b3355';
    return `
      <circle cx="54" cy="39" r="2.4" fill="${c}"/>
      <circle cx="66" cy="39" r="2.4" fill="${c}"/>
      <path d="M55 47 q5 5 10 0" stroke="#b5574a" stroke-width="2" fill="none" stroke-linecap="round"/>
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

  // 一个人：who 是人物，pose 是姿势，k 是大小，dx/dy 是整体挪动
  const person = (who, pose = 'stand', k = 1, dx = 0, dy = 0) => {
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
      ${face(w)}
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
      <rect x="-40" y="-28" width="80" height="42" rx="4" fill="#2f6b4f" stroke="#d8a26a" stroke-width="5"/>
      <path d="M-26 -17 h18 M-26 -9 h26 M-26 -1 h14" stroke="#eaf4ff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
  };

  const bubble = (x = 60, y = 18) => `<g transform="translate(${x} ${y})">
    <path d="M-17 -10 h34 a7 7 0 0 1 7 7 v6 a7 7 0 0 1 -7 7 h-20 l-9 7 l2 -7 a7 7 0 0 1 -7 -7 v-6 a7 7 0 0 1 7 -7Z"
      fill="#fff" stroke="#c9d6e8" stroke-width="2"/>
    <circle cx="-7" cy="0" r="2.3" fill="#8aa0bb"/><circle cx="0" cy="0" r="2.3" fill="#8aa0bb"/><circle cx="7" cy="0" r="2.3" fill="#8aa0bb"/>
  </g>`;

  // ---------- 场景 ----------
  const SCENES = {
    // 打招呼：两个小朋友互相挥手
    greet: (who = 'chen', who2 = 'li') => BG.school + person(who2, 'wave', .8, -24, 2) + person(who, 'wave', .9, 24, 0) + bubble(88, 18),
    // 道别：背着书包往画面外走
    bye: (who = 'john') => BG.school + person(who, 'wave', .92, 8, 2) +
      `<path d="M84 74 h18 m-5 -5 l5 5 l-5 5" stroke="#7a7397" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    // 自我介绍：指着自己
    self: (who = 'chen') => BG.school + person(who, 'self', .96, 4, 2) + bubble(92, 24),
    // 在教室：老师指黑板
    board: (who = 'miss') => BG.classroom + person(who, 'point', .86, 4, 10) + `<g transform="translate(60 96) scale(.85)">${P.desk}</g>`,
    // 打开书
    openbook: (who = 'li') => BG.classroom + person(who, 'book', .92, 4, 0) + `<g transform="translate(60 80) scale(.85)">${P.openbook}</g>`,
    // 举起铅笔
    showpencil: (who = 'li') => BG.classroom + person(who, 'hold', .92, 4, 0) + `<g transform="translate(84 38) scale(.75)">${P.pencil}</g>`,
    // 老师早上好
    morning: (who = 'miss', who2 = 'chen') => BG.classroom + person(who, 'wave', .78, -28, 4) + person(who2, 'wave', .78, 28, 4) + bubble(60, 14),
    // 上课抱着书
    classbook: (who = 'miss') => BG.classroom + person(who, 'book', .9, 4, 0) + `<g transform="translate(60 80) scale(.8)">${P.book}</g>` + `<g transform="translate(60 101) scale(.8)">${P.desk}</g>`,
  };

  const wrap = inner => `<svg viewBox="0 0 120 120" class="art-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // key 的写法：
  //   p:人物:姿势      一个人，比如 p:chen:wave
  //   i:道具           一个东西，比如 i:book
  //   s:场景:人物:人物  一个场景，比如 s:greet:chen:li
  A.svg = key => {
    const [t, a, b, c] = String(key || '').split(':');
    if (t === 'p') return wrap(BG.plain + person(a, b || 'stand', 1.16, 0, 0));
    if (t === 'i') return wrap(BG.plain + `<g transform="translate(60 60) scale(2)">${P[a] || P.book}</g>`);
    if (t === 's' && SCENES[a]) return wrap(SCENES[a](b, c));
    return '';
  };

  A.who = WHO;
  A.scenes = Object.keys(SCENES);
  A.items = Object.keys(P);
  TM.Art = A;
})(window.TM);
