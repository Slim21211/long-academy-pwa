# Академия Долголетия — PWA

Корпоративная база знаний для сотрудников пансионатов.

## Быстрый старт

```bash
npm install
npm run dev
```

## Сборка и деплой

```bash
npm run build   # сборка в ./dist
npm run preview # локальный просмотр сборки
```

### Деплой на Vercel

1. Загрузите проект в GitHub
2. Подключите репозиторий в [vercel.com](https://vercel.com)
3. Настройки по умолчанию подходят (Vite автоматически определяется)
4. В разделе **Settings → General** убедитесь что `Output Directory = dist`

## PWA-иконки

В папке `public/icons/` лежат базовые иконки. Для лучшего качества замените их на готовые PNG:

- `icon-192.png` — 192×192 пикселей
- `icon-512.png` — 512×512 пикселей

Сгенерировать иконки можно на [favicon.io](https://favicon.io) или [realfavicongenerator.net](https://realfavicongenerator.net).

## Структура проекта

```
src/
  data/links.ts          ← все ссылки на PDF/видео/фото
  pages/
    Home/                ← главное меню
    About/               ← о компании
    Standards/           ← список категорий
    Category/            ← список документов с поиском
    Friends/             ← приведи друга
  components/
    Header/              ← шапка с кнопкой «назад»
    DocCard/             ← карточка документа
    InstallBanner/       ← баннер «добавить на главный экран»
    Layout/              ← обёртка страниц
  hooks/
    usePlatform.ts       ← определение ОС/браузера по UA
    useInstallPrompt.ts  ← нативный install prompt (Android Chrome)
  styles/
    _variables.scss      ← переменные, цвета, миксины
    global.scss          ← глобальные стили
```

## Добавление/обновление документов

Все ссылки на документы находятся в `src/data/links.ts`.
Структура категорий:

```ts
{
  id: 'unique-id',
  title: 'Название категории',
  icon: '📋',
  color: '#HEX',
  documents: [
    { id: 1, name: 'Название документа', url: 'https://...' },
  ],
}
```

## Офлайн-кэширование

PDF-файлы кэшируются при первом открытии (стратегия CacheFirst, 30 дней).
Видео и изображения — 7 дней.
Сам интерфейс приложения — навсегда до обновления.

## Поддержка браузеров

Все современные браузеры. Протестировано:
- iOS Safari (Add to Home Screen)
- iOS Chrome / Firefox
- Android Chrome (нативный install prompt)
- Android Samsung Browser
- Desktop Chrome / Firefox / Edge
