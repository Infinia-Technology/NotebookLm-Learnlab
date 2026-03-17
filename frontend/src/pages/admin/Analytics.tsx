import { useQuery } from '@tanstack/react-query';
import { getAdminAnalytics } from '../../lib/api';
import {
    Users,
    BookOpen,
    CheckCircle,
    TrendingUp,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

// Mock data removed in favor of real API data

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const AnalyticsPage = () => {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: getAdminAnalytics
    });

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    // Calculate aggregated stats
    const avgCompletion = analytics?.total_courses > 0
        ? Math.round(analytics?.by_course?.reduce((acc: any, curr: any) => acc + curr.avg_completion, 0) / analytics.total_courses)
        : 0;

    const stats = [
        { label: 'Total Courses', value: analytics?.total_courses || 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Active Learners', value: analytics?.total_active_learners || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Avg. Completion', value: `${avgCompletion}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Modules Completed', value: analytics?.total_completions || 0, icon: CheckCircle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Insights</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time performance metrics across your organization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Last 7 Days</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "bg-white/80 dark:bg-gray-800/60 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-gray-700/50 shadow-sm transition-all card-premium-hover",
                            `hover-glow-${stat.color.split('-')[1]}`
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            {(stat as any).change && (
                                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${(stat as any).isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {(stat as any).change}
                                    {(stat as any).isPositive ? <ArrowUpRight size={14} className="ml-1" /> : <ArrowDownRight size={14} className="ml-1" />}
                                </div>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Trend Area Chart */}
                <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-gray-700/50 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Learning Activity Trends</h2>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.activity_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="active" name="Active Learners" stroke="#8884d8" fillOpacity={1} fill="url(#colorActive)" strokeWidth={2} />
                                <Area type="monotone" dataKey="completions" name="Module Completions" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCompletions)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Content Distribution Pie Chart */}
                <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-gray-700/50 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Content Consumption</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.content_distribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(analytics?.content_distribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Course Performance Bar Chart & Table */}
            <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-gray-700/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Course Engagement & Completion</h2>

                {/* Horizontal Bar Chart for Course Completion */}
                <div className="h-[250px] w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={analytics?.by_course || []}
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis type="category" dataKey="course_title" width={150} tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 shadow-sm rounded text-xs">
                                                <p className="font-semibold">{payload[0].payload.course_title}</p>
                                                <p>Avg Completion: {Math.round(payload[0].value as number)}%</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="avg_completion" name="Avg. Completion" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Course Name</th>
                                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Enrollments</th>
                                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Avg. Completion</th>
                                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                            {analytics?.by_course?.map((course: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/40 dark:hover:bg-gray-700/30 transition-all">
                                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{course.course_title}</td>
                                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{course.enrollment_count} learners</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden min-w-[80px]">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                                    style={{ width: `${course.avg_completion}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(course.avg_completion)}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${course.avg_completion > 70
                                            ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                            : course.avg_completion > 30
                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                            }`}>
                                            {course.avg_completion > 70 ? 'High Performing' : course.avg_completion > 30 ? 'Active' : 'Low Activity'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold text-sm transition-colors">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
