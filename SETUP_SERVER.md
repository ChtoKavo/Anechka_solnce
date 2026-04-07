# 🍟 CLOWNS - Инструкция по развертыванию на сервере 151.247.196.66

## Требования на сервере:
- Node.js (v16 или выше)
- MySQL Server
- Nginx или Apache (для reverse proxy)
- PM2 или Supervisor (для управления процессами)
- SSH доступ
- Доменное имя (опционально, можно использовать IP)

## Шаг 1: Подключение к серверу

```bash
# Подключитесь через SSH
ssh root@151.247.196.66
# Или если у вас другой пользователь:
ssh username@151.247.196.66
```

## Шаг 2: Установка необходимого ПО

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js (если его ещё нет)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установите MySQL Server
sudo apt install -y mysql-server

# Установите Nginx (для reverse proxy)
sudo apt install -y nginx

# Установите PM2 (для управления Node приложениями)
sudo npm install -g pm2
```

## Шаг 3: Подготовка БД на сервере

```bash
# Подключитесь к MySQL
sudo mysql -u root

# В консоли MySQL выполните:
```

```sql
-- Создайте пользователя для БД
CREATE USER 'clowns_user'@'localhost' IDENTIFIED BY 'YourSecurePasswordHere123!@#';

-- Создайте БД
CREATE DATABASE clowns_db;

-- Дайте права пользователю
GRANT ALL PRIVILEGES ON clowns_db.* TO 'clowns_user'@'localhost';
FLUSH PRIVILEGES;

-- Выход
EXIT;
```

```bash
# Импортируйте структуру БД
sudo mysql -u clowns_user -p clowns_db < /path/to/database.sql

# Когда попросит пароль, введите: YourSecurePasswordHere123!@#
```

## Шаг 4: Развертывание приложения

```bash
# Склонируйте репозиторий (или скопируйте файлы через SFTP)
cd /var/www
git clone https://github.com/ChtoKavo/clowns.git

# Или если используете SFTP, распакуйте архив:
# unzip clowns.zip

cd clowns

# Установите зависимости frontend
npm install

# Установите зависимости backend
cd backend
npm install
cd ..
```

## Шаг 5: Конфигурация .env для сервера

```bash
# Создайте .env файл в backend/
nano backend/.env
```

Вставьте этот контент (или используйте .env.production):

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://151.247.196.66

DB_HOST=localhost
DB_USER=clowns_user
DB_PASSWORD=YourSecurePasswordHere123!@#
DB_NAME=clowns_db

JWT_SECRET=your-very-secure-production-secret-key-min-32-chars-long
JWT_EXPIRE=7d
```

Сохраните: Ctrl+X, Y, Enter

## Шаг 6: Сборка фронтенда

```bash
# В корне проекта
npm run build

# Это создаст папку dist/ с готовыми файлами
```

## Шаг 7: Настройка Nginx для reverse proxy

```bash
# Создайте конфиг для Nginx
sudo nano /etc/nginx/sites-available/clowns
```

Вставьте:

```nginx
server {
    listen 80;
    server_name 151.247.196.66;
    # Или если у вас доменное имя:
    # server_name youromain.com www.yourdomain.com;

    # Статические файлы фронтенда
    location / {
        root /var/www/clowns;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API запросы
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Включите сайт
sudo ln -s /etc/nginx/sites-available/clowns /etc/nginx/sites-enabled/

# Проверьте конфиг Nginx
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl restart nginx
```

## Шаг 8: Запуск backend приложения с PM2

```bash
cd /var/www/clowns/backend

# Запустите приложение через PM2
pm2 start index.js --name "clowns-api"

# Сделайте PM2 автозапуском после перезагрузки сервера
pm2 startup
pm2 save

# Проверьте статус
pm2 status
pm2 logs clowns-api  # для просмотра логов
```

## Шаг 9: SSL сертификат (HTTPS)

**Рекомендуется! Используйте Let's Encrypt:**

```bash
# Установите Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d 151.247.196.66
# Или с доменом:
# sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Сертификат автоматически обновляется
```

## Проверка работоспособности

```bash
# API Health Check
curl http://151.247.196.66/api/health

# Должна быть ответ вроде:
# {"status":"OK","message":"Сервер работает","environment":"production"}
```

Откройте в браузере: `http://151.247.196.66` или `https://151.247.196.66`

## Команды для управления на сервере

```bash
# Просмотр логов backend
pm2 logs clowns-api

# Перезагрузка backend
pm2 restart clowns-api

# Остановка
pm2 stop clowns-api

# Удаление из PM2
pm2 delete clowns-api
```

## Обновление кода на сервере

```bash
cd /var/www/clowns

# Обновите код
git pull origin main

# Пересоберите frontend
npm run build

# Перезагрузите backend
pm2 restart clowns-api

# Перезагрузите Nginx
sudo systemctl restart nginx
```

## Мониторинг

```bash
# Просмотр маше у процессов PM2
pm2 monit

# Веб-хэнель для мониторинга (опционально)
pm2 web
# Откройте: http://localhost:9615
```

## Резервная копия БД

```bash
# Создать бэкап
mysqldump -u clowns_user -p clowns_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бэкапа
mysql -u clowns_user -p clowns_db < backup_20240101_120000.sql
```

## Production Checklist

- [ ] SSL сертификат установлен (HTTPS)
- [ ] `JWT_SECRET` изменён на длинный случайный ключ
- [ ] `DB_PASSWORD` установлен на сильный пароль
- [ ] Бэкапы БД настроены
- [ ] Логи настроены
- [ ] Firewall настроен (порты 80, 443 открыты, 5000 только для localhost)
- [ ] PM2 автозапуск включен
- [ ] Cron для автообновления сертификата работает

## Решение проблем

### ❌ "Connection refused" на 151.247.196.66
- Проверьте брандмауэр: `sudo ufw status`
- Откройте порты: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`

### ❌ "Cannot GET /" в браузере
- Проверьте, что `npm run build` выполнен
- Проверьте путь в конфиге Nginx

### ❌ Backend не запускается через PM2
- Проверьте логи: `pm2 logs`
- Проверьте .env файл
- Убедитесь, что MySQL запущен: `sudo systemctl status mysql`

### ❌ CORS ошибки на сервере
- Обновите `FRONTEND_URL` в production .env
- Перезагрузите backend: `pm2 restart clowns-api`

## Дополнительные ресурсы

- [PM2 Документация](https://pm2.keymetrics.io/)
- [Nginx Документация](https://nginx.org/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
