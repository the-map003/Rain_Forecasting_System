import React, { useContext } from 'react'
import { UserContext } from '../../context/userContext'
import Navbar from './Navbar'
import SideMenu from './SideMenu'

const DashboardLayout = ({ children, activeMenu }) => {
    const {user} = useContext(UserContext);
    
    // Debug - check if user exists
    console.log("User in context:", user);
    
    return (
        <div className=''>
            <Navbar activeMenu={activeMenu} />
            {user ? (
                <div className='flex'>
                    {/* This is your sidebar - explicitly shown on large screens */}
                    <div className='hidden lg:block w-64'>
                        <SideMenu activeMenu={activeMenu} />
                    </div>

                    <div className='grow mx-5'>{children}</div>
                </div>
            ) : (
                <div>Please log in to view dashboard content</div>
            )}
        </div>
    )
}

export default DashboardLayout