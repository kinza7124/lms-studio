'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddAssignmentProps {
    courseId: number;
    onSuccess?: () => void;
}

export function AddAssignment({ courseId, onSuccess }: AddAssignmentProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/assignments', {
                courseId,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            });
            setTitle('');
            setDescription('');
            setDueDate('');
            alert('Assignment added successfully');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to add assignment', error);
            alert('Failed to add assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-white/10 bg-white/5 text-white mt-4">
            <CardHeader>
                <CardTitle className="text-lg">Add Assignment</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-white/10 border-white/20 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        {loading ? 'Adding...' : 'Add Assignment'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
