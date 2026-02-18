import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building,
    Download,
    Shield,
    Users,
    Cpu,
    UserPlus,
    TrendingUp,
    Loader2,
    Package,
    Search,
    Clock,
    BookOpen,
    Award,
    Info,
    Calendar,
    AlertCircle,
    Edit,
    Plus
} from 'lucide-react';
import {
    getModuleCatalog,
    getModulePreview,
    customInstallModule,
    uninstallModule
} from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Badge } from '../../components/ui/Badge';
import type { SystemModule, InstallCustomization } from '../../types';

// Map icon strings to components
const IconMap: Record<string, any> = {
    Shield,
    Users,
    Cpu,
    UserPlus,
    TrendingUp,
    Building,
    Package
};

export const MarketplacePage = () => {
    const queryClient = useQueryClient();
    const { isDomainAdmin } = useAuth();

    // Modals
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [installingMod, setInstallingMod] = useState<SystemModule | null>(null);

    // Filters & Search
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [levelFilter, setLevelFilter] = useState('All');

    // Debounced search state
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch FULL catalog to have stable filter options and smooth client-side filtering
    const { data: allModules, isLoading } = useQuery({
        queryKey: ['marketplace-catalog-all'],
        queryFn: () => getModuleCatalog(),
    });

    // Client-side filtering for "perfect" instantaneous responsiveness
    const filteredModules = useMemo(() => {
        if (!allModules) return [];
        return allModules.filter(mod => {
            const matchesSearch = !debouncedSearch ||
                mod.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                mod.description.toLowerCase().includes(debouncedSearch.toLowerCase());

            const matchesCategory = categoryFilter === 'All' || mod.category === categoryFilter;
            const matchesLevel = levelFilter === 'All' || mod.level === levelFilter;

            return matchesSearch && matchesCategory && matchesLevel;
        });
    }, [allModules, debouncedSearch, categoryFilter, levelFilter]);

    const { data: previewData, isLoading: isLoadingPreview } = useQuery({
        queryKey: ['module-preview', previewId],
        queryFn: () => getModulePreview(previewId!),
        enabled: !!previewId
    });

    const customInstallMutation = useMutation({
        mutationFn: customInstallModule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace-catalog'] });
            setInstallingMod(null);
            alert('Module installed and configured successfully!');
        }
    });

    const uninstallMutation = useMutation({
        mutationFn: uninstallModule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace-catalog'] });
        }
    });

    const categories = useMemo(() => {
        if (!allModules) return ['All'];
        const cats = Array.from(new Set(allModules.map(m => m.category)));
        return ['All', ...cats];
    }, [allModules]);

    const categoryOptions = useMemo(() =>
        categories.map(c => ({ value: c, label: c })),
        [categories]);

    const levelOptions = [
        { value: 'All', label: 'All Levels' },
        { value: 'Beginner', label: 'Beginner' },
        { value: 'Intermediate', label: 'Intermediate' },
        { value: 'Advanced', label: 'Advanced' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Search */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Elevatria Marketplace
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Professional enterprise modules ready for deployment.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search modules..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <CustomSelect
                            value={categoryFilter}
                            onChange={(val) => setCategoryFilter(val)}
                            options={categoryOptions}
                            className="w-44"
                        />
                        <CustomSelect
                            value={levelFilter}
                            onChange={(val) => setLevelFilter(val)}
                            options={levelOptions}
                            className="w-44"
                        />
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            {filteredModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredModules.map((module) => {
                        const Icon = IconMap[module.icon] || Package;
                        const isInstalled = module.is_installed;

                        return (
                            <div
                                key={module.id}
                                className={cn(
                                    "flex flex-col p-6 bg-white dark:bg-gray-800/40 rounded-3xl border transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1.5",
                                    isInstalled ? "border-blue-100 dark:border-blue-900/30" : "border-gray-100 dark:border-gray-800"
                                )}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn(
                                        "p-4 rounded-2xl transition-all duration-500 group-hover:scale-110",
                                        isInstalled ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-gray-50 dark:bg-gray-800/80 text-gray-400 group-hover:text-blue-500"
                                    )}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={module.level === 'Advanced' ? 'warning' : 'info'} className="font-bold">
                                            {module.level}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                                            <Clock className="w-3 h-3" />
                                            {module.duration}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 decoration-blue-500/30 group-hover:underline underline-offset-4">
                                        {module.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium">
                                        {module.description}
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800/60 rounded-full text-[10px] font-bold text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                                            {module.lessons_count} Lessons
                                        </div>
                                        {module.has_assignment && (
                                            <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full text-[10px] font-bold text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
                                                Practical Job
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl h-10 font-bold border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setPreviewId(module.id)}
                                    >
                                        <Info className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                    {isInstalled ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                            onClick={() => uninstallMutation.mutate(module.id)}
                                            disabled={uninstallMutation.isPending}
                                        >
                                            {uninstallMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 rotate-45" />}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="flex-1 rounded-xl h-10 font-bold shadow-lg shadow-blue-500/20"
                                            onClick={() => setInstallingMod(module)}
                                            disabled={!isDomainAdmin}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Setup
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 bg-gray-50 dark:bg-gray-900/40 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-6">
                        <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No modules matching your search</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs text-center font-medium">
                        Try adjusting your filters or searching for something else.
                    </p>
                    <Button
                        variant="secondary"
                        className="mt-8 px-6 rounded-xl font-bold"
                        onClick={() => {
                            setSearch('');
                            setCategoryFilter('All');
                            setLevelFilter('All');
                        }}
                    >
                        Clear all filters
                    </Button>
                </div>
            )}

            {/* Preview Modal */}
            <Modal
                isOpen={!!previewId}
                onClose={() => setPreviewId(null)}
                title="Module Preview"
                size="lg"
            >
                {isLoadingPreview ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
                ) : previewData ? (
                    <div className="space-y-6">
                        <div className="p-5 bg-blue-50/50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                            <h4 className="font-bold text-lg text-blue-900 dark:text-blue-200 mb-2">{previewData.name}</h4>
                            <p className="text-sm text-blue-800/80 dark:text-blue-300/90 leading-relaxed font-medium">
                                {previewData.full_description}
                            </p>
                        </div>

                        <div>
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" /> Curriculum ({previewData.lessons.length} Lessons)
                            </h5>
                            <div className="space-y-2.5">
                                {previewData.lessons.map((lesson, i) => (
                                    <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50/80 dark:bg-gray-800/80 rounded-xl text-sm group hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 dark:text-gray-500 font-mono text-xs w-4">{i + 1}</span>
                                            <span className="font-semibold text-gray-700 dark:text-gray-200">{lesson.title}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <Badge variant="info" className="capitalize text-[10px] h-5">{lesson.type}</Badge>
                                            <span className="font-medium">{lesson.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(previewData.quiz_preview || previewData.assignment_preview) && (
                            <div className="grid grid-cols-2 gap-4">
                                {previewData.quiz_preview && (
                                    <div className="p-4 border rounded-2xl bg-orange-50/40 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/40">
                                        <p className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Shield className="w-3 h-3" /> Final Quiz
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{previewData.quiz_preview.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{previewData.quiz_preview.questions_count} Questions</p>
                                    </div>
                                )}
                                {previewData.assignment_preview && (
                                    <div className="p-4 border rounded-2xl bg-purple-50/40 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/40">
                                        <p className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Award className="w-3 h-3" /> Practice Job
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{previewData.assignment_preview.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Type: {previewData.assignment_preview.type}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 justify-end border-t">
                            <Button variant="secondary" onClick={() => setPreviewId(null)}>Close</Button>
                            {!allModules?.find((m: SystemModule) => m.id === previewId)?.is_installed && (
                                <Button onClick={() => {
                                    const mod = allModules?.find((m: SystemModule) => m.id === previewId);
                                    if (mod) setInstallingMod(mod);
                                    setPreviewId(null);
                                }}>
                                    Continue to Installation
                                </Button>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* Installation Customization Modal */}
            {installingMod && (
                <InstallModal
                    module={installingMod}
                    onClose={() => setInstallingMod(null)}
                    onInstall={(data) => customInstallMutation.mutate(data)}
                    isSubmitting={customInstallMutation.isPending}
                />
            )}
        </div>
    );
};

// Sub-component for Custom Installation flow
const InstallModal = ({ module, onClose, onInstall, isSubmitting }: {
    module: SystemModule | null,
    onClose: () => void,
    onInstall: (data: InstallCustomization) => void,
    isSubmitting: boolean
}) => {
    const [name, setName] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isMandatory, setIsMandatory] = useState(false);
    const [enableAssignments, setEnableAssignments] = useState(true);

    // Sync name when module changes
    useMemo(() => {
        if (module) setName(module.name);
    }, [module]);

    if (!module) return null;

    return (
        <Modal
            isOpen={!!module}
            onClose={onClose}
            title="Configure Installation"
            description={`Customize how ${module.name} is deployed to your enterprise.`}
        >
            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Edit className="w-4 h-4" /> Enterprise Display Name
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mandatory Compliance 2024"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Deadline Date
                        </label>
                        <Input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                    <div className="space-y-4 pt-8">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={cn(
                                "w-10 h-6 rounded-full transition-all relative border-2 border-gray-200 dark:border-gray-700",
                                isMandatory ? "bg-blue-600 border-blue-600" : "bg-gray-100 dark:bg-gray-800"
                            )} onClick={() => setIsMandatory(!isMandatory)}>
                                <div className={cn(
                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                                    isMandatory ? "translate-x-4" : "translate-x-0"
                                )} />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as Mandatory</span>
                        </label>
                    </div>
                </div>

                {module.has_assignment && (
                    <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/40 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-300 rounded-xl group-hover:scale-110 transition-transform">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Include Hands-on Assignment</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Requires manual grading by your team</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={enableAssignments}
                            onChange={(e) => setEnableAssignments(e.target.checked)}
                            className="w-5 h-5 text-blue-600 dark:bg-gray-800 dark:border-gray-700 rounded-lg cursor-pointer transition-all focus:ring-blue-500"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Installation creates a private clone for your organization.
                    </p>
                    <p className="text-xs text-gray-500">Learner progress will be tracked independently.</p>
                </div>

                <div className="flex gap-3 pt-4 justify-end border-t">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        onClick={() => onInstall({
                            module_id: module.id,
                            custom_name: name,
                            is_mandatory: isMandatory,
                            deadline: deadline || undefined,
                            enable_assignments: enableAssignments
                        })}
                        disabled={isSubmitting}
                        className="gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Confirm Installation
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
