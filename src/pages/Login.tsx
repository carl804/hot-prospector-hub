import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, TestTube } from 'lucide-react';

const errorMessages: Record<string, string> = {
  user_not_in_ghl: 'Your account is not registered in the system. Please contact your administrator to be added as a team member.',
  unauthorized_domain: 'Your email domain is not authorized to access this application.',
  token_exchange_failed: 'Authentication failed. Please try again.',
  user_info_failed: 'Could not retrieve your account information.',
  auth_failed: 'An error occurred during login. Please try again.',
  oauth_not_configured: 'Google OAuth is not configured. Contact your administrator.',
  no_code: 'Invalid authentication request.',
};

export default function Login() {
  const { isAuthenticated, isLoading, login, isDevMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const error = searchParams.get('error');
  const errorDomain = searchParams.get('domain');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-2">
          {isDevMode && (
            <Badge variant="outline" className="mx-auto mb-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
              <TestTube className="w-3 h-3 mr-1" />
              Preview Mode
            </Badge>
          )}
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Hot Prospector</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isDevMode 
              ? 'Click below to enter preview mode (Google OAuth works on Vercel deployment)'
              : 'Sign in with your team Google account to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessages[error] || `Authentication error: ${error}`}
                {errorDomain && ` (${errorDomain})`}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={login} 
            className="w-full h-12 text-base font-medium gap-3"
            variant={isDevMode ? "default" : "outline"}
          >
            {isDevMode ? (
              <>
                <TestTube className="w-5 h-5" />
                Enter Preview Mode
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground pt-4">
            {isDevMode 
              ? 'Deploy to Vercel to enable Google OAuth authentication'
              : 'Only authorized team members can access this dashboard'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
