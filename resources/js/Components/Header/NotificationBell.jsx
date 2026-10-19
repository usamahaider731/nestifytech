import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  RiNotification3Line,
  RiNotification3Fill,
  RiShoppingBag3Line,
  RiSparklingLine,
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiCloseLine,
  RiVolumeUpLine,
} from 'react-icons/ri';
import axios from 'axios';
import {
  isNotificationSupported,
  requestNotificationPermission,
  showChromeNotification,
  getNotifiedIds,
  markAsNotified,
} from '@/Utils/notificationHelper';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Read permission status
  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async (triggerDesktop = true) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        const fetched = res.data.notifications;
        setNotifications(fetched);

        const notifiedIds = getNotifiedIds();
        const unnotified = fetched.filter((n) => !notifiedIds.includes(n.id));

        setUnreadCount(unnotified.length);

        // Send Chrome desktop notifications for unnotified items if permission is granted
        if (triggerDesktop && isNotificationSupported() && Notification.permission === 'granted') {
          unnotified.slice(0, 3).forEach((item) => {
            showChromeNotification(item.title, {
              body: item.body,
              icon: item.image || '/assets/image/favicon.png',
              url: item.url,
              tag: item.id,
            });
            markAsNotified(item.id);
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and poll every 45 seconds for new products or order changes
  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enable Chrome notifications
  const handleEnableDesktopNotifications = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      showChromeNotification('Notifications Enabled!', {
        body: 'You will now receive Chrome notifications for new arrivals and order updates.',
      });
      // Fire for current unread
      const notifiedIds = getNotifiedIds();
      notifications.filter((n) => !notifiedIds.includes(n.id)).slice(0, 2).forEach((item) => {
        showChromeNotification(item.title, {
          body: item.body,
          icon: item.image || '/assets/image/favicon.png',
          url: item.url,
          tag: item.id,
        });
        markAsNotified(item.id);
      });
      setUnreadCount(0);
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n) => markAsNotified(n.id));
    setUnreadCount(0);
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            handleMarkAllRead();
          }
        }}
        className="relative flex cursor-pointer items-center text-text transition hover:text-primary p-1"
        aria-label="View notifications"
        title="Notifications"
      >
        {isOpen ? <RiNotification3Fill size={20} className="text-primary" /> : <RiNotification3Line size={20} />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-bg border border-border rounded-lg shadow-2xl z-50 overflow-hidden text-xs text-text transition-all animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-bg">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-res hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <RiCheckDoubleLine size={13} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-res hover:text-text p-1 rounded hover:bg-border/50 cursor-pointer"
              >
                <RiCloseLine size={16} />
              </button>
            </div>
          </div>

          {/* Chrome Notification Enable Banner (if not already enabled) */}
          {isNotificationSupported() && permission !== 'granted' && (
            <div className="p-3 bg-primary/10 border-b border-border flex items-start gap-2.5">
              <RiVolumeUpLine size={16} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-text">
                  Enable Chrome Desktop Alerts
                </p>
                <p className="text-[10px] text-res leading-tight mt-0.5">
                  Get instant desktop popups for order tracking and new product drops.
                </p>
                <button
                  type="button"
                  onClick={handleEnableDesktopNotifications}
                  className="mt-2 px-2.5 py-1 text-[10px] font-bold bg-primary text-white rounded hover:opacity-90 transition-opacity cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  Turn On Chrome Alerts
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-res">
                <RiNotification3Line size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[11px] text-res mt-1">
                  We'll alert you here when new products drop or your order status changes.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <a
                  key={item.id}
                  href={item.url || '#'}
                  onClick={() => markAsNotified(item.id)}
                  className="p-3 flex items-start gap-3 hover:bg-border/30 transition-colors block group cursor-pointer"
                >
                  {/* Icon / Image */}
                  <div className="shrink-0 relative">
                    {item.image && !item.image.includes('placeholder') && !item.image.includes('favicon') ? (
                      <img
                        src={item.image}
                        alt=""
                        className="size-10 object-cover rounded border border-border"
                      />
                    ) : (
                      <div
                        className={`size-10 rounded flex items-center justify-center ${
                          item.category === 'order'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {item.category === 'order' ? (
                          <RiShoppingBag3Line size={18} />
                        ) : (
                          <RiSparklingLine size={18} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-text truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <RiExternalLinkLine
                        size={12}
                        className="text-res opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    </div>
                    <p className="text-[11px] text-res line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                    {item.timestamp && (
                      <span className="text-[10px] text-res/70 block mt-1">
                        {new Date(item.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-bg border-t border-border text-center">
              <Link
                href={route('store')}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Explore New Arrivals in Store &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
