import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Debug.module.scss';

interface DiagInfo {
  online: boolean;
  swSupported: boolean;
  swController: string;
  swState: string;
  cachesSupported: boolean;
  cacheKeys: string[];
  pdfCacheUrls: string[];
  cacheWriteTest: string;
}

const PDF_CACHE_NAME = 'pdf-manual-v1';

async function runDiagnostics(): Promise<DiagInfo> {
  const info: DiagInfo = {
    online: navigator.onLine,
    swSupported: 'serviceWorker' in navigator,
    swController: 'нет',
    swState: 'нет',
    cachesSupported: 'caches' in window,
    cacheKeys: [],
    pdfCacheUrls: [],
    cacheWriteTest: 'не проверялось',
  };

  // SW controller
  if ('serviceWorker' in navigator) {
    const ctrl = navigator.serviceWorker.controller;
    info.swController = ctrl ? `есть (${ctrl.scriptURL})` : 'нет (null)';
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const state = reg.active?.state ?? 'нет active';
        const waiting = reg.waiting ? ' | waiting: есть' : '';
        info.swState = `scope: ${reg.scope} | active: ${state}${waiting}`;
      } else {
        info.swState = 'регистрация не найдена';
      }
    } catch (e) {
      info.swState = `ошибка: ${String(e)}`;
    }
  }

  // Cache API
  if ('caches' in window) {
    try {
      info.cacheKeys = await caches.keys();

      const cache = await caches.open(PDF_CACHE_NAME);
      const keys = await cache.keys();
      info.pdfCacheUrls = keys.map((r) => r.url);

      // Тест записи
      const testKey = '/__cache-write-test__';
      try {
        await cache.put(testKey, new Response('ok', { status: 200 }));
        const check = await cache.match(testKey);
        const text = await check?.text();
        await cache.delete(testKey);
        info.cacheWriteTest =
          text === 'ok' ? '✅ запись работает' : '❌ не совпало';
      } catch (e) {
        info.cacheWriteTest = `❌ ошибка записи: ${String(e)}`;
      }
    } catch (e) {
      info.cacheKeys = [`ошибка: ${String(e)}`];
    }
  }

  return info;
}

export default function Debug() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<DiagInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    runDiagnostics().then((d) => {
      setInfo(d);
      setLoading(false);
    });
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    runDiagnostics().then((d) => {
      setInfo(d);
      setLoading(false);
    });
  };

  const handleClearCache = async () => {
    try {
      await caches.delete(PDF_CACHE_NAME);
      setTestMsg('Кэш PDF очищен');
      handleRefresh();
    } catch (e) {
      setTestMsg(`Ошибка: ${String(e)}`);
    }
  };

  const handleTestCachePdf = async () => {
    const testUrl =
      'https://raw.githubusercontent.com/Slim21211/long-academy-bot-media/main/mission/%D0%9C%D0%B8%D1%81%D1%81%D0%B8%D1%8F%20%D0%B8%20%D1%86%D0%B5%D0%BD%D0%BD%D0%BE%D1%81%D1%82%D0%B8%20%D0%9A%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D0%B8.pdf';
    setTestMsg('Загружаю PDF для кэша...');
    try {
      const cache = await caches.open(PDF_CACHE_NAME);
      const response = await fetch(testUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await cache.put(testUrl, response.clone());
      setTestMsg('✅ PDF закэширован');
      handleRefresh();
    } catch (e) {
      setTestMsg(`❌ Ошибка: ${String(e)}`);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => navigate('/')} className={styles.back}>
          ← Назад
        </button>
        <h1>Диагностика</h1>
        <button onClick={handleRefresh} className={styles.refresh}>
          🔄
        </button>
      </header>

      <div className={styles.content}>
        {loading && <p className={styles.loading}>Проверяю…</p>}

        {info && (
          <>
            <Section title="Сеть">
              <Row label="Онлайн" value={info.online ? '✅ да' : '❌ нет'} />
            </Section>

            <Section title="Service Worker">
              <Row label="Поддержка" value={info.swSupported ? '✅' : '❌'} />
              <Row label="Controller" value={info.swController} small />
              <Row label="Состояние" value={info.swState} small />
            </Section>

            <Section title="Cache API">
              <Row
                label="Поддержка"
                value={info.cachesSupported ? '✅' : '❌'}
              />
              <Row label="Тест записи" value={info.cacheWriteTest} />
              <Row
                label="Все кэши"
                value={
                  info.cacheKeys.length > 0
                    ? info.cacheKeys.join(', ')
                    : 'пусто'
                }
                small
              />
            </Section>

            <Section title={`PDF кэш (${info.pdfCacheUrls.length} файлов)`}>
              {info.pdfCacheUrls.length === 0 ? (
                <p className={styles.empty}>Нет закэшированных PDF</p>
              ) : (
                info.pdfCacheUrls.map((u) => (
                  <p key={u} className={styles.url}>
                    {decodeURIComponent(u.split('/').pop() ?? u)}
                  </p>
                ))
              )}
            </Section>

            <div className={styles.actions}>
              <button onClick={handleTestCachePdf} className={styles.btnGreen}>
                Закэшировать тестовый PDF
              </button>
              <button onClick={handleClearCache} className={styles.btnRed}>
                Очистить PDF кэш
              </button>
            </div>

            {testMsg && <p className={styles.testMsg}>{testMsg}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          fontWeight: 700,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#8FA89A',
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: '4px 0',
          border: '1px solid #D5E8DC',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 16px',
        borderBottom: '1px solid #F0F4F1',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 14, color: '#5A7268', flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: small ? 11 : 13,
          fontWeight: 600,
          color: '#1A2E24',
          textAlign: 'right',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}
