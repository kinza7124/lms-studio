'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/page';

interface AssignmentSubmissionFormProps {
  assignmentId: number;
  onSuccess: () => void;
}

export function AssignmentSubmissionForm({ assignmentId, onSuccess }: AssignmentSubmissionFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 && !submissionText.trim()) {
      alert('Please provide either file uploads or text submission');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId.toString());
      if (submissionText) {
        formData.append('submissionText', submissionText);
      }
      files.forEach((file) => {
        formData.append('files', file);
      });

      await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFiles([]);
      setSubmissionText('');
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-5">
      <Field label="Text submission (optional)" htmlFor="submissionText">
        <Textarea
          id="submissionText"
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          placeholder="Enter your submission text here…"
          rows={4}
        />
      </Field>
      <Field
        label="File uploads (optional)"
        htmlFor="files"
        hint={files.length > 0 ? `${files.length} file(s) selected` : undefined}
      >
        <Input
          id="files"
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading || (files.length === 0 && !submissionText.trim())}>
          {loading ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
