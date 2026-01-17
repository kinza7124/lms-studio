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
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Lecture {lecture.lecture_number ?? '-'}
        </p>
        <h3 className="text-2xl font-semibold">{lecture.title}</h3>
      </div>
      {lecture.video_url ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <iframe
            src={lecture.video_url}
            title={lecture.title}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-muted-foreground">No video provided.</p>
      )}
      {lecture.content && (
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="whitespace-pre-wrap text-sm">{lecture.content}</pre>
        </div>
      )}
      {lecture.pdf_url ? (
        <Button asChild variant="outline">
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            View PDF
          </a>
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">No PDF uploaded.</p>
      )}
    </section>
  );
}

