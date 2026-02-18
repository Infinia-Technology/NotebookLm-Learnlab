import { useState, useEffect } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { Building, Plus, Search, Shield, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';

// Available modules (hardcoded based on Modules.tsx)
const AVAILABLE_MODULES = [
    { id: 'enterprise-ai', title: 'Enterprise AI Strategy' },
    { id: 'advanced-python', title: 'Advanced Python Patterns' },
    { id: 'rust-systems', title: 'Rust Systems Programming' },
    { id: 'microservices', title: 'Microservices Architecture' },
    { id: 'marketing-analytics', title: 'Marketing Analytics' },
    { id: 'cloud-security', title: 'Zero-Trust Cloud Security' },
];

interface Domain {
    uuid: string;
    domain: string;
    name?: string; // Optional
    enabled_modules: string[];
    is_active: boolean;
    created_at: string;
}

export function DomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            const res = await api.get('/admin/domains');
            setDomains(res.data);
        } catch (error) {
            console.error('Failed to load domains', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const domainData = {
            domain: formData.get('domain'),
            name: formData.get('name'),
            enabled_modules: [] // Default to none
        };

        try {
            await api.post('/admin/domains', domainData);
            alert('Domain created successfully');
            setShowCreateModal(false);
            fetchDomains();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to create domain');
        }
    };

    const toggleModule = async (domain: Domain, moduleId: string) => {
        const isEnabled = domain.enabled_modules.includes(moduleId);
        const newModules = isEnabled
            ? domain.enabled_modules.filter(id => id !== moduleId)
            : [...domain.enabled_modules, moduleId];

        try {
            // Optimistic update
            const updatedDomain = { ...domain, enabled_modules: newModules };
            setDomains(domains.map(d => d.uuid === domain.uuid ? updatedDomain : d));

            await api.put(`/admin/domains/${domain.uuid}/modules`, {
                enabled_modules: newModules
            });
        } catch (error) {
            alert('Failed to update modules');
            fetchDomains(); // Revert
        }
    };

    const filteredDomains = domains.filter(d =>
        d.domain.toLowerCase().includes(search.toLowerCase()) ||
        d.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageLayout
            title="Domain Management"
            subtitle="Manage enterprise tenants and module access"
            icon={<Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            actions={
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Domain
                </Button>
            }
        >
            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search domains..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 max-w-md"
                />
            </div>

            {/* Domains List */}
            <div className="space-y-4">
                {filteredDomains.map((domain) => (
                    <div
                        key={domain.uuid}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {domain.name || domain.domain}
                                    <span className="text-xs font-normal px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        {domain.domain}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Created: {new Date(domain.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Modules Grid */}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Enabled Modules
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {AVAILABLE_MODULES.map((module) => {
                                    const isEnabled = domain.enabled_modules.includes(module.id);
                                    return (
                                        <div
                                            key={module.id}
                                            onClick={() => toggleModule(domain, module.id)}
                                            className={`
                                                cursor-pointer flex items-center justify-between p-3 rounded-lg border text-sm transition-all
                                                ${isEnabled
                                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700 opacity-60 hover:opacity-100'}
                                            `}
                                        >
                                            <span className={`font-medium ${isEnabled ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {module.title}
                                            </span>
                                            {isEnabled ? (
                                                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            ) : (
                                                <X className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredDomains.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        No domains found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Domain</h2>
                        <form onSubmit={handleCreateDomain} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Domain (e.g., example.com)</label>
                                <Input name="domain" placeholder="apeiro.digital" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Display Name</label>
                                <Input name="name" placeholder="Apeiro Digital Inc." />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Create Domain
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
