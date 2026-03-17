import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Save,
  RefreshCw,
  Cpu,
  Database,
  Type,
  ImageIcon,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface AISettings {
  ai_api_key: string;
  ai_base_url: string;
  model_mappings: Record<string, string>;
}

export function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    ai_api_key: '',
    ai_base_url: '',
    model_mappings: {
      chat: 'deepseek-ai/DeepSeek-V3.1',
      transcribe: 'openai/whisper-large-v3',
      vision: 'Qwen/Qwen3-VL-235B',
      embeddings: 'Qwen3-Embedding-8B',
      infographic: 'deepseek-ai/DeepSeek-V3.1',
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/ai-settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch AI settings:', error);
      setStatus({ type: 'error', message: 'Failed to load settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatus(null);
    try {
      // First save current values to backend so it tests with latest inputs
      await api.put('/admin/ai-settings', settings);
      const response = await api.post('/admin/ai-settings/test');
      if (response.data.success) {
        setStatus({ type: 'success', message: response.data.message });
      } else {
        setStatus({ type: 'error', message: response.data.message });
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Connection test failed. Verify your key and URL.' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await api.put('/admin/ai-settings', settings);
      setStatus({ type: 'success', message: 'AI Integration settings updated successfully!' });
      
      // Premium experience: Confetti on successful save!
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#4f46e5', '#3b82f6']
      });
      
    } catch (error) {
      console.error('Failed to update AI settings:', error);
      setStatus({ type: 'error', message: 'Failed to save settings. Check your connection.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModelChange = (service: string, model: string) => {
    setSettings((prev) => ({
      ...prev,
      model_mappings: {
        ...prev.model_mappings,
        [service]: model,
      },
    }));
  };

  if (isLoading) {
    return (
      <PageLayout title="AI Integration" subtitle="Configure AI providers and models">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="AI Integration" 
      subtitle="Centralized management for AI providers, API keys, and model mappings"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Notification */}
        {status && (
          <div className={cn(
            "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300",
            status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50" : 
                                      "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
          )}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium text-sm">{status.message}</p>
          </div>
        )}

        {/* API Credentials Section */}
        <section className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Credentials</h2>
            </div>
            
            <button
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]",
                "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
              )}
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AI API Base URL</label>
              <input
                type="text"
                placeholder="e.g. https://api.openai.com/v1 or LiteLLM URL"
                value={settings.ai_base_url || ''}
                onChange={(e) => setSettings({ ...settings, ai_base_url: e.target.value })}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">Leave empty if using environment variable defaults.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={settings.ai_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                  placeholder="Enter your AI provider API key"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Model Mapping Section */}
        <section className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Assignment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ModelInputField
              label="Knowledge Chat"
              description="Used for document Q&A and general queries"
              icon={Type}
              value={settings.model_mappings.chat}
              onChange={(val) => handleModelChange('chat', val)}
            />
            <ModelInputField
              label="Audio Transcription"
              description="Used for processing voice recordings and podcasts"
              icon={RefreshCw}
              value={settings.model_mappings.transcribe}
              onChange={(val) => handleModelChange('transcribe', val)}
            />
            <ModelInputField
              label="Visual Analysis (OCR)"
              description="Used for explaining images and diagrams"
              icon={ImageIcon}
              value={settings.model_mappings.vision}
              onChange={(val) => handleModelChange('vision', val)}
            />
            <ModelInputField
              label="Infographic Generation"
              description="Powering the premium infographic visual engine"
              icon={Zap}
              value={settings.model_mappings.infographic}
              onChange={(val) => handleModelChange('infographic', val)}
            />
             <ModelInputField
              label="Embeddings Engine"
              description="Critical for document search (RAG) performance"
              icon={Database}
              value={settings.model_mappings.embeddings}
              onChange={(val) => handleModelChange('embeddings', val)}
            />
          </div>
        </section>

        {/* Save Actions */}
        <div className="flex items-center justify-end gap-4 py-4">
          <button
            onClick={fetchSettings}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Updating...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

function ModelInputField({ 
  label, 
  description, 
  icon: Icon, 
  value, 
  onChange 
}: { 
  label: string; 
  description: string; 
  icon: any; 
  value: string; 
  onChange: (val: string) => void; 
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <label className="text-sm font-bold text-gray-900 dark:text-white">{label}</label>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all outline-none text-sm font-medium"
      />
      <p className="text-[11px] text-gray-500 leading-tight">{description}</p>
    </div>
  );
}
