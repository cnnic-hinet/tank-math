// 家长页：各题型正确率、近 7 天、设置、学校进度、奖励目标、录音、备份
(function (TM) {
  const { U, Store, Audio, Q, Levels: L, Repair } = TM;
  const h = U.h;
  const P = {};

  const color = r => (r >= 0.85 ? '#4caf50' : r >= 0.6 ? '#ffb300' : '#ff6b5e');

  // 学习分析：这里只放摘要，详细的在维修厂「📊 学习分析」
  const accCard = () => {
    const A = TM.Analysis;
    const rows = A.rows(), all = A.all(rows);
    const weak = rows.filter(r => A.level(r) >= 2).slice(0, 4);
    return h('div', { class: 'p-card' },
      h('h3', null, '📊 学习分析'),
      h('div', { class: 'an-sum' }, A.summary()),
      weak.length ? h('div', { class: 'an-list', style: { marginTop: '10px' } }, weak.map(r => h('div', { class: 'an-row lv' + A.level(r) },
        h('div', { class: 'an-row-top' },
          h('b', null, r.name),
          h('span', { class: 'an-zone' }, r.zone ? `${r.zone.icon} ${r.zone.name}` : ''),
          h('span', { class: 'an-state ' + (r.acc >= 0.85 ? 'good' : r.acc >= 0.6 ? 'mid' : 'bad') }, `${Math.round(r.acc * 100)}%`)),
        h('div', { class: 'an-bar' }, h('i', { style: { width: Math.round(r.acc * 100) + '%', background: color(r.acc) } })),
        h('div', { class: 'an-meta' }, h('span', null, `做了 ${r.n} 次，错 ${r.wrong} 次`),
          r.main ? h('span', null, `主要错在${A.KINDS[r.main].name}`) : null)))) : null,
      h('button', { class: 'btn green', style: { marginTop: '12px', width: '100%' }, onclick: () => { Audio.sfx.tap(); TM.Garage.show('an'); } },
        '打开详细分析（按题型、难度、错法）'),
      h('div', { class: 'note' }, `一共做了 ${all.n} 题，第一次答对 ${all.ok} 题。详细页面里能看到每个题型的正确率、基础/提高/挑战分开的表现、错在哪儿，还能直接出题练。`));
  };

  const weekCard = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(U.addDays(U.today(), -i));
    const data = days.map(k => Store.data.daily[k] || { sec: 0, n: 0, ok: 0, wrong: {} });
    const maxMin = Math.max(10, ...data.map(d => d.sec / 60));
    const wrong = {};
    data.forEach(d => Object.entries(d.wrong).forEach(([t, c]) => { wrong[t] = (wrong[t] || 0) + c; }));
    const top = Object.entries(wrong).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const n = data.reduce((s, d) => s + d.n, 0), ok = data.reduce((s, d) => s + d.ok, 0);
    return h('div', { class: 'p-card' },
      h('h3', null, '📅 最近 7 天'),
      h('div', { class: 'week' }, data.map((d, i) => {
        const m = Math.round(d.sec / 60);
        return h('div', { class: 'day' + (i === 6 ? ' today' : '') },
          h('span', { class: 'v' }, m ? m + '分' : ''),
          h('div', { class: 'col', style: { height: (d.sec / 60 / maxMin) * 100 + '%' } }),
          h('span', null, i === 6 ? '今天' : days[i].slice(5).replace('-', '/')));
      })),
      h('div', { class: 'note' }, `7 天共做 ${n} 题，第一次就答对 ${ok} 题${n ? `（${Math.round((ok / n) * 100)}%）` : ''}。`),
      h('h3', { style: { marginTop: '14px' } }, '❗ 最近错得最多'),
      top.length
        ? h('div', { class: 'miss-list' }, top.map(([t, c]) => h('div', null, `${Q.names[t] || t}　`, h('span', { class: 'cnt' }, `错 ${c} 次`))))
        : h('div', { class: 'note' }, '最近没有错题 👍'),
      h('div', { class: 'note' }, `维修厂：待修 ${Repair.active().length} 辆，已修好 ${Repair.fixedList().length} 辆。`));
  };

  const seg = (opts, cur, onPick) => {
    const box = h('div', { class: 'seg' });
    opts.forEach(([v, label]) => box.append(h('button', {
      class: v === cur ? 'on' : '',
      onclick: () => { onPick(v); box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.textContent === label)); },
    }, label)));
    return box;
  };

  const setCard = () => {
    const S = Store.data;
    const nick = h('input', { value: S.nick, maxlength: 6, style: { width: '140px', padding: '6px 10px', borderRadius: '10px', border: '2px solid #ddd8e8', fontSize: '18px' } });
    nick.addEventListener('change', () => { S.nick = nick.value.trim() || '可可'; Store.save(); });
    return h('div', { class: 'p-card' },
      h('h3', null, '⚙️ 设置'),
      h('div', { class: 'set-row' }, '每天最多玩',
        seg([[10, '10分'], [15, '15分'], [20, '20分'], [30, '30分'], [0, '不限']], S.settings.limitMin, v => { S.settings.limitMin = v; Store.save(); })),
      h('div', { class: 'set-row' }, '朗读题目',
        seg([[true, '开'], [false, '关']], S.settings.voice, v => { S.settings.voice = v; Store.save(); }),
        h('button', { class: 'btn small gray', onclick: () => TM.Lines.say('hello') }, '试听')),
      h('div', { class: 'set-row' }, '孩子昵称', nick),
      h('div', { class: 'note' }, `今天已玩 ${U.fmtTime(Store.day().sec)}。到了时长，开新关时会提醒休息（正在打的关可以打完）。`));
  };

  // 学校进度：没学到的战区先藏起来
  const schoolCard = () => {
    const hide = Store.data.settings.hide;
    return h('div', { class: 'p-card' },
      h('h3', null, '🏫 学校进度'),
      h('div', { class: 'note' }, '点一下切换。“还没学”的战区在地图上锁住，学校讲到了再打开。'),
      h('div', { class: 'chips' }, L.ZONES.map((z, zi) => {
        if (zi === 0) return null;
        const b = h('button', {
          class: 'chip' + (hide[z.id] ? '' : ' on'),
          onclick: () => {
            if (hide[z.id]) delete hide[z.id]; else hide[z.id] = true;
            Store.save();
            b.classList.toggle('on', !hide[z.id]);
            b.lastChild.textContent = hide[z.id] ? '还没学' : '学过了';
          },
        }, h('b', null, `${z.icon} ${z.name}`), h('small', null, `${z.grade} · ${z.desc}`), h('span', null, hide[z.id] ? '还没学' : '学过了'));
        return b;
      })));
  };

  // 现实奖励：攒勋章兑换
  const goalCard = () => {
    const S = Store.data.settings;
    const g = TM.Tasks.goal();
    const text = h('input', { class: 'p-input', placeholder: '比如：周末去公园玩', maxlength: 20, value: g ? g.text : '' });
    let need = g ? g.need : 5;
    const start = () => {
      const t = text.value.trim();
      if (!t) return TM.App.toast('先写下奖励是什么');
      S.goal = { text: t, need, start: U.today() };
      Store.save();
      TM.App.toast('奖励目标已设好');
      P.show();
    };
    const clear = () => { S.goal = null; Store.save(); P.show(); };
    return h('div', { class: 'p-card' },
      h('h3', null, '🎁 奖励目标'),
      g ? h('div', { class: 'set-row' }, `当前：${g.text}`, h('b', null, `🏅 ${g.got}/${g.need}`), g.reached ? h('span', { class: 'adj strong' }, '已达成') : null) : null,
      h('div', { class: 'set-row' }, '奖励', text),
      h('div', { class: 'set-row' }, '需要勋章',
        seg([[3, '3枚'], [5, '5枚'], [7, '7枚'], [10, '10枚']], need, v => { need = v; })),
      h('div', { class: 'set-row' },
        h('button', { class: 'btn small green', onclick: start }, g ? '重新开始' : '开始攒'),
        g ? h('button', { class: 'btn small gray', onclick: clear }, g.reached ? '已兑现，清除' : '取消目标') : null),
      h('div', { class: 'note' }, '孩子每天完成全部每日任务得 1 枚勋章。地图上会显示进度，攒满时会提醒孩子来找你兑现。'));
  };

  // 家长录音：每个场景录一句表扬，最长 8 秒
  const recCard = () => {
    const R = TM.Rec;
    const card = h('div', { class: 'p-card' }, h('h3', null, '🎙️ 家长录音'));
    if (!R.supported() || !window.isSecureContext) {
      card.append(h('div', { class: 'note' }, '这个浏览器不支持录音（需要用 https 或本机地址打开）。'));
      return card;
    }
    let busy = null;
    const rows = {};
    const draw = async () => {
      const has = await R.list();
      R.SLOTS.forEach(sl => {
        const row = rows[sl.id];
        row.innerHTML = '';
        const recBtn = h('button', { class: 'btn small red' }, '● 录音');
        recBtn.onclick = async () => {
          if (busy) { busy.stop(); return; }
          try {
            busy = await R.record();
          } catch (e) {
            busy = null;
            return TM.App.toast('没有拿到麦克风权限');
          }
          let left = busy.max / 1000;
          recBtn.textContent = `■ 停止（${left}）`;
          const tick = setInterval(() => { left--; recBtn.textContent = `■ 停止（${Math.max(0, left)}）`; }, 1000);
          const blob = await busy.done;
          clearInterval(tick);
          busy = null;
          await R.set(sl.id, blob);
          TM.App.toast('录好了');
          draw();
        };
        row.append(...[h('b', null, sl.name), recBtn,
          has[sl.id] ? h('button', { class: 'btn small blue', onclick: () => R.play(sl.id).then(ok => ok || TM.App.toast('播放失败，请检查是否开了声音')) }, '▶ 试听') : h('span', { class: 'p-muted' }, '还没录（用老师的话表扬）'),
          has[sl.id] ? h('button', { class: 'btn small gray', onclick: async () => { await R.del(sl.id); draw(); } }, '删除') : null].filter(Boolean));
      });
    };
    R.SLOTS.forEach(sl => { rows[sl.id] = h('div', { class: 'set-row rec-row' }); card.append(rows[sl.id]); });
    card.append(h('div', { class: 'note' }, '比如：“可可真棒，妈妈为你骄傲！” 录了的场景就播放你的声音，没录的还是老师说。录音只存在这台 iPad 上，不在备份文件里。'));
    draw();
    return card;
  };

  const backupCard = () => {
    const ta = h('textarea', { placeholder: '把备份内容粘贴到这里，再点“导入”' });
    // 自动快照：每天第一次打开时自动存一份，升级/恢复/导入前也会存
    const restore = async s => {
      const v = await TM.App.ask({
        emoji: '⚠️', title: '用这份快照恢复？',
        text: `「${s.label}」的进度会覆盖现在的进度。恢复前会先把现在这份存成「恢复前」，点错了还能退回来。`,
        buttons: [{ label: '取消', value: 0, cls: 'gray' }, { label: '恢复', value: 1, cls: 'red' }],
      });
      if (!v) return;
      if (Store.restore(s.raw)) { TM.App.toast('已恢复，正在重新打开'); setTimeout(() => location.reload(), 800); }
      else TM.App.toast('恢复失败');
    };
    const snaps = Store.snaps();
    const snapBox = h('div', null,
      h('h3', { style: { marginTop: '14px' } }, '🕘 自动快照'),
      h('div', { class: 'note' }, '每天第一次打开时自动存一份，留 7 天；升级、导入、恢复之前也会各存一份。存档读不出来时，从这里恢复。'),
      snaps.length
        ? h('div', { class: 'snap-list' }, snaps.map(s => h('div', { class: 'set-row' },
          h('b', null, s.label),
          h('span', { class: 'p-muted' }, s.broken ? '这份读不出来' : `做了 ${s.n} 题 · ⭐ ${s.wallet} · ${Math.max(1, Math.round(s.size / 1024))}KB`),
          h('button', { class: 'btn small blue', onclick: () => restore(s) }, '恢复'))))
        : h('div', { class: 'note' }, '还没有快照，下次打开时会自动存。'));
    const brokenBox = Store.broken ? h('div', { class: 'p-warn' },
      h('div', null, '⚠️ 存档读取失败。原文件已经另存了一份，不会被覆盖。可以先在下面「自动快照」里恢复，或者点右边的按钮以新存档继续。'),
      h('button', { class: 'btn small red', onclick: async () => {
        const v = await TM.App.ask({ emoji: '⚠️', title: '以新存档继续？', text: '本次打开后做的进度会保存。读不出来的那份已经单独留了，之后还能在快照里找到。', buttons: [{ label: '取消', value: 0, cls: 'gray' }, { label: '继续', value: 1, cls: 'red' }] });
        if (v) { Store.acceptNew(); TM.App.toast('已保存新存档'); P.show(); }
      } }, '以新存档继续')) : null;
    const download = () => {
      const blob = new Blob([Store.exportText()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `坦克数学备份-${U.today()}.json` });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      backedUp();
    };
    const backedUp = () => { Store.data.lastBackup = U.today(); Store.save(); warn.remove(); };
    const days = U.daysBetween(Store.data.lastBackup || Store.data.created, U.today());
    const warn = TM.App.backupOld()
      ? h('div', { class: 'p-warn' }, Store.data.lastBackup ? `⚠️ 已经 ${days} 天没备份了，建议现在备份一次。` : '⚠️ 还没有备份过，建议现在备份一次。')
      : h('span');
    const copy = async () => {
      ta.value = Store.exportText();
      try { await navigator.clipboard.writeText(ta.value); TM.App.toast('已复制，可以粘贴到备忘录保存'); backedUp(); }
      catch (e) { ta.select(); TM.App.toast('请手动全选复制文本框里的内容'); }
    };
    const fileIn = h('input', { type: 'file', accept: '.json,application/json,text/plain', style: { display: 'none' } });
    fileIn.addEventListener('change', async () => { if (fileIn.files[0]) ta.value = await fileIn.files[0].text(); });
    const doImport = async () => {
      if (!ta.value.trim()) return TM.App.toast('先粘贴或选择备份文件');
      const v = await TM.App.ask({ emoji: '⚠️', title: '确定导入吗？', text: '当前进度会被备份里的内容覆盖。', buttons: [{ label: '取消', value: 0, cls: 'gray' }, { label: '导入', value: 1, cls: 'red' }] });
      if (!v) return;
      try { Store.importText(ta.value.trim()); TM.Analysis?.backfill(); TM.App.toast('导入成功'); P.show(); }
      catch (e) { TM.App.toast('导入失败：' + e.message); }
    };
    const doReset = async () => {
      const v = await TM.App.ask({ emoji: '🗑️', title: '清空所有进度？', text: '星星、错题本、统计都会被删除，无法恢复。建议先导出备份。', buttons: [{ label: '取消', value: 0, cls: 'gray' }, { label: '清空', value: 1, cls: 'red' }] });
      if (v) { Store.reset(); TM.App.map(); }
    };
    return h('div', { class: 'p-card full' },
      h('h3', null, '💾 备份与恢复'),
      warn,
      TM.App.standalone() ? null : h('div', { class: 'p-warn' },
        '📱 建议在 Safari 里点「分享 → 添加到主屏幕」，以后从主屏幕图标打开。直接用 Safari 打开的网页，7 天不用时 Safari 可能会清掉进度。'),
      h('div', { class: 'set-row' },
        h('button', { class: 'btn small blue', onclick: download }, '下载备份文件'),
        h('button', { class: 'btn small blue', onclick: copy }, '复制备份文本'),
        h('button', { class: 'btn small gray', onclick: () => fileIn.click() }, '选择备份文件'),
        h('button', { class: 'btn small green', onclick: doImport }, '导入'),
        h('button', { class: 'btn small red', onclick: doReset }, '清空进度'), fileIn),
      ta,
      brokenBox,
      snapBox,
      h('div', { class: 'note' }, `进度只存在这台 iPad 的 Safari 里。清除 Safari 网站数据会丢失进度，建议每周备份一次。家长录音不在备份里。当前存档 ${Math.max(1, Math.round(Store.size() / 1024))}KB。`));
  };

  P.show = () => {
    TM.App.show(h('div', { class: 'screen parent' },
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-icon', onclick: () => TM.App.map() }, '←'),
        h('div', { class: 'title' }, '👨‍👩‍👦 家长页')),
      h('div', { class: 'p-body' }, accCard(), h('div', { class: 'p-stack' }, weekCard(), setCard(), schoolCard()), goalCard(), recCard(), backupCard())));
    TM.App.noClock = true;
  };

  TM.Parent = P;
})(window.TM);
