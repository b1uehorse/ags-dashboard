# Рецепт: interactive-slider (scale с onchange)

Слайдер, который **меняет** значение в системе — brightness, volume, mic-gain. Без `:onchange` слайдер мёртвый.

## Задача-челлендж: регулятор яркости

Тянешь ползунок → `brightnessctl` применяет значение.

## Сборка

### 1. Переменная (текущее состояние)

```yuck
(defpoll brightness-val :interval "3s" :initial "50"
    "brightnessctl g -P")
```

`brightnessctl g -P` возвращает текущую яркость в процентах (0..100). `defpoll` нужен чтобы при изменении яркости **снаружи** (горячие клавиши, другой виджет) наш слайдер подтянулся.

### 2. Виджет

```yuck
(defwidget brightness-slider []
    (box :class "tile" :orientation "h" :space-evenly false :spacing 10
        (label :class "nerd" :text "")
        (scale :class "bright-scale"
               :min 0 :max 100
               :value brightness-val
               :step 5
               :onchange "brightnessctl s {}%")))
```

`:step 5` — дискретность ползунка. Без него тачпадом дёргается по 1%, `:onchange` спамится → UI лагает. `5` для brightness/volume — здравый компромисс.

**Ключевое**:
- `:value brightness-val` — слайдер **следит** за переменной (двусторонняя привязка).
- `:onchange "command {}"` — `{}` заменяется на текущее значение слайдера. Запускается на каждое движение.
- Без `:onchange` — слайдер только показывает, не управляет.

### 3. SCSS

```scss
.bright-scale {
    min-width: 180px;
    trough {
        background-color: $background-alt;
        min-height: 6px;
        border-radius: 3px;
    }
    highlight {
        background-color: $yellow;
        border-radius: 3px;
    }
    slider {
        background-color: $foreground;
        border-radius: 50%;
        min-width: 14px;
        min-height: 14px;
    }
}
```

### 4. Reload и проверка

```bash
eww reload
# двигаешь слайдер → яркость меняется
# жмёшь Fn-key → слайдер подтягивается
```

## Важные нюансы

### `:onchange` летит КАЖДОЕ движение
Если команда медленная (api-вызов) — UI залагает.
Решение: дебаунс-скрипт-обёртка:
```bash
# scripts/brightness-debounce
#!/usr/bin/env bash
VAL="$1"
# пишем значение, запускаем фоновый таймер
echo "$VAL" > /tmp/bright.pending
(sleep 0.1; LAST=$(cat /tmp/bright.pending); brightnessctl s "${LAST}%") &
```

### Плавные слайдеры (draggable → apply on release)
Eww не даёт `:on-release` нативно. Обход: `:onchange` пишет в temp-файл, рядом запущен `inotifywait` скрипт, который применяет с задержкой.

Проще: смирись, что применяется на каждом frame. На brightness/volume это ок.

### Volume с правильным step

```yuck
(scale :min 0 :max 150
       :value mic-vol
       :onchange "wpctl set-volume @DEFAULT_AUDIO_SINK@ {}%"
       :active true)
```

`:active true` — обязательно, иначе слайдер read-only.

## Частые ошибки

| Проблема | Причина |
|---|---|
| Слайдер не двигается | `:active false` или забыл |
| Двигается но ничего не меняется | `:onchange` пустой или забыл `{}` |
| Прыгает обратно | `:value` биндится к defpoll, а команда не успела повлиять. Увеличь интервал poll до 1s |
| На резком движении лагает | Медленная команда в `:onchange` — нужна дебаунс-обёртка |
| Thumb не видно | Переопредели `slider { background, min-width, border-radius }` в SCSS |

## Чеклист

- [ ] `:value` привязан к defpoll (чтобы внешние изменения подхватывались)
- [ ] `:onchange` с `{}` placeholder-ом
- [ ] `:active true` (default false)
- [ ] SCSS для trough/highlight/slider — все три узла
- [ ] Для медленных команд — debounce-обёртка
