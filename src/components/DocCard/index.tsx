import styles from './DocCard.module.scss';

interface DocCardProps {
  name: string;
  url: string;
  index?: number;
}

function PdfIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
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

// GitHub raw CDN отдаёт PDF с Content-Disposition: attachment,
// из-за чего iOS Safari на телефоне скачивает вместо открытия.
// Google Docs Viewer обходит это ограничение на всех устройствах.
function getViewerUrl(pdfUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}`;
}

// Скачать: на iOS — нативный шаринг (сохранить в Файлы / AirDrop).
// На desktop/Android — fetch + blob URL.
async function downloadPdf(url: string, name: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ title: name, url });
      return;
    } catch {
      // Пользователь отменил — падаем на fetch
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('fetch failed');
    const blob = await response.blob();
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

export default function DocCard({ name, url, index }: DocCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    void downloadPdf(url, name);
  };

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${(index ?? 0) * 40}ms` }}
    >
      <div className={styles.iconWrap}>
        <PdfIcon />
      </div>

      <p className={styles.name}>{name}</p>

      <div className={styles.actions}>
        <a
          href={getViewerUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${styles.btnPrimary}`}
          aria-label={`Открыть ${name}`}
        >
          <OpenIcon />
          <span>Открыть</span>
        </a>

        <button
          onClick={handleDownload}
          className={`${styles.btn} ${styles.btnSecondary}`}
          aria-label={`Скачать ${name}`}
        >
          <DownloadIcon />
          <span>Скачать</span>
        </button>
      </div>
    </article>
  );
}
