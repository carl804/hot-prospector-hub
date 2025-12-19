import { Building2, ListTodo, AlertTriangle, Clock, Activity, Users, Zap } from 'lucide-react';
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
      title: 'My Staff',
      url: '/staff',
      icon: Users,
      badge: 0,
      badgeVariant: 'default' as const,
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60 bg-sidebar/95 backdrop-blur-xl">
      {/* Modern Header with Logo */}
      <SidebarHeader className="p-4 border-b border-sidebar-border/40">
        <div className="flex items-center gap-3">
          <div className={cn(
            "relative shrink-0 transition-all duration-300",
            collapsed ? "w-8 h-8" : "w-10 h-10"
          )}>
            {/* Logo with gradient and glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-primary to-blue-600 shadow-lg shadow-primary/25" />
            <div className="absolute inset-0 rounded-xl flex items-center justify-center">
              <Zap className={cn(
                "text-white transition-all duration-300",
                collapsed ? "w-4 h-4" : "w-5 h-5"
              )} />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fade-in">
              <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">
                Hot Prospector
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                Task Manager
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "relative group/item rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 px-3 py-2.5"
                        activeClassName=""
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}

                        <item.icon className={cn(
                          "w-[18px] h-[18px] shrink-0 transition-transform duration-200",
                          isActive && "scale-110"
                        )} />

                        <span className={cn(
                          "flex-1 text-[13px] font-medium",
                          isActive && "text-primary"
                        )}>
                          {item.title}
                        </span>

                        {!collapsed && item.badge > 0 && (
                          <span className={cn(
                            'text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors',
                            item.badgeVariant === 'destructive'
                              ? 'bg-destructive/15 text-destructive'
                              : isActive
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats - Modern Card Style */}
        {!collapsed && (
          <SidebarGroup className="mt-6 px-1">
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-2">
                Overview
              </p>

              {/* Alert Cards */}
              <div className="space-y-2">
                {/* Overdue Alert */}
                {stats.overdue > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/15 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-destructive">{stats.overdue} overdue</p>
                      <p className="text-[10px] text-destructive/70">Needs attention</p>
                    </div>
                  </div>
                )}

                {/* Due Today */}
                {stats.dueToday > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">{stats.dueToday} due today</p>
                      <p className="text-[10px] text-primary/70">In progress</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Card */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Completion Rate</span>
                  <span className="text-lg font-bold text-foreground">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-1.5" />
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {stats.completed} of {stats.completed + stats.totalTasks} tasks done
                </p>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with collapsed stats */}
      {collapsed && (stats.overdue > 0 || stats.dueToday > 0) && (
        <SidebarFooter className="p-2 border-t border-sidebar-border/40">
          <div className="flex flex-col gap-1.5 items-center">
            {stats.overdue > 0 && (
              <div
                className="w-7 h-7 rounded-lg bg-destructive/15 flex items-center justify-center transition-transform hover:scale-110"
                title={`${stats.overdue} overdue`}
              >
                <span className="text-[10px] font-bold text-destructive">{stats.overdue}</span>
              </div>
            )}
            {stats.dueToday > 0 && (
              <div
                className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center transition-transform hover:scale-110"
                title={`${stats.dueToday} due today`}
              >
                <span className="text-[10px] font-bold text-primary">{stats.dueToday}</span>
              </div>
            )}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
