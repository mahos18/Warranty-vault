// public/sw.js
// Service Worker — handles incoming push notifications

self.addEventListener("push", function (event) {
  let data = { title: "Warranty Vault", body: "You have a warranty update." };

  try {
    data = event.data.json();
  } catch {
    data.body = event.data?.text() ?? data.body;
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag ?? "warranty-notification",
    renotify: true,
    data: { url: data.url ?? "/dashboard" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// When user taps the notification — open the app
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});