// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyCJsjqXeI64pQWfYT7sosPES-Q8V10-Nis",
  authDomain: "diwalya-8f905.firebaseapp.com",
  projectId: "diwalya-8f905",
  storageBucket: "diwalya-8f905.appspot.com",
  messagingSenderId: "59846271927",
  appId: "1:59846271927:web:2f0e0ef6bde9589d977461"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/diwalya-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
