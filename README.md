# WEB Novel Engine

Легкий JavaScript-рушій для браузерних візуальних новел. Він не залежить від фреймворку: сценарій, персонажі та зображення надходять з REST API, а рушій виконує вузли сюжету по одному.

Поточна версія підтримує:

- фони та їхні параметри відображення;
- декілька персонажів на сцені, позиції, активного мовця й емоції;
- діалоги з ефектом друку та пропуском тексту;
- вибір з розгалуженням сюжету;
- приховування персонажів;
- REST API з пагінацією `limit` / `offset`;
- автономний тестовий сервер, демо та модульні тести.

## Швидкий старт

### 1. Запустити повне демо з API

Потрібен Python 3.10+.

```bash
py -m pip install -r requirements.txt
py tests/test_server.py
```

Відкрийте [http://127.0.0.1:5000/tests/index_2.html](http://127.0.0.1:5000/tests/index_2.html).

Демо звертається до `test_server.py` за `/characters/`, `/nodes/` та відображає всі основні можливості рушія. Дані відтворювані: використовується фіксований seed `42`.

### 2. Запустити автоматичні JavaScript-тести

Потрібен Node.js 18+.

```bash
npm test
```

### 3. Перевірити Python API

```bash
py -m unittest discover -s tests -p "*_test.py"
```

## Структура проєкту

| Шлях | Призначення |
| --- | --- |
| `main.js` | Фабрика `createEngine()` та з’єднання модулів. |
| `core/engine.js` | Публічний життєвий цикл: запуск, перехід, вибір, скидання. |
| `node/NodeManager.js` | Завантажує вузли й виконує їх у порядку сценарію. |
| `background/BackgroundManager.js` | Встановлює фонове зображення. |
| `character/` | Стан, DOM-рендеринг та емоції персонажів. |
| `dialogue/` | Показ реплік і ефект друку. |
| `choice/ChoiceManager.js` | Поточні варіанти вибору. |
| `api/CharactersApi.js` | HTTP-клієнт контракту API. |
| `tests/test_server.py` | Локальний Flask-сервер, генератор сценарію й статика. |
| `tests/index_2.html` | Повна інтерактивна перевірка рушія. |
| `tests/assets/` | Самодостатні SVG-фони та персонажі для демо. |

## Як працює сценарій

Сценарій — це масив вузлів. У кожного вузла є унікальний `id`, `type` і, зазвичай, `next`. Після виконання вузла рушій не переходить автоматично: інтерфейс викликає `engine.next()` після кліку гравця. Вузол `choice` зупиняє звичайний перехід і чекає `engine.selectChoice(index)`.

```text
background → character → dialogue → choice
                                  ├→ гілка A → … → кінець
                                  ├→ гілка B → … → кінець
                                  └→ гілка C → … → кінець
```

### Стан рушія

Поточний стан доступний у `engine.state`.

| Поле | Значення |
| --- | --- |
| `status` | `idle`, `loading`, `running` або `finished`. |
| `currentNodeId` | ID останнього виконаного вузла або `null`. |
| `isWaitingForChoice` | `true`, коли необхідно обрати варіант. |

## Підключення рушія до сторінки

На сторінці мають бути щонайменше три DOM-елементи: фон, шар персонажів і елемент для тексту.

```html
<div id="background"></div>
<div id="characters"></div>
<div id="text"></div>
```

```js
import { createEngine } from "./main.js";

const engine = createEngine({
    apiBaseUrl: "/api",
    target_id: "background",
    characterContainerId: "characters",
    dialogueTargetId: "text",
    textSpeed: 25
});

const firstNode = await engine.start();

// Викликати після кліку по діалогу.
const nextNode = await engine.next();

// Викликати після натискання кнопки вибору.
const selectedNode = await engine.selectChoice(0);

// Скинути стан для повторного проходження.
engine.reset();
```

| Параметр `createEngine` | Тип | Типове значення | Опис |
| --- | --- | --- | --- |
| `apiBaseUrl` | `string` | `""` | Префікс API, наприклад `"/api"` або `"https://api.example.com"`. |
| `charactersApi` | об’єкт | `null` | Власна реалізація API замість HTTP-клієнта. Корисно для тестів. |
| `target_id` / `targetId` | `string` | `"background_image"` | ID контейнера фону. |
| `characterContainerId` | `string` | `"characters"` | ID шару персонажів. |
| `dialogueTargetId` | `string` | `"dialogue_text"` | ID елемента, де друкується текст. |
| `textSpeed` | `number` | `50` | Затримка між символами в мілісекундах. |

## Формат даних

### Персонаж

`GET /characters/` повертає масив персонажів. Поле `emotions` можна повернути одразу для редактора, але під час гри рушій також уміє окремо запитати `GET /characters/:id/emotion/`.

```json
{
  "id": 1,
  "name": "Анна",
  "image": "/media/characters/anna-neutral.webp",
  "defaultPosition": "left",
  "emotions": {
    "neutral": "/media/characters/anna-neutral.webp",
    "happy": "/media/characters/anna-happy.webp"
  }
}
```

| Поле | Обов’язкове | Опис |
| --- | --- | --- |
| `id` | так | Числовий або рядковий унікальний ID. |
| `name` | так | Ім’я для UI. |
| `image` | так | URL базового спрайта/портрета. |
| `defaultPosition` | ні | `left`, `center` або `right`; використовується в діалозі до першого явного показу. |
| `emotions` | ні | Мапа `назва емоції → URL зображення`. |

### Вузол `background`

Змінює фон.

```json
{
  "id": 1,
  "type": "background",
  "image": "/media/backgrounds/library.webp",
  "options": {
    "opacity": 0.9,
    "objectFit": "cover",
    "width": "100%",
    "height": "100%"
  },
  "next": 2
}
```

### Вузол `character`

Показує або приховує персонажа. Якщо вказана `emotion`, рушій завантажує відповідне зображення через endpoint емоцій.

```json
{
  "id": 2,
  "type": "character",
  "characterId": 1,
  "position": "left",
  "emotion": "happy",
  "next": 3
}
```

Приховати можна двома еквівалентними способами:

```json
{ "id": 8, "type": "character", "characterId": 1, "action": "hide", "next": 9 }
```

```json
{ "id": 8, "type": "character", "characterId": 1, "visible": false, "next": 9 }
```

| Поле | Тип | Опис |
| --- | --- | --- |
| `characterId` | `number \| string` | ID персонажа з `/characters/`. |
| `position` | `left \| center \| right` | Позиція для показу; типово `center`. |
| `emotion` | `string` | Ключ з мапи емоцій, наприклад `happy`. |
| `style` | `object` | Додаткові inline-стилі для DOM-слоту. |
| `action` | `"hide"` | Приховує персонажа. |
| `visible` | `boolean` | `false` також приховує персонажа. |

### Вузол `dialogue`

```json
{
  "id": 3,
  "type": "dialogue",
  "dialogue": {
    "characterId": 1,
    "text": "Я знайшла лист. Треба вирішити, що робити далі."
  },
  "next": 4
}
```

Для репліки без персонажа не передавайте `characterId`; додайте `speakerName`, якщо UI показує ім’я мовця.

```json
{
  "id": 16,
  "type": "dialogue",
  "dialogue": {
    "speakerName": "Оповідач",
    "text": "У кімнаті знову стало тихо."
  }
}
```

### Вузол `choice`

Вузол не має `next`, бо перехід лежить у кожному варіанті.

```json
{
  "id": 6,
  "type": "choice",
  "choices": [
    { "label": "Піти до саду", "nextNodeId": 7 },
    { "label": "Залишитися в бібліотеці", "nextNodeId": 12 }
  ]
}
```

| Поле варіанта | Опис |
| --- | --- |
| `label` | Текст кнопки. |
| `nextNodeId` | ID вузла, що виконається після вибору. Допускається також коротке поле `next`. |

### Зведена таблиця вузлів

| `type` | Обов’язкові дані | Результат |
| --- | --- | --- |
| `background` | `image` | Змінює фон. |
| `character` | `characterId` | Показує/оновлює персонажа або приховує його. |
| `dialogue` | `dialogue.text` | Друкує репліку, позначає мовця. |
| `choice` | `choices[]` | Показує кнопки та чекає вибору. |

У всіх вузлах `id` обов’язковий. `next` необов’язковий: якщо його немає, це кінець поточної гілки.

## REST API контракт

Клієнт розуміє як «чистий» масив, так і пагіновану відповідь. Рекомендований формат відповіді колекції:

```json
{
  "count": 20,
  "limit": 50,
  "offset": 0,
  "results": [
    { "id": 1, "type": "background", "image": "/media/bg.webp", "next": 2 }
  ]
}
```

| Метод і шлях | Відповідь | Використання |
| --- | --- | --- |
| `GET /characters/?limit=50&offset=0` | персонажі | `CharactersManager.loadCharacters()` |
| `GET /characters/:id/` | один персонаж | Додаткові екрани/редактор. |
| `GET /characters/:id/emotion/` | мапа емоцій | `changeEmotion()`. |
| `GET /dialogues/?limit=50&offset=0` | репліки | Необов’язковий окремий список. |
| `GET /nodes/?limit=50&offset=0` | вузли | `NodeManager.loadNodes()`. |

### Повний мінімальний сценарій

```json
{
  "characters": [
    {
      "id": 1,
      "name": "Анна",
      "image": "/media/anna.webp",
      "defaultPosition": "left",
      "emotions": { "neutral": "/media/anna.webp", "happy": "/media/anna-happy.webp" }
    }
  ],
  "nodes": [
    { "id": 1, "type": "background", "image": "/media/library.webp", "next": 2 },
    { "id": 2, "type": "character", "characterId": 1, "position": "left", "next": 3 },
    { "id": 3, "type": "dialogue", "dialogue": { "characterId": 1, "text": "Привіт!" }, "next": 4 },
    { "id": 4, "type": "choice", "choices": [{ "label": "Продовжити", "nextNodeId": 5 }] },
    { "id": 5, "type": "dialogue", "dialogue": { "speakerName": "Оповідач", "text": "Кінець демо." } }
  ]
}
```

## Тестовий сервер

`tests/test_server.py` одночасно:

1. генерує 2 персонажів, 20 вузлів і 3 гілки сюжету;
2. віддає API на `http://127.0.0.1:5000`;
3. віддає HTML, JavaScript та SVG-файли проєкту;
4. перевіряє наявність усіх тестових ресурсів під час старту.

| Гілка після вузла 6 | Що перевіряє |
| --- | --- |
| «Дослідити сад» | Інший фон, приховування Анни, повторний показ з іншою позицією та емоцією. |
| «Залишитися в бібліотеці» | Приховування Боба й Анни через `visible: false`, репліку оповідача. |
| «Завершити коротку сцену» | Зміну фону, емоцію Анни й приховування Боба. |

Корисні URL:

```text
http://127.0.0.1:5000/health/
http://127.0.0.1:5000/characters/?limit=50&offset=0
http://127.0.0.1:5000/nodes/?chapter=2
http://127.0.0.1:5000/tests/index_2.html
```

## Приклад інтеграції з Django REST Framework

Нижче — один зручний варіант зберігання. Загальні поля вузла тримаються у колонках, а поля, залежні від типу, — у `JSONField`.

### `models.py`

```python
from django.db import models


class Character(models.Model):
    name = models.CharField(max_length=120)
    image = models.ImageField(upload_to="characters/")
    default_position = models.CharField(
        max_length=10,
        choices=[("left", "Left"), ("center", "Center"), ("right", "Right")],
        default="center",
    )


class CharacterEmotion(models.Model):
    character = models.ForeignKey(Character, related_name="emotion_items", on_delete=models.CASCADE)
    key = models.SlugField(max_length=40)  # neutral, happy, angry …
    image = models.ImageField(upload_to="characters/emotions/")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["character", "key"], name="unique_character_emotion")]


class StoryNode(models.Model):
    BACKGROUND = "background"
    CHARACTER = "character"
    DIALOGUE = "dialogue"
    CHOICE = "choice"
    TYPES = [(BACKGROUND, "Background"), (CHARACTER, "Character"), (DIALOGUE, "Dialogue"), (CHOICE, "Choice")]

    chapter = models.PositiveIntegerField(default=1, db_index=True)
    type = models.CharField(max_length=20, choices=TYPES)
    data = models.JSONField(default=dict)
    next_node = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="previous_nodes")
```

### Приклад таблиць даних

Таблиця `character`:

| id | name | image | default_position |
| ---: | --- | --- | --- |
| 1 | Анна | `characters/anna.webp` | `left` |
| 2 | Боб | `characters/bob.webp` | `right` |

Таблиця `character_emotion`:

| id | character_id | key | image |
| ---: | ---: | --- | --- |
| 1 | 1 | `neutral` | `characters/anna.webp` |
| 2 | 1 | `happy` | `characters/anna-happy.webp` |
| 3 | 2 | `neutral` | `characters/bob.webp` |

Таблиця `story_node`:

| id | chapter | type | next_node_id | `data` |
| ---: | ---: | --- | ---: | --- |
| 1 | 1 | `background` | 2 | `{"image":"/media/library.webp"}` |
| 2 | 1 | `character` | 3 | `{"characterId":1,"position":"left","emotion":"happy"}` |
| 3 | 1 | `dialogue` | 4 | `{"dialogue":{"characterId":1,"text":"Привіт"}}` |
| 4 | 1 | `choice` | — | `{"choices":[{"label":"Далі","nextNodeId":5}]}` |

### `serializers.py`

```python
from rest_framework import serializers
from .models import Character, StoryNode


class CharacterSerializer(serializers.ModelSerializer):
    emotions = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = ("id", "name", "image", "default_position", "emotions")

    def get_emotions(self, character):
        request = self.context.get("request")
        result = {}
        for emotion in character.emotion_items.all():
            url = emotion.image.url
            result[emotion.key] = request.build_absolute_uri(url) if request else url
        return result

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["defaultPosition"] = data.pop("default_position")
        return data


class StoryNodeSerializer(serializers.ModelSerializer):
    next = serializers.SerializerMethodField()

    class Meta:
        model = StoryNode
        fields = ("id", "chapter", "type", "data", "next")

    def get_next(self, node):
        return node.next_node_id

    def to_representation(self, instance):
        base = super().to_representation(instance)
        payload = base.pop("data") or {}
        return {**base, **payload}
```

### `views.py` та `urls.py`

```python
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.generics import ListAPIView
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Character, StoryNode
from .serializers import CharacterSerializer, StoryNodeSerializer


class NovelPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 100


class CharacterViewSet(ReadOnlyModelViewSet):
    queryset = Character.objects.prefetch_related("emotion_items").all()
    serializer_class = CharacterSerializer
    pagination_class = NovelPagination

    @action(detail=True, methods=["get"], url_path="emotion")
    def emotion(self, request, pk=None):
        character = self.get_object()
        return Response({item.key: request.build_absolute_uri(item.image.url) for item in character.emotion_items.all()})


class NodeListView(ListAPIView):
    serializer_class = StoryNodeSerializer
    pagination_class = NovelPagination

    def get_queryset(self):
        queryset = StoryNode.objects.all().order_by("id")
        chapter = self.request.query_params.get("chapter")
        return queryset.filter(chapter=chapter) if chapter is not None else queryset
```

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CharacterViewSet, NodeListView

router = DefaultRouter()
router.register("characters", CharacterViewSet, basename="character")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/nodes/", NodeListView.as_view()),
]
```

Після міграцій (`py manage.py makemigrations && py manage.py migrate`) передайте рушію `apiBaseUrl: "/api"`.

> Якщо фронтенд і Django API працюють на різних доменах, налаштуйте CORS у Django. За однакового домену це не потрібно.

## Перевірки перед релізом

- усі `id` вузлів і персонажів унікальні;
- усі `next` і `nextNodeId` посилаються на наявні вузли;
- кожна емоція має доступний URL файлу;
- у кожній гілці є вузол без `next` або свідоме повернення до іншої гілки;
- API повертає `results`, а не вкладений довільний об’єкт;
- `background`, `characters` і `text` існують у DOM до створення рушія;
- за потреби довгі сценарії вантажаться порціями через `limit` та `offset`.

## Типові проблеми

| Симптом | Причина та виправлення |
| --- | --- |
| `API error: 404` | Перевірте `apiBaseUrl` і завершіть шлях без останнього `/api/`; клієнт сам додає `/characters/` або `/nodes/`. |
| Персонаж не показується | Перевірте `characterId`, URL `image` та наявність контейнера `#characters`. |
| Емоція не змінюється | Додайте ключ емоції до `GET /characters/:id/emotion/`. |
| Вибір не зникає | Обробник кнопки має викликати `await engine.selectChoice(index)`. |
| Демо не завантажує дані | Відкривайте його через `py tests/test_server.py`, а не як файл `file://`. |

## Ліцензія

Проєкт поширюється за умовами [MIT License](LICENSE).
