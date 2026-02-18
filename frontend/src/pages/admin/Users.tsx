import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  listUsers,
  getAdminStats,
  deleteUser,
} from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { LinkButton } from '../../components/ui/Button';
import { PageLayout } from '../../components/layout/PageLayout';
import { CustomSelect } from '../../components/ui/CustomSelect';
import type { User } from '../../types';

const ITEMS_PER_PAGE = 20;

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

interface AdminStatsData {
  total_users: number;
  active_users: number;
  pending_users: number;
  super_admins: number;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(searchParams.get('role') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Synchronize state with URL parameters
  useEffect(() => {
    const roleParam = searchParams.get('role') || '';
    const statusParam = searchParams.get('status') || '';

    if (roleParam !== selectedRole) setSelectedRole(roleParam);
    if (statusParam !== selectedStatus) setSelectedStatus(statusParam);
  }, [searchParams]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedRole) params.role = selectedRole;
    if (selectedStatus) params.status = selectedStatus;

    // Only update if params actually changed to avoid infinite loops
    const currentRole = searchParams.get('role') || '';
    const currentStatus = searchParams.get('status') || '';

    if (currentRole !== selectedRole || currentStatus !== selectedStatus) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedRole, selectedStatus, setSearchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole, selectedStatus]);

  // Fetch stats
  const { data: stats } = useQuery<AdminStatsData>({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });

  // Fetch users
  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', currentPage, debouncedSearch, selectedRole, selectedStatus],
    queryFn: () => listUsers({
      page: currentPage,
      per_page: ITEMS_PER_PAGE,
      search: debouncedSearch || undefined,
      role: selectedRole || undefined,
      status: selectedStatus || undefined,
    }),
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setActionMenuOpen(null);
    },
  });

  const users = usersData?.items || [];
  const totalPages = usersData?.pages || 1;
  const totalUsers = usersData?.total || 0;

  const handleDelete = (userId: string, email: string) => {
    if (confirm(`Are you sure you want to permanently delete ${email}? This action cannot be undone.`)) {
      deleteMutation.mutate(userId);
    }
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null);
    if (actionMenuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [actionMenuOpen]);

  return (
    <PageLayout
      title="User Management"
      subtitle="Manage users and their permissions"
      icon={<UsersIcon className="w-6 h-6 text-sky-600" />}
      actions={
        <LinkButton
          to="/admin/users/create"
          variant="primary"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create User
        </LinkButton>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_users || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.active_users || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pending_users || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.super_admins || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Super Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
            )}
          </div>

          {/* Role Filter */}
          <CustomSelect
            value={selectedRole}
            onChange={setSelectedRole}
            options={ROLE_OPTIONS}
            className="w-full lg:w-44"
          />

          {/* Status Filter */}
          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={STATUS_OPTIONS}
            className="w-full lg:w-44"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-600 dark:text-sky-400 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((user: User) => (
                  <UserRow
                    key={user.uuid}
                    user={user}
                    currentUserUuid={currentUser?.uuid}
                    actionMenuOpen={actionMenuOpen}
                    setActionMenuOpen={setActionMenuOpen}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function UserRow({
  user,
  currentUserUuid,
  actionMenuOpen,
  setActionMenuOpen,
  onDelete,
}: {
  user: User;
  currentUserUuid?: string;
  actionMenuOpen: string | null;
  setActionMenuOpen: (id: string | null) => void;
  onDelete: (id: string, email: string) => void;
}) {
  // Check if this is the current logged-in user
  const isSelf = currentUserUuid && user.uuid === currentUserUuid;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string | null | undefined) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      default: return 'User';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold uppercase">
              {user.first_name?.[0] || user.email[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {user.role === 'super_admin' ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm font-medium">
            <ShieldCheck className="w-3 h-3" />
            Super Admin
          </span>
        ) : (
          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {getRoleLabel(user.role)}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          'inline-flex px-2 py-1 rounded-lg text-xs font-medium capitalize',
          getStatusColor(user.status || 'active')
        )}>
          {user.status || 'active'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(user.created_at)}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(user.last_login_at)}</span>
      </td>
      <td className="px-6 py-4">
        <div className="relative flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === user.uuid ? null : user.uuid);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {actionMenuOpen === user.uuid && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <Link
                to={`/admin/users/${user.uuid}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
                {isSelf ? 'View' : 'Edit'}
              </Link>
              {!isSelf && (
                <button
                  onClick={() => onDelete(user.uuid, user.email)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              {isSelf && (
                <div className="px-4 py-2 text-sm text-gray-400 dark:text-gray-500 italic">
                  Cannot delete self
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default UsersPage;
