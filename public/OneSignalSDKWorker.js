/**
 * OneSignal Service Worker — required for background push notifications.
 * This file MUST be served from the root of the domain (/OneSignalSDKWorker.js).
 * Placing it in the /public folder achieves this in Vite projects.
 *
 * When a resident subscribes, this service worker runs silently in the browser
 * background — even when the Vaishnavi Pride tab is closed or the browser is minimised.
 * OneSignal's servers deliver the push notification through this worker.
 */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
