import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCourses, createCourse, createModule, listModules } from '../../lib/api';
import {
    Plus,
    Book,
    Video,
    FileText,
    ChevronRight,
    Loader2,
    Layout,
    Trash2
} from 'lucide-react';
import { deleteModule } from '../../lib/api';
import { cn } from '../../lib/utils';

export const ModuleBuilderPage = () => {
    const queryClient = useQueryClient();
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [isAddingModule, setIsAddingModule] = useState(false);

    const [newCourse, setNewCourse] = useState({ title: '', description: '' });
    const [isUploading, setIsUploading] = useState(false);

    // Default states
    const defaultModuleState = {
        title: '',
        description: '',
        content_type: 'video',
        content_url: '',
        file_path: '',
        order_index: 0,
        estimated_duration: 30,
        is_mandatory: false,
        completion_criteria: { min_watch_percent: 80 },
        quiz_settings: {
            passing_score: 80,
            max_attempts: 3,
            time_limit: 30,
            randomize_questions: false
        },
        assignment: {
            enabled: false,
            title: '',
            instructions: '',
            submission_type: 'text',
            requires_approval: true,
            due_date: ''
        }
    };

    const [newModule, setNewModule] = useState(defaultModuleState);

    const { data: courses, isLoading: coursesLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: listCourses
    });

    const { data: modules, isLoading: modulesLoading } = useQuery({
        queryKey: ['modules', selectedCourse],
        queryFn: () => listModules(selectedCourse!),
        enabled: !!selectedCourse
    });

    const createCourseMutation = useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            setIsAddingCourse(false);
            setNewCourse({ title: '', description: '' });
        }
    });

    const createModuleMutation = useMutation({
        mutationFn: (moduleData: any) => {
            console.log('Creating module with payload:', moduleData); // Debug log
            // Clean up data before sending
            const sanitizedData = {
                ...moduleData,
                assignment: {
                    ...moduleData.assignment,
                    due_date: moduleData.assignment.due_date || null
                }
            };
            return createModule(sanitizedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules', selectedCourse] });
            setIsAddingModule(false);
            setNewModule({ ...defaultModuleState, order_index: (modules?.length || 0) + 1 });
            alert('Module successfully added!');
        },
        onError: (err: any) => {
            console.error('Module creation failed:', err);
            alert(`Failed to save module: ${err.response?.data?.detail || err.message}`);
        }
    });

    const deleteModuleMutation = useMutation({
        mutationFn: deleteModule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules', selectedCourse] });
            alert('Module deleted successfully');
        },
        onError: (err: any) => {
            console.error('Module deletion failed:', err);
            alert(`Failed to delete module: ${err.response?.data?.detail || err.message}`);
        }
    });

    const handleDeleteModule = (moduleUuid: string, title: string) => {
        if (window.confirm(`Are you sure you want to delete the module "${title}"? This will also delete all student progress and submissions for this module.`)) {
            deleteModuleMutation.mutate(moduleUuid);
        }
    };

    const handleSaveModule = () => {
        // Validation: If NOT a quiz, resource (link or file) is mandatory
        if (newModule.content_type !== 'quiz') {
            const hasResource = newModule.content_url?.trim() || newModule.file_path?.trim();
            if (!hasResource) {
                alert('A resource (Link, PDF, or PPT) is required for this module type.');
                return;
            }
        }

        createModuleMutation.mutate({ ...newModule, course_uuid: selectedCourse });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setIsUploading(true);
        try {
            const { url } = await import('../../lib/api').then(m => m.uploadFile(e.target.files![0]));
            setNewModule(prev => ({ ...prev, file_path: url, content_url: url })); // Auto-fill content_url too for compatibility
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    if (coursesLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Module Builder</h1>
                    <p className="text-gray-500">Create and manage course modules</p>
                </div>
                <button
                    onClick={() => setIsAddingCourse(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} /> New Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Courses Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Book size={20} /> Courses
                    </h2>
                    <div className="space-y-2">
                        {courses?.map((course: any) => (
                            <button
                                key={course.uuid}
                                onClick={() => setSelectedCourse(course.uuid)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center",
                                    selectedCourse === course.uuid
                                        ? "border-primary bg-primary/5 text-primary font-medium"
                                        : "border-gray-200 hover:border-gray-300"
                                )}
                            >
                                <span className="truncate">{course.title}</span>
                                <ChevronRight size={16} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modules Main Area */}
                <div className="md:col-span-3 space-y-6">
                    {selectedCourse ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">
                                    Modules for {courses?.find((c: any) => c.uuid === selectedCourse)?.title}
                                </h2>
                                <button
                                    onClick={() => {
                                        setNewModule({ ...defaultModuleState, order_index: (modules?.length || 0) + 1 });
                                        setIsAddingModule(true);
                                    }}
                                    className="flex items-center gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg"
                                >
                                    <Plus size={20} /> Add Module
                                </button>
                            </div>

                            {modulesLoading ? (
                                <Loader2 className="animate-spin mx-auto" />
                            ) : (
                                <div className="space-y-4">
                                    {modules?.length === 0 && (
                                        <div className="text-center p-12 border-2 border-dashed rounded-xl text-gray-500">
                                            No modules found for this course. Start by adding one!
                                        </div>
                                    )}
                                    {modules?.map((module: any) => (
                                        <div key={module.uuid} className="p-4 bg-white dark:bg-gray-800 border rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                                    {module.content_type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{module.title}</h3>
                                                    <p className="text-sm text-gray-500 capitalize flex items-center gap-2">
                                                        {module.content_type}
                                                        {module.is_mandatory && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Mandatory</span>}
                                                        {module.estimated_duration && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{module.estimated_duration}m</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-gray-400">Index: {module.order_index}</span>
                                                <button
                                                    onClick={() => handleDeleteModule(module.uuid, module.title)}
                                                    disabled={deleteModuleMutation.isPending}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Module"
                                                >
                                                    {deleteModuleMutation.isPending && deleteModuleMutation.variables === module.uuid ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-24 border-2 border-dashed rounded-3xl text-gray-400">
                            <Layout size={48} className="mb-4 opacity-20" />
                            <p>Select a course to manage its modules</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isAddingCourse && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Create New Course</h2>
                        <div className="space-y-4">
                            <input
                                className="w-full p-3 border rounded-lg dark:bg-gray-800"
                                placeholder="Course Title"
                                value={newCourse.title}
                                onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                            />
                            <textarea
                                className="w-full p-3 border rounded-lg dark:bg-gray-800"
                                placeholder="Description"
                                value={newCourse.description}
                                onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setIsAddingCourse(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button
                                    onClick={() => createCourseMutation.mutate(newCourse)}
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAddingModule && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Add Module</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        className="w-full p-3 border rounded-xl dark:bg-gray-800"
                                        value={newModule.title}
                                        onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description (HTML supported)</label>
                                    <textarea
                                        className="w-full p-3 border rounded-xl dark:bg-gray-800 h-24"
                                        value={newModule.description}
                                        onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Content Type</label>
                                    <select
                                        className="w-full p-3 border rounded-xl dark:bg-gray-800"
                                        value={newModule.content_type}
                                        onChange={e => setNewModule({ ...newModule, content_type: e.target.value as any })}
                                    >
                                        <option value="video">Video</option>
                                        <option value="pdf">PDF</option>
                                        <option value="ppt">PPT</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border rounded-xl dark:bg-gray-800"
                                        value={newModule.estimated_duration}
                                        onChange={e => setNewModule({ ...newModule, estimated_duration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Content Source Selection */}
                            {newModule.content_type !== 'quiz' && (
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                    <h3 className="font-medium text-sm">Content Source</h3>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Upload File (PDF/Video/PPT)</label>
                                        <input
                                            type="file"
                                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
                                            onChange={handleFileUpload}
                                        />
                                        {isUploading && <span className="text-xs text-blue-500">Uploading...</span>}
                                        {newModule.file_path && <span className="text-xs text-green-500 block mt-1">File uploaded: {newModule.file_path}</span>}
                                    </div>
                                    <div className="text-center text-xs text-gray-400">- OR -</div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">External URL</label>
                                        <input
                                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                                            placeholder="https://..."
                                            value={newModule.content_url}
                                            onChange={e => setNewModule({ ...newModule, content_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quiz Settings */}
                            {newModule.content_type === 'quiz' && (
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl space-y-3">
                                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Quiz Configuration</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs mb-1">Passing Score (%)</label>
                                            <input type="number" className="w-full p-2 rounded border"
                                                value={newModule.quiz_settings.passing_score}
                                                onChange={e => setNewModule({ ...newModule, quiz_settings: { ...newModule.quiz_settings, passing_score: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1">Time Limit (mins)</label>
                                            <input type="number" className="w-full p-2 rounded border"
                                                value={newModule.quiz_settings.time_limit}
                                                onChange={e => setNewModule({ ...newModule, quiz_settings: { ...newModule.quiz_settings, time_limit: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Assignment Settings */}
                            <div className="border-t pt-4">
                                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newModule.assignment.enabled}
                                        onChange={e => setNewModule({ ...newModule, assignment: { ...newModule.assignment, enabled: e.target.checked } })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="font-medium">Include Post-Module Assignment</span>
                                </label>

                                {newModule.assignment.enabled && (
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs mb-1">Assignment Title</label>
                                            <input
                                                className="w-full p-2 rounded border"
                                                value={newModule.assignment.title}
                                                onChange={e => setNewModule({ ...newModule, assignment: { ...newModule.assignment, title: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1">Instructions</label>
                                            <textarea
                                                className="w-full p-2 rounded border h-20"
                                                value={newModule.assignment.instructions}
                                                onChange={e => setNewModule({ ...newModule, assignment: { ...newModule.assignment, instructions: e.target.value } })}
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={newModule.assignment.requires_approval}
                                                    onChange={e => setNewModule({ ...newModule, assignment: { ...newModule.assignment, requires_approval: e.target.checked } })}
                                                />
                                                Requires Approval
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox" id="mandatory"
                                        checked={newModule.is_mandatory}
                                        onChange={e => setNewModule({ ...newModule, is_mandatory: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <label htmlFor="mandatory" className="text-sm font-medium">Mandatory Module</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Order Index</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border rounded-xl dark:bg-gray-800"
                                        value={newModule.order_index}
                                        onChange={e => setNewModule({ ...newModule, order_index: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t font-medium">
                                <button onClick={() => setIsAddingModule(false)} className="px-5 py-2 text-gray-500">Cancel</button>
                                <button
                                    onClick={handleSaveModule}
                                    disabled={createModuleMutation.isPending || isUploading}
                                    className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-8 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
                                >
                                    {createModuleMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Save Module'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
