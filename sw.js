// 离线缓存：只有在 https 下才会启用。改了文件记得把 VERSION 加 1
const VERSION = 'tankmath-14';
const FILES = [
  './', 'index.html', 'manifest.json', 'icon-512.png', 'icon.svg', 'css/style.css',
  'js/util.js', 'js/storage.js', 'js/audio.js', 'js/rec.js', 'js/lines.js', 'js/q-core.js', 'js/q-zone1.js', 'js/q-zone2.js', 'js/q-zone3.js',
  'js/q-pos.js', 'js/q-zone4.js', 'js/q-zone5.js', 'js/q-zone6.js', 'js/tasks.js', 'js/minigame.js',
  'js/levels.js', 'js/repair.js', 'js/analysis.js', 'js/rewards.js', 'js/visual.js', 'js/battle.js', 'js/app.js', 'js/play.js', 'js/garage.js', 'js/hangar.js', 'js/parent.js',
];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
