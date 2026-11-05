// 声音：中文语音朗读（婷婷）+ 合成音效（不需要任何音频文件）
(function (TM) {
  const A = {};
  const hasTTS = 'speechSynthesis' in window;
  const voice = { zh: null, en: null };
  let ctx = null;

  // 中文固定用婷婷（温柔女声），有增强版就用增强版；英文挑一个自然的女声
  const better = v => /premium|enhanced|增强|高音质/i.test(v.voiceURI + v.name);
  const TING = /Tingting|婷婷/i;
  const EN_GOOD = /Samantha|Google US English|Ava|Allison|Susan|Karen|Serena|Alex/i;
  const LANG = { zh: /zh[-_]CN/i, en: /^en([-_]|$)/i };

  A.voices = (lang = 'zh') => (hasTTS ? speechSynthesis.getVoices().filter(v => LANG[lang].test(v.lang)) : []);

  const pickVoice = lang => {
    if (!hasTTS) return null;
    const vs = A.voices(lang).sort((a, b) => better(b) - better(a));
    voice[lang] = lang === 'en'
      ? vs.find(v => EN_GOOD.test(v.name + v.voiceURI)) || vs[0] || null
      : vs.find(v => TING.test(v.name + v.voiceURI)) || vs[0] || null;
    return voice[lang];
  };
  const pickAll = () => { pickVoice('zh'); pickVoice('en'); };
  if (hasTTS && speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', pickAll);

  let seq = 0, busy = 0;
  // 朗读一段话，读完（或超时）后 resolve(true)；被后面的朗读打断则 resolve(false)
  // lang：'zh' 中文（婷婷），'en' 英文（Samantha 等）
  A.speak = (text, lang = 'zh') => {
    busy++;
    return say(text, lang === 'en' ? 'en' : 'zh').finally(() => { busy--; });
  };
  // 按顺序读多段，比如「中文要求 → 英文单词」。被新的朗读打断就停下
  A.speakParts = async parts => {
    const list = Array.isArray(parts) ? parts : [parts];
    for (const p of list) {
      const o = typeof p === 'string' ? { text: p } : p;
      if (!o || !o.text) continue;
      const ok = await A.speak(o.text, o.lang === 'en' ? 'en' : 'zh');
      if (!ok) return false;
    }
    return true;
  };
  const say = (text, lang) => new Promise(resolve => {
    if (!text || !hasTTS || !TM.Store.data.settings.voice) return resolve(true);
    if (!voice[lang]) pickVoice(lang);
    const my = ++seq;
    const go = () => {
      if (my !== seq) return resolve(false);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'en' ? 'en-US' : 'zh-CN';
      if (voice[lang]) u.voice = voice[lang];
      u.rate = lang === 'en' ? 0.85 : 0.9;
      u.pitch = lang === 'en' ? 1 : 1.1;
      const t = setTimeout(done, 2000 + text.length * 400);
      function done() {
        clearTimeout(t);
        resolve(my === seq);
      }
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    };
    // iOS 上 cancel 后立刻 speak 偶尔会被吞掉，稍等一下
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      setTimeout(go, 80);
    } else go();
  });
  // 等正在说的话（包括家长录音）说完再往下走，最多等 max 毫秒（防止 iOS 的朗读状态卡住）
  A.wait = (max = 20000) => new Promise(resolve => {
    const t0 = Date.now();
    const tick = () => {
      if ((!busy && !(TM.Rec && TM.Rec.playing())) || Date.now() - t0 > max) return resolve();
      setTimeout(tick, 150);
    };
    tick();
  });
  // 停掉朗读和家长录音
  A.stop = () => {
    seq++;
    if (hasTTS) speechSynthesis.cancel();
    if (TM.Rec) TM.Rec.stop();
  };

  const ac = () => {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  A.ctx = ac;

  const tone = (freq, dur, type = 'sine', vol = 0.2, at = 0, slide = 0) => {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  };

  const noise = (dur, vol = 0.3, ftype = 'lowpass', freq = 900) => {
    const c = ac();
    if (!c) return;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = ftype;
    f.frequency.value = freq;
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  };

  A.sfx = {
    tap: () => tone(520, 0.06, 'sine', 0.08),
    shoot: () => tone(700, 0.18, 'square', 0.1, 0, -450),
    boom: () => { noise(0.5, 0.4); tone(110, 0.4, 'sine', 0.3, 0, -70); },
    hit: () => { noise(0.35, 0.35); tone(80, 0.35, 'square', 0.12, 0, -40); },
    bad: () => tone(240, 0.25, 'triangle', 0.15, 0, -90),
    ok: () => { tone(660, 0.12, 'triangle', 0.2); tone(990, 0.2, 'triangle', 0.2, 0.1); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.2, i * 0.14)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.18, i * 0.2)),
    fix: () => [880, 1175, 1568].forEach((f, i) => tone(f, 0.16, 'sine', 0.15, i * 0.08)),
    missile: () => { noise(0.5, 0.2, 'bandpass', 1200); tone(300, 0.5, 'sawtooth', 0.06, 0, 500); },
    laser: () => tone(1800, 0.3, 'sawtooth', 0.08, 0, -1500),
    freeze: () => [1568, 2093, 2637].forEach((f, i) => tone(f, 0.25, 'sine', 0.1, i * 0.06)),
    crack: () => { noise(0.25, 0.4, 'highpass', 2500); tone(900, 0.1, 'square', 0.08); },
    pop: () => { tone(400, 0.12, 'sine', 0.2, 0, 600); tone(900, 0.1, 'sine', 0.12, 0.25, 500); },
    plane: () => { noise(1.1, 0.25, 'lowpass', 500); tone(160, 1.1, 'sawtooth', 0.05, 0, 60); },
    crate: () => tone(600, 0.6, 'sine', 0.08, 0, -300),
    splat: () => { noise(0.3, 0.35, 'lowpass', 600); tone(200, 0.2, 'sine', 0.2, 0, -120); },
    firework: () => { tone(400, 0.4, 'sine', 0.08, 0, 1200); [450, 560, 680].forEach(t => setTimeout(() => noise(0.3, 0.3, 'highpass', 1500), t)); },
    fire: () => { noise(0.6, 0.25, 'bandpass', 700); tone(220, 0.5, 'sawtooth', 0.05, 0, -120); },
    wind: () => { noise(1, 0.3, 'bandpass', 500); tone(300, 0.9, 'sine', 0.05, 0, 300); },
    magic: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.18, 'sine', 0.1, i * 0.07)),
    thunder: () => { noise(0.9, 0.5, 'lowpass', 400); tone(60, 0.8, 'square', 0.12, 0, -20); },
    hole: () => tone(500, 0.9, 'sine', 0.15, 0, -440),
    meteor: () => { noise(0.9, 0.25, 'lowpass', 1200); tone(400, 0.8, 'sawtooth', 0.04, 0, -300); },
    boing: () => tone(300, 0.3, 'sine', 0.2, 0, 640),
    roar: () => { noise(0.6, 0.3, 'lowpass', 320); tone(90, 0.5, 'sawtooth', 0.12, 0, -30); },
    coin: () => { tone(1320, 0.08, 'square', 0.06); tone(1760, 0.2, 'square', 0.06, 0.08); },
    buy: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, i * 0.09)),
  };

  // iOS 需要在第一次触摸时解锁音频
  // 语音也一样：第一次朗读必须发生在触摸事件里
  document.addEventListener('pointerdown', () => {
    ac();
    if (hasTTS) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  }, { once: true });

  TM.Audio = A;
})(window.TM);
