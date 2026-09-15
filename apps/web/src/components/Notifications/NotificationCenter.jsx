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
        className="relative p-2.5 text-[#D7B66D] bg-[#102A25] border border-[#D7B66D]/30 hover:border-[#D7B66D]/60 rounded-xl transition shadow-md hover:shadow-[#D7B66D]/10"
        title="SMS Alert Notification Center"
      >
        <Bell className="w-5 h-5 text-[#D7B66D]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#D7B66D] text-[#0B2318] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-[#0B2318]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 card-aserre rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-[#D7B66D]/20 flex items-center justify-between bg-[#0B2318]">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-[#D7B66D]" />
              <h3 className="text-sm font-bold font-serif-luxury text-white">SMS Alert Logs</h3>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full badge-aserre-gold">
              {notifications.length} Alerts
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-3.5 space-y-3 divide-y divide-[#D7B66D]/15">
            {loading && notifications.length === 0 ? (
              <p className="text-xs text-[#8FA399] text-center py-6">Loading notification logs...</p>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 space-y-1.5">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold font-serif-luxury text-white">No SMS Alerts Dispatched</p>
                <p className="text-[10px] text-[#8FA399]">All project delay risks and cost overruns are within safe thresholds.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.notification_id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md badge-aserre-gold flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 mr-1 text-[#D7B66D]" />
                      {notif.channel || 'SMS'}
                    </span>
                    <span className="text-[10px] text-[#8FA399] flex items-center space-x-1">
                      <Clock className="w-3 h-3 mr-0.5 text-[#D7B66D]/60" />
                      {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#FAF7F2] leading-snug font-mono bg-[#0B2318] p-2.5 rounded-xl border border-[#D7B66D]/20">
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
