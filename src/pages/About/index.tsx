import { useState } from 'react';
import Header from '../../components/Header';
import { VIDEO, PDF } from '../../data/links';
import styles from './About.module.scss';

function DocumentIcon() {
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

export default function About() {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className={`${styles.page} page-enter`}>
      <Header title="О Компании" showBack backPath="/" />

      <main className={styles.main}>
        <p className={styles.intro}>
          Посмотрите медиаматериалы, чтобы больше узнать о нашей компании
        </p>

        {/* Video section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Видео о компании</h2>

          <div className={styles.videoCard}>
            {!videoError ? (
              <video
                src={VIDEO.ABOUT}
                controls
                playsInline
                preload="metadata"
                className={styles.video}
                onError={() => setVideoError(true)}
                aria-label="Видео о компании Академия Долголетия"
              />
            ) : (
              // Если <video> не смог загрузить файл (iOS + CDN без range requests)
              // — показываем кнопку, которая открывает mp4 напрямую в Safari.
              // Нативный плеер iOS обрабатывает это без проблем.
              <div className={styles.videoFallback}>
                <p className={styles.videoFallbackText}>
                  Встроенный плеер недоступен в этом браузере
                </p>
                <a
                  href={VIDEO.ABOUT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.videoFallbackBtn}
                >
                  ▶ Открыть видео
                </a>
              </div>
            )}
          </div>

          {/* Постоянная ссылка для iOS — открывает видео в нативном плеере Safari */}
          <a
            href={VIDEO.ABOUT}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoExternalLink}
          >
            Открыть видео в браузере →
          </a>
        </section>

        {/* Mission PDF */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Документы</h2>
          <a
            href={PDF.MISSION}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docCard}
          >
            <div className={styles.docIcon}>
              <DocumentIcon />
            </div>
            <div className={styles.docContent}>
              <p className={styles.docName}>Миссия и ценности Компании</p>
              <p className={styles.docHint}>PDF документ</p>
            </div>
            <div className={styles.docArrow}>
              <OpenIcon />
            </div>
          </a>
        </section>
      </main>
    </div>
  );
}
