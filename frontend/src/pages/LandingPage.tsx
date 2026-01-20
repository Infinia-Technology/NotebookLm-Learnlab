import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useSystemConfig } from '../hooks/useSystemConfig';

export function LandingPage() {
  const { config, loading } = useSystemConfig();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[var(--btn-primary-bg)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { app } = config;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo-icon.svg"
                alt={app.name}
                className="w-9 h-9"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = `<div class="w-9 h-9 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center"><span class="text-white font-bold text-base">${app.name.charAt(0).toUpperCase()}</span></div>`;
                }}
              />
              <span className="text-lg font-semibold text-gray-900">{app.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link to="/auth/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {app.description}
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Built with modern technologies for speed, security, and scalability.
            Start building your application today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/signup">
              <Button variant="primary" size="lg" className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to build
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete foundation with authentication, user management, and more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure Auth"
              description="JWT authentication with email verification and password reset"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="User Management"
              description="Role-based access control with admin dashboard"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Fast & Modern"
              description="React 19 + Vite frontend with FastAPI backend"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Extensible"
              description="Modular architecture ready for your features"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-0 p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Create your account and start building with {app.name} today.
            </p>
            <Link to="/auth/signup">
              <button className="px-6 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                Create your account
              </button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-icon.svg"
                alt={app.name}
                className="w-8 h-8"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = `<div class="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center"><span class="text-white font-bold text-sm">${app.name.charAt(0).toUpperCase()}</span></div>`;
                }}
              />
              <span className="text-sm font-medium text-gray-900">{app.name}</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {app.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-[var(--btn-primary-bg)]/10 rounded-lg flex items-center justify-center text-[var(--btn-primary-bg)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Card>
  );
}
