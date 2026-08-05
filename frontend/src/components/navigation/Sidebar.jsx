import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/images/svr logo.jpg';
import { SYSTEM_SUBTITLE, useCompanyStore } from '../../context/companyStore';
import { useModuleSettingsStore } from '../../context/moduleSettingsStore';
import { menuSections as allMenuSections } from '../../config/menuSections';

const isPathActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);
  const disabledPaths = useModuleSettingsStore((state) => state.disabledPaths);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuSections = useMemo(() => {
    const disabled = new Set(disabledPaths);
    return allMenuSections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            if (item.submenu) {
              const submenu = item.submenu.filter((sub) => !disabled.has(sub.path));
              return submenu.length > 0 ? { ...item, submenu } : null;
            }
            return disabled.has(item.path) ? null : item;
          })
          .filter(Boolean),
      }))
      .filter((section) => section.items.length > 0);
  }, [disabledPaths]);

  const allItems = useMemo(() => menuSections.flatMap((s) => s.items), [menuSections]);

  // Auto-expand submenu of active route
  useEffect(() => {
    const active = {};
    allItems.forEach((item) => {
      if (item.submenu?.some((sub) => isPathActive(location.pathname, sub.path))) {
        active[item.label] = true;
      }
    });
    setExpandedMenus((prev) => ({ ...prev, ...active }));
  }, [location.pathname, allItems]);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const toggleMenu = (label) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus((prev) => ({ ...prev, [label]: true }));
      return;
    }
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? (isCollapsed ? 68 : 260) : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gray-900 text-white overflow-hidden shadow-2xl relative border-r border-gray-800 flex-shrink-0"
    >
      <div className="h-full flex flex-col">

        {/* Logo + Collapse Toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={logo} alt="SVR" className="w-8 h-8 rounded-lg ring-1 ring-primary-500/40 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight truncate">{companyName}</p>
                <p className="text-[10px] text-gray-500 truncate">{SYSTEM_SUBTITLE}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img src={logo} alt="SVR" className="w-8 h-8 rounded-lg ring-1 ring-primary-500/40 mx-auto" />
          )}
          <button
            onClick={() => { setIsCollapsed(p => !p); if (!isCollapsed) setExpandedMenus({}); }}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>


        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-sidebar">
          {menuSections.map((section, si) => (
            <div key={si}>
              {/* Section divider */}
              {section.title && !isCollapsed && (
                <p className="px-2 pt-3 pb-1 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              {section.title && isCollapsed && si > 0 && (
                <div className="my-2 border-t border-gray-800" />
              )}

              {section.items.map((item) => {
                const submenuActive = item.submenu?.some((sub) => isPathActive(location.pathname, sub.path));

                // Submenu item
                if (item.submenu) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        title={isCollapsed ? item.label : ''}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                          submenuActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon size={16} className="flex-shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <motion.div animate={{ rotate: expandedMenus[item.label] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={13} className="text-gray-600" />
                          </motion.div>
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedMenus[item.label] && !isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden ml-4 pl-3 border-l border-gray-800 mt-0.5 mb-1 space-y-0.5"
                          >
                            {item.submenu.map((sub) => (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    isActive
                                      ? 'bg-primary-600 text-white'
                                      : 'text-gray-500 hover:text-white hover:bg-gray-800'
                                  }`
                                }
                              >
                                <sub.icon size={13} className="flex-shrink-0" />
                                <span>{sub.label}</span>
                              </NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // Direct link
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-900/40'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                      }`
                    }
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        item.badge === 'daily'
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-400 text-amber-900'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>


      </div>
    </motion.aside>
  );
};

export default Sidebar;
