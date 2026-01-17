'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

    if (loading) return <div>Loading profile...</div>;

    return (
        <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
                <CardTitle>Teacher Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            value={profile.department}
                            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="resume">Resume / Bio</Label>
                        <Textarea
                            id="resume"
                            value={profile.resume}
                            onChange={(e) => setProfile({ ...profile, resume: e.target.value })}
                            className="bg-white/10 border-white/20 text-white min-h-[100px]"
                        />
                    </div>
                    <Button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
