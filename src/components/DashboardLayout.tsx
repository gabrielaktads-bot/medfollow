import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LogOut, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useNotificacoes } from "@/hooks/useNotificacoes";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ navItems, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { unreadCount } = useNotificacoes();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 sidebar-gradient border-r transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <img src="/favicon.png" alt="MedFollow" className="h-8 w-8 object-contain" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground">MedFollow</h2>
              <p className="text-xs text-muted-foreground">{subtitle || title}</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role Switcher */}
          <div className="border-b px-3 py-2">
            <RoleSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              const isAlerts = item.title === "Alertas";
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                  {isAlerts && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t px-3 py-3">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b bg-card px-4 py-3 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          <div key={location.pathname} className="animate-in fade-in duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
