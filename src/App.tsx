import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAutoLogPageView } from "@/hooks/useActivityLog";
import { ErrorBoundary, PageErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/ui/LoadingSpinner";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Staff = lazy(() => import("./pages/Staff"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Component to handle activity logging within router context
function ActivityLogger() {
  useAutoLogPageView();
  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ActivityLogger />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <PageErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/tasks" element={<Tasks />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/staff" element={<Staff />} />
                          <Route path="/activity" element={<ActivityLogs />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </PageErrorBoundary>
                    </AppLayout>
                  </AuthGuard>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
