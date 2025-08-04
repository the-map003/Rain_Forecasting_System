import React, { useContext, useState } from 'react'
import { UserContext } from '../../../context/userContext'
import Navbar from '../Navbar'
import SideMenu from '../SideMenu'

const DashboardLayout = ({ children, activeMenu }) => {
    const {user} = useContext(UserContext);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    
    // Toggle mobile sidebar
    const toggleMobileSidebar = () => {
        setMobileSidebarOpen(!mobileSidebarOpen);
    };
    
    return (
        <div className='min-h-screen relative'>
            {/* Blue gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 -z-10"></div>
            
            <Navbar activeMenu={activeMenu} toggleSidebar={toggleMobileSidebar} />
            {user ? (
                <div className='flex justify-center'> {/* Added justify-center here */}
                    {/* Desktop Sidebar - hidden on mobile, visible on large screens */}
                    <div className='hidden lg:block w-64 fixed left-0 h-[calc(100vh-64px)] border-r border-blue-800 bg-slate-900 bg-opacity-50 backdrop-blur-sm'>
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                    
                    {/* Mobile Sidebar - overlay when open */}
                    {mobileSidebarOpen && (
                        <>
                            <div 
                                className='fixed inset-0 bg-slate-900 bg-opacity-70 z-40 lg:hidden'
                                onClick={toggleMobileSidebar}
                            />
                            <div className='fixed top-0 left-0 w-64 h-full bg-slate-900 bg-opacity-90 backdrop-blur-sm z-50 lg:hidden shadow-xl'>
                                <SideMenu activeMenu={activeMenu} mobile={true} closeSidebar={toggleMobileSidebar} />
                            </div>
                        </>
                    )}
                    
                    {/* Main Content Area - increased width */}
                    <div className='w-full max-w-8xl lg:pl-64 px-6 py-6 mx-8'> {/* Changed from max-w-6xl to max-w-7xl */}
                        <div className='bg-slate-800 bg-opacity-50 backdrop-blur-sm rounded-lg shadow-lg p-6 text-white border border-blue-700'>
                            {children}
                        </div>
                    </div>
                </div>
            ) : (
                <div className='flex items-center justify-center h-[calc(100vh-64px)]'>
                    <div className='bg-slate-800 bg-opacity-50 backdrop-blur-sm p-8 rounded-lg shadow-lg text-center text-white border border-blue-700 max-w-md w-full mx-4'> {/* Added max-w-md, w-full, and mx-4 */}
                        <h2 className='text-2xl font-semibold text-blue-300 mb-2'>Access Restricted</h2>
                        <p className='text-gray-300'>Please log in to view dashboard content</p>
                    </div>
                </div>
            )}
            
            {/* Animated rain effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-0.5 bg-blue-200 opacity-20"
                        style={{
                        left: `${Math.random() * 100}%`,
                        top: -20,
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${Math.random() * 2 + 1}s`,
                        animationName: 'rainDrop',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite'
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

export default DashboardLayout