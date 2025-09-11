import React, { useState, useContext } from 'react';
import { HiOutlineMenu, HiOutlineX, HiOutlineBell } from 'react-icons/hi';
import { FiSearch } from 'react-icons/fi';
import { UserContext } from "../../context/userContext";
import { CloudRain, Droplets, Sun } from 'lucide-react';
import { getInitials } from '../../utils/helper';

const Navbar = ({ activeMenu, toggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useContext(UserContext);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className='flex items-center justify-between bg-slate-900 bg-opacity-50 backdrop-blur-sm h-16 px-6 sticky top-0 z-30 border-b border-blue-800 text-white'>
      <div className='flex items-center gap-4'>
        <button
          className='block lg:hidden text-blue-300 hover:text-blue-100 transition-colors'
          onClick={toggleSidebar}
        >
          <HiOutlineMenu className="h-6 w-6" />
        </button>
        
        <div className='flex items-center'>
          <CloudRain className="h-8 w-8 text-blue-300 mr-2" />
          <div>
            <h1 className='font-bold text-lg text-blue-100'>RainCast</h1>
            <p className='text-xs text-blue-400'>Forecasting System</p>
          </div>
        </div>
      </div>


      <div className='flex items-center gap-4'>

        {user && (
          <div className='flex items-center gap-2'>
            <div className='h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-full flex items-center justify-center text-white font-semibold text-sm border border-blue-400'>
              {getInitials(user.firstname) || 'U'}
            </div>
            <div className='hidden md:block'>
              <p className='text-sm font-medium text-blue-100'>{user.firstname || 'User'}</p>
              <p className='text-xs text-blue-400'>{user.role || 'User'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;