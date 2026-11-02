// 战场：DOM + CSS 动画。所有动作返回 Promise，方便按顺序编排
(function (TM) {
  const { U, V, Audio } = TM;
  const h = U.h;
  const wait = U.sleep;

  const ENEMY_Y = 16;   // 敌方坦克停下来的位置（%）
  const STEP = 13;      // 答错一次往前开的距离

  // 每种武器怎么飞过去、打中后敌人怎么样。没写的用普通炮弹和爆炸
  // fly：shell 炮弹 / ammo 用图标当炮弹 / beam 光束 / sky 天上劈闪电 / meteor 流星雨 / air 空中支援
  // end：打中后的样子，见下面的 END
  const FX = {
    shell: {},
    missile: { fly: 'ammo', ammo: '🚀', cls: 'missile', ms: 520, sfx: 'missile', big: true },
    ice: { cls: 'ice', end: 'freeze', sparks: ['❄️', '🧊', '✨'] },
    melon: { fly: 'ammo', ammo: '🍉', cls: 'roll', ms: 480, end: 'splat', sparks: ['🍉', '💦', '🍉', '✨'] },
    bubble: { cls: 'bubble', sfx: 'pop', end: 'bubble', sparks: ['🫧', '🫧', '✨'] },
    laser: { fly: 'beam', sfx: 'laser' },
    firework: { fly: 'ammo', ammo: '🎇', ms: 450, sfx: 'firework', big: true, sparks: ['🎆', '🎇', '✨', '💫', '🌟', '💖'] },
    fire: { fly: 'ammo', ammo: '🔥', cls: 'fireball', ms: 450, sfx: 'fire', end: 'burn', sparks: ['🔥', '💨', '✨'] },
    rainbow: { fly: 'beam', cls: 'rainbow', sfx: 'laser', big: true, sparks: ['🌈', '🌟', '⭐', '💖', '✨'] },
    tornado: { fly: 'ammo', ammo: '🌪️', cls: 'twister', ms: 700, sfx: 'wind', end: 'spin', sparks: ['🍃', '💨', '🍃'] },
    bunny: { cls: 'magic', sfx: 'magic', end: 'bunny', sparks: ['✨', '💖', '🌸', '⭐'] },
    thunder: { fly: 'sky', sfx: 'thunder', big: true, sparks: ['⚡', '✨', '💥'] },
    hole: { cls: 'hole', sfx: 'hole', end: 'hole', sparks: ['🌀', '✨', '⭐'] },
    meteor: { fly: 'meteor', sfx: 'meteor', big: true, sparks: ['☄️', '🔥', '⭐', '💥'] },
    air: { fly: 'air', big: true, shake: true, sparks: ['⭐', '🌟', '💥', '✨'] },
  };

  // 消灭敌人的样子。b 是战场，e 是敌人，p 是命中点。返回还要再等多久
  const END = {
    boom: (b, e, p, big, fx) => {
      Audio.sfx.boom();
      b.boom(p, big, fx.sparks);
      if (fx.shake) b.shake();
      e.classList.add('dead');
      return big ? 900 : 650;
    },
    freeze: async (b, e, p, big, fx) => {
      Audio.sfx.freeze();
      e.classList.add('frozen');
      await wait(550);
      Audio.sfx.crack();
      b.sparks(p, 12, 90, fx.sparks);
      e.classList.add('shatter');
      return big ? 900 : 650;
    },
    bubble: (b, e, p, big, fx) => {
      e.append(h('div', { class: 'bubble-wrap' }));
      e.classList.add('floating');
      b.sparks(p, 6, 60, fx.sparks);
      return 1100;
    },
    splat: async (b, e, p, big, fx) => {
      Audio.sfx.splat();
      e.append(h('div', { class: 'splat-goo' }));
      e.classList.add('splatted');
      b.sparks(p, 10, 80, fx.sparks);
      await wait(600);
      e.classList.add('dead');
      return 700;
    },
    burn: async (b, e, p, big, fx) => {
      Audio.sfx.boom();
      b.boom(p, big, fx.sparks);
      e.classList.add('burnt');
      await wait(600);
      b.sparks(p, 5, 50, ['💨', '💨', '💨']);
      e.classList.add('fade');
      return 700;
    },
    spin: (b, e, p, big, fx) => {
      b.sparks(p, 8, 90, fx.sparks);
      e.classList.add('spun');
      return 1000;
    },
    bunny: async (b, e, p) => {
      b.sparks(p, 10, 70, ['💨', '✨', '💖']);
      e.innerHTML = '';
      e.append(h('div', { class: 'bunny-em' }, '🐰'));
      await wait(500);
      e.classList.add('bunnied');
      return 1100;
    },
    hole: async (b, e, p, big, fx) => {
      const v = h('div', { class: 'vortex' }, '🌀');
      v.style.left = p.x + 'px';
      v.style.top = p.y + 'px';
      b.el.append(v);
      e.classList.add('sucked');
      setTimeout(() => v.remove(), 1300);
      await wait(900);
      b.sparks(p, 8, 60, fx.sparks);
      return 500;
    },
  };

  class Battle {
    // zi：战区序号，决定场景和敌人长相
    constructor(el, zi = 0) {
      this.el = el;
      this.zi = zi;
      el.innerHTML = '';
      el.className = 'field z' + zi;
      this.layer = h('div', { class: 'layer' });
      this.queue = h('div', { class: 'enemy-queue' });
      this.hearts = h('div', { class: 'hearts' });
      this.energy = h('div', { class: 'energy' });
      this.me = h('div', { class: 'tank me', html: V.tank('me') });
      this.base = h('div', { class: 'base' }, h('div', { class: 'flag' }, '🚩'), h('div', { class: 'base-name' }, TM.Store.data.nick + '的基地'));
      el.append(h('div', { class: 'road' }), this.queue, this.energy, this.layer, this.me, this.base, this.hearts);
      this.enemy = null;
    }

    setHearts(n, max) {
      this.hearts.innerHTML = '';
      if (max == null) return;
      for (let i = 0; i < max; i++) this.hearts.append(h('span', { class: i < n ? 'on' : 'off' }, i < n ? '❤️' : '🤍'));
    }

    // 必杀技能量条
    setEnergy(n, max) {
      this.energy.innerHTML = '';
      if (max == null) return;
      this.energy.classList.toggle('full', n >= max);
      this.energy.append(h('span', { class: 'e-icon' }, n >= max ? '✈️' : '⚡'));
      for (let i = 0; i < max; i++) this.energy.append(h('i', { class: i < n ? 'on' : '' }));
    }

    // 顶部显示还剩几个敌人
    setQueue(kinds) {
      this.queue.innerHTML = '';
      kinds.forEach(k => this.queue.append(h('div', { class: 'mini ' + k, html: V.enemy(this.zi, k) })));
    }

    // 字幕气泡
    say(text) {
      if (this.bubble) this.bubble.remove();
      const b = h('div', { class: 'say-bubble' }, h('span', { class: 'rb-icon' }, '👩‍🏫'), h('span', null, text));
      this.el.append(b);
      this.bubble = b;
      clearTimeout(this._bt);
      this._bt = setTimeout(() => b.remove(), 3200);
    }

    async spawn(kind, hp = 1) {
      const t = h('div', { class: `tank enemy ${kind} z${this.zi}`, html: V.enemy(this.zi, kind) });
      t.style.top = '-30%';
      this.y = ENEMY_Y;
      if (hp > 1) {
        this.hpBar = h('div', { class: 'hpbar' }, h('i'));
        t.append(this.hpBar);
        this.hp = this.maxHp = hp;
      } else this.hpBar = null;
      this.layer.append(t);
      this.enemy = t;
      t.getBoundingClientRect();
      t.style.top = this.y + '%';
      await wait(700);
    }

    async advance() {
      if (!this.enemy) return;
      this.y = Math.min(this.y + STEP, ENEMY_Y + STEP * 2);
      this.enemy.classList.add('rumble');
      this.enemy.style.top = this.y + '%';
      await wait(600);
      this.enemy.classList.remove('rumble');
    }

    // 元素中心点（相对战场）
    center(el) {
      const fr = this.el.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - fr.left, y: r.top + r.height / 2 - fr.top };
    }

    // 炮弹从 from 飞到 to（元素）。text 不为空时用 emoji 当炮弹
    async shell(from, to, cls, text, ms = 380) {
      const a = this.center(from), b = this.center(to);
      // 双管坦克一次打两发
      const offs = from === this.me && TM.Rewards.model().id === 'twin' ? [-13, 13] : [0];
      const ss = offs.map(dx => {
        const s = h('div', { class: 'shell ' + cls }, text || '');
        s.style.transitionDuration = ms + 'ms';
        s.style.left = a.x + dx + 'px';
        s.style.top = a.y + 'px';
        this.el.append(s);
        return s;
      });
      ss[0].getBoundingClientRect();
      ss.forEach((s, i) => {
        s.style.left = b.x + offs[i] / 2 + 'px';
        s.style.top = b.y + 'px';
      });
      await wait(ms);
      ss.forEach(s => s.remove());
      return b;
    }

    // 激光：从我方坦克直直射到敌人
    async beam(cls) {
      const a = this.center(this.me), b = this.center(this.enemy);
      const bm = h('div', { class: 'beam ' + cls });
      bm.style.left = a.x + 'px';
      bm.style.top = b.y + 'px';
      bm.style.height = a.y - b.y + 'px';
      this.el.append(bm);
      await wait(260);
      setTimeout(() => bm.remove(), 300);
      return b;
    }

    boom(p, big, set) {
      const b = h('div', { class: 'boom' + (big ? ' big' : '') }, '💥');
      b.style.left = p.x + 'px';
      b.style.top = p.y + 'px';
      this.el.append(b);
      this.sparks(p, big ? 14 : 8, big ? 120 : 70, set);
      setTimeout(() => b.remove(), 700);
    }

    sparks(p, n, dist, set = ['⭐', '✨', '🌟']) {
      for (let i = 0; i < n; i++) {
        const sp = h('div', { class: 'spark' }, U.pick(set));
        const ang = Math.random() * Math.PI * 2, r = 50 + Math.random() * dist;
        sp.style.left = p.x + 'px';
        sp.style.top = p.y + 'px';
        sp.style.setProperty('--dx', Math.cos(ang) * r + 'px');
        sp.style.setProperty('--dy', Math.sin(ang) * r + 'px');
        this.el.append(sp);
        setTimeout(() => sp.remove(), 900);
      }
    }

    // 我方坦克旁边冒出武器名字
    flashWeapon(w) {
      const tag = h('div', { class: 'weapon-tag' + (w.id === 'air' ? ' super' : '') }, w.icon + ' ' + w.name);
      this.el.append(tag);
      setTimeout(() => tag.remove(), 1300);
    }

    // 必杀技：飞机飞过，扔下三颗炸弹
    async airStrike() {
      const p = this.center(this.enemy);
      const plane = h('div', { class: 'plane' }, '✈️');
      plane.style.top = Math.max(10, p.y - 70) + 'px';
      this.el.append(plane);
      Audio.sfx.plane();
      plane.getBoundingClientRect();
      plane.classList.add('go');
      await wait(450);
      [-34, 0, 34].forEach((dx, i) => setTimeout(() => {
        const b = h('div', { class: 'bomb' }, '💣');
        b.style.left = p.x + dx + 'px';
        b.style.top = Math.max(10, p.y - 60) + 'px';
        this.el.append(b);
        b.getBoundingClientRect();
        b.style.top = p.y + 'px';
        setTimeout(() => b.remove(), 360);
      }, i * 110));
      await wait(600);
      setTimeout(() => plane.remove(), 800);
      return p;
    }

    // 按武器发射，返回命中点
    async launch(id) {
      const fx = FX[id] || FX.shell, fly = fx.fly || 'shell';
      if (fly === 'air') return this.airStrike();
      this.me.classList.add('recoil');
      Audio.sfx[fx.sfx || 'shoot']();
      let p;
      if (fly === 'beam') p = await this.beam(fx.cls || '');
      else if (fly === 'sky') p = await this.thunder();
      else if (fly === 'meteor') p = await this.meteors();
      else if (fly === 'ammo') p = await this.shell(this.me, this.enemy, 'ammo ' + (fx.cls || ''), fx.ammo, fx.ms);
      else p = await this.shell(this.me, this.enemy, 'mine ' + (fx.cls || ''));
      this.me.classList.remove('recoil');
      return p;
    }

    // 雷电：天上劈下一道闪电，全场一闪
    async thunder() {
      const p = this.center(this.enemy);
      const bolt = h('div', { class: 'bolt' });
      bolt.style.left = p.x + 'px';
      bolt.style.height = p.y + 'px';
      const fl = h('div', { class: 'flash' });
      this.el.append(fl, bolt);
      await wait(260);
      setTimeout(() => { bolt.remove(); fl.remove(); }, 400);
      return p;
    }

    // 流星雨：三颗流星从右上方砸下来
    async meteors() {
      const p = this.center(this.enemy);
      [-40, 0, 40].forEach((dx, i) => setTimeout(() => {
        const m = h('div', { class: 'shell ammo meteor' }, '☄️');
        m.style.transitionDuration = '420ms';
        m.style.left = p.x + dx + 170 + 'px';
        m.style.top = '-40px';
        this.el.append(m);
        m.getBoundingClientRect();
        m.style.left = p.x + dx + 'px';
        m.style.top = p.y + (i % 2 ? -12 : 12) + 'px';
        setTimeout(() => { m.remove(); this.sparks({ x: p.x + dx, y: p.y }, 4, 40, ['🔥', '✨']); }, 420);
      }, i * 160));
      await wait(800);
      return p;
    }

    // 我方开火（weapon 是武器 id）。返回敌人是否被消灭
    // 敌人有护盾时这一炮只打碎护盾，this.blocked 设为 true
    async fire(weapon = 'shell') {
      if (!this.enemy) return true;
      const w = TM.Rewards.weapon(weapon), fx = FX[weapon] || FX.shell;
      if (weapon !== 'shell') this.flashWeapon(w);
      const p = await this.launch(weapon);
      if (this.shield) {
        this.shield = false;
        this.blocked = true;
        Audio.sfx.crack();
        this.sparks(p, 10, 80, ['🛡️', '✨', '💠']);
        this.enemy.classList.remove('shielded');
        await wait(600);
        return false;
      }
      if (this.hpBar && --this.hp > 0) {
        Audio.sfx.hit();
        this.boom(p, weapon === 'air', fx.sparks);
        this.hpBar.firstChild.style.width = (this.hp / this.maxHp) * 100 + '%';
        this.enemy.classList.add('hurt');
        if (fx.shake) this.shake();
        await wait(500);
        this.enemy.classList.remove('hurt');
        // 被打退一点
        this.y = Math.max(ENEMY_Y, this.y - STEP);
        this.enemy.style.top = this.y + '%';
        return false;
      }
      const e = this.enemy;
      this.enemy = null;
      const ms = await (END[fx.end] || END.boom)(this, e, p, !!this.hpBar || !!fx.big, fx);
      setTimeout(() => e.remove(), 1600);
      await wait(ms);
      return true;
    }

    shake() {
      this.el.classList.add('shake');
      setTimeout(() => this.el.classList.remove('shake'), 500);
    }

    // 敌方开炮打基地
    async enemyFire() {
      if (!this.enemy) return;
      Audio.sfx.shoot();
      const p = await this.shell(this.enemy, this.base, 'theirs');
      Audio.sfx.hit();
      this.boom(p, false);
      this.shake();
      await wait(500);
    }

    // 敌人开走（这道题没打下来）
    async retreat() {
      if (!this.enemy) return;
      const e = this.enemy;
      this.enemy = null;
      e.style.top = '-35%';
      await wait(700);
      e.remove();
    }

    // Boss 技能：护盾挡一炮
    shieldUp() {
      this.shield = true;
      this.enemy.classList.add('shielded');
    }

    // Boss 叫小兵：Boss 先退到一边，打完小兵再回来
    stash() {
      this._stash = { enemy: this.enemy, hpBar: this.hpBar, hp: this.hp, maxHp: this.maxHp, y: this.y };
      this.enemy.classList.add('aside');
      this.enemy = null;
    }
    async unstash() {
      if (!this._stash) return;
      if (this.enemy) await this.retreat();
      Object.assign(this, this._stash);
      this._stash = null;
      this.enemy.classList.remove('aside');
      this.enemy.style.top = this.y + '%';
      await wait(500);
    }

    // Boss 打退一点（答错但还要继续打它）
    async pushBack() {
      if (!this.enemy) return;
      this.y = ENEMY_Y;
      this.enemy.style.top = this.y + '%';
      await wait(500);
    }

    // 补给箱从天上降落，点一下打开（等太久就自动打开）。label 是打开后显示的奖励
    async supply(label) {
      const c = h('button', { class: 'crate' }, h('div', { class: 'chute' }, '🪂'), h('div', { class: 'box' }, '📦'), h('div', { class: 'tap' }, '点我！'));
      c.style.top = '-30%';
      this.layer.append(c);
      c.getBoundingClientRect();
      c.style.top = '28%';
      await new Promise(r => { c.onclick = r; setTimeout(r, 9000); });
      c.onclick = null;
      Audio.sfx.fix();
      c.classList.add('open');
      c.innerHTML = '';
      c.append(h('div', { class: 'box' }, '🎁'), h('div', { class: 'gift' }, label));
      this.sparks(this.center(c), 10, 80);
      await wait(1400);
      c.remove();
    }

    // ---------- 维修厂模式 ----------
    garage() {
      this.el.classList.add('garage');
      this.me.style.display = 'none';
      this.base.style.display = 'none';
    }

    async showBroken() {
      this.layer.innerHTML = '';
      const t = h('div', { class: 'tank repair-tank', html: V.tank('broken') });
      t.append(h('div', { class: 'wrench' }, '🔧'));
      this.layer.append(t);
      this.enemy = t;
      await wait(300);
    }

    async repaired(label) {
      const t = this.enemy;
      Audio.sfx.fix();
      t.classList.add('fixing');
      await wait(500);
      t.innerHTML = V.tank('me');
      t.append(h('div', { class: 'repair-mark' }, label));
      this.boom(this.center(t), false);
      t.classList.remove('fixing');
      await wait(900);
    }
  }

  TM.Battle = Battle;
})(window.TM);
