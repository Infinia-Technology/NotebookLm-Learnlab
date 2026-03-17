/**
 * {{APP_NAME}} Landing Page
 *
 * {{DESCRIPTION}}
 *
 * Generated: {{GENERATED_AT}}
 * Template: {{TEMPLATE_TYPE}}
 */

import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const features = [
  {
    title: 'Easy to Use',
    description: 'Intuitive interface designed for productivity and efficiency.',
  },
  {
    title: 'Secure & Reliable',
    description: 'Built with security best practices and data protection in mind.',
  },
  {
    title: 'Fully Customizable',
    description: 'Adapt the platform to your specific business needs.',
  },
  {
    title: 'API First',
    description: 'Robust REST API for seamless integrations.',
  },
];

export default function {{MODEL_NAME}}LandingPage() {
  const { config } = useSystemConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {config.app.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-bold text-lg">{config.app.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {{APP_NAME}}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {{DESCRIPTION}}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you manage and grow your business.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6">
                <CheckCircle2 className="w-8 h-8 text-[var(--btn-primary-bg)] mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-[var(--btn-primary-bg)] text-white p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join thousands of users who are already using {{APP_NAME}} to
              streamline their workflows.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-[var(--btn-primary-bg)] hover:bg-gray-100"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {config.app.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-bold text-white">{config.app.name}</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} {config.app.name}. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
