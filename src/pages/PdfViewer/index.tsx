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

// ─── IndexedDB кэш ────────────────────────────────────────────────────────────
// Используем IndexedDB вместо Cache API: он не знает об HTTP-заголовках
// (Vary, Cache-Control и т.д.) и работает одинаково на всех платформах iOS.
// Cache API + Vary: Accept-Encoding от GitHub = cache.match возвращает null
// даже когда файл физически есть — это известный баг/ограничение WebKit.
const IDB_NAME = 'pdf-store';
const IDB_STORE = 'pdfs';
const IDB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(url: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(url);
      req.onsuccess = () =>
        resolve((req.result as ArrayBuffer | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbPut(url: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const req = db
        .transaction(IDB_STORE, 'readwrite')
        .objectStore(IDB_STORE)
        .put(buffer, url);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* не критично */
  }
}

export async function idbKeys(): Promise<string[]> {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ─── Fetch с кэшированием ─────────────────────────────────────────────────────
async function fetchPdfWithCache(url: string): Promise<ArrayBuffer> {
  // 1. Проверяем IndexedDB
  const cached = await idbGet(url);
  if (cached) return cached;

  // 2. Загружаем из сети
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();

  // 3. Сохраняем в IndexedDB (не ждём — не блокируем рендер)
  void idbPut(url, buffer.slice(0));

  return buffer;
}

// ─── Constants ────────────────────────────────────────────────────────────────
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
  const [pdfData, setPdfData] = useState<{ data: ArrayBuffer } | null>(null);
  // retryCount — счётчик для принудительного перезапуска useEffect при retry
  const [retryCount, setRetryCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    if (!url) return;
    setIsLoading(true);
    setError(false);
    setPdfData(null);
    setNumPages(0);

    fetchPdfWithCache(url)
      .then((buffer) => setPdfData({ data: buffer }))
      .catch(() => {
        setIsLoading(false);
        setError(true);
      });
    // retryCount в зависимостях → кнопка "Повторить" перезапускает fetch
  }, [url, retryCount]);

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

  const handleRetry = () => {
    setError(false);
    setIsLoading(true);
    setPdfData(null);
    setRetryCount((c) => c + 1);
  };

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

      <div className={styles.canvasWrap} ref={containerRef}>
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.3}
          maxScale={5}
          velocityAnimation={{ sensitivityTouch: 1, animationTime: 400 }}
          doubleClick={{ mode: 'reset' }}
          wheel={{ step: 0.08 }}
          pinch={{ step: 5 }}
          limitToBounds={false}
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
              minWidth: `${containerWidth}px`,
            }}
          >
            {!error && pdfData && (
              <Document
                file={pdfData}
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
            <button onClick={handleRetry} className={styles.retryBtn}>
              Повторить
            </button>
          </div>
        )}
      </div>

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
