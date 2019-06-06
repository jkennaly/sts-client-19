// index.jsx

import m from 'mithril'
const root = document.getElementById("app");

// Styles
import "./index.css";
// images
//import "./favicon.ico";

import App from './components/layout/App.jsx';
//window.isUpdateAvailable = new Promise(function(resolve, reject) {
if ('serviceWorker' in navigator) {
  /*
	let refreshing;
   // The event listener that is fired when the service worker updates
   // Here we reload the page
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      	//console.log('serviceWorker controllerchange')
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      registration.addEventListener('updatefound', () => {
      	//console.log('serviceWorker updatefound')

        // An updated service worker has appeared in registration.installing!
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          console.log('serviceWorker statechange')
          console.log(newWorker.state)

          // Has service worker state changed?
          switch (newWorker.state) {
            case 'installed':

	// There is a new service worker available, show the notification
              if (navigator.serviceWorker.controller) {
                let notification = document.getElementById('upgrade-notice');
    				    notification.className = 'show';
              }

              break;
          }
        });
      });
      //console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
  */
}
//})

m.render(root, <App />);
