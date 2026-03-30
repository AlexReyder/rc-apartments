<!-- Вот актуальный репозиторий в Github - https://github.com/AlexReyder/rc-apartments
Переходим к следующему этапу. seed на 4 корпуса × 6 этажей - пока не будем делать, мы возьмем прошлую БД и данные flats. -->

Продолжаем проект rc-apartments.
Вот актуальный репозиторий в Github - https://github.com/AlexReyder/rc-apartments
Контекст проекта:
- WordPress и Laravel — отдельные приложения.
- Внутри Laravel используем Inertia + React.
- Laravel отвечает за:
  - /apartments
  - /apartments/{slug}
  - /3dpanorama
  - /3dpanorama/{buildingSlug}
  - /3dpanorama/{buildingSlug}/{floorSlug}
  - /admin/*
- Сейчас фокус только на flats module.
- Используем существующую таблицу flats из MySQL как основной источник данных.
- Пока НЕ делаем отдельные tables buildings/floors и НЕ делаем seed.
- slug квартиры: b{building}-f{floor}-a{number}
  Пример: b1-f1-a66
- Поиск должен поддерживать формат:
  1886 => корпус 1, этаж 8, квартира 86

Текущее состояние репозитория:
- Уже есть routes для /apartments, /3dpanorama, /admin, /admin/flats
- Уже есть Flat model
- Уже есть ApartmentController и Admin\\FlatController
- Есть базовые public pages apartments/index и apartments/show
- Но проект в промежуточном состоянии:
  - есть рассинхрон между route/controller и Inertia pages по путям и регистру
  - sidebar и auth redirect всё ещё завязаны на /dashboard вместо /admin
  - полноценная страница Admin/Flats/Index ещё не доведена
  - panorama пока не трогаем

Что нужно сделать сейчас:
1. Сначала стабилизировать admin foundation:
   - перевести sidebar на /admin
   - перевести redirect после login/register на /admin
   - сделать нормальный AdminLayout
2. Затем собрать полноценный flats list module для /admin/flats:
   - таблица квартир
   - search
   - sort
   - perPage: 10/20/30/50
   - pagination
   - query params в URL
   - empty state
   - status badge
   - ссылки на публичную карточку квартиры

Формат работы:
- Сначала проанализируй текущий репозиторий.
- Затем предложи точный пошаговый план реализации ближайшего этапа.
- После плана сразу приступай к разработке.
- Если нужно, давай изменения в виде готовых патчей по файлам.
- Не пересобирай архитектуру заново, а работай от текущего состояния репозитория.