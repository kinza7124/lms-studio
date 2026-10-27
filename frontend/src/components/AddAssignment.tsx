'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Field } from '@/components/ui/page';

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
        <Card className="mt-4">
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 p-6">
                    <h3 className="text-[17px] font-semibold text-foreground">Add assignment</h3>
                    <Field label="Title" htmlFor="title">
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Description" htmlFor="description">
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </Field>
                    <Field label="Due date" htmlFor="dueDate" hint="Optional.">
                        <Input
                            id="dueDate"
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </Field>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Adding…' : 'Add assignment'}
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    );
}
