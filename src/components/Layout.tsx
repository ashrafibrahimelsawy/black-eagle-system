import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  Briefcase, 
  Users as UsersIcon, 
  Settings, 
  LogOut,
  ChevronRight,
  UserCircle,
  CheckSquare,
  Camera
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  user: any;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
    navigate("/login");
  };

  const menuItems = [
    { id: 'dashboard', name: "الرئيسية", path: "/", icon: LayoutDashboard, roles: ["employee", "project_manager", "admin", "super_admin"] },
    { id: 'tasks', name: "المهام", path: "/tasks", icon: CheckSquare, roles: ["employee", "project_manager", "admin", "super_admin"] },
    { id: 'attendance', name: "الحضور والانصراف", path: "/attendance", icon: Clock, roles: ["employee", "project_manager", "admin", "super_admin"] },
    { id: 'leaves', name: "الإجازات", path: "/leaves", icon: CalendarDays, roles: ["employee", "project_manager", "admin", "super_admin"] },
    { id: 'projects', name: "المشاريع", path: "/projects", icon: Briefcase, roles: ["employee", "project_manager", "admin", "super_admin"] },
    { id: 'clients', name: "العملاء", path: "/clients", icon: UsersIcon, roles: ["project_manager", "admin", "super_admin"] },
    { id: 'finance', name: "المالية", path: "/finance", icon: LayoutDashboard, roles: ["admin", "super_admin"] },
    { id: 'payroll', name: "الرواتب", path: "/payroll", icon: LayoutDashboard, roles: ["employee", "admin", "super_admin"] },
    { id: 'users', name: "المستخدمين", path: "/users", icon: Settings, roles: ["super_admin"] },
  ];

  const userPermissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions || '[]') : (user.permissions || []);

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user.role) || userPermissions.includes(item.id)
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Black Eagle</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400")} />
                <span className="font-medium">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 mr-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {menuItems.find(i => i.path === location.pathname)?.name || "النظام"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left mr-4">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-6 h-6" />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
