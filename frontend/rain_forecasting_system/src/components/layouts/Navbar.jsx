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

      <div className='hidden md:flex items-center bg-slate-800 bg-opacity-70 rounded-full px-4 py-2 flex-1 max-w-xl mx-4 border border-blue-900'>
        <FiSearch className="text-blue-300 mr-2" />
        <input
          type="text"
          placeholder="Search for locations, forecasts..."
          className="bg-transparent border-none outline-none w-full text-sm text-blue-100 placeholder-blue-400"
        />
      </div>

      <div className='flex items-center gap-4'>
        <div className='hidden sm:flex items-center gap-1 bg-blue-900 bg-opacity-50 px-3 py-1 rounded-full border border-blue-700'>
          <Droplets className="h-4 w-4 text-blue-300" />
          <span className='text-xs font-medium text-blue-200'>72%</span>
        </div>
        
        <div className='hidden sm:flex items-center gap-1 bg-indigo-900 bg-opacity-50 px-3 py-1 rounded-full border border-indigo-700'>
          <Sun className="h-4 w-4 text-yellow-300" />
          <span className='text-xs font-medium text-blue-200'>24°C</span>
        </div>

        <button
          className='relative text-blue-300 hover:text-blue-100 transition-colors'
          onClick={toggleNotifications}
        >
          <HiOutlineBell className="h-6 w-6" />
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>3</span>
        </button>

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

      {showNotifications && (
        <div className='absolute top-16 right-4 bg-slate-800 bg-opacity-90 backdrop-blur-sm shadow-lg rounded-lg w-80 mt-2 z-50 border border-blue-800 overflow-hidden text-white'>
          <div className='p-3 border-b border-blue-900'>
            <h3 className='font-medium text-blue-200'>Notifications</h3>
          </div>
          <div className='max-h-96 overflow-y-auto'>
            <div className='p-3 border-b border-blue-900 hover:bg-slate-700'>
              <p className='text-sm font-medium text-blue-100'>Heavy Rain Alert</p>
              <p className='text-xs text-blue-300'>Expected heavy rainfall in your area</p>
              <p className='text-xs text-blue-500 mt-1'>2 hours ago</p>
            </div>
            <div className='p-3 border-b border-blue-900 hover:bg-slate-700'>
              <p className='text-sm font-medium text-blue-100'>Forecast Updated</p>
              <p className='text-xs text-blue-300'>Weekly forecast has been updated</p>
              <p className='text-xs text-blue-500 mt-1'>Yesterday</p>
            </div>
            <div className='p-3 hover:bg-slate-700'>
              <p className='text-sm font-medium text-blue-100'>System Maintenance</p>
              <p className='text-xs text-blue-300'>Scheduled maintenance in 2 days</p>
              <p className='text-xs text-blue-500 mt-1'>2 days ago</p>
            </div>
          </div>
          <div className='p-2 border-t border-blue-900 text-center'>
            <button className='text-xs text-blue-300 hover:text-blue-100'>View All</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;