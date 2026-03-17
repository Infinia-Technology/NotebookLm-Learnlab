import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserCog,
  Mail,
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
import { updateUserSchema, type UpdateUserFormData } from '../../lib/schemas';
import { getErrorMessage } from '../../lib/api-error';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { PageLayout } from '../../components/layout/PageLayout';
import type { UpdateUserRequest } from '../../types';

const roleOptions = [
  { value: '', label: 'Viewer (Default)' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin (Full access)' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

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

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    watch,
    control,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      department: '',
      phone_number: '',
      role: '',
      status: 'active',
      password: '',
    },
  });

  // Watch role for helper text
  const systemRole = watch('role');

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        department: user.department || '',
        phone_number: user.phone_number || '',
        role: (user.role as UpdateUserFormData['role']) || '',
        status: (user.status as UpdateUserFormData['status']) || 'active',
        password: '',
      });
    }
  }, [user, reset]);

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
    onError: (err: unknown) => {
      setError('root', { message: getErrorMessage(err) });
    },
  });

  // Submit form
  const onSubmit = (data: UpdateUserFormData) => {
    const updateData: UpdateUserRequest = {
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      department: data.department || undefined,
      phone_number: data.phone_number || undefined,
      role: data.role || undefined,
      status: data.status,
    };

    // Only include password if provided
    if (data.password) {
      updateData.password = data.password;
    }

    updateMutation.mutate(updateData);
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
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  const getRoleHelperText = () => {
    switch (systemRole) {
      case 'super_admin':
        return 'Full system access - can see and modify everything';
      case 'admin':
        return 'Can manage users and most settings';
      case 'editor':
        return 'Can edit content but not manage users';
      default:
        return 'Read-only access';
    }
  };

  return (
    <PageLayout
      title="Edit User"
      subtitle={user.email}
      icon={<UserCog className="w-6 h-6 text-sky-600" />}
      backTo="/admin/users"
      maxWidth="4xl"
    >
      {/* Error Alert */}
      {errors.root && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{errors.root.message}</p>
          <button onClick={() => setError('root', {})} className="ml-auto">
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        {/* Account Details */}
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={user.email}
              disabled
              helperText="Email cannot be changed"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              showPasswordToggle
              autoComplete="new-password"
              helperText="Leave blank to keep current"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            Profile Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              placeholder="John"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              type="text"
              placeholder="Doe"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
            <div className="relative">
              <Input
                label="Department"
                type="text"
                placeholder="Engineering"
                error={errors.department?.message}
                {...register('department')}
              />
              <Briefcase className="absolute right-3 top-[38px] w-4 h-4 text-gray-400" />
            </div>
            <div className="relative">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 234 567 8900"
                error={errors.phone_number?.message}
                {...register('phone_number')}
              />
              <Phone className="absolute right-3 top-[38px] w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Role & Status */}
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            Role & Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="Status"
                  value={field.value}
                  onChange={field.onChange}
                  options={statusOptions}
                  error={errors.status?.message}
                />
              )}
            />
            <div>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    label="System Role"
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={roleOptions}
                    error={errors.role?.message}
                  />
                )}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {getRoleHelperText()}
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
    </PageLayout>
  );
}

export default EditUserPage;
