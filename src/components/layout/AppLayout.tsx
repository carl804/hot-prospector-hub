import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { GHLSyncStatus } from '@/components/GHLSyncStatus';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-12 md:h-14 flex items-center justify-between border-b border-border bg-background px-2 md:px-4 shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="shrink-0" />
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <GHLSyncStatus />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
