import { FileText, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lecture } from '@/types';

const buildAssetUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase;
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

type LecturePlayerProps = {
  lecture: Lecture;
};

export function LecturePlayer({ lecture }: LecturePlayerProps) {
  const pdfUrl = buildAssetUrl(lecture.pdf_url);

  return (
    <section className="space-y-5">
      {lecture.video_url ? (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            src={lecture.video_url}
            title={lecture.title}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-secondary text-sm text-muted-foreground">
          <VideoOff className="h-5 w-5" strokeWidth={1.75} />
          No video provided.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-1">Lecture {lecture.lecture_number ?? '-'}</p>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{lecture.title}</h3>
        </div>
        {lecture.pdf_url ? (
          <Button asChild variant="outline" size="sm" className="shrink-0 self-start">
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
              View PDF
            </a>
          </Button>
        ) : (
          <p className="shrink-0 text-xs text-muted-foreground">No PDF uploaded.</p>
        )}
      </div>

      {lecture.content && (
        <div className="rounded-xl bg-secondary/60 p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{lecture.content}</pre>
        </div>
      )}
    </section>
  );
}
