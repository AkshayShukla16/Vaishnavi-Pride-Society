/**
 * Native Browser Web Push Notification & PWA Service Worker Engine for Vaishnavi Pride.
 * Enables system notifications on Windows, Android, macOS, and iOS.
 * Utilizes Service Worker (sw.js) so alerts reach end users even when browser tabs are closed.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

// Register Service Worker for Background Push Notifications when App loads
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => {
        swRegistration = reg;
        console.log('[PWA Service Worker Engine Registered]', reg.scope);
      },
      (err) => {
        console.warn('[PWA Service Worker Registration Failed]', err);
      }
    );
  });
}

export const notificationService = {
  /**
   * Request browser permission for system push notifications and register Service Worker
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[Notification Engine] Browser does not support desktop notifications.');
      return false;
    }

    let isGranted = Notification.permission === 'granted';

    if (Notification.permission !== 'denied' && !isGranted) {
      const permission = await Notification.requestPermission();
      isGranted = permission === 'granted';
    }

    if (isGranted && 'serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.ready;
      } catch (err) {
        console.warn('[Service Worker Ready Error]', err);
      }
    }

    return isGranted;
  },

  /**
   * Send native OS push notification alert to user device.
   * Leverages Service Worker showNotification if active so notification reaches device even when browser is closed.
   */
  sendNotification(title: string, body: string, iconUrl?: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log(`[In-App Broadcast Fallback] ${title}: ${body}`);
      return;
    }

    const icon = iconUrl || '/pwa-icon.png';

    // If Service Worker is ready, use showNotification for background/offline notification support
    if (swRegistration && 'showNotification' in swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: 'vaishnavi-society-alert',
      }).catch(() => {
        // Fallback to standard Notification
        new Notification(title, { body, icon, tag: 'vaishnavi-society-alert' });
      });
    } else {
      try {
        new Notification(title, {
          body,
          icon,
          tag: 'vaishnavi-society-alert',
        });
      } catch (err) {
        console.warn('[Notification Trigger Error]', err);
      }
    }
  }
};
