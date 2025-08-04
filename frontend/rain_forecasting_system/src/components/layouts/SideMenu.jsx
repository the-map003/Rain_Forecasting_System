import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bus,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { 
  getFilteredMenuItems, 
  QUICK_ACTIONS, 
  APP_INFO 
} from '../../utils/data'; // Adjust path as needed
import { UserContext } from '../../context/userContext'; // Adjust path as needed

const CharAvatar = ({ fullName, width = "w-12", height = "h-12", style = "text-lg" }) => {
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className={`${width} ${height} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${style} shadow-lg`}>
      {getInitials(fullName)}
    </div>
  );
};

const SidebarMenuItem = ({ item, isActive, onClick, isExpanded, currentPath }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  
  // Check if any submenu item is active
  const isSubmenuActive = item.hasSubmenu && item.submenu?.some(subItem => 
    currentPath === subItem.path
  );

  const handleClick = () => {
    if (item.hasSubmenu) {
      setIsSubmenuOpen(!isSubmenuOpen);
    } else {
      onClick(item.path);
    }
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-between text-sm transition-all duration-200 rounded-xl ${
          isActive || isSubmenuActive
            ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg" 
            : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
        } py-3 px-4 group`}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`text-lg transition-colors ${
            isActive || isSubmenuActive 
              ? 'text-white' 
              : 'text-gray-500 group-hover:text-blue-600'
          }`} />
          {isExpanded && (
            <div className="flex flex-col items-start">
              <span className="font-medium">{item.label}</span>
              {item.description && (
                <span className={`text-xs ${
                  isActive || isSubmenuActive 
                    ? 'text-blue-100' 
                    : 'text-gray-400'
                }`}>
                  {item.description}
                </span>
              )}
            </div>
          )}
        </div>
        {isExpanded && item.hasSubmenu && (
          <div className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className={`text-sm ${
              isActive || isSubmenuActive 
                ? 'text-white' 
                : 'text-gray-400'
            }`} />
          </div>
        )}
      </button>

      {/* Submenu */}
      {item.hasSubmenu && isSubmenuOpen && isExpanded && (
        <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
          {item.submenu.map((subItem) => (
            <button
              key={subItem.id}
              onClick={() => onClick(subItem.path)}
              className={`w-full flex items-center gap-3 text-sm transition-colors py-2 px-3 rounded-lg ${
                currentPath === subItem.path
                  ? 'text-blue-600 bg-blue-50 font-medium'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <subItem.icon className="text-base" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{subItem.label}</span>
                <span className="text-xs text-gray-400">{subItem.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SideMenu = () => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleNavigation = (path) => {
    if (path === 'logout') {
      handleLogout();
      return;
    }
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate('/login');
  };

  const handleQuickSupport = () => {
    // Implement your support logic here
    console.log('Opening support...');
    // Could open a modal, navigate to support page, etc.
  };

  const filteredMenuItems = getFilteredMenuItems(user?.role);
  const currentPath = location.pathname;

  return (
    <div className={`${isExpanded ? 'w-80' : 'w-20'} h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        {isExpanded && (
          <div className="p-2">
            <div className="flex items-center gap-4">
              <CharAvatar 
                fullName={user?.fullname}
                width="w-12"
                height="h-12"
                style="text-base"
              />
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {user?.fullname || "Guest User"}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {user?.role || "passenger"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-400">Online</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className={`text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMenuItems.map((item) => (
          <SidebarMenuItem
            key={item.id}
            item={item}
            isActive={currentPath === item.path}
            onClick={handleNavigation}
            isExpanded={isExpanded}
            currentPath={currentPath}
          />
        ))}
      </div>

      {/* Quick Actions */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <QUICK_ACTIONS.support.icon className="text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">
                {QUICK_ACTIONS.support.title}
              </h4>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {QUICK_ACTIONS.support.description}
            </p>
            <button 
              onClick={handleQuickSupport}
              className="w-full bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {QUICK_ACTIONS.support.action}
            </button>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 py-3 px-4 rounded-xl transition-colors"
        >
          <LogOut className="text-lg" />
          {isExpanded && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Footer */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400">{APP_INFO.name} {APP_INFO.version}</p>
            <p className="text-xs text-gray-300">{APP_INFO.copyright}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideMenu;