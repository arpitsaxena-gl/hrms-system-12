import { Bell, Search, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

interface NavbarProps { onMenuToggle: () => void }

export function Navbar({ onMenuToggle }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Toggle navigation">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Quick search..." className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400" readOnly />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">1</span>
        </Link>

        <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200 bg-white">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">SA</div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-900 leading-none">Super Admin</p>
            <p className="text-xs text-slate-500 mt-0.5">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
