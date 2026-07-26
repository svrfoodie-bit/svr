import {
  Menu,
  Home,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/images/svr logo.jpg';
import { fetchNotifications } from '../../services/notificationService';
import GlobalSearch from './GlobalSearch';
import { useThemeStore } from '../../context/themeStore';
import { useAuthStore } from '../../context/authStore';
import { APP_SUBTITLE, useCompanyStore } from '../../context/companyStore';

const TYPE_ICON = {
  alert: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const TYPE_COLOR = {
  alert: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  // Load on mount, refresh every 5 minutes
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-xl shadow-soft border-b border-gray-200/50 px-4 md:px-6 py-3 sticky top-0 z-30"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Logo & App Name */}
        <div className="flex items-center gap-3 md:gap-4">
          <motion.button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-primary-50 rounded-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={22} className="text-gray-700" />
          </motion.button>

          <motion.div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={logo}
              alt="SVR Logo"
              className="w-10 h-10 rounded-full ring-2 ring-accent-400/50 shadow-soft"
            />
            <div className="hidden sm:block">
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                {companyName}
              </h1>
              <p className="text-xs text-gray-500">{APP_SUBTITLE}</p>
            </div>
          </motion.div>
        </div>

        {/* Centre - Global Search */}
        <div className="hidden md:flex flex-1 justify-center max-w-sm mx-4">
          <GlobalSearch />
        </div>

        {/* Right side - Utility Icons */}
        <div className="flex items-center gap-2 md:gap-3">
          <motion.button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-primary-50 rounded-xl transition-all group relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Home"
          >
            <Home size={20} className="text-gray-700 group-hover:text-primary-600" />
          </motion.button>

          {/* Dark mode toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 hover:bg-primary-50 rounded-xl transition-all relative overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun size={20} className="text-amber-400" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon size={20} className="text-gray-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>


          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-primary-50 rounded-xl transition-all relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Notifications"
            >
              <Bell size={20} className="text-gray-700" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-strong border border-gray-200 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); loadNotifications(); }}
                          disabled={loadingNotifs}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Refresh"
                        >
                          <RefreshCw size={14} className={`text-gray-400 ${loadingNotifs ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifs && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                          <RefreshCw size={16} className="animate-spin" />
                          <span className="text-sm">Checking...</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={32} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">All clear — no alerts</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const Icon = TYPE_ICON[notif.type] || Info;
                          const iconColor = TYPE_COLOR[notif.type] || 'text-gray-400';
                          return (
                            <motion.div
                              key={notif.id}
                              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                              className={`p-4 border-b border-gray-50 cursor-pointer ${notif.unread ? 'bg-primary-50/30' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <Icon size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-800">{notif.title}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                </div>
                                {notif.unread && (
                                  <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 shrink-0" />
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-100">
                      <button
                        onClick={() => { setShowNotifications(false); navigate('/outstanding-report'); }}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View outstanding report →
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {/* User avatar + dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 p-1.5 hover:bg-primary-50 rounded-xl transition-all"
              title="Account"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-400 capitalize leading-tight">{user?.role || ''}</p>
              </div>
              <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-strong border border-gray-100 z-50 overflow-hidden"
                  >
                    {/* Profile info */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-primary-50 to-accent-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                          <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={16} className="text-gray-400" />
                        Settings
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/help'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={16} className="text-gray-400" />
                        Help
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
                      >
                        <LogOut size={16} className="text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
