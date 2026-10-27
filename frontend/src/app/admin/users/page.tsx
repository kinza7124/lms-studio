'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, LoadingState, PageHeader, Select, Tabs, statusTone } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const params = filter !== 'all' ? { role: filter } : {};
        const { data } = await api.get<User[]>('/admin/users', { params });
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [filter]);

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u.user_id !== userId));
    } catch (error) {
      console.error(error);
      alert('Failed to delete user');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers(users.map((u) => (u.user_id === userId ? { ...u, role: newRole as any } : u)));
    } catch (error) {
      console.error(error);
      alert('Failed to update role');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Create, update and remove accounts, and assign roles across your institution."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { value: 'all', label: 'All' },
            { value: 'student', label: 'Students' },
            { value: 'teacher', label: 'Teachers' },
            { value: 'admin', label: 'Admins' },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <p className="text-sm tabular-nums text-muted-foreground">{users.length} users</p>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different role filter." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th className="hidden md:table-cell">Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={user.full_name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={user.role === 'admin' ? 'primary' : statusTone(user.role)} className="capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="hidden whitespace-nowrap tabular-nums text-muted-foreground md:table-cell">
                    {new Date(user.created_at || '').toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        className="h-9 w-32 text-sm"
                        aria-label="Change role"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.user_id)}
                        className="text-destructive hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
