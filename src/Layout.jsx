import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users,
  LayoutList,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";
import NotificationPanel from "./components/notifications/NotificationPanel";
import PerformanceOptimizer from "./components/performance/PerformanceOptimizer";

const getNavigationItems = (user) => {
  const role = user?.role;
  const jobRole = user?.job_role;
  
  const items = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
      roles: ['admin', 'director', 'sales', 'designer', 'cold_caller']
    },
    {
      title: "Leads",
      url: createPageUrl("LeadManagement"),
      icon: Users,
      roles: ['admin', 'director', 'sales', 'cold_caller']
    },
    {
      title: "All Projects",
      url: createPageUrl("Projects"),
      icon: FolderKanban,
      roles: ['admin', 'director', 'sales', 'designer']
    },
    {
      title: "Calendar",
      url: createPageUrl("Calendar"),
      icon: CalendarIcon,
      roles: ['admin', 'director', 'sales', 'designer']
    },
    {
      title: "Team",
      url: createPageUrl("Team"),
      icon: Users,
      roles: ['admin', 'director', 'sales', 'designer']
    },
    {
      title: "Templates",
      url: createPageUrl("TemplateManagement"),
      icon: LayoutList,
      roles: ['admin', 'director']
    },
    {
      title: "Payroll",
      url: createPageUrl("ManpowerPayroll"),
      icon: Users,
      roles: ['admin', 'director']
    },
    {
      title: "Users",
      url: createPageUrl("UserManagement"),
      icon: Users,
      roles: ['admin', 'director']
    }
  ];
  
  return items.filter(item => {
    if (role === 'admin' || jobRole === 'director') return true;
    return item.roles.includes(jobRole);
  });
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check approval status (skip for admins)
      if (currentUser.role !== 'admin') {
        if (currentUser.approval_status === "pending" && location.pathname !== createPageUrl("PendingApproval")) {
          window.location.href = createPageUrl("PendingApproval");
          return;
        }
        
        if (currentUser.approval_status === "rejected") {
          alert("Your account has been rejected. Please contact an administrator.");
          await base44.auth.logout();
          return;
        }
      }
      
      // Check if user needs to change password
      if (currentUser.must_change_password && location.pathname !== createPageUrl("ChangePassword")) {
        window.location.href = createPageUrl("ChangePassword");
      }
    } catch (error) {
      console.log("Not authenticated");
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.reload();
  };

  return (
    <SidebarProvider>
      <PerformanceOptimizer />
      <style>{`
        :root {
          /* Primary Palette */
          --primary: #0EA5E9;
          --primary-dark: #0284C7;
          --primary-light: #38BDF8;
          --primary-foreground: #ffffff;
          
          /* Secondary Palette */
          --secondary: #F0F9FF;
          --secondary-dark: #E0F2FE;
          
          /* Accent & Status Colors */
          --accent: #F59E0B;
          --success: #10B981;
          --danger: #EF4444;
          --warning: #F59E0B;
          --info: #3B82F6;
          
          /* Neutral Grays - Refined */
          --background: #FAFAF9;
          --surface: #FFFFFF;
          --surface-secondary: #F9FAFB;
          --muted: #F5F5F4;
          --muted-foreground: #78716C;
          --border: #E7E5E4;
          --border-light: #F5F5F4;
          
          /* Typography System */
          --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --font-mono: 'Monaco', 'Courier New', monospace;
          
          --text-primary: #1F2937;
          --text-secondary: #6B7280;
          --text-muted: #9CA3AF;
          --text-inverted: #FFFFFF;
          
          /* Font Sizes */
          --text-xs: 0.75rem;
          --text-sm: 0.875rem;
          --text-base: 1rem;
          --text-lg: 1.125rem;
          --text-xl: 1.25rem;
          --text-2xl: 1.5rem;
          --text-3xl: 1.875rem;
          --text-4xl: 2.25rem;
          
          /* Font Weights */
          --font-normal: 400;
          --font-medium: 500;
          --font-semibold: 600;
          --font-bold: 700;
          
          /* Line Heights */
          --leading-tight: 1.25;
          --leading-normal: 1.5;
          --leading-relaxed: 1.625;
          
          /* Spacing Scale */
          --spacing-xs: 0.25rem;
          --spacing-sm: 0.5rem;
          --spacing-md: 1rem;
          --spacing-lg: 1.5rem;
          --spacing-xl: 2rem;
          --spacing-2xl: 3rem;
          
          /* Shadows */
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          
          /* Radius */
          --radius-sm: 0.375rem;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
          --radius-xl: 1rem;
          --radius-full: 9999px;
        }

        /* Typography Consistency */
        body {
          font-family: var(--font-family);
          color: var(--text-primary);
          background-color: var(--background);
        }

        h1 {
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          line-height: var(--leading-tight);
          color: var(--text-primary);
        }

        h2 {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          line-height: var(--leading-tight);
          color: var(--text-primary);
        }

        h3 {
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          line-height: var(--leading-normal);
          color: var(--text-primary);
        }

        h4, h5, h6 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          line-height: var(--leading-normal);
          color: var(--text-primary);
        }

        p {
          font-size: var(--text-base);
          line-height: var(--leading-normal);
          color: var(--text-primary);
        }

        .text-sm {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .text-xs {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
      `}</style>
      
      <div className="min-h-screen flex w-full bg-[var(--background)]">
        <Sidebar className="border-r border-[var(--border)] bg-white">
          <SidebarHeader className="border-b border-[var(--border)] p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">Kinderbuild Projects</h2>
                <p className="text-xs text-gray-500">Project Manager</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getNavigationItems(user).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-sky-50 hover:text-sky-700 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-sky-50 text-sky-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Quick Actions
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <Link to={createPageUrl("CreateProject")}>
                    <button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200">
                      + New Project
                    </button>
                  </Link>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-[var(--border)] p-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 md:hidden">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-gray-900">Kinderbuild Projects</h1>
            </div>
            <div className="flex-1" />
            <NotificationPanel user={user} />
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}