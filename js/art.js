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

  // ---------- 动作 ----------
  // 每条手臂是 [从肩膀画到手的路径, 手掌 x, 手掌 y]；再配腿的动作、身体前倾和表情
  const REST_L = 'M45 64 Q41 76 44 84';
  const REST_R = 'M75 64 Q79 76 76 84';
  const POSE = {
    stand: { a: [REST_L, REST_R] },
    // 单手举高挥
    wave: { a: [REST_L, ['M75 64 Q87 55 89 41', 89, 40]] },
    // 双手举高挥
    wave2: { a: [['M45 64 Q33 55 31 41', 31, 40], ['M75 64 Q87 55 89 41', 89, 40]] },
    // 往右边指
    point: { a: [REST_L, ['M75 63 Q90 61 99 57', 100, 57]] },
    pointL: { a: [['M45 63 Q30 61 21 57', 20, 57], REST_R] },
    // 往下指（指着地上的东西）
    down: { a: [REST_L, ['M75 64 Q84 76 88 88', 88, 90]] },
    // 往右上斜着指（指黑板）
    up: { a: [REST_L, ['M75 64 Q89 54 94 30', 95, 28]], tilt: -4 },
    // 一直举到头顶（举手回答）
    raise: { a: [REST_L, ['M75 63 Q86 44 88 20', 88, 18]], tilt: -3 },
    // 手里拿着东西举在胸前
    hold: { a: [REST_L, ['M75 64 Q84 53 86 41', 86, 39]] },
    // 双手摊开给人看
    show: { a: [['M45 64 Q33 53 31 39', 31, 38], ['M75 64 Q87 53 89 39', 89, 38]] },
    open: { a: [['M45 64 Q33 62 26 58', 25, 57], ['M75 64 Q87 62 94 58', 95, 57]] },
    // 双手捧着书
    book: { a: [['M45 64 Q52 71 55 77', 55, 78], ['M75 64 Q68 71 65 77', 65, 78]] },
    // 双手抱着一摞书走在前面
    carry: { a: [['M45 64 Q50 69 53 70', 54, 70], ['M75 64 Q70 69 67 70', 66, 70]] },
    // 伸出一只手去接东西（另一只手自然垂着）
    take: { a: [['M45 64 Q36 64 30 62', 29, 62], REST_R], tilt: 6 },
    // 手放在耳朵边
    listen: { a: [REST_L, ['M75 64 Q85 49 73 42', 72, 41]], tilt: 4 },
    // 手放在自己胸口
    self: { a: [REST_L, ['M75 64 Q68 70 65 61', 64, 60]] },
    // 跑
    run: { a: [['M45 64 Q38 70 34 76', 33, 77], ['M75 64 Q84 68 88 74', 89, 75]], legs: 'run', tilt: 6 },
    // 一边走一边挥手（道别）
    bye: { a: [REST_L, ['M75 64 Q87 55 89 41', 89, 40]], legs: 'walk', tilt: 2 },
    // 走
    walk: { a: [['M45 64 Q39 72 36 78', 35, 79], ['M75 64 Q82 70 85 74', 86, 75]], legs: 'walk', tilt: 3 },
    // 跳
    jump: { a: [['M45 64 Q33 62 26 58', 25, 57], ['M75 64 Q87 62 94 58', 95, 57]], legs: 'jump', dy: -8 },
    // 鞠躬道歉
    bow: { a: [['M45 64 Q48 70 53 76', 53, 77], ['M75 64 Q72 70 67 76', 67, 77]], tilt: 9 },
    // 弯腰去捡地上的东西
    pick: { a: [REST_L, ['M75 64 Q85 78 88 94', 88, 96]], tilt: 12 },
    // 一只手往前推门
    push: { a: [REST_L, ['M75 63 Q88 64 96 64', 97, 64]], tilt: 4 },
    // 把手伸出去递东西
    give: { a: [REST_L, ['M75 64 Q88 63 96 62', 97, 61]] },
  };

  // 腿的画法：站、跑、走、跳
  const legs = (w, kind) => {
    const p = w.pants, shoe = '#5c5470';
    if (kind === 'run') {
      return `<path d="M52 88 l-9 12" stroke="${p}" stroke-width="9" stroke-linecap="round"/>
        <path d="M66 88 l9 10" stroke="${p}" stroke-width="9" stroke-linecap="round"/>
        <ellipse cx="42" cy="101" rx="7" ry="3.4" fill="${shoe}" transform="rotate(-24 42 101)"/>
        <ellipse cx="77" cy="99" rx="7" ry="3.4" fill="${shoe}" transform="rotate(18 77 99)"/>`;
    }
    if (kind === 'walk') {
      return `<path d="M53 88 l-4 16" stroke="${p}" stroke-width="9" stroke-linecap="round"/>
        <path d="M66 88 l5 15" stroke="${p}" stroke-width="9" stroke-linecap="round"/>
        <ellipse cx="48" cy="106" rx="7" ry="3.4" fill="${shoe}" transform="rotate(-12 48 106)"/>
        <ellipse cx="73" cy="105" rx="7" ry="3.4" fill="${shoe}" transform="rotate(10 73 105)"/>`;
    }
    if (kind === 'jump') {
      return `<path d="M52 88 l-6 10" stroke="${p}" stroke-width="9" stroke-linecap="round"/>
        <path d="M66 88 l6 10" stroke="${p}" stroke-width="9" stroke-linecap="round"/>
        <ellipse cx="45" cy="99" rx="7" ry="3.4" fill="${shoe}" transform="rotate(-16 45 99)"/>
        <ellipse cx="73" cy="99" rx="7" ry="3.4" fill="${shoe}" transform="rotate(16 73 99)"/>`;
    }
    return `<rect x="50" y="86" width="9" height="19" rx="4" fill="${p}"/>
      <rect x="61" y="86" width="9" height="19" rx="4" fill="${p}"/>
      <ellipse cx="54.5" cy="106" rx="7.5" ry="3.6" fill="${shoe}"/>
      <ellipse cx="65.5" cy="106" rx="7.5" ry="3.6" fill="${shoe}"/>`;
  };

  const face = (w, mood = 'smile') => {
    const c = w.glasses ? '#2b2b33' : '#3b3355';
    const mouth = {
      smile: '<path d="M55 47 q5 5 10 0" stroke="#b5574a" stroke-width="2" fill="none" stroke-linecap="round"/>',
      happy: '<path d="M54 45 q6 9 12 0 q-6 3 -12 0Z" fill="#b5574a"/>',
      talk: '<ellipse cx="60" cy="48" rx="3.2" ry="3.8" fill="#b5574a"/><path d="M57 49.5 q3 1.6 6 0" stroke="#ffd0c6" stroke-width="1.2" fill="none"/>',
      sad: '<path d="M55 49 q5 -5 10 0" stroke="#b5574a" stroke-width="2" fill="none" stroke-linecap="round"/>',
      worry: '<path d="M56 49 q4 -3 8 0" stroke="#b5574a" stroke-width="2" fill="none" stroke-linecap="round"/>',
      wow: '<circle cx="60" cy="48" r="3.2" fill="#b5574a"/>',
    }[mood] || '';
    // 眉毛：难过往下垂、惊讶往上挑
    const brows = mood === 'sad' || mood === 'worry'
      ? '<path d="M49 31 q5 2 9 0 M62 31 q4 -2 9 0" stroke="#3b3355" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
      : mood === 'wow'
        ? '<path d="M49 29 q5 -3 9 0 M62 29 q4 3 9 0" stroke="#3b3355" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
        : '';
    const eye = mood === 'wow' ? 2.9 : 2.4;
    return `
      <circle cx="54" cy="39" r="${eye}" fill="${c}"/>
      <circle cx="66" cy="39" r="${eye}" fill="${c}"/>
      ${brows}
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

  const armSvg = (a, w) => {
    // 有的手臂只写路径，有的写 [路径, 手掌 x, 手掌 y]
    const [d, hx, hy] = typeof a === 'string' ? [a] : a;
    return `<path d="${d}" stroke="${w.skin}" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${hx == null ? '' : `<circle cx="${hx}" cy="${hy}" r="4.6" fill="${w.skin}"/>`}`;
  };

  // 一个人：who 是人物，pose 是姿势，k 是大小，dx/dy 是整体挪动，
  // mood 是表情，flip 把整个人左右镜像（两个人面对面时用）
  const person = (who, pose = 'stand', k = 1, dx = 0, dy = 0, mood = 'smile', flip = false) => {
    const w = WHO[who] || WHO.li;
    const p = POSE[pose] || POSE.stand;
    const upper = `
      <rect x="43" y="58" width="34" height="30" rx="9" fill="${w.shirt}"/>
      <circle cx="45" cy="63" r="6" fill="${w.shirt}"/>
      <circle cx="75" cy="63" r="6" fill="${w.shirt}"/>
      <path d="M60 58 v30" stroke="#000" stroke-opacity=".07" stroke-width="2"/>
      ${p.a.map(x => armSvg(x, w)).join('')}
      <rect x="55" y="49" width="10" height="9" rx="2" fill="${w.skin}"/>
      <circle cx="60" cy="38" r="16" fill="${w.skin}"/>
      ${bangs(w)}
      ${face(w, mood)}
      ${w.bow ? `<g transform="translate(69 29)"><path d="M0 0 l7 -5 v10Z" fill="${w.bow}"/><circle cx="8" cy="0" r="2.2" fill="${w.bow}"/></g>` : ''}`;
    const body = `<g transform="translate(0 ${p.dy || 0})">
      ${legs(w, p.legs)}
      <g transform="rotate(${p.tilt || 0} 60 88)">${upper}</g>
    </g>`;
    const flipped = flip ? `<g transform="translate(120 0) scale(-1 1)">${body}</g>` : body;
    return `<g transform="translate(${dx} ${dy}) translate(60 60) scale(${k}) translate(-60 -60)">${flipped}</g>`;
  };

  // ---------- 道具 ----------
  const P = {
    book: `<g>
      <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#4aa8ff"/>
      <rect x="-15" y="-10" width="6" height="20" rx="3" fill="#2b7fc4"/>
      <rect x="-6" y="-5" width="18" height="3" rx="1.5" fill="#fff" opacity=".85"/>
      <rect x="-6" y="1" width="12" height="3" rx="1.5" fill="#fff" opacity=".6"/>
    </g>`,
    // 一摞书
    stack: `<g>
      <rect x="-16" y="4" width="34" height="10" rx="2.5" fill="#4aa8ff"/>
      <rect x="-14" y="-5" width="30" height="10" rx="2.5" fill="#ff9f43"/>
      <rect x="-16" y="-14" width="32" height="10" rx="2.5" fill="#7cc576"/>
      <rect x="-13" y="7" width="10" height="3" rx="1.5" fill="#fff" opacity=".8"/>
      <rect x="-11" y="-2" width="10" height="3" rx="1.5" fill="#fff" opacity=".8"/>
      <rect x="-12" y="-11" width="10" height="3" rx="1.5" fill="#fff" opacity=".8"/>
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
    // 小椅子
    chair: `<g>
      <rect x="-17" y="-26" width="34" height="6" rx="3" fill="#e0a866"/>
      <rect x="-17" y="-26" width="6" height="34" rx="3" fill="#d09760"/>
      <rect x="11" y="-26" width="6" height="34" rx="3" fill="#d09760"/>
      <rect x="-19" y="3" width="38" height="7" rx="3" fill="#e0a866"/>
      <rect x="-16" y="9" width="6" height="14" rx="2" fill="#c98a5c"/>
      <rect x="10" y="9" width="6" height="14" rx="2" fill="#c98a5c"/>
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
    // 黑板上的粉笔星
    star: `<path d="M0 -7 L2 -2 L7.5 -2 L3 1.6 L4.6 7 L0 3.8 L-4.6 7 L-3 1.6 L-7.5 -2 L-2 -2Z" fill="#ffe066"/>`,
  };

  // ---------- 背景 ----------
  const BG = {
    plain: `<rect width="120" height="120" rx="16" fill="#f6f9ff"/>
      <circle cx="60" cy="56" r="42" fill="#e8f1ff"/>`,
    // 校门口：草地、远处的小树、太阳
    school: `<rect width="120" height="120" rx="16" fill="#dff1ff"/>
      <circle cx="104" cy="15" r="9" fill="#ffe066"/>
      <path d="M0 88 h120 v32 H0Z" fill="#bfe6a0"/>
      <path d="M0 98 h120 v22 H0Z" fill="#a9d888"/>
      <g transform="translate(8 88)">
        <rect x="-2" y="-6" width="4" height="10" rx="1.5" fill="#a9714b"/>
        <circle cx="0" cy="-12" r="8" fill="#7cc576"/>
        <circle cx="-5" cy="-8" r="5.5" fill="#8ed484"/>
      </g>
      <g transform="translate(112 90) scale(.9)">
        <rect x="-2" y="-6" width="4" height="10" rx="1.5" fill="#a9714b"/>
        <circle cx="0" cy="-11" r="7" fill="#7cc576"/>
      </g>`,
    // 教室：黑板在右上、窗户在左上、前面的地板
    classroom: `<rect width="120" height="120" rx="16" fill="#f2f0ff"/>
      <path d="M0 90 h120 v30 H0Z" fill="#e7dcc5"/>
      <path d="M0 90 h120 v3 H0Z" fill="#d6c7a8"/>
      <g transform="translate(22 26)">
        <rect x="-15" y="-13" width="30" height="26" rx="3" fill="#bfe9ff" stroke="#fff" stroke-width="3"/>
        <path d="M0 -13 V13 M-15 0 H15" stroke="#fff" stroke-width="3"/>
      </g>
      <g transform="translate(64 3)">
        <rect x="-31" y="0" width="62" height="25" rx="3" fill="#2f6b4f" stroke="#d8a26a" stroke-width="4.4"/>
        <path d="M-20 8 h14 M-20 15 h21 M-20 21 h10" stroke="#eaf4ff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <path d="M2 21 h9" stroke="#ffe066" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
      </g>`,
    // 早上：太阳刚出来、小鸟飞
    morning: `<rect width="120" height="120" rx="16" fill="#ffe8cf"/>
      <g transform="translate(22 21)">
        <circle r="11" fill="#ffd15c"/>
        <g stroke="#ffd15c" stroke-width="2.6" stroke-linecap="round">
          <path d="M0 -16 v-4"/><path d="M11 -11 l3 -3"/><path d="M16 0 h4"/><path d="M-11 -11 l-3 -3"/><path d="M-16 0 h-4"/>
        </g>
      </g>
      <path d="M18 22 q5 -5 10 0 M32 16 q5 -5 10 0" stroke="#e8a91f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M0 88 h120 v32 H0Z" fill="#bfe6a0"/>
      <path d="M0 98 h120 v22 H0Z" fill="#a9d888"/>
      <path d="M74 14 q4 -4 8 0 q4 -4 8 0" stroke="#e8a91f" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  };

  // 说话气泡：画个笑脸，比三个点更容易看懂「在说话」
  const bubble = (x = 60, y = 16, kind = 'smile') => {
    const m = kind === 'talk'
      ? '<ellipse cx="0" cy="2" rx="3" ry="4" fill="#3b3355"/>'
      : '<path d="M-5 3 q5 5 10 0" stroke="#3b3355" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return `<g transform="translate(${x} ${y})">
      <path d="M-17 -10 h34 a7 7 0 0 1 7 7 v6 a7 7 0 0 1 -7 7 h-20 l-9 7 l2 -7 a7 7 0 0 1 -7 -7 v-6 a7 7 0 0 1 7 -7Z"
        fill="#fff" stroke="#c9d6e8" stroke-width="2"/>
      <circle cx="-6" cy="-1" r="2.1" fill="#3b3355"/><circle cx="6" cy="-1" r="2.1" fill="#3b3355"/>
      ${m}
    </g>`;
  };

  // 挥手/说话时的动感短线
  const arcs = (x, y, dir = 1) => `<g stroke="#f0a93f" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9">
    <path d="M${x} ${y} q${6 * dir} -6 ${2 * dir} -12"/>
    <path d="M${x + 7 * dir} ${y + 3} q${8 * dir} -6 ${5 * dir} -13"/></g>`;

  const heart = (x, y, r = 1, c = '#ff5f7e') => `<path transform="translate(${x} ${y}) scale(${r})"
    d="M0 0 c-4 -5 -10 -4 -10 1 c0 4 5 7 10 11 c5 -4 10 -7 10 -11 c0 -5 -6 -6 -10 -1Z" fill="${c}"/>`;

  const sparkle = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#ffd84d">
    <path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z"/></g>`;

  // ---------- 场景 ----------
  // 每张图都交代「谁、在做什么、在哪、关键道具」
  const SCENES = {
    // 打招呼：两个小朋友面对面举手问好，地上有个球
    greet: (who = 'chen', who2 = 'li') =>
      BG.school +
      person(who2, 'wave2', .86, -27, 2, 'happy', true) +
      person(who, 'wave', .9, 27, 0, 'happy') +
      bubble(60, 12) +
      `<g transform="translate(100 101) scale(.5)">${P.ball}</g>`,
    // 说再见：背着书包走向打开的门，回头挥手
    bye: (who = 'john') =>
      BG.school +
      `<g transform="translate(100 78) scale(.92)">${P.door}</g>` +
      `<g transform="translate(38 73) scale(.6) rotate(-8)">${P.bag}</g>` +
      `<g stroke="#3c8fc0" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M50 62 q-6 0 -10 4"/><path d="M50 70 q-5 1 -9 5"/></g>` +
      person(who, 'bye', .86, -4, 0, 'happy', true) +
      `<g stroke="#8aa0bb" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8">
        <path d="M18 78 h10"/><path d="M14 86 h14"/><path d="M20 94 h8"/></g>` +
      arcs(24, 33, -1),
    // 介绍自己：手放在胸口，胸前挂着名字牌，旁边同学在听
    self: (who = 'chen') =>
      BG.school +
      person(who, 'self', .9, -18, 0, 'happy', true) +
      person('li', 'stand', .82, 32, 4, 'smile') +
      bubble(18, 14),
    // 看黑板：老师拿粉笔指着黑板，黑板上有星星
    board: (who = 'miss') =>
      BG.classroom +
      person(who, 'up', .88, -26, 2, 'talk') +
      `<g transform="translate(60 100) scale(.9)">${P.desk}</g>` +
      `<g transform="translate(60 92) scale(.7)">${P.openbook}</g>` +
      `<g transform="translate(65 31) rotate(28)">
        <rect x="-1.8" y="-7" width="3.6" height="13" rx="1.4" fill="#fff" stroke="#d8d2c4" stroke-width=".8"/>
        <rect x="-1.8" y="4" width="3.6" height="2" fill="#ffe066"/></g>` +
      `<g transform="translate(88 33) scale(.55)">${P.star}</g>`,
    // 打开书：坐在椅子上，桌上摊开一本书
    openbook: (who = 'li') =>
      BG.classroom +
      `<g transform="translate(58 86) scale(.92)">${P.chair}</g>` +
      person(who, 'book', .9, -2, -2, 'smile') +
      `<g transform="translate(60 96) scale(.95)">${P.desk}</g>` +
      `<g transform="translate(60 84) scale(.95)">${P.openbook}</g>`,
    // 举起铅笔：把铅笔举得高高的，桌上还有笔袋和本子
    showpencil: (who = 'wu') =>
      BG.classroom +
      person(who, 'hold', .92, -10, 0, 'happy') +
      `<g transform="translate(60 100) scale(.92)">${P.desk}</g>` +
      `<g transform="translate(80 94) scale(.55)">${P.pencilcase}</g>` +
      `<g transform="translate(74 42) scale(.72)">${P.pencil}</g>` +
      sparkle(62, 24, .9) + sparkle(92, 34, .7),
    // 早上好：日出、墙上钟指 7 点，老师和学生在校门口问好
    morning: (who = 'miss', who2 = 'chen') =>
      BG.morning +
      person(who, 'wave', .82, -28, 10, 'happy', true) +
      person(who2, 'wave2', .86, 28, 6, 'happy') +
      bubble(52, 22),
    // 抱着书：老师抱着一摞书走
    classbook: (who = 'miss') =>
      BG.classroom +
      person(who, 'carry', .94, -4, 0, 'smile') +
      `<g transform="translate(60 72) scale(.9)">${P.stack}</g>` +
      `<g transform="translate(94 102) scale(.7)">${P.desk}</g>`,
    // 说谢谢：一个把书递过去，一个双手接住，旁边飘两颗心
    thank: (who = 'li', who2 = 'chen') =>
      BG.school +
      person(who, 'give', .86, -28, 2, 'happy') +
      person(who2, 'take', .86, 28, 2, 'happy') +
      `<g transform="translate(62 63) scale(.9)">${P.book}</g>` +
      heart(44, 22, 1) + heart(72, 16, .8, '#ff9eb5'),
    // 给你：把铅笔递到另一个小朋友手里
    here: (who = 'li', who2 = 'wu') =>
      BG.classroom +
      person(who, 'give', .9, -28, 0, 'happy') +
      person(who2, 'take', .9, 28, 0, 'happy') +
      `<g transform="translate(60 60) rotate(10) scale(.7)">${P.pencil}</g>` +
      `<g transform="translate(60 98) scale(.8)">${P.desk}</g>`,
    // 对不起：低头鞠躬，旁边杯子倒了、积木散在地上，同学吓一跳
    sorry: (who = 'wu') =>
      BG.classroom +
      person(who, 'bow', .92, -14, 0, 'sad') +
      person('chen', 'show', .78, 34, 6, 'wow') +
      `<g transform="translate(24 94)">${P.spill}</g>` +
      `<g transform="translate(18 88) rotate(-72) scale(.85)">${P.cup}</g>` +
      `<g transform="translate(34 94) rotate(14)">${P.blocks}</g>` +
      `<path d="M-6 0 q3 6 0 10 q-3 -4 0 -10Z" fill="#7cc4ff" transform="translate(40 80)"/>`,
    // 听我说：老师手放在耳朵边说话，同学在旁边听，中间是声音
    listen: (who = 'miss') =>
      BG.classroom +
      person(who, 'listen', .9, -26, 4, 'talk') +
      person('li', 'stand', .84, 30, 6, 'smile', true) +
      `<g stroke="#8aa0bb" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9">
        <path d="M52 34 q7 7 0 14"/><path d="M60 29 q11 12 0 24"/><path d="M68 34 q7 7 0 14"/></g>`,
  };

  const wrap = inner => `<svg viewBox="0 0 120 120" class="art-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // 单个道具画多大：宽的东西缩小一点，免得贴边被裁掉
  const ITEM_K = {
    book: 2.6, stack: 1.8, openbook: 2.3, pencil: 2.2, pencilcase: 2.3, bag: 2.3, bottle: 2.6,
    cap: 2.6, desk: 1.9, chair: 1.7, board: 1.55, apple: 2.4, ball: 2.4, door: 1.45,
    cup: 2.6, blocks: 2.4, spill: 2.2, star: 3,
  };

  // key 的写法：
  //   p:人物:姿势      一个人，比如 p:chen:wave
  //   i:道具           一个东西，比如 i:book
  //   s:场景:人物:人物  一个场景，比如 s:greet:chen:li
  A.svg = key => {
    const [t, a, b, c] = String(key || '').split(':');
    if (t === 'p') return wrap(BG.plain + person(a, b || 'stand', 1.22, 0, 0));
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
    book: '书', stack: '一摞书', openbook: '打开的书', pencil: '铅笔', pencilcase: '笔袋',
    bag: '书包', bottle: '水壶', cap: '帽子', desk: '桌子', chair: '椅子', board: '黑板',
    apple: '苹果', ball: '皮球', door: '门', cup: '杯子', blocks: '积木',
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
