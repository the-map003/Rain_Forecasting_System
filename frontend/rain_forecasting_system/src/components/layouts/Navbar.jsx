import React, { useState, useContext } from 'react';
import { HiOutlineMenu, HiOutlineX, HiOutlineBell } from 'react-icons/hi';
import { FiSearch } from 'react-icons/fi';
import SideMenu from "./SideMenu";
import { UserContext } from "../../context/userContext";
import LOGO from '../../assets/images/bus_icon.png'; 

// Import with optional chaining in case the component doesn't exist
let NotificationDropdown;
try {
  NotificationDropdown = require('../Dropdowns/NotificationDropdown').default;
} catch (e) {
  NotificationDropdown = () => null; // Fallback empty component
}

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useContext(UserContext);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className='flex items-center justify-between bg-white shadow-sm py-4 px-6 sticky top-0 z-30 border-b border-gray-100'>
      <div className='flex items-center gap-4'>
        <button
          className='block lg:hidden text-gray-600 hover:text-gray-900 transition-colors'
          onClick={() => setOpenSideMenu(!openSideMenu)}
          aria-label="Toggle menu"
        >
          {openSideMenu ? (
            <HiOutlineX className='text-2xl' />
          ) : (
            <HiOutlineMenu className='text-2xl' />
          )}
        </button>

        {/* Logo image replacing the text */}
        <div className='flex items-center'>
          <img 
            src={LOGO}
            alt="Bus Tracking System" 
            className='h-12 w-auto sm:h-16 md:h-14'
          />
        </div>
      </div>

      {/* Centered search input with increased width */}
      <div className='flex-1 flex justify-center px-4'>
        <div className='relative w-full max-w-md'>
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            placeholder='Search buses or routes...'
            className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      {/* Right side - can be used for additional items like notifications, user avatar, etc. */}
      <div className='flex items-center gap-4'>
        {/* Add any additional navbar items here */}
      </div>

      {openSideMenu && (
        <div className='fixed top-16 left-0 w-64 h-[calc(100vh-64px)] bg-white shadow-lg z-40'>
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;