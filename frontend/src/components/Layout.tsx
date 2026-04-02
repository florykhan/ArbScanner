import { Outlet, NavLink } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  Bell,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Toaster } from "./ui/sonner";

export default function Layout() {
  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/events", icon: Calendar, label: "Events" },
    { to: "/alerts", icon: Bell, label: "Alerts" },
    { to: "/admin/manage", icon: Settings, label: "Manage Data" },
  ];

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6">
        <div className="mb-8">
          <NavLink
            to="/"
            end
            title="ArbScanner — home"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-1 py-0.5 outline-none ring-offset-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                isActive
                  ? "ring-1 ring-emerald-500/35 bg-emerald-950/30"
                  : "hover:bg-slate-800/50"
              }`
            }
          >
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-medium tracking-wider">ARB</span>
          </NavLink>
        </div>
        
        <nav className="flex-1 w-full">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/dashboard" || item.to === "/admin/manage"}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all group ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                  title={item.label}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-[10px] text-slate-600 text-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mb-1 animate-pulse"></div>
          <p>LIVE</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}