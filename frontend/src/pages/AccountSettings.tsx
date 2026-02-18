import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Lock,
  Mail,
  Building2,
  Phone,
  Shield,
  Calendar,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAccountProfile,
  updateAccountProfile,
  changePassword,
} from '../lib/api';
import { profileSchema, changePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from '../lib/schemas';
import { validatePassword } from '../lib/validation';
import { getErrorMessage } from '../lib/api-error';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageLayout } from '../components/layout/PageLayout';

type TabType = 'profile' | 'security';

const tabs: { id: TabType; name: string; icon: React.ElementType }[] = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Lock },
];

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  return (
    <PageLayout
      title="Account Settings"
      subtitle="Manage your profile and security settings"
    >
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${isActive
                    ? 'border-indigo-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </PageLayout>
  );
}

// ============== Profile Tab ==============
function ProfileTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: getAccountProfile,
  });

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      department: '',
      phone_number: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        department: profile.department || '',
        phone_number: profile.phone_number || '',
      });
    }
  }, [profile, reset]);

  const { updateUser } = useAuth();

  const updateMutation = useMutation({
    mutationFn: updateAccountProfile,
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Update AuthContext user data
      updateUser({
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        department: updatedProfile.department,
      });
    },
    onError: (err: unknown) => {
      setError('root', { message: getErrorMessage(err) });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        department: profile.department || '',
        phone_number: profile.phone_number || '',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.root && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{errors.root.message}</span>
        </div>
      )}

      {/* Editable Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Personal Information
          </h2>
          {!isEditing ? (
            <Button
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="text-primary-600"
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                leftIcon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={updateMutation.isPending}
                leftIcon={!updateMutation.isPending ? <Save className="w-4 h-4" /> : undefined}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {isEditing ? (
              <Input
                label="First Name"
                placeholder="Enter first name"
                error={errors.first_name?.message}
                {...register('first_name')}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <p className="text-gray-900 dark:text-white py-2.5">{profile?.first_name || '—'}</p>
              </>
            )}
          </div>

          <div>
            {isEditing ? (
              <Input
                label="Last Name"
                placeholder="Enter last name"
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <p className="text-gray-900 dark:text-white py-2.5">{profile?.last_name || '—'}</p>
              </>
            )}
          </div>

          <div>
            {isEditing ? (
              <Input
                label="Department"
                placeholder="Enter department"
                error={errors.department?.message}
                {...register('department')}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Department
                </label>
                <p className="text-gray-900 dark:text-white py-2.5">{profile?.department || '—'}</p>
              </>
            )}
          </div>

          <div>
            {isEditing ? (
              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter phone number"
                error={errors.phone_number?.message}
                {...register('phone_number')}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <p className="text-gray-900 dark:text-white py-2.5">{profile?.phone_number || '—'}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Read-Only Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <p className="text-gray-900 dark:text-white py-2.5">{profile?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Member Since
            </label>
            <p className="text-gray-900 dark:text-white py-2.5">{formatDate(profile?.created_at || null)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Lock className="w-4 h-4 inline mr-1" />
              Last Login
            </label>
            <p className="text-gray-900 dark:text-white py-2.5">{formatDate(profile?.last_login_at || null)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Password check component
function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      )}
      <span className={`text-xs ${passed ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

// ============== Security Tab ==============
function SecurityTab() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  const newPassword = watch('new_password');

  // Password validation for requirements display
  const passwordValidation = validatePassword(newPassword || '');

  // Show rules when user starts typing
  useEffect(() => {
    if (newPassword && newPassword.length > 0) {
      setShowPasswordRules(true);
    } else {
      setShowPasswordRules(false);
    }
  }, [newPassword]);

  const changeMutation = useMutation({
    mutationFn: (params: { new_password: string }) => changePassword(params.new_password),
    onSuccess: () => {
      setSuccessMessage('Password changed successfully');
      reset();
      setShowPasswordRules(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: unknown) => {
      setError('root', { message: getErrorMessage(error) });
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changeMutation.mutate({
      new_password: data.new_password,
    });
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.root && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{errors.root.message}</span>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Change Password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                error={errors.new_password?.message}
                {...register('new_password')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {showPasswordRules && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Password requirements:</p>
                <div className="space-y-1">
                  <PasswordCheck passed={passwordValidation.checks.minLength} label="At least 8 characters" />
                  <PasswordCheck passed={passwordValidation.checks.hasUppercase} label="At least 1 uppercase letter (A-Z)" />
                  <PasswordCheck passed={passwordValidation.checks.hasLowercase} label="At least 1 lowercase letter (a-z)" />
                  <PasswordCheck passed={passwordValidation.checks.hasNumber} label="At least 1 number (0-9)" />
                  <PasswordCheck passed={passwordValidation.checks.hasSymbol} label="At least 1 special character (!@#$%^&*)" />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={changeMutation.isPending}
            className="w-full"
          >
            {changeMutation.isPending ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </div>

      {/* Password Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Password Security Tips</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Use a combination of uppercase and lowercase letters
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Include numbers and special characters
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Avoid using personal information
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Use a unique password for this account
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AccountSettings;
