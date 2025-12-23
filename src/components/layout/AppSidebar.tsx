import { Building2, ListTodo, AlertTriangle, Clock, Activity, Zap } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { usePipelineTasks } from '@/hooks/useGHLTasks';
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

// Use the same pipeline as the Tasks page
const TARGET_PIPELINE_ID = "QNloaHE61P6yedF6jEzk";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  // Fetch real GHL data from the same pipeline as Tasks page
  const { data: opportunitiesData } = useGHLOpportunities();
  const { data: tasksData = [] } = usePipelineTasks(TARGET_PIPELINE_ID);

  // Calculate stats from real pipeline tasks (matching Tasks page logic)
  const stats = useMemo(() => {
    const opportunities = opportunitiesData?.opportunities || [];
    const tasks = tasksData;

    // Count active opportunities (clients) in the pipeline
    const pipelineOpportunities = opportunities.filter((opp) => opp.pipelineId === TARGET_PIPELINE_ID);
    const activeClients = pipelineOpportunities.filter((opp) =>
      opp.status === 'open' || opp.status === 'won'
    ).length;

    // Task stats - EXACT same logic as Tasks.tsx
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    const overdueTasks = activeTasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = startOfDay(new Date(t.dueDate));
      return isPast(dueDate) && !isToday(dueDate);
    });

    const dueTodayTasks = activeTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));

    const completionRate = tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

    return {
      totalTasks: activeTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completed: completedTasks.length,
      activeClients,
      totalClients: pipelineOpportunities.length,
      completionRate,
    };
  }, [opportunitiesData, tasksData]);

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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/40 glass">
      {/* 2025 Header with Gradient Logo */}
      <SidebarHeader className="p-4 border-b border-sidebar-border/30">
        <div className="flex items-center gap-3">
          <div className={cn(
            "relative shrink-0 transition-all duration-300 group",
            collapsed ? "w-9 h-9" : "w-11 h-11"
          )}>
            {/* Animated gradient logo with glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-secondary-accent to-primary shadow-glow-lg animate-glow-pulse" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/90 via-secondary-accent/90 to-primary/90" />
            <div className="absolute inset-0 rounded-xl flex items-center justify-center">
              <Zap className={cn(
                "text-white transition-all duration-300 drop-shadow-lg",
                collapsed ? "w-5 h-5" : "w-6 h-6"
              )} />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fade-in">
              <h1 className="text-sm font-bold text-foreground tracking-tighter truncate">
                Hot Prospector
              </h1>
              <p className="text-[11px] text-muted-foreground/80 truncate font-medium">
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
                        "relative group/item rounded-xl transition-all duration-300 magnetic-hover",
                        isActive
                          ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary hover:from-primary/20 hover:to-primary/15 shadow-soft"
                          : "text-muted-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-foreground"
                      )}
                    >
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 px-3 py-2.5"
                        activeClassName=""
                      >
                        {/* Modern active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary via-secondary-accent to-primary rounded-r-full shadow-glow" />
                        )}

                        <item.icon className={cn(
                          "w-[18px] h-[18px] shrink-0 transition-all duration-300",
                          isActive && "scale-110 drop-shadow-lg text-primary"
                        )} />

                        <span className={cn(
                          "flex-1 text-[13px] font-semibold transition-all",
                          isActive && "text-primary tracking-tight"
                        )}>
                          {item.title}
                        </span>

                        {!collapsed && item.badge > 0 && (
                          <span className={cn(
                            'text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all duration-300',
                            item.badgeVariant === 'destructive'
                              ? 'bg-gradient-to-r from-destructive/20 to-destructive/15 text-destructive shadow-soft'
                              : isActive
                                ? 'bg-gradient-to-r from-primary/25 to-primary/20 text-primary shadow-soft'
                                : 'bg-muted/80 text-muted-foreground'
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

              {/* 2025 Alert Cards with Glassmorphism */}
              <div className="space-y-2">
                {/* Overdue Alert - Modern gradient card */}
                {stats.overdue > 0 && (
                  <div className="group flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-destructive/15 via-destructive/10 to-transparent border border-destructive/20 animate-fade-in shadow-soft hover:shadow-2025-md transition-all duration-300">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-4 h-4 text-destructive drop-shadow" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-destructive">{stats.overdue} overdue</p>
                      <p className="text-[10px] text-destructive/70 font-medium">Needs attention</p>
                    </div>
                    <div className="ml-auto">
                      <div className="status-dot-pulse bg-destructive" />
                    </div>
                  </div>
                )}

                {/* Due Today - Vibrant blue card */}
                {stats.dueToday > 0 && (
                  <div className="group flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/20 animate-fade-in shadow-soft hover:shadow-2025-md transition-all duration-300">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                      <Clock className="w-4 h-4 text-primary drop-shadow" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">{stats.dueToday} due today</p>
                      <p className="text-[10px] text-primary/70 font-medium">In progress</p>
                    </div>
                    <div className="ml-auto">
                      <div className="status-dot-pulse bg-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* 2025 Progress Card - Premium glassmorphism */}
              <div className="mt-4 p-4 rounded-xl card-frosted animate-fade-in hover:shadow-2025-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">Completion Rate</span>
                  <span className="text-xl font-black text-foreground gradient-text">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
                <p className="mt-2.5 text-[10px] text-muted-foreground font-medium">
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
