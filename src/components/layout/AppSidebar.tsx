import { Building2, ListTodo, AlertTriangle, Clock, Activity } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { MOCK_TASKS } from '@/data/taskData';
import { CLIENTS } from '@/types/client';
import { isToday, isPast, startOfDay } from 'date-fns';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  // Calculate stats
  const stats = useMemo(() => {
    const tasks = MOCK_TASKS;
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const overdueTasks = activeTasks.filter((t) => {
      const dueDate = startOfDay(new Date(t.dueDate));
      return isPast(dueDate) && !isToday(dueDate);
    });
    const dueTodayTasks = activeTasks.filter((t) => isToday(new Date(t.dueDate)));

    const activeClients = CLIENTS.filter((c) => c.status !== 'completed').length;
    const totalClients = CLIENTS.length;

    const completionRate = tasks.length > 0 
      ? Math.round((completedTasks.length / tasks.length) * 100) 
      : 0;

    return {
      totalTasks: activeTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completed: completedTasks.length,
      activeClients,
      totalClients,
      completionRate,
    };
  }, []);

  const navItems = [
    { 
      title: 'Clients', 
      url: '/', 
      icon: Building2,
      badge: stats.activeClients,
      badgeVariant: 'default' as const,
    },
    { 
      title: 'Tasks', 
      url: '/tasks', 
      icon: ListTodo,
      badge: stats.totalTasks,
      badgeVariant: stats.overdue > 0 ? 'destructive' as const : 'default' as const,
    },
    { 
      title: 'Activity', 
      url: '/activity', 
      icon: Activity,
      badge: 0,
      badgeVariant: 'default' as const,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">HP</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-sidebar-foreground truncate">Hot Prospector</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Task Manager</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {!collapsed && item.badge > 0 && (
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          item.badgeVariant === 'destructive' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats - Only show when not collapsed */}
        {!collapsed && (
          <SidebarGroup className="mt-4">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-3">
                Quick Stats
              </p>
              
              {/* Overdue Alert */}
              {stats.overdue > 0 && (
                <div className="flex items-center gap-2 p-2.5 mb-2 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-medium text-destructive">
                    {stats.overdue} overdue
                  </span>
                </div>
              )}

              {/* Due Today */}
              {stats.dueToday > 0 && (
                <div className="flex items-center gap-2 p-2.5 mb-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {stats.dueToday} due today
                  </span>
                </div>
              )}

              {/* Progress */}
              <div className="mt-4 p-3 rounded-lg bg-sidebar-accent/50 dark:bg-sidebar-accent">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-sidebar-foreground/70">Completion</span>
                  <span className="font-semibold text-sidebar-foreground">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with collapsed stats */}
      {collapsed && (stats.overdue > 0 || stats.dueToday > 0) && (
        <SidebarFooter className="p-2">
          <div className="flex flex-col gap-1 items-center">
            {stats.overdue > 0 && (
              <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center" title={`${stats.overdue} overdue`}>
                <span className="text-xs font-bold text-destructive">{stats.overdue}</span>
              </div>
            )}
            {stats.dueToday > 0 && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center" title={`${stats.dueToday} due today`}>
                <span className="text-xs font-bold text-primary">{stats.dueToday}</span>
              </div>
            )}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
