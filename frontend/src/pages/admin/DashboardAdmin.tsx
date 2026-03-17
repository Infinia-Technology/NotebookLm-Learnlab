import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ArrowRight,
  Loader2,
  UserPlus,
  Layers,
} from 'lucide-react';
import { getAdminStats } from '../../lib/api';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  superAdmins: number;
  isLoading: boolean;
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    superAdmins: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStats = await getAdminStats();

        setStats({
          totalUsers: userStats.total_users || 0,
          activeUsers: userStats.active_users || 0,
          pendingUsers: userStats.pending_users || 0,
          superAdmins: userStats.super_admins || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <PageLayout
      title="Admin Dashboard"
      subtitle="System overview and management"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          isLoading={stats.isLoading}
          href="/admin/users"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={ShieldCheck}
          color="green"
          isLoading={stats.isLoading}
          href="/admin/users?status=active"
        />
        <StatCard
          title="Pending Users"
          value={stats.pendingUsers}
          icon={Users}
          color="amber"
          isLoading={stats.isLoading}
          href="/admin/users?status=pending"
        />
        <StatCard
          title="Super Admins"
          value={stats.superAdmins}
          icon={ShieldCheck}
          color="purple"
          isLoading={stats.isLoading}
          href="/admin/users?role=super_admin"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActionCard
          title="Module Builder"
          description="Create and manage learning modules"
          icon={Layers}
          href="/admin/module-builder"
          color="indigo"
        />
        <QuickActionCard
          title="User Management"
          description="View and manage all users"
          icon={Users}
          href="/admin/users"
          color="sky"
        />
        <QuickActionCard
          title="Create User"
          description="Add a new user to the system"
          icon={UserPlus}
          href="/admin/users/create"
          color="emerald"
        />
      </div>
    </PageLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'amber' | 'purple';
  isLoading: boolean;
  href?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const cardClasses = cn(
    "bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all group block w-full text-left card-premium-hover",
    `hover-glow-${color === 'green' ? 'emerald' : color}`,
    href && "cursor-pointer"
  );

  const cardContent = (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
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
  color: 'sky' | 'emerald' | 'indigo';
}) {
  const colorClasses = {
    sky: 'bg-sky-100 text-sky-600 group-hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:group-hover:bg-sky-900/50',
    emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:group-hover:bg-emerald-900/50',
    indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:group-hover:bg-indigo-900/50',
  };

  return (
    <Link
      to={href}
      className={cn(
        "group bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition-all card-premium-hover",
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
