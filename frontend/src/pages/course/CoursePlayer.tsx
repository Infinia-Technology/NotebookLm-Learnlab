import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listModules, updateProgress, submitAssignment, uploadFile, downloadCertificate, sendCertificate } from '../../lib/api';
import {
    PlayCircle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Menu,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    HelpCircle,
    Lock,
    Download,
    FileText,
    Upload,
    Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../core';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, Mail } from 'lucide-react';

// --- Mock Data ---

type ContentType = 'video' | 'text' | 'quiz' | 'pdf' | 'ppt';

interface Assignment {
    enabled: boolean;
    title: string;
    instructions: string;
    submission_type: 'text' | 'file' | 'url';
    requires_approval: boolean;
    due_date?: string;
}

interface Lesson {
    id: string;
    title: string;
    description?: string;
    type: ContentType;
    duration?: string;
    completed: boolean;
    content?: string; // For text/video placeholder
    content_url?: string;
    file_path?: string;
    questions?: QuizQuestion[];
    assignment?: Assignment;
    is_mandatory?: boolean;
    order_index: number;
}

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
}

interface Section {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
    sections: Section[];
}

// Courses are now fetched from the API

// --- Components ---

export function CoursePlayer() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<string>('');
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Quiz State
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState<{ correct: number, total: number } | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    // Assignment State
    const [assignmentText, setAssignmentText] = useState('');
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
    const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

    const { user } = useAuth();
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [managerEmail, setManagerEmail] = useState('');
    const [claimEmail, setClaimEmail] = useState(user?.email || '');
    const [isSending, setIsSending] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // Fetch dynamic modules
    const { data: modules, isLoading } = useQuery({
        queryKey: ['modules', courseId],
        queryFn: () => listModules(courseId!),
        enabled: !!courseId
    });

    // Update progress mutation
    const progressMutation = useMutation({
        mutationFn: ({ moduleUuid, progress }: { moduleUuid: string, progress: any }) =>
            updateProgress(moduleUuid, progress),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
        }
    });

    // Assignment Submission Mutation
    const submitAssignmentMutation = useMutation({
        mutationFn: submitAssignment,
        onSuccess: () => {
            setAssignmentSubmitted(true);
            setAssignmentSubmitting(false);
            // Optionally verify module completion if auto-approval or wait for manual review
            alert('Assignment submitted successfully!');
        },
        onError: () => {
            setAssignmentSubmitting(false);
            alert('Failed to submit assignment.');
        }
    });

    useEffect(() => {
        if (user?.email) {
            setClaimEmail(user.email);
        }
    }, [user]);

    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managerEmail) return;

        setIsSending(true);
        setClaimError(null);
        try {
            await sendCertificate(courseId!, managerEmail);
            setClaimSuccess(true);
            setTimeout(() => {
                setIsClaimModalOpen(false);
                setClaimSuccess(false);
                setManagerEmail('');
            }, 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to send certificate. Please check the email and try again.';
            setClaimError(errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    // Virtual course object for UI compatibility
    const course = useMemo<Course | null>(() => {
        if (!modules) return null;
        return {
            id: courseId || '',
            title: 'Dynamic Course', // Could fetch course title separately
            sections: [
                {
                    id: 'all-modules',
                    title: 'Course Content',
                    lessons: modules.map((m: any) => ({
                        id: m.uuid,
                        title: m.title,
                        description: m.description,
                        type: m.content_type,
                        completed: m.status === 'completed',
                        content: m.content_url || m.description,
                        content_url: m.content_url,
                        file_path: m.file_path,
                        questions: m.completion_criteria?.questions || [], // For quiz type
                        assignment: m.assignment?.enabled ? m.assignment : undefined,
                        is_mandatory: m.is_mandatory,
                        order_index: m.order_index
                    })).sort((a: any, b: any) => a.order_index - b.order_index)
                }
            ]
        };
    }, [modules, courseId]);

    // Initialize completed lessons from course data (mock + local)
    useEffect(() => {
        if (course) {
            const initialCompleted = new Set<string>();
            course.sections.forEach((s: Section) => s.lessons.forEach((l: Lesson) => {
                if (l.completed) initialCompleted.add(l.id);
            }));
            setCompletedLessons(prev => new Set([...prev, ...initialCompleted]));
        }
    }, [course]);

    // Reset quiz/assignment state when changing lessons
    useEffect(() => {
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
        setAssignmentText('');
        setAssignmentFile(null);
        setAssignmentSubmitted(false);
    }, [activeLesson?.id]);

    const isLessonLocked = (lesson: Lesson) => {
        if (!course) return true;

        // Detect certification exams more robustly
        const title = lesson.title.toLowerCase();
        const isCertification = title.includes('final') ||
            title.includes('grand') ||
            title.includes('certification') ||
            lesson.id.toLowerCase().includes('exam') ||
            lesson.id.toLowerCase().includes('cert');

        if (isCertification) {
            // Check if all OTHER lessons are completed
            let allOthersComplete = true;
            course.sections.forEach((s: Section) => {
                s.lessons.forEach((l: Lesson) => {
                    const lTitle = l.title.toLowerCase();
                    const lIsCertification = lTitle.includes('final') ||
                        lTitle.includes('grand') ||
                        lTitle.includes('certification') ||
                        l.id.toLowerCase().includes('exam') ||
                        l.id.toLowerCase().includes('cert');

                    // If it's NOT a certification exam, it must be complete
                    if (!lIsCertification) {
                        if (!completedLessons.has(l.id)) {
                            allOthersComplete = false;
                        }
                    }
                });
            });
            return !allOthersComplete;
        }

        return false;
    };

    const handleOptionSelect = (questionId: number, optionIndex: number) => {
        if (quizSubmitted) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!activeLesson?.questions) return;

        let correctCount = 0;
        activeLesson.questions.forEach(q => {
            if (selectedAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        const total = activeLesson.questions.length;
        setQuizScore({ correct: correctCount, total });
        setQuizSubmitted(true);

        // Mark lesson as complete if passed (e.g. > 80% or 100%)
        if (correctCount === total) {
            setCompletedLessons(prev => new Set([...prev, activeLesson!.id]));
            progressMutation.mutate({
                moduleUuid: activeLesson!.id,
                progress: { status: 'completed' }
            });
        }

        // Celebration if 100%
        if (correctCount === total) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const markLessonComplete = () => {
        if (!activeLesson) return;

        // Optimistic update for local state
        setCompletedLessons(prev => new Set([...prev, activeLesson.id]));

        progressMutation.mutate({
            moduleUuid: activeLesson.id,
            progress: { status: 'completed' }
        }, {
            onSuccess: () => {
                // Manually update the cache to ensure persistence even before refetch
                queryClient.setQueryData(['modules', courseId], (oldData: any[]) => {
                    if (!oldData) return oldData;
                    return oldData.map(m => {
                        if (m.uuid === activeLesson.id) {
                            return { ...m, status: 'completed' };
                        }
                        return m;
                    });
                });
                // Invalidate to be sure, but the manual update handles immediate UI consistency
                queryClient.invalidateQueries({ queryKey: ['modules', courseId] });

                // Celebration
                confetti({
                    particleCount: 30,
                    spread: 50,
                    origin: { y: 0.7 },
                    colors: ['#4F46E5', '#10B981']
                });
            },
            onError: (err) => {
                console.error("Failed to mark complete:", err);
                alert("Failed to save progress. Please try again.");
                // Revert local state if needed (optional, complexity vs benefit)
            }
        });
    };

    const handleAssignmentSubmit = async () => {
        if (!activeLesson) return;
        setAssignmentSubmitting(true);

        let submissionContent = assignmentText;
        let submissionType = activeLesson.assignment?.submission_type || 'text';

        if (submissionType === 'file' && assignmentFile) {
            try {
                const { url } = await uploadFile(assignmentFile);
                submissionContent = url;
            } catch (e) {
                alert('File upload failed');
                setAssignmentSubmitting(false);
                return;
            }
        }

        submitAssignmentMutation.mutate({
            module_uuid: activeLesson.id,
            submission_content: submissionContent,
            submission_type: submissionType
        });
    };

    useEffect(() => {
        if (course && course.sections.length > 0 && !activeLesson) {
            // Find first uncompleted lesson or just first lesson
            setActiveSection(course.sections[0].id);
            setActiveLesson(course.sections[0].lessons[0]);
        }
    }, [course]);

    // Helper to determine if the current lesson is the last one in the course
    const isLastLesson = useMemo(() => {
        if (!course || !activeLesson) return false;
        // Flatten all lessons
        const allLessons = course.sections.flatMap(s => s.lessons);
        if (allLessons.length === 0) return false;
        const lastLesson = allLessons[allLessons.length - 1];
        return lastLesson.id === activeLesson.id;
    }, [course, activeLesson]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 dark:bg-black">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading Course Content...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 dark:bg-black">
                <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">The course you're looking for doesn't exist or has been removed.</p>
                    <Button onClick={() => navigate('/dashboard/modules')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    const handleLessonSelect = (lesson: Lesson, sectionId: string) => {
        setActiveLesson(lesson);
        setActiveSection(sectionId);
        if (!lesson.completed && !lesson.assignment) {
            // Only auto-start progress if not an assignment-heavy module? 
            // Or just mark in progress.
            progressMutation.mutate({
                moduleUuid: lesson.id,
                progress: { status: 'in_progress' }
            });
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 dark:bg-black">
            {/* Sidebar */}
            <div
                className={cn(
                    "flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-y-auto",
                    sidebarOpen ? "w-80" : "w-0 border-none"
                )}
            >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/modules')} className="mb-2 -ml-2 text-gray-500">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Courses
                    </Button>
                    <h2 className="font-bold text-gray-900 dark:text-white leading-tight">{course.title}</h2>
                </div>

                <div className="p-2">
                    {course.sections.map((section: Section) => (
                        <div key={section.id} className="mb-2">
                            <button
                                onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                                className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                            >
                                <span>{section.title}</span>
                                {activeSection === section.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            {activeSection === section.id && (
                                <div className="ml-2 mt-1 space-y-1">
                                    {section.lessons.map((lesson: Lesson) => {
                                        const locked = isLessonLocked(lesson);
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    if (locked) {
                                                        alert("Prerequisites not met: You must complete all previous modules before starting the certification exam.");
                                                        return;
                                                    }
                                                    handleLessonSelect(lesson, section.id);
                                                }}
                                                className={cn(
                                                    "flex items-center w-full p-2 text-sm rounded-lg transition-colors text-left gap-3",
                                                    activeLesson?.id === lesson.id
                                                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                                        : completedLessons.has(lesson.id)
                                                            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                                                    locked && "opacity-50 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/50"
                                                )}
                                            >
                                                {locked ? (
                                                    <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                ) : completedLessons.has(lesson.id) ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                ) : (
                                                    lesson.type === 'video' ? <PlayCircle className="w-4 h-4 flex-shrink-0" /> :
                                                        lesson.type === 'quiz' ? <HelpCircle className="w-4 h-4 flex-shrink-0" /> :
                                                            <BookOpen className="w-4 h-4 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate flex items-center gap-2">
                                                        {lesson.title}
                                                        {lesson.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">REQ</span>}
                                                    </div>
                                                    {lesson.duration && <div className="text-xs opacity-70">{lesson.duration} mins</div>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
                {/* Toolbar */}
                <div className="flex items-center p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <span className="ml-4 font-medium text-gray-900 dark:text-white truncate flex-1">
                        {activeLesson?.title}
                    </span>



                    {activeLesson && !isLessonLocked(activeLesson) && (
                        completedLessons.has(activeLesson.id) ? (
                            <div className="mr-2 flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                Completed
                            </div>
                        ) : ['video', 'text', 'pdf', 'ppt'].includes(activeLesson.type) && (
                            <Button
                                size="sm"
                                onClick={markLessonComplete}
                                className="mr-2 bg-green-600 hover:bg-green-700 text-white gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Mark Complete
                            </Button>
                        )
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {activeLesson && isLessonLocked(activeLesson) ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                    <Lock className="w-10 h-10 text-gray-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Module Locked</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                                    This module is locked. You must complete all previous modules and prerequisites before you can access the certification exam.
                                </p>
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-900/30">
                                    <CheckCircle className="w-4 h-4" />
                                    Complete all modules to unlock
                                </div>
                            </div>
                        ) : activeLesson && (
                            <>
                                {activeLesson.description && (
                                    <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                                        <h3 className="text-lg font-semibold mb-2">About this module</h3>
                                        <div dangerouslySetInnerHTML={{ __html: activeLesson.description }} />
                                    </div>
                                )}

                                {activeLesson.type === 'video' && (
                                    <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden group">
                                        {activeLesson.content_url && activeLesson.content_url.includes('/static/') ? (
                                            <video controls className="w-full h-full object-contain">
                                                <source src={activeLesson.content_url} />
                                            </video>
                                        ) : (
                                            <div className="text-center">
                                                <PlayCircle className="w-16 h-16 text-white/50 mb-4 mx-auto group-hover:text-white transition-colors" />
                                                <p className="text-gray-400">Video Placeholder: {activeLesson.content}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeLesson.type === 'text' && (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <h3>Reading Material</h3>
                                        {activeLesson.content_url && activeLesson.content_url.includes('.pdf') ? (
                                            <iframe src={activeLesson.content_url} className="w-full h-[600px] rounded-xl border" />
                                        ) : (
                                            <p className="lead">{activeLesson.content}</p>
                                        )}
                                    </div>
                                )}

                                {(activeLesson.type === 'pdf' || activeLesson.type === 'ppt') && (
                                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                        <FileText className="w-16 h-16 text-gray-400 mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">Document Resource</h3>
                                        <p className="text-gray-500 mb-6">{activeLesson.title}</p>
                                        {activeLesson.content_url && (
                                            <a
                                                href={activeLesson.content_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => markLessonComplete()}
                                            >
                                                <Button className="gap-2">
                                                    <Download className="w-4 h-4" /> Download/View {activeLesson.type.toUpperCase()}
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Manual Completion for Passive Content */}
                                {['video', 'text', 'pdf', 'ppt'].includes(activeLesson.type) && !completedLessons.has(activeLesson.id) && (
                                    <div className="mt-8 flex justify-center border-t border-gray-100 dark:border-gray-800 pt-8">
                                        <Button
                                            onClick={markLessonComplete}
                                            size="lg"
                                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Mark as Completed
                                        </Button>
                                    </div>
                                )}

                                {activeLesson.type === 'quiz' && activeLesson.questions && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quiz: {activeLesson.title}</h3>
                                            {quizScore && (
                                                <div className={`px-4 py-2 rounded-full font-bold text-sm ${quizScore.correct === quizScore.total
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    }`}>
                                                    Score: {quizScore.correct}/{quizScore.total}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-8">
                                            {activeLesson.questions.map((q, idx) => (
                                                <div key={q.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                                    <p className="font-medium text-gray-900 dark:text-white mb-4">{idx + 1}. {q.question}</p>
                                                    <div className="space-y-3">
                                                        {q.options.map((opt, optIdx) => {
                                                            let optionClass = "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700";

                                                            // Styling based on result
                                                            if (quizSubmitted) {
                                                                if (optIdx === q.correctAnswer) {
                                                                    optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500";
                                                                } else if (selectedAnswers[q.id] === optIdx) {
                                                                    optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500";
                                                                } else {
                                                                    optionClass = "opacity-50";
                                                                }
                                                            } else if (selectedAnswers[q.id] === optIdx) {
                                                                optionClass = "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600";
                                                            }

                                                            return (
                                                                <label
                                                                    key={optIdx}
                                                                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${optionClass}`}
                                                                    onClick={() => handleOptionSelect(q.id, optIdx)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedAnswers[q.id] === optIdx
                                                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                            : 'border-gray-400'
                                                                            }`}>
                                                                            {selectedAnswers[q.id] === optIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                                                                        </div>
                                                                        <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                                                                    </div>

                                                                    {quizSubmitted && optIdx === q.correctAnswer && (
                                                                        <Check className="w-5 h-5 text-green-600" />
                                                                    )}
                                                                    {quizSubmitted && selectedAnswers[q.id] === optIdx && optIdx !== q.correctAnswer && (
                                                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {!quizSubmitted && !completedLessons.has(activeLesson.id) ? (
                                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                                <Button
                                                    onClick={handleSubmitQuiz}
                                                    disabled={Object.keys(selectedAnswers).length < activeLesson.questions.length}
                                                >
                                                    Submit Quiz
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                                                {(quizScore?.correct === quizScore?.total || completedLessons.has(activeLesson.id)) ? (
                                                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-6 rounded-lg inline-block border border-green-200 dark:border-green-800">
                                                        <p className="font-bold text-lg mb-4">
                                                            {(() => {
                                                                const isCert = activeLesson.title.toLowerCase().includes('final') ||
                                                                    activeLesson.title.toLowerCase().includes('exam') ||
                                                                    activeLesson.title.toLowerCase().includes('certification');
                                                                return isCert ? '🎉 Final Exam Passed! 🎉' : '🎉 Quiz Completed! 🎉';
                                                            })()}
                                                        </p>
                                                        {(() => {
                                                            const isCert = activeLesson.title.toLowerCase().includes('certification') ||
                                                                activeLesson.title.toLowerCase().includes('final exam') ||
                                                                activeLesson.title.toLowerCase().includes('grand exam');
                                                            return isCert && (
                                                                <Button
                                                                    onClick={() => setIsClaimModalOpen(true)}
                                                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                                                    size="lg"
                                                                >
                                                                    <Award className="w-5 h-5" />
                                                                    Claim My Professional Certificate
                                                                </Button>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 p-4 rounded-lg inline-block">
                                                        <p className="font-bold text-lg mb-1">Review your answers</p>
                                                        <p>You can retake the quiz to improve your score.</p>
                                                        <Button className="mt-4" onClick={() => {
                                                            setQuizSubmitted(false);
                                                            setSelectedAnswers({});
                                                            setQuizScore(null);
                                                        }}>Retake Quiz</Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Assignment Section */}
                                {activeLesson.assignment && (
                                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-6 mt-8">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-orange-100 dark:bg-orange-800/30 rounded-lg text-orange-600">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                    Assignment: {activeLesson.assignment.title}
                                                </h3>
                                                <div className="prose dark:prose-invert max-w-none text-sm mb-4">
                                                    <p>{activeLesson.assignment.instructions}</p>
                                                </div>

                                                {completedLessons.has(activeLesson.id) ? (
                                                    <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200">
                                                        <CheckCircle size={20} /> Assignment Completed & Approved
                                                    </div>
                                                ) : assignmentSubmitted ? (
                                                    <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
                                                        <Check size={20} /> Assignment Submitted - Pending Review
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {activeLesson.assignment.submission_type === 'text' && (
                                                            <textarea
                                                                className="w-full p-3 border rounded-lg bg-white dark:bg-black"
                                                                placeholder="Type your submission here..."
                                                                rows={5}
                                                                value={assignmentText}
                                                                onChange={e => setAssignmentText(e.target.value)}
                                                            />
                                                        )}

                                                        {activeLesson.assignment.submission_type === 'file' && (
                                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:bg-white/50 transition-colors">
                                                                <input
                                                                    type="file"
                                                                    id="assignment-file"
                                                                    className="hidden"
                                                                    onChange={e => setAssignmentFile(e.target.files?.[0] || null)}
                                                                />
                                                                <label htmlFor="assignment-file" className="cursor-pointer">
                                                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                                                                        {assignmentFile ? assignmentFile.name : "Click to upload assignment file"}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end">
                                                            <Button
                                                                onClick={handleAssignmentSubmit}
                                                                disabled={assignmentSubmitting || (activeLesson.assignment.submission_type === 'text' && !assignmentText) || (activeLesson.assignment.submission_type === 'file' && !assignmentFile)}
                                                            >
                                                                {assignmentSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Lesson Navigation */}
                                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (!course || !activeLesson) return;
                                            const currentSectionIndex = course.sections.findIndex((s: Section) => s.id === activeSection);
                                            const currentSection = course.sections[currentSectionIndex];
                                            const currentLessonIndex = currentSection.lessons.findIndex((l: Lesson) => l.id === activeLesson.id);

                                            if (currentLessonIndex > 0) {
                                                const prevLesson = currentSection.lessons[currentLessonIndex - 1];
                                                handleLessonSelect(prevLesson, activeSection);
                                            } else if (currentSectionIndex > 0) {
                                                const prevSection = course.sections[currentSectionIndex - 1];
                                                const prevLesson = prevSection.lessons[prevSection.lessons.length - 1];
                                                handleLessonSelect(prevLesson, prevSection.id);
                                            }
                                        }}
                                        disabled={!course || (course.sections.findIndex((s) => s.id === activeSection) === 0 && course.sections[0].lessons.findIndex((l: any) => l.id === activeLesson?.id) === 0)}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Previous Lesson
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            if (!course || !activeLesson) return;
                                            const currentSectionIndex = course.sections.findIndex((s: Section) => s.id === activeSection);
                                            const currentSection = course.sections[currentSectionIndex];
                                            const currentLessonIndex = currentSection.lessons.findIndex((l: Lesson) => l.id === activeLesson.id);

                                            let nextLesson: Lesson | null = null;
                                            let nextSectionId = activeSection;

                                            if (currentLessonIndex < currentSection.lessons.length - 1) {
                                                nextLesson = currentSection.lessons[currentLessonIndex + 1];
                                            } else if (currentSectionIndex < course.sections.length - 1) {
                                                const nextSection = course.sections[currentSectionIndex + 1];
                                                nextLesson = nextSection.lessons[0];
                                                nextSectionId = nextSection.id;
                                            }

                                            if (nextLesson) {
                                                if (isLessonLocked(nextLesson)) {
                                                    alert("Next module is locked: Please complete all current prerequisites first.");
                                                } else {
                                                    handleLessonSelect(nextLesson, nextSectionId);
                                                }
                                            }
                                        }}
                                        disabled={!course || isLastLesson}
                                    >
                                        Next Lesson <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isClaimModalOpen}
                onClose={() => setIsClaimModalOpen(false)}
                title="Claim Your Certificate"
                description={`Congratulations on completing ${course.title}!`}
            >
                <form onSubmit={handleClaimSubmit} className="space-y-4">
                    {claimSuccess ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
                            <p className="text-gray-600 dark:text-gray-400">The certificate has been sent to your manager.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Email</label>
                                <Input
                                    type="email"
                                    value={claimEmail}
                                    onChange={(e) => setClaimEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Manager's Email</label>
                                <Input
                                    type="email"
                                    value={managerEmail}
                                    onChange={(e) => setManagerEmail(e.target.value)}
                                    placeholder="yourboss@example.com"
                                    required
                                />
                                <p className="text-xs text-gray-500">A copy of your certificate will be sent to your manager for record.</p>
                            </div>

                            {claimError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                                    <AlertCircle size={16} /> {claimError}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => downloadCertificate(courseId!, course.title)}
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download PDF
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSending || !managerEmail}
                                    className="gap-2"
                                >
                                    {isSending ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" /> Send to Manager
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </Modal>
        </div>
    );
}
