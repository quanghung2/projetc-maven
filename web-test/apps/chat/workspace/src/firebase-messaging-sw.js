// [START initialize_firebase_in_sw]
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  messagingSenderId: '272212048036'
});

// use this variable for showing 1 notification once until notification closed
// var isShowNotification = true;

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
// [END initialize_firebase_in_sw]

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Notification';
  const notificationOptions = {
    body: payload.data.popupMessage,
    icon: payload.data.appIconUrl || 'https://d2hlei1umhw6cd.cloudfront.net/images/app-logo/visitor_128x128.png'
  };
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      if (client.frameType == 'top-level') {
        client.postMessage(payload);
      }
    });
  });

  // register event noficationclose
  // self.addEventListener('notificationclose', function(event) {
  //   isShowNotification = true;
  // });

  if (payload.data.popupMessage) {
    // if (isShowNotification) {
    //   isShowNotification = false;
    //   return self.registration.showNotification(notificationTitle, notificationOptions);
    // }
    if (!payload.data.expiredTime || payload.data.expiredTime >= new Date().getTime()) {
      return self.registration.showNotification(notificationTitle, notificationOptions);
    }
  }
});
// [END background_handler]
