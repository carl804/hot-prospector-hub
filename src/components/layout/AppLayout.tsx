import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { GHLSyncStatus } from '@/components/GHLSyncStatus';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Modern Header */}
          <header className="h-14 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="shrink-0 h-8 w-8 rounded-lg hover:bg-accent transition-colors" />
              {/* Optional: Add breadcrumbs or page title here */}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              <GHLSyncStatus />
              <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          {/* Main content area with subtle gradient */}
          <div className="flex-1 overflow-auto bg-gradient-to-b from-background via-background to-muted/20">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
