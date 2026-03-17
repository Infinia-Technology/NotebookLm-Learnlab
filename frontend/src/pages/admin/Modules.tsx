import { PageLayout } from '../../components/layout/PageLayout';
import { BookOpen, Brain, Code2, Cog, PlayCircle, Server, Shield, Loader2, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCourses, enrollInCourse } from '../../lib/api';
import { useState } from 'react';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';

// Visual themes to cycle through for courses
const COURSE_THEMES = [
    { icon: Brain, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    { icon: Code2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { icon: Cog, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    { icon: Server, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' },
    { icon: BookOpen, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/20' },
    { icon: Shield, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' }
];

export function ModulesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Enrollment Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourseUuid, setSelectedCourseUuid] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);

    const { data: courses, isLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: listCourses
    });

    const enrollMutation = useMutation({
        mutationFn: (variables: { courseUuid: string; credentials: any }) =>
            enrollInCourse(variables.courseUuid, variables.credentials),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            setIsModalOpen(false);
            resetForm();
            navigate(`/dashboard/modules/${variables.courseUuid}`);
        },
        onError: (err: any) => {
            console.error('Enrollment failed:', err);
            setAuthError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
        }
    });

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setAuthError(null);
        setSelectedCourseUuid(null);
    };

    const handleEnroll = (courseUuid: string, isStarted: boolean) => {
        if (isStarted) {
            navigate(`/dashboard/modules/${courseUuid}`);
        } else {
            setSelectedCourseUuid(courseUuid);
            setIsModalOpen(true);
        }
    };

    const confirmEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseUuid) return;

        enrollMutation.mutate({
            courseUuid: selectedCourseUuid,
            credentials: { email, password }
        });
    };

    // Helper to get a stable theme based on course ID
    const getTheme = (_id: string, index: number) => {
        return COURSE_THEMES[index % COURSE_THEMES.length];
    };

    if (isLoading) {
        return (
            <PageLayout
                title="Learning Platform"
                subtitle="Enhance your skills with our curated courses"
                icon={<BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            >
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Learning Platform"
            subtitle="Enhance your skills with our curated courses"
            icon={<BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        >
            {courses?.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No courses available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses?.map((course: any, idx: number) => {
                        const theme = getTheme(course.uuid, idx);
                        const Icon = theme.icon;

                        return (
                            <div
                                key={course.uuid}
                                className={cn(
                                    "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col course-card-premium",
                                    `course-card-${theme.color.split('-')[1]}`
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${theme.bg}`}>
                                        <Icon className={`w-6 h-6 ${theme.color}`} />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                        Course
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                    {course.title}
                                </h3>

                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">
                                    {course.description || "No description available."}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Progress</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {course.completion_percentage ? Math.round(course.completion_percentage) : 0}%
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleEnroll(course.uuid, course.completion_percentage > 0)}
                                        loading={enrollMutation.isPending && enrollMutation.variables?.courseUuid === course.uuid}
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        {course.completion_percentage > 0 ? 'Continue' : 'Enroll'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Enrollment Verification Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title="Verify Your Credentials"
                description="Please enter your email and password to secure your enrollment."
            >
                <form onSubmit={confirmEnroll} className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        showPasswordToggle
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {authError && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            {authError}
                        </p>
                    )}

                    <ModalFooter className="flex-col sm:flex-row">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                resetForm();
                            }}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={enrollMutation.isPending}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                        >
                            Verify & Enroll
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </PageLayout>
    );
}
