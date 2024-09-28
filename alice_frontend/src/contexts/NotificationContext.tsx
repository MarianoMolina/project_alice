import React, { createContext, useContext, useState, ReactNode } from 'react';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationAction {
  label: string;
  onClick: () => void;
}

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  action?: NotificationAction;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type?: NotificationType, duration?: number, action?: NotificationAction) => void;
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: NotificationType = 'info', duration = 5000, action?: NotificationAction) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => removeNotification(id), duration);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};