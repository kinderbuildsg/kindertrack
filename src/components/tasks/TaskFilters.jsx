import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

export default function TaskFilters({ filters, setFilters }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleReset = () => {
    setFilters({
      assigned_to: '',
      completed: 'all',
      sortBy: 'due_date'
    });
  };

  const hasActiveFilters = filters.assigned_to || filters.completed !== 'all';

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters:</span>
      </div>

      <Select value={filters.assigned_to} onValueChange={(value) => 
        setFilters(prev => ({ ...prev, assigned_to: value }))
      }>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Assigned to..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All Users</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.email}>
              {user.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.completed} onValueChange={(value) =>
        setFilters(prev => ({ ...prev, completed: value }))
      }>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tasks</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sortBy} onValueChange={(value) =>
        setFilters(prev => ({ ...prev, sortBy: value }))
      }>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="due_date">Due Date</SelectItem>
          <SelectItem value="created">Recently Created</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}