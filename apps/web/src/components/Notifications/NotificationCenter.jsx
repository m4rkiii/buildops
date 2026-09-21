import React, { useState, useEffect } from 'react';
import { getNotifications } from '../../services/api';
import { Bell, Smartphone, Clock, AlertTriangle, CheckCircle, Crown } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notification-bell"
        className="relative p-2.5 text-white bg-zinc-900 border border-zinc-700 hover:border-white hover:bg-black rounded-xl transition shadow-md"
        title="SMS Alert Notification Center"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 card-aserre rounded-2xl shadow-2xl z-50 overflow-hidden bg-zinc-950 border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white tracking-tight">SMS Alert Logs</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-white border border-zinc-700">
              {notifications.length} Alerts
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-3.5 space-y-3 divide-y divide-zinc-800">
            {loading && notifications.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6 font-medium">Loading notification logs...</p>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 space-y-1.5">
                <CheckCircle className="w-6 h-6 text-white mx-auto" />
                <p className="text-xs font-bold text-white">No SMS Alerts Dispatched</p>
                <p className="text-[10px] text-zinc-400 font-medium">All project delay risks and cost overruns are within safe thresholds.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.notification_id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-800 text-white border border-zinc-700 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 mr-1 text-white" />
                      {notif.channel || 'SMS'}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center space-x-1 font-medium">
                      <Clock className="w-3 h-3 mr-0.5 text-zinc-500" />
                      {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-snug font-mono bg-black p-2.5 rounded-xl border border-zinc-800">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
