import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuItems, quickActions } from '../../utils/data';
import { useState } from 'react';
import {
  CloudRain,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { UserContext } from '../../context/userContext';

const SideMenu = ({ activeMenu, mobile = false, closeSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    } else {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (mobile && closeSidebar) {
      closeSidebar();
    }
  };

  // Get user role from context or localStorage
  const userRole = user?.role || 
    (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role : 'staff');

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles && item.roles.includes(userRole)
  );

  return (
    <div className='h-full flex flex-col bg-transparent text-blue-100'>
      {mobile && (
        <div className='p-4 border-b border-blue-800 flex items-center justify-between'>
          <div className='flex items-center'>
            <CloudRain className="h-6 w-6 text-blue-300 mr-2" />
            <h2 className='font-bold text-blue-100'>RainCast</h2>
          </div>
          <button onClick={closeSidebar} className='text-blue-300 hover:text-blue-100'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className='flex-1 overflow-y-auto py-2'>
        <div className='px-3 py-2'>
          <p className='text-xs font-medium text-blue-400 mb-2 px-3'>MAIN MENU</p>
            {filteredMenuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const [open, setOpen] = useState(false); // This line needs to be moved **outside the loop** if you want persistence per item

              return (
                <div key={item.id} className="mb-1">
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        setOpen((prev) => !prev); // toggle submenu
                      } else {
                        handleNavigation(item.path);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer ${
                      activeMenu === item.id ? 'bg-blue-900 bg-opacity-50 text-blue-100' : 'text-blue-300 hover:bg-slate-800 hover:bg-opacity-50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${activeMenu === item.id ? 'text-blue-200' : 'text-blue-400'}`} />
                    <div className="flex-1 text-left">
                      <p className='text-sm font-medium'>{item.label}</p>
                      {item.description && <p className='text-xs text-blue-500 hidden lg:block'>{item.description}</p>}
                    </div>
                    {hasChildren && (
                      <ChevronRight
                        className={`h-4 w-4 text-blue-500 ml-auto transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenu items */}
                  {hasChildren && open && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleNavigation(sub.path)}
                          className="w-full flex items-center gap-2 px-2 py-1 text-sm text-blue-300 hover:text-blue-100 hover:bg-slate-700 rounded"
                        >
                          <sub.icon className="h-4 w-4 text-blue-400" />
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className='px-3 py-2 mt-2'>
          <p className='text-xs font-medium text-blue-400 mb-2 px-3'>QUICK ACCESS</p>
          {quickActions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className='w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1 text-blue-300 hover:bg-slate-800 hover:bg-opacity-50'
            >
              <item.icon className='h-5 w-5 text-blue-400' />
              <p className='text-sm'>{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className='p-4 border-t border-blue-800 bg-slate-800 bg-opacity-30'>
        <button
          onClick={handleLogout}
          className='w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-300 hover:bg-red-900 hover:bg-opacity-30'
        >
          <LogOut className='h-5 w-5' />
          <p className='text-sm font-medium'>Logout</p>
        </button>
      </div>
    </div>
  );
};

export default SideMenu;