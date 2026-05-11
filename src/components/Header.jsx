import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, Menu, Settings as SettingsIcon } from 'lucide-react';

const Header = ({ onMenuClick, user }) => {
  const navigate = useNavigate();
  const isAdmin = user?.role?.toUpperCase().includes('ADMIN');

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Mobile Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">

          {isAdmin && (
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
              title="System Settings"
            >
              <SettingsIcon size={20} />
            </button>
          )}

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* User Profile Summary (Desktop) */}
          <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[10px]  font-semibold text-blue-600 tracking-wider">
                {user?.role === 'SUPER_ADMIN' ? 'Executive Admin' : 
                 user?.role === 'ADMIN' ? 'Administrator' : 'Team Member'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all overflow-hidden shadow-sm border border-slate-300">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
