import styles from './DocCard.module.scss';

interface DocCardProps {
  name: string;
  url: string;
  index?: number;
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

export default function DocCard({ name, url, index }: DocCardProps) {
  return (
    <article className={styles.card} style={{ animationDelay: `${(index ?? 0) * 40}ms` }}>
      <div className={styles.iconWrap}>
        <PdfIcon />
      </div>

      <p className={styles.name}>{name}</p>

      <div className={styles.actions}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${styles.btnPrimary}`}
          aria-label={`Открыть ${name}`}
        >
          <OpenIcon />
          <span>Открыть</span>
        </a>
        <a
          href={url}
          download
          className={`${styles.btn} ${styles.btnSecondary}`}
          aria-label={`Скачать ${name}`}
        >
          <DownloadIcon />
          <span>Скачать</span>
        </a>
      </div>
    </article>
  );
}
