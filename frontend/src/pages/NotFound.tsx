import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';
import { Button } from '../components/ui/Button';
import { useSystemConfig } from '../hooks/useSystemConfig';

export function NotFound() {
  const { config } = useSystemConfig();

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const homeLink = isAuthenticated ? '/dashboard' : '/';
  const homeLabel = isAuthenticated ? 'Go to Dashboard' : 'Go to Home';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-lg px-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-10 h-10 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {config.app.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-wider">{config.app.name}</div>
        </div>

        {/* 404 Card with glow */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-app-primary-600)]/20 via-[var(--color-app-primary-500)]/20 to-[var(--color-app-primary-400)]/20 rounded-2xl blur-xl opacity-50" />

          <div className="relative bg-white rounded-2xl shadow-2xl p-8">
            <div className="w-16 h-16 bg-[var(--color-app-primary-100)] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-[var(--btn-primary-bg)]" />
            </div>

            <div className="text-6xl font-bold text-gray-200 mb-4">404</div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
            <p className="text-gray-500 mb-6">
              The page you're looking for doesn't exist or has been moved.
              Please check the URL or navigate back to the home page.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </Button>
              <Link to={homeLink}>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  {homeLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-slate-500">
          {config.app.description}
        </p>
      </div>
    </div>
  );
}

export default NotFound;
