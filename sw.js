// ========== Service Worker — Guts IOC PWA ==========
const CACHE_NAME = "ioc-v1";
const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// ติดตั้ง: cache ไฟล์หลัก
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES).catch(()=>{}))
  );
  self.skipWaiting();
});

// activate: ลบ cache เก่า
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: stale-while-revalidate สำหรับ HTML/JS, network-first สำหรับ API
self.addEventListener("fetch", e => {
  const url = e.request.url;

  // API Google Script — ไม่ cache เพราะข้อมูลเปลี่ยนเสมอ
  if (url.includes("script.google.com")) {
    e.respondWith(fetch(e.request).catch(() => new Response("[]", {headers:{"Content-Type":"application/json"}})));
    return;
  }

  // ไฟล์ static — cache first, revalidate in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
