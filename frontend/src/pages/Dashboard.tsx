import { Link } from 'react-router-dom';
import { Settings, Users, TrendingUp, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const quickActions: QuickAction[] = [
  {
    name: 'Account Settings',
    description: 'Manage your profile and preferences',
    href: '/dashboard/account',
    icon: Settings,
  },
  {
    name: 'User Management',
    description: 'Manage users and roles',
    href: '/admin/users',
    icon: Users,
    adminOnly: true,
  }
];

// Mock stats for demonstration
const stats = [
  {
    label: 'Total Users',
    value: '1,234',
    change: '+12%',
    trend: 'up' as const,
    icon: Users,
  },
  {
    label: 'Active Sessions',
    value: '89',
    change: '+5%',
    trend: 'up' as const,
    icon: Activity,
  },
  {
    label: 'This Week',
    value: '156',
    change: '-3%',
    trend: 'down' as const,
    icon: Calendar,
  },
  {
    label: 'Growth',
    value: '23.5%',
    change: '+8%',
    trend: 'up' as const,
    icon: TrendingUp,
  },
];

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const { config } = useSystemConfig();

  const filteredActions = quickActions.filter(
    (action) => !action.adminOnly || isSuperAdmin
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            This is your {config.app.name} dashboard. Here's what's happening today.
          </p>
        </div>
        <Badge variant="primary" size="md">
          {config.app.type.replace(/-/g, ' ')}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={stat.trend === 'up' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--color-app-primary-100)] rounded-lg">
                <stat.icon className="w-5 h-5 text-[var(--btn-primary-bg)]" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader
          title="Quick Actions"
          subtitle="Get started with common tasks"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-[var(--btn-primary-bg)] hover:shadow-sm transition-all"
            >
              <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-[var(--color-app-primary-100)] transition-colors">
                <action.icon className="w-5 h-5 text-gray-600 group-hover:text-[var(--btn-primary-bg)] transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[var(--btn-primary-bg)] transition-colors">
                  {action.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Getting Started Card */}
      <Card className="bg-gradient-to-r from-[var(--color-app-primary-50)] to-[var(--color-app-primary-100)] border-[var(--color-app-primary-200)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-app-primary-900)] mb-2">
              Getting Started
            </h2>
            <p className="text-[var(--color-app-primary-800)] max-w-xl">
              This is a core platform template. Use it as a foundation for building
              your own applications with authentication, user management, and
              multi-tenant support built-in.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open('/design-system', '_blank')}
              >
                View Design System
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/api/docs', '_blank')}
              >
                API Documentation
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
