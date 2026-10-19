/**
 * Utility functions for Web / Chrome Desktop Notifications
 */

export const NOTIFICATION_STORAGE_KEY = 'nestify_notified_ids';
export const NOTIFICATION_PERMISSION_KEY = 'nestify_chrome_notifications_enabled';

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request permission from the user to display Chrome / Browser notifications
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Display a native Chrome / OS desktop notification
 */
export function showChromeNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    icon: options.icon || '/assets/image/favicon.png',
    badge: '/assets/image/favicon.png',
    body: options.body || '',
    tag: options.tag || 'nestifytech',
    renotify: true,
    ...options,
  });

  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    if (options.url) {
      window.location.href = options.url;
    }
    notification.close();
  };

  return notification;
}

/**
 * Get the list of already notified item IDs from localStorage
 */
export function getNotifiedIds() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Mark item IDs as notified
 */
export function markAsNotified(id) {
  try {
    const ids = getNotifiedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      // Keep only recent 100 to prevent unbounded growth
      const trimmed = ids.slice(-100);
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.error('Error saving notified id', err);
  }
}
