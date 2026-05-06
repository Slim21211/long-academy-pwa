import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { idbKeys } from '../PdfViewer';
import styles from './Debug.module.scss';

const PDF_CACHE_NAME = 'pdf-manual-v1';

async function runDiagnostics() {
  const info = {
    online: navigator.onLine,
    swSupported: 'serviceWorker' in navigator,
    swController: 'нет',
    swState: 'нет',
    cachesSupported: 'caches' in window,
    idbSupported: 'indexedDB' in window,
    cacheKeys: [] as string[],
    idbPdfUrls: [] as string[],
    cacheWriteTest: 'не проверялось',
    idbWriteTest: 'не проверялось',
  };

  if ('serviceWorker' in navigator) {
    const ctrl = navigator.serviceWorker.controller;
    info.swController = ctrl ? `есть (${ctrl.scriptURL})` : 'нет (null)';
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const waiting = reg.waiting ? ' | waiting: есть' : '';
        info.swState = `scope: ${reg.scope} | active: ${reg.active?.state ?? 'нет'}${waiting}`;
      } else {
        info.swState = 'регистрация не найдена';
      }
    } catch (e) {
      info.swState = `ошибка: ${String(e)}`;
    }
  }

  if ('caches' in window) {
    try {
      info.cacheKeys = await caches.keys();
      const cache = await caches.open(PDF_CACHE_NAME);
      const testKey = '/__write-test__';
      await cache.put(testKey, new Response('ok', { status: 200 }));
      const check = await cache.match(testKey, { ignoreVary: true });
      await cache.delete(testKey);
      info.cacheWriteTest =
        (await check?.text()) === 'ok' ? '✅ работает' : '❌ сбой';
    } catch (e) {
      info.cacheWriteTest = `❌ ${String(e)}`;
    }
  }

  if ('indexedDB' in window) {
    try {
      info.idbPdfUrls = await idbKeys();
      info.idbWriteTest = info.idbPdfUrls !== null ? '✅ работает' : '❌ сбой';
    } catch (e) {
      info.idbWriteTest = `❌ ${String(e)}`;
    }
  }

  return info;
}

type Info = Awaited<ReturnType<typeof runDiagnostics>>;

export default function Debug() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const refresh = () => {
    setLoading(true);
    runDiagnostics().then((d) => {
      setInfo(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const clearIDB = async () => {
    try {
      await indexedDB.deleteDatabase('pdf-store');
      setMsg('IndexedDB очищен');
      refresh();
    } catch (e) {
      setMsg(`Ошибка: ${String(e)}`);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => navigate('/')} className={styles.back}>
          ← Назад
        </button>
        <h1>Диагностика</h1>
        <button onClick={refresh} className={styles.refresh}>
          🔄
        </button>
      </header>

      <div className={styles.content}>
        {loading && <p className={styles.loading}>Проверяю…</p>}
        {info && (
          <>
            <Section title="Сеть">
              <Row
                label="navigator.onLine"
                value={info.online ? '✅ true' : '❌ false'}
              />
              <Row
                label="Примечание"
                value="На iOS может быть неточным"
                small
              />
            </Section>

            <Section title="Service Worker">
              <Row label="Поддержка" value={info.swSupported ? '✅' : '❌'} />
              <Row label="Controller" value={info.swController} small />
              <Row label="Состояние" value={info.swState} small />
            </Section>

            <Section title="Cache API (старый)">
              <Row
                label="Поддержка"
                value={info.cachesSupported ? '✅' : '❌'}
              />
              <Row label="Запись" value={info.cacheWriteTest} />
              <Row
                label="Кэши"
                value={info.cacheKeys.join(', ') || 'пусто'}
                small
              />
            </Section>

            <Section
              title={`IndexedDB (новый) — ${info.idbPdfUrls.length} PDF`}
            >
              <Row label="Поддержка" value={info.idbSupported ? '✅' : '❌'} />
              <Row label="Доступ" value={info.idbWriteTest} />
              {info.idbPdfUrls.length === 0 ? (
                <p className={styles.empty}>Нет закэшированных PDF</p>
              ) : (
                info.idbPdfUrls.map((u) => (
                  <p key={u} className={styles.url}>
                    {decodeURIComponent(u.split('/').pop() ?? u)}
                  </p>
                ))
              )}
            </Section>

            <div className={styles.actions}>
              <button onClick={clearIDB} className={styles.btnRed}>
                Очистить IndexedDB
              </button>
            </div>
            {msg && <p className={styles.testMsg}>{msg}</p>}
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
