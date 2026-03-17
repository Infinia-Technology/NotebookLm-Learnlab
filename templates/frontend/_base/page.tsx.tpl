/**
 * {{APP_NAME}} Page
 *
 * {{DESCRIPTION}}
 *
 * Generated: {{GENERATED_AT}}
 * Template: {{TEMPLATE_TYPE}}
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { api } from '../../../lib/api';
import type {
  {{MODEL_NAME}},
  {{MODEL_NAME}}Create,
  {{MODEL_NAME}}Update,
  {{MODEL_NAME}}ListResponse,
} from '../../../modules/{{SLUG_KEBAB}}/types';

export default function {{MODEL_NAME}}Page() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{{MODEL_NAME}} | null>(null);
  const [formData, setFormData] = useState<{{MODEL_NAME}}Create>({
    name: '',
    description: '',
    status: 'active',
  });

  // Fetch items
  const { data, isLoading, error } = useQuery<{{MODEL_NAME}}ListResponse>({
    queryKey: ['{{SLUG_KEBAB}}', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await api.get(`/{{SLUG_KEBAB}}?${params}`);
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {{MODEL_NAME}}Create) => {
      const response = await api.post('/{{SLUG_KEBAB}}', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{{SLUG_KEBAB}}'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: {{MODEL_NAME}}Update }) => {
      const response = await api.patch(`/{{SLUG_KEBAB}}/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{{SLUG_KEBAB}}'] });
      setEditingItem(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/{{SLUG_KEBAB}}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{{SLUG_KEBAB}}'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: {{MODEL_NAME}}) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      status: item.status,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{{APP_NAME}}</h1>
          <p className="text-gray-600 mt-1">{{DESCRIPTION}}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => (
          <Card key={item.uuid} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(item)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.uuid)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {data?.items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No items found. Create your first one!
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingItem}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingItem(null);
          resetForm();
        }}
        title={editingItem ? 'Edit Item' : 'Create New Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={255}
          />
          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            maxLength={2000}
          />
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'inactive' | 'archived',
                })
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--btn-primary-bg)]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingItem
                ? 'Update'
                : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
