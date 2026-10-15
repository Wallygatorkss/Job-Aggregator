import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

try {
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
} catch {
}

interface Props {
  blobUrl: string | null;
  className?: string;
  alt?: string;
  children?: ReactNode;
}

export default function PdfPreview({ blobUrl, className, alt = 'PDF preview' }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let clearFrame: number | null = null;
    if (!blobUrl) {
      clearFrame = requestAnimationFrame(() => {
        setImgSrc(null);
        setError(null);
      });
      return () => {
        cancelled = true;
        if (clearFrame) cancelAnimationFrame(clearFrame);
      };
    }


    const load = async () => {
      try {
  let loadingTask: unknown;
        if (blobUrl.startsWith('blob:')) {
          const resp = await fetch(blobUrl);
          const ab = await resp.arrayBuffer();
          loadingTask = getDocument({ data: new Uint8Array(ab) });
        } else {
          loadingTask = getDocument(blobUrl);
        }
  const pdf = await (loadingTask as { promise: Promise<unknown> }).promise;
  const page = await (pdf as { getPage(pageNumber: number): Promise<any> }).getPage(1);

        const viewportUnscaled = page.getViewport({ scale: 1 });

        const computeAndRender = async (width: number) => {
          const desiredWidth = Math.max(1, Math.floor(width * (window.devicePixelRatio || 1)));
          const scale = desiredWidth / viewportUnscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const renderContext = {
            canvasContext: context as CanvasRenderingContext2D,
            viewport,
          };

          await page.render(renderContext).promise;

          if (cancelled) return;
          const dataUrl = canvas.toDataURL('image/png');
          requestAnimationFrame(() => {
            if (!cancelled) setImgSrc(dataUrl);
          });
        };

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width) await computeAndRender(rect.width);
        }

        const handleResize = () => {
          if (!containerRef.current) return;
          const w = containerRef.current.getBoundingClientRect().width;
          computeAndRender(w).catch(() => {});
        };

        window.addEventListener('resize', handleResize);

        const roCallback = (entries: ResizeObserverEntry[]) => {
          for (const entry of entries) {
            const w = Math.floor(entry.contentRect.width);
            computeAndRender(w).catch(() => {});
          }
        };


        const ro2 = new ResizeObserver(roCallback);
        if (containerRef.current) ro2.observe(containerRef.current);

        return () => {
          cancelled = true;
          window.removeEventListener('resize', handleResize);
          ro2.disconnect();
          requestAnimationFrame(() => {
            setImgSrc(null);
          });
        };
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Impossible de rendre le PDF.');
      }
    };

    load();

    return () => {
      setImgSrc(null);
    };
  }, [blobUrl]);

  if (!blobUrl) return <div ref={containerRef} className={className} />;

  return (
    <div ref={containerRef} className={className}>
      {error && (
        <div className="p-4 text-sm text-red-400">{error}</div>
      )}
      {imgSrc ? (
        <img src={imgSrc} alt={alt} className="w-full h-auto select-none" />
      ) : (
        <div className="flex w-full items-center justify-center bg-white/5 text-white/50" style={{ minHeight: 400 }}>Chargement...</div>
      )}
    </div>
  );
}
