import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [moduleUnreadMap, setModuleUnreadMap] = useState({});

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotalUnread(data.total_unread || 0);
        setModuleUnreadMap(data.module_unread_map || {});
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s auto-sync
    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  const markAsRead = async (notifId) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markModuleAsRead = async (moduleKey) => {
    if (!token || !moduleKey) return;
    try {
      await fetch('/api/notifications/mark-module-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ module_key: moduleKey })
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Error clearing module notifications:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        totalUnread,
        moduleUnreadMap,
        fetchNotifications,
        markAsRead,
        markModuleAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
