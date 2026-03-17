import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserPlus,
  Mail,
  User,
  Phone,
  Briefcase,
  Shield,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import { createUser } from '../../lib/api';
import { createUserSchema, type CreateUserFormData } from '../../lib/schemas';
import { getErrorMessage } from '../../lib/api-error';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { PageLayout } from '../../components/layout/PageLayout';
import type { CreateUserRequest } from '../../types';

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

export function CreateUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      department: '',
      phone_number: '',
      role: 'viewer',
      status: 'active',
    },
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      return await createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      navigate('/admin/users');
    },
    onError: (err: unknown) => {
      setError('root', { message: getErrorMessage(err) });
    },
  });

  // Submit form
  const onSubmit = (data: CreateUserFormData) => {
    const userData: CreateUserRequest = {
      email: data.email.trim(),
      password: data.password,
      first_name: data.first_name?.trim() || undefined,
      last_name: data.last_name?.trim() || undefined,
      department: data.department?.trim() || undefined,
      phone_number: data.phone_number?.trim() || undefined,
      role: data.role,
      status: data.status,
    };

    createMutation.mutate(userData);
  };

  return (
    <PageLayout
      title="Create User"
      subtitle="Add a new user to the system"
      icon={<UserPlus className="w-6 h-6 text-sky-600" />}
      backTo="/admin/users"
      maxWidth="2xl"
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
              placeholder="user@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              showPasswordToggle
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
              name="role"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="Role"
                  value={field.value || ''}
                  onChange={field.onChange}
                  options={roleOptions}
                  error={errors.role?.message}
                />
              )}
            />
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
            loading={createMutation.isPending}
            leftIcon={!createMutation.isPending ? <Check className="w-4 h-4" /> : undefined}
          >
            Create User
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}

export default CreateUserPage;
