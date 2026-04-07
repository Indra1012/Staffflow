import { useEffect } from 'react';
import {
  BarChart3, Users, Clock, ArrowLeftRight, Calendar,
  FileText, Settings, Wallet, LogOut, HelpCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'staff',     label: 'Directory', icon: Users },
  { id: 'attendance',label: 'Attendance', icon: Clock },
  { id: 'ledger',    label: 'Ledgers',   icon: ArrowLeftRight },
  { id: 'salaries',  label: 'Payroll',   icon: Calendar },
  { id: 'reports',   label: 'Reports',   icon: FileText },
  { id: 'help',      label: 'Help & Guide', icon: HelpCircle },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function MobileSidebar({ isOpen, onClose, activeTab, setActiveTab, company, logout }) {
  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop — starts below nav bar (top-14 = 56px) */}
      <div
        className={`fixed top-14 inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer — slides in from right, starts below nav */}
      <aside
        className={`fixed top-14 right-0 h-[calc(100vh-56px)] w-72 bg-white z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Company info */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Signed in as</p>
            <p className="text-sm font-bold text-black truncate">{company?.companyName || 'Company'}</p>
            <p className="text-[10px] text-gray-500 truncate">{company?.email || ''}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer — logout */}
        <div className="px-3 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
