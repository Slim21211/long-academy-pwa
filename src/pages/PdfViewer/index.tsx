import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
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
    if (!res.ok) throw new Error();
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

const PADDING = 16;

export default function PdfViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const url = searchParams.get('url') ?? '';
  const name = searchParams.get('name') ?? 'Документ';

  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [displayScale, setDisplayScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
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

  // PDF рендерится один раз при базовой ширине контейнера.
  // Зум — CSS transform через TransformWrapper, без перерисовки канваса.
  const pageWidth = Math.max(containerWidth - PADDING * 2, 100);

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

      {/* ── Zoom + pan + scroll ── */}
      <div className={styles.canvasWrap} ref={containerRef}>
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.3}
          maxScale={5}
          // Плавная инерция после жеста
          velocityAnimation={{ sensitivityTouch: 1, animationTime: 400 }}
          // Двойной тап — сброс зума
          doubleClick={{ mode: 'reset' }}
          // Колёсико мыши на десктопе
          wheel={{ step: 0.08 }}
          // Pinch чувствительность
          pinch={{ step: 5 }}
          // Не ограничиваем границами — пользователь может листать документ
          limitToBounds={false}
          // Обновляем отображаемый процент в нижней панели
          onTransform={(ref) => setDisplayScale(ref.state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `${PADDING}px`,
              gap: '0',
              // Минимальная ширина = вьюпорт, чтобы узкий контент был по центру
              minWidth: `${containerWidth}px`,
            }}
          >
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
                    {i < numPages - 1 && <div className={styles.pageDivider} />}
                  </div>
                ))}
              </Document>
            )}
          </TransformComponent>
        </TransformWrapper>

        {/* Loader и error — поверх TransformWrapper */}
        {isLoading && (
          <div className={styles.overlay}>
            <div className={styles.spinner} />
            <p>Загрузка документа…</p>
          </div>
        )}
        {error && (
          <div className={styles.overlay}>
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
      </div>

      {/* ── Zoom bar ── */}
      {!isLoading && !error && numPages > 0 && (
        <nav className={styles.bottomBar} aria-label="Масштаб">
          <button
            className={styles.navBtn}
            onClick={() => transformRef.current?.zoomOut(0.25)}
            aria-label="Уменьшить"
          >
            −
          </button>
          <button
            className={styles.zoomLabel}
            onClick={() => transformRef.current?.resetTransform()}
            aria-label="Сбросить масштаб"
            title="Сбросить"
          >
            {Math.round(displayScale * 100)}%
          </button>
          <button
            className={styles.navBtn}
            onClick={() => transformRef.current?.zoomIn(0.25)}
            aria-label="Увеличить"
          >
            +
          </button>
        </nav>
      )}
    </div>
  );
}
