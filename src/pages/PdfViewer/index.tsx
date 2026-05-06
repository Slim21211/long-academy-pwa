import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import styles from './PdfViewer.module.scss';

// Worker через CDN — версия совпадает с установленным pdfjs-dist
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

function ChevronLeft() {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
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
      <path d="M9 18l6-6-6-6" />
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

// ─── Component ────────────────────────────────────────────────────────────────
const SCALE_MIN = 0.5;
const SCALE_MAX = 3.0;
const SCALE_STEP = 0.25;
const SCALE_DEFAULT = 1.0;

export default function PdfViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const url = searchParams.get('url') ?? '';
  const name = searchParams.get('name') ?? 'Документ';

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(SCALE_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(320);

  // Отслеживаем ширину контейнера для адаптивного рендера страницы
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
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

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () =>
    setScale((s) => Math.min(SCALE_MAX, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () =>
    setScale((s) => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));
  const resetZoom = () => setScale(SCALE_DEFAULT);

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

  // Ширина страницы = ширина контейнера × масштаб
  const pageWidth = Math.round(containerWidth * scale);

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

      {/* ── PDF canvas ── */}
      <div className={styles.canvasWrap} ref={containerRef}>
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
            <div
              className={styles.pageWrap}
              style={{ width: pageWidth, maxWidth: '100%' }}
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                loading={null}
              />
            </div>
          </Document>
        )}
      </div>

      {/* ── Bottom bar ── */}
      {!isLoading && !error && numPages > 0 && (
        <nav className={styles.bottomBar} aria-label="Навигация по документу">
          {/* Листание страниц */}
          <div className={styles.navGroup}>
            <button
              className={styles.navBtn}
              onClick={goToPrev}
              disabled={currentPage <= 1}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft />
            </button>
            <span className={styles.pageInfo}>
              {currentPage} / {numPages}
            </span>
            <button
              className={styles.navBtn}
              onClick={goToNext}
              disabled={currentPage >= numPages}
              aria-label="Следующая страница"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Масштаб */}
          <div className={styles.zoomGroup}>
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
              aria-label="Сбросить масштаб"
              title="Сбросить"
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
          </div>
        </nav>
      )}
    </div>
  );
}
