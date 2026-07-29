import React, { useState, useEffect } from 'react';
import { getNotifications } from '../../services/api';
import { Bell, Smartphone, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

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
        className="relative p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition"
        title="SMS Alert Notification Center"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">SMS Alert Logs</h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {notifications.length} Alerts
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
            {loading && notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Loading notification logs...</p>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 space-y-1">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">No SMS Alerts Dispatched</p>
                <p className="text-[10px] text-slate-400">All project delay risks and cost overruns are within safe thresholds.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.notification_id} className="pt-2.5 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {notif.channel || 'SMS'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 mr-0.5 text-slate-500" />
                      {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/60">
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
