import { Building2, ListTodo, AlertTriangle, Clock } from 'lucide-react';
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
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">HP</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-sidebar-foreground truncate">Hot Prospector</h1>
              <p className="text-xs text-muted-foreground truncate">Task Manager</p>
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Quick Stats
              </p>
              
              {/* Overdue Alert */}
              {stats.overdue > 0 && (
                <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-medium text-destructive">
                    {stats.overdue} overdue
                  </span>
                </div>
              )}

              {/* Due Today */}
              {stats.dueToday > 0 && (
                <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {stats.dueToday} due today
                  </span>
                </div>
              )}

              {/* Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium text-foreground">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-1.5" />
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
