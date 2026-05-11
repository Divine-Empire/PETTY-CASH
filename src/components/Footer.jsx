import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, TrendingDown, BookOpen, Database, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Footer = ({ isCollapsed }) => {
    const location = useLocation();
    const { user } = useAuthStore();
    
    // Do not show icons on Settings page
    const isSettingsPage = location.pathname === '/settings';

    const adminMenuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/add-expense', icon: Plus, label: 'Entry' },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/head-master', icon: Database, label: 'Master' },
    ];

    const employeeMenuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/add-expense', icon: Plus, label: 'Entry' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    const menuItems = (user?.role?.toUpperCase().includes('ADMIN')) ? adminMenuItems : employeeMenuItems;

    return (
        <footer className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] transition-all duration-300 ${isCollapsed ? 'lg:left-20' : 'lg:left-64'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Mobile Navigation Icons */}
                {!isSettingsPage && (
                    <div className="lg:hidden flex justify-between items-center px-4 py-3">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex flex-col items-center gap-1.5 px-2 py-1 rounded-xl transition-all duration-300
                                    ${isActive ? 'text-blue-600' : 'text-slate-400'}
                                `}
                            >
                                <item.icon size={20} className={`transition-all duration-300 ${location.pathname === item.path ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-tight transition-all ${location.pathname === item.path ? 'opacity-100' : 'opacity-60'}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </div>
                )}

                {/* Attribution Bar */}
                <div className="py-2.5 flex justify-center items-center">
                    <p className="text-[10px] font-semibold text-slate-300  ">
                        Powered By <a 
                            href="https://botivate.in" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 font-semibold transition-colors"
                        >
                            Botivate
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
