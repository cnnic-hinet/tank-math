// 家长录音：过关、打败 Boss、完成每日任务时播放爸爸妈妈录的表扬
// 录音存在 IndexedDB 里，不进备份文件
(function (TM) {
  const R = {};
  const DB = 'tankmath-rec', ST = 'clips';
  const MAX_MS = 8000;

  R.SLOTS = [
    { id: 'win', name: '过关时' },
    { id: 'boss', name: '打败 Boss 时' },
    { id: 'daily', name: '完成每日任务时' },
  ];

  R.supported = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.indexedDB);

  let db = null;
  const open = () => db || (db = new Promise((res, rej) => {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => q.result.createObjectStore(ST);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  }));
  const tx = (mode, fn) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction(ST, mode), q = fn(t.objectStore(ST));
    t.oncomplete = () => res(q && q.result);
    t.onerror = () => rej(t.error);
  }));

  R.get = id => (window.indexedDB ? tx('readonly', s => s.get(id)).catch(() => null) : Promise.resolve(null));
  R.set = (id, blob) => tx('readwrite', s => s.put(blob, id));
  R.del = id => tx('readwrite', s => s.delete(id));
  R.list = async () => {
    const out = {};
    for (const s of R.SLOTS) out[s.id] = !!(await R.get(s.id));
    return out;
  };

  // 开始录音，最长 8 秒。返回 {stop, done}；done resolve 成录好的 Blob
  R.record = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported?.(t));
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const parts = [];
    mr.ondataavailable = e => e.data.size && parts.push(e.data);
    const done = new Promise(res => {
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        res(new Blob(parts, { type: mr.mimeType || type || 'audio/mp4' }));
      };
    });
    mr.start();
    const timer = setTimeout(() => mr.state === 'recording' && mr.stop(), MAX_MS);
    return {
      max: MAX_MS,
      done,
      stop: () => { clearTimeout(timer); if (mr.state === 'recording') mr.stop(); },
    };
  };

  // 用已解锁的 AudioContext 播放（iOS 上不需要再点一下）
  let cur = null;
  R.stop = () => {
    if (cur) { try { cur.stop(); } catch (e) { /* 已经停了 */ } }
    cur = null;
  };
  R.playBlob = async blob => {
    const ctx = TM.Audio.ctx();
    if (!ctx || !blob) return false;
    try {
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      R.stop();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.onended = () => { if (cur === src) cur = null; };
      src.start();
      cur = src;
      return true;
    } catch (e) {
      console.warn('录音播放失败', e);
      return false;
    }
  };
  R.playing = () => !!cur;
  // 播放某个场景的录音；没有录音或关了声音返回 false
  R.play = async id => {
    if (!TM.Store.data.settings.voice) return false;
    return R.playBlob(await R.get(id));
  };

  TM.Rec = R;
})(window.TM);
