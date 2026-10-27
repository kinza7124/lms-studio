'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, MousePointerClick } from 'lucide-react';
import api from '@/lib/api';
import type { Suggestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge, EmptyState, Field, List, ListItem, LoadingState, PageHeader, Tabs, statusTone } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Suggestions"
        description="Course improvement suggestions submitted by teachers."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <p className="text-sm tabular-nums text-muted-foreground">{suggestions.length} suggestions</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {suggestions.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No suggestions" description="Nothing matches this filter." />
        ) : (
          <List>
            {suggestions.map((suggestion) => (
              <ListItem
                key={suggestion.suggestion_id}
                active={selectedSuggestion?.suggestion_id === suggestion.suggestion_id}
                onClick={() => setSelectedSuggestion(suggestion)}
                className="items-start"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-[15px] font-medium text-foreground">
                      {suggestion.code} - {suggestion.title}
                    </p>
                    <Badge tone={statusTone(suggestion.status)} className="capitalize">{suggestion.status}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{suggestion.teacher_name}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{suggestion.suggestion_text.substring(0, 100)}...</p>
                </div>
              </ListItem>
            ))}
          </List>
        )}

        {selectedSuggestion ? (
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="min-w-0 text-[17px]">
                  {selectedSuggestion.code} - {selectedSuggestion.title}
                </CardTitle>
                <Badge tone={statusTone(selectedSuggestion.status)} className="capitalize">{selectedSuggestion.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSuggestion.teacher_name} · {selectedSuggestion.teacher_email}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{selectedSuggestion.suggestion_text}</p>
              {selectedSuggestion.admin_response && (
                <div className="rounded-xl bg-secondary/60 p-4">
                  <p className="text-xs text-muted-foreground">Admin response</p>
                  <p className="mt-1 text-sm text-foreground">{selectedSuggestion.admin_response}</p>
                </div>
              )}
              {selectedSuggestion.status === 'pending' && (
                <div className="space-y-4">
                  <Field label="Response" htmlFor="adminResponse" hint="Optional, shared with the teacher.">
                    <Textarea
                      id="adminResponse"
                      placeholder="Write a response"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                    />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-red-50"
                      onClick={() => handleReject(selectedSuggestion.suggestion_id)}
                    >
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(selectedSuggestion.suggestion_id)}>
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          suggestions.length > 0 && (
            <EmptyState
              icon={MousePointerClick}
              title="Select a suggestion"
              description="Choose a suggestion to read it and respond."
              className="hidden lg:flex"
            />
          )
        )}
      </div>
    </div>
  );
}
