
/*
  BARRIO DIGITAL
  RESINAS DEL PACÍFICO

  Service Worker
  Actualización automática de archivos
  y funcionamiento sin conexión.
*/

const CACHE = "resinas-pacifico-v1.0.5";

const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./assets/logo.jpg",
  "./assets/hero.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png"
];

// INSTALACIÓN

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("resinas-pacifico-") &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// CONSULTAS

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Nunca interceptar Supabase ni otros dominios.

  if (url.origin !== self.location.origin) {
    return;
  }

  // No guardar el administrador en caché.

  if (url.pathname.endsWith("/admin.html")) {
    return;
  }

  event.respondWith(
    (async () => {

      const cache = await caches.open(CACHE);

      try {

        // Consultar primero la versión en línea.

        const response = await fetch(request);

        if (response.ok) {

          // Guardar la versión más reciente.

          await cache.put(
            request,
            response.clone()
          );
        }

        return response;

      } catch (error) {

        // Si falla internet, usar la caché.

        const cached =
          await caches.match(request);

        if (cached) {
          return cached;
        }

        // Página sin conexión.

        if (request.mode === "navigate") {

          const offline =
            await caches.match("./offline.html");

          if (offline) {
            return offline;
          }
        }

        return Response.error();

      }

    })()
  );

});
