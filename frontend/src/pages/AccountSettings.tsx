import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { validatePassword } from '../lib/validation';
import { Button } from '../components/ui/Button';

type TabType = 'profile' | 'security';

const tabs: { id: TabType; name: string; icon: React.ElementType }[] = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Lock },
];

interface UpdateProfileParams {
  first_name?: string;
  last_name?: string;
  department?: string;
  phone_number?: string;
}

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and security settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-indigo-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}

// ============== Profile Tab ==============
function ProfileTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileParams>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: getAccountProfile,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        department: profile.department || '',
        phone_number: profile.phone_number || '',
      });
    }
  }, [profile]);

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
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {updateMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">Failed to update profile. Please try again.</span>
        </div>
      )}

      {/* Editable Profile Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
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
                onClick={handleSave}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            ) : (
              <p className="text-gray-900 py-2.5">{profile?.first_name || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            ) : (
              <p className="text-gray-900 py-2.5">{profile?.last_name || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Department
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter department"
              />
            ) : (
              <p className="text-gray-900 py-2.5">{profile?.department || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            ) : (
              <p className="text-gray-900 py-2.5">{profile?.phone_number || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Read-Only Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gray-500" />
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <p className="text-gray-900 py-2.5">{profile?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Member Since
            </label>
            <p className="text-gray-900 py-2.5">{formatDate(profile?.created_at || null)}</p>
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
        <X className="w-4 h-4 text-slate-300" />
      )}
      <span className={`text-xs ${passed ? 'text-green-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}

// ============== Security Tab ==============
function SecurityTab() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password validation
  const passwordValidation = validatePassword(newPassword);

  // Show rules when user starts typing
  useEffect(() => {
    if (newPassword.length > 0) {
      setShowPasswordRules(true);
    } else {
      setShowPasswordRules(false);
    }
  }, [newPassword]);

  const changeMutation = useMutation({
    mutationFn: (params: { new_password: string }) => changePassword(params.new_password),
    onSuccess: () => {
      setSuccessMessage('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordRules(false);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      setErrorMessage(error?.response?.data?.detail || 'Failed to change password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passwordValidation.isValid) {
      setErrorMessage('Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    changeMutation.mutate({
      new_password: newPassword,
    });
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{errorMessage}</span>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-gray-500" />
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {showPasswordRules && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Password requirements:</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!passwordValidation.isValid || !confirmPassword || newPassword !== confirmPassword}
            loading={changeMutation.isPending}
            className="w-full"
          >
            {changeMutation.isPending ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </div>

      {/* Password Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">Password Security Tips</h3>
        <ul className="text-sm text-blue-700 space-y-2">
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
