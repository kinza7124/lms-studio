'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Suggestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  useAuthGuard();

  useEffect(() => {
    loadSuggestions();
  }, [filter]);

  const loadSuggestions = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get<Suggestion[]>('/suggestions', { params });
      setSuggestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/suggestions/${id}/approve`, { adminResponse });
      setSelectedSuggestion(null);
      setAdminResponse('');
      loadSuggestions();
    } catch (error) {
      console.error(error);
      alert('Failed to approve suggestion');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/suggestions/${id}/reject`, { adminResponse });
      setSelectedSuggestion(null);
      setAdminResponse('');
      loadSuggestions();
    } catch (error) {
      console.error(error);
      alert('Failed to reject suggestion');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Suggestions</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Suggestions ({suggestions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.suggestion_id}
                  className={`cursor-pointer rounded-lg border p-4 ${
                    selectedSuggestion?.suggestion_id === suggestion.suggestion_id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10'
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <p className="font-medium text-white">
                    {suggestion.code} - {suggestion.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    By: {suggestion.teacher_name} | Status: {suggestion.status}
                  </p>
                  <p className="mt-2 text-sm text-white">{suggestion.suggestion_text.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedSuggestion && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Suggestion Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-white">
                  {selectedSuggestion.code} - {selectedSuggestion.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  By: {selectedSuggestion.teacher_name} ({selectedSuggestion.teacher_email})
                </p>
                <p className="mt-2 text-white">{selectedSuggestion.suggestion_text}</p>
              </div>
              {selectedSuggestion.admin_response && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admin Response:</p>
                  <p className="text-white">{selectedSuggestion.admin_response}</p>
                </div>
              )}
              {selectedSuggestion.status === 'pending' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Admin response (optional)"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(selectedSuggestion.suggestion_id)}>
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedSuggestion.suggestion_id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

