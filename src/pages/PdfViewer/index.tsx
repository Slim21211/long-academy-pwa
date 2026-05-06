import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import styles from './PdfViewer.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ─── Icons ────────────────────────────────────────────────────────────────────
function ArrowLeft() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── Download ─────────────────────────────────────────────────────────────────
async function downloadPdf(url: string, name: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    window.open(url, '_blank');
  }
}

const SCALE_MIN = 0.5;
const SCALE_MAX = 3.0;
const SCALE_STEP = 0.25;
const SCALE_DEFAULT = 1.0;
const PADDING = 16; // px, с каждой стороны

export default function PdfViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const url = searchParams.get('url') ?? '';
  const name = searchParams.get('name') ?? 'Документ';

  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(SCALE_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setContainerWidth(containerRef.current.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setError(false);
    },
    []
  );

  const onDocumentLoadError = useCallback(() => {
    setIsLoading(false);
    setError(true);
  }, []);

  const zoomIn = () =>
    setScale((s) => Math.min(SCALE_MAX, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () =>
    setScale((s) => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));
  const resetZoom = () => setScale(SCALE_DEFAULT);

  // Базовая ширина = контейнер минус паддинги.
  // pageWidth — то, что получит <Page width={...} />.
  const baseWidth = Math.max(containerWidth - PADDING * 2, 100);
  const pageWidth = Math.round(baseWidth * scale);

  if (!url) {
    return (
      <div className={styles.errorPage}>
        <p>Файл не найден</p>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <button
          className={styles.headerBtn}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          <ArrowLeft />
        </button>
        <h1 className={styles.headerTitle}>{name}</h1>
        <button
          className={styles.headerBtn}
          onClick={() => void downloadPdf(url, name)}
          aria-label="Скачать"
        >
          <DownloadIcon />
        </button>
      </header>

      {/* ── Scroll container ── */}
      <div className={styles.canvasWrap} ref={containerRef}>
        {/*
          canvasInner — ключевой слой для корректного зума:
          - min-width: 100%  → при узких страницах заполняет вьюпорт,
                               align-items: center центрирует их
          - width: max-content → при широких страницах расширяется под контент,
                               canvasWrap получает горизонтальный скролл,
                               левый край всегда доступен (нет negative overflow)
        */}
        <div className={styles.canvasInner}>
          {isLoading && (
            <div className={styles.loader}>
              <div className={styles.spinner} />
              <p>Загрузка документа…</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <p className={styles.errorIcon}>⚠️</p>
              <p className={styles.errorText}>Не удалось загрузить документ</p>
              <button
                onClick={() => {
                  setError(false);
                  setIsLoading(true);
                }}
                className={styles.retryBtn}
              >
                Повторить
              </button>
            </div>
          )}

          {!error && (
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i}
                  className={styles.pageWrap}
                  style={{ width: pageWidth }}
                >
                  <Page
                    pageNumber={i + 1}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    loading={null}
                  />
                  {/* Тонкий разделитель между страницами вместо белого провала */}
                  {i < numPages - 1 && <div className={styles.pageDivider} />}
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>

      {/* ── Zoom bar ── */}
      {!isLoading && !error && numPages > 0 && (
        <nav className={styles.bottomBar} aria-label="Масштаб">
          <button
            className={styles.navBtn}
            onClick={zoomOut}
            disabled={scale <= SCALE_MIN}
            aria-label="Уменьшить"
          >
            −
          </button>
          <button
            className={styles.zoomLabel}
            onClick={resetZoom}
            title="Сбросить масштаб"
            aria-label="Сбросить масштаб"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            className={styles.navBtn}
            onClick={zoomIn}
            disabled={scale >= SCALE_MAX}
            aria-label="Увеличить"
          >
            +
          </button>
        </nav>
      )}
    </div>
  );
}
