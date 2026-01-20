import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCog,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Shield,
  X,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react';
import {
  getUser,
  updateUser,
} from '../../lib/api';
import { Button } from '../../components/ui/Button';
import type { UpdateUserRequest } from '../../types';

export function EditUserPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  });

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [systemRole, setSystemRole] = useState<'super_admin' | 'admin' | 'editor' | 'viewer' | ''>('');
  const [status, setStatus] = useState<string>('active');
  const [password, setPassword] = useState('');

  // Error/success state
  const [error, setError] = useState<string | null>(null);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setDepartment(user.department || '');
      setPhoneNumber(user.phone_number || '');
      setSystemRole((user.role as typeof systemRole) || '');
      setStatus(user.status || 'active');
    }
  }, [user]);

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserRequest) => {
      await updateUser(userId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      navigate('/admin/users');
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      setError(err.response?.data?.detail || err.message || 'Failed to update user');
    },
  });

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data: UpdateUserRequest = {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      department: department || undefined,
      phone_number: phoneNumber || undefined,
      role: systemRole || undefined,
      status,
    };

    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      data.password = password;
    }

    updateMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
            <UserCog className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        {/* Account Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
                <span className="text-gray-400 font-normal"> (leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  minLength={6}
                  autoComplete="new-password"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Profile Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <div className="relative">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Role & Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Role & Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <select
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value as typeof systemRole)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Viewer (Default)</option>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin (Full access)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {systemRole === 'super_admin' && 'Full system access - can see and modify everything'}
                {systemRole === 'admin' && 'Can manage users and most settings'}
                {systemRole === 'editor' && 'Can edit content but not manage users'}
                {(systemRole === 'viewer' || !systemRole) && 'Read-only access'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/admin/users')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={updateMutation.isPending}
            leftIcon={!updateMutation.isPending ? <Save className="w-4 h-4" /> : undefined}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditUserPage;
