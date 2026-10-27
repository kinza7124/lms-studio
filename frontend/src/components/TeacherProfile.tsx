'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Field, LoadingState } from '@/components/ui/page';

export function TeacherProfile() {
    const [profile, setProfile] = useState({ resume: '', department: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/teachers/profile');
                setProfile({
                    resume: data.teacher.resume || '',
                    department: data.teacher.department || '',
                });
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/teachers/profile', profile);
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState label="Loading profile…" className="py-10" />;

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 p-6">
                    <Field label="Department" htmlFor="department">
                        <Input
                            id="department"
                            value={profile.department}
                            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        />
                    </Field>
                    <Field label="Resume / bio" htmlFor="resume">
                        <Textarea
                            id="resume"
                            value={profile.resume}
                            onChange={(e) => setProfile({ ...profile, resume: e.target.value })}
                            className="min-h-[120px]"
                        />
                    </Field>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save profile'}
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    );
}
