# 🍟 Установка и запуск CLOWNS локально

## 1️⃣ Требования

- Node.js v18+
- MySQL 8.0+
- npm или yarn

## 2️⃣ Порядок установки

### Шаг 1: Клонирование репозитория (уже сделано!)

```bash
git clone https://github.com/ChtoKavo/clowns.git
cd clowns
```

### Шаг 2: Установка зависимостей

```bash
# Фронтенд
npm install

# Бэкенд
cd backend
npm install
cd ..
```

### Шаг 3: Создание MySQL базы данных

1. Откройте MySQL клиент или используйте MySQL Workbench:

```bash
mysql -u root -p
```

2. Выполните SQL скрипт `database.sql`:

```bash
mysql -u root -p < database.sql
```

Или в MySQL клиентском приложении скопируйте содержимое `database.sql` и выполните.

### Шаг 4: Конфигурация .env

Файл `.env` уже создан в корне проекта. Проверьте переменные:

```env
NODE_ENV=development
BACKEND_PORT=5000
BACKEND_HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=clowns_db

JWT_SECRET=your_jwt_secret_key_change_this_in_production_12345
JWT_EXPIRE=7d

FRONTEND_HOST=localhost
FRONTEND_PORT=5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Если MySQL пароль отличается**, обновите в `.env`:
```env
DB_PASSWORD=ваш_пароль
```

## 3️⃣ Запуск локально

### Вариант 1: Две консоли (рекомендуется)

**Консоль 1 - Бэкенд:**
```bash
cd backend
npm run dev
```

Вы должны увидеть:
```
✓ MySQL подключение успешно!
╔═══════════════════════════════════════════╗
║ 🍟 CLOWNS API СЕРВЕР ЗАПУЩЕН 🍟           ║
╠═══════════════════════════════════════════╣
║ IP адрес: http://localhost:5000
║ Окружение: development
```

**Консоль 2 - Фронтенд:**
```bash
npm run dev
```

Вы должны увидеть:
```
  VITE v8.0.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### Вариант 2: Одна консоль с конкурентными процессами

Установите `concurrently`:
```bash
npm install --save-dev concurrently
```

Добавьте скрипт в `package.json`:
```json
"dev:all": "concurrently \"cd backend && npm run dev\" \"npm run dev\""
```

Запустите:
```bash
npm run dev:all
```

## 4️⃣ Проверка работы

1. Откройте браузер: http://localhost:5173
2. Проверьте API: http://localhost:5000/api/health
3. Должен вернуться: `{"status":"OK","message":"Сервер работает","environment":"development"}`

## 5️⃣ Тестирование функционала

1. **Регистрация**: перейдите на `/register`
2. **Вход**: на `/login`
3. **Каталог рецептов**: `/catalog`
4. **Ваши рецепты**: `/profile`

## 🔧 Решение проблем

### Ошибка подключения к БД: "ECONNREFUSED"

- ✓ Убедитесь, что MySQL запущен
- ✓ Проверьте DB_HOST, DB_PORT, DB_USER, DB_PASSWORD в `.env`

### Фронт не видит API

- ✓ Бэкенд должен работать на `http://localhost:5000`
- ✓ Проверьте консоль браузера (F12) на CORS ошибки
- ✓ Проверьте вкладку Network - методы должны идти на `/api/*`

### "Port already in use"

Бэк на 5000:
```bash
lsof -i :5000
# Или на Windows:
netstat -ano | findstr :5000
```

Фронт на 5173:
```bash
lsof -i :5173
```

Затем kill процесс.

## 📝 API Endpoints

### Аутентификация
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/verify` - проверка токена

### Рецепты
- `GET /api/recipes` - все рецепты
- `GET /api/recipes/:id` - рецепт по ID
- `POST /api/recipes` - создать (нужен токен)
- `PUT /api/recipes/:id` - обновить (нужен токен)
- `DELETE /api/recipes/:id` - удалить (нужен токен)

### Избранное
- `GET /api/favorites` - избранные рецепты (нужен токен)
- `POST /api/favorites/:recipeId` - добавить в избранное
- `DELETE /api/favorites/:recipeId` - удалить из избранного

### Профиль
- `GET /api/profile` - получить профиль (нужен токен)
- `PUT /api/profile` - обновить профиль (нужен токен)

## 🚀 Развертывание на сервере

Смотрите `SETUP_SERVER.md` для инструкций по развертыванию на `151.247.196.66`

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=clowns_db

JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRE=7d
```

**Если у вас другой пароль от MySQL**, измените `DB_PASSWORD`:
```env
DB_PASSWORD=ваш_пароль_от_mysql
```

## Шаг 4: Запуск проекта

**Терминал 1 (Backend):**
```bash
cd backend
npm run dev
```

Должно появиться:
```
╔═══════════════════════════════════════════╗
║ 🍟 CLOWNS API СЕРВЕР ЗАПУЩЕН 🍟           ║
╠═══════════════════════════════════════════╣
║ Порт: 5000
║ Окружение: development
║ Frontend URL: http://localhost:5173
╚═══════════════════════════════════════════╝
```

**Терминал 2 (Frontend):**
```bash
npm run dev
```

Должно появиться:
```
  VITE v8.0.1  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Шаг 5: Открыть сайт

Откройте браузер и переходите на: **http://localhost:5173**

## Тестовые учётные данные

**Админ:**
- Email: `admin@clowns.local`
- Пароль: `admin123`

**Пользователь:**
- Email: `anna@clowns.local`
- Пароль: `admin123`

## Проверка подключения к БД

Откройте в браузере: **http://localhost:5000/api/health**

Должна быть ответ:
```json
{
  "status": "OK",
  "message": "Сервер работает",
  "environment": "development"
}
```

## Решение проблем

### ❌ "Can't connect to MySQL server"
- Убедитесь, что MySQL запущен (WampServer должен быть зелёным)
- Проверьте `DB_HOST`, `DB_USER`, `DB_PASSWORD` в .env

### ❌ "Port 5000 already in use"
Измените в `.env`:
```env
PORT=5001
```

### ❌ "CORS error в браузере"
Убедитесь, что `FRONTEND_URL` в `.env` соответствует URL вашего фронтенда

### ❌ "Cannot find module 'mysql2'"
```bash
cd backend
npm install --save mysql2
```

### ❌ "Database doesn't exist"
Пересоздайте БД:
```bash
mysql -u root -p < database.sql
```

## Команды для разработки

```bash
# В корне проекта - запуск frontend (Vite)
npm run dev          # Разработка
npm run build        # Производство
npm run preview      # Предпросмотр сборки
npm run lint         # Проверка кода

# В папке backend - запуск backend (Express)
npm run dev          # Разработка
npm start            # Production
npm run prod         # Production с явным указанием
```

## PostgreSQL вместо MySQL?

Если хотите использовать PostgreSQL, отредактируйте:
1. `backend/index.js` - замените `mysql2` на `pg`
2. `database.sql` - адаптируйте SQL синтаксис для PostgreSQL
3. `.env` - измените параметры подключения

## Получить помощь

При ошибках проверьте:
1. Логи в консоли терминала (там обычно есть подробное описание)
2. Консоль DevTools браузера (F12)
3. Сетевые запросы в DevTools (вкладка Network)
