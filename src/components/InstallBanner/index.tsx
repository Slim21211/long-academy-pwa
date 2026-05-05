import { useState, useEffect } from 'react';
import { detectPlatform, type Platform } from '../../hooks/usePlatform';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import styles from './InstallBanner.module.scss';

const DISMISSED_KEY = 'install-banner-dismissed';

interface InstructionStep {
  icon: string;
  text: string;
}

function getInstructions(platform: Platform): { title: string; steps: InstructionStep[] } | null {
  switch (platform) {
    case 'ios-safari':
      return {
        title: 'Добавьте на главный экран',
        steps: [
          { icon: '⬆️', text: 'Нажмите кнопку «Поделиться» (квадрат со стрелкой вверх)' },
          { icon: '➕', text: 'Выберите «На экран "Домой"»' },
          { icon: '✅', text: 'Нажмите «Добавить»' },
        ],
      };
    case 'ios-chrome':
    case 'ios-firefox':
    case 'ios-edge':
    case 'ios-other':
      return {
        title: 'Добавьте на главный экран',
        steps: [
          { icon: '⬆️', text: 'Нажмите кнопку «Поделиться» (квадрат со стрелкой)' },
          { icon: '➕', text: 'Прокрутите вниз — «На экран "Домой"»' },
          { icon: '✅', text: 'Нажмите «Добавить»' },
        ],
      };
    case 'android-samsung':
      return {
        title: 'Добавьте на главный экран',
        steps: [
          { icon: '⋮', text: 'Нажмите три точки в правом верхнем углу' },
          { icon: '➕', text: 'Выберите «Добавить страницу на...»' },
          { icon: '🏠', text: 'Нажмите «Главный экран»' },
        ],
      };
    case 'android-firefox':
      return {
        title: 'Добавьте на главный экран',
        steps: [
          { icon: '⋮', text: 'Нажмите три точки в нижнем меню' },
          { icon: '➕', text: 'Выберите «Установить»' },
          { icon: '✅', text: 'Подтвердите установку' },
        ],
      };
    case 'android-edge':
      return {
        title: 'Добавьте на главный экран',
        steps: [
          { icon: '⋮', text: 'Нажмите три точки в нижнем меню' },
          { icon: '📱', text: 'Нажмите «Добавить на телефон»' },
          { icon: '✅', text: 'Выберите «Установить»' },
        ],
      };
    case 'desktop':
      return {
        title: 'Установите приложение',
        steps: [
          { icon: '🖥️', text: 'Нажмите иконку установки в адресной строке браузера' },
          { icon: '✅', text: 'Нажмите «Установить»' },
        ],
      };
    default:
      return null;
  }
}

interface InstallBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function InstallBanner({ onVisibilityChange }: InstallBannerProps) {
  const [platform] = useState<Platform>(() => detectPlatform());
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; }
    catch { return false; }
  });
  const [expanded, setExpanded] = useState(false);
  const { isInstallable, triggerInstall } = useInstallPrompt();

  const instructions = getInstructions(platform);
  const isInstalled = platform === 'installed';
  const canNativeInstall = isInstallable && (platform === 'android-chrome' || platform === 'desktop');
  const shouldShow = !isInstalled && !dismissed && (canNativeInstall || (instructions !== null));

  useEffect(() => {
    onVisibilityChange?.(shouldShow);
  }, [shouldShow, onVisibilityChange]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* ignore */ }
  };

  const handleInstall = async () => {
    if (canNativeInstall) {
      await triggerInstall();
    } else {
      setExpanded((v) => !v);
    }
  };

  return (
    <div className={styles.wrapper} role="complementary" aria-label="Установка приложения">
      <div className={styles.banner}>
        <div className={styles.main}>
          <div className={styles.appIcon}>🌿</div>
          <div className={styles.text}>
            <p className={styles.heading}>Установите приложение</p>
            <p className={styles.desc}>Работает без интернета</p>
          </div>
          <div className={styles.btnGroup}>
            <button
              className={styles.installBtn}
              onClick={handleInstall}
              aria-expanded={expanded}
            >
              {canNativeInstall ? 'Установить' : (expanded ? 'Скрыть' : 'Как?')}
            </button>
            <button
              className={styles.closeBtn}
              onClick={handleDismiss}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {expanded && instructions && !canNativeInstall && (
          <div className={styles.steps}>
            <p className={styles.stepsTitle}>{instructions.title}</p>
            <ol className={styles.stepsList}>
              {instructions.steps.map((step, i) => (
                <li key={i} className={styles.step}>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
