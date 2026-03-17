import { PageLayout } from '../../components/layout/PageLayout';
import { Award, Download, Loader2, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { listCourses, downloadCertificate } from '../../lib/api';

export function CertificationsPage() {
    const { data: courses, isLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: listCourses
    });

    const completedCourses = courses?.filter((course: any) => course.completion_percentage === 100) || [];

    if (isLoading) {
        return (
            <PageLayout
                title="My Certifications"
                subtitle="View and download your earned certificates"
                icon={<Award className="w-6 h-6 text-yellow-500" />}
            >
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="My Certifications"
            subtitle="View and download your earned certificates"
            icon={<Award className="w-6 h-6 text-yellow-500" />}
        >
            {completedCourses.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No certifications yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Complete courses with 100% progress to earn recognized certifications.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map((course: any) => (
                        <div
                            key={course.uuid}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-yellow-500"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 uppercase tracking-wider">
                                    Earned
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {course.title}
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">
                                Certificate of Completion for successfully finishing all modules of {course.title}.
                            </p>

                            <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                                <Button
                                    onClick={() => downloadCertificate(course.uuid, course.title)}
                                    className="w-full gap-2"
                                    variant="outline"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
}
