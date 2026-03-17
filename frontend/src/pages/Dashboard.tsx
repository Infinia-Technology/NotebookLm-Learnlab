import { Link } from 'react-router-dom';
import {
  Settings,
  KeyRound,
  User,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { PageLayout } from '../components/layout/PageLayout';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { config } = useSystemConfig();

  return (
    <PageLayout
      title={`Welcome${user?.first_name ? `, ${user.first_name}` : ''}!`}
      subtitle={`Your ${config.app.name} dashboard`}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          title="My Profile"
          description="View and edit your profile information"
          icon={User}
          href="/dashboard/account"
          color="sky"
        />
        <QuickActionCard
          title="My Certifications"
          description="View and download your certificates"
          icon={Award}
          href="/dashboard/certifications"
          color="amber"
        />
        <QuickActionCard
          title="Account Settings"
          description="Manage your account preferences"
          icon={Settings}
          href="/dashboard/account"
          color="violet"
        />
        <QuickActionCard
          title="Change Password"
          description="Update your password"
          icon={KeyRound}
          href="/dashboard/account?tab=security"
          color="amber"
        />
        <QuickActionCard
          title="Documentation"
          description="Learn how to use the platform"
          icon={BookOpen}
          href="/docs"
          color="emerald"
        />
        <QuickActionCard
          title="Help & Support"
          description="Get help with any issues"
          icon={HelpCircle}
          href="/help"
          color="rose"
        />
      </div>
    </PageLayout>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose';
}) {
  const colorClasses = {
    sky: 'bg-sky-100 text-sky-600 group-hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:group-hover:bg-sky-900/50',
    emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:group-hover:bg-emerald-900/50',
    violet: 'bg-violet-100 text-violet-600 group-hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:group-hover:bg-violet-900/50',
    amber: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:group-hover:bg-amber-900/50',
    rose: 'bg-rose-100 text-rose-600 group-hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:group-hover:bg-rose-900/50',
  };

  return (
    <Link
      to={href}
      className={cn(
        "group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all card-premium-hover",
        `hover-glow-${color}`
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </div>
    </Link>
  );
}
