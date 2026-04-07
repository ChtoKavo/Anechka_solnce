# 🚀 Проект Anechka_solnce запущен на cartoshka.site

## Статус сервера

✅ **Backend**: Запущен на порту 5000 через PM2  
✅ **Frontend**: Собран и готов, статические файлы в `/dist`  
✅ **Database**: Подключена к 151.247.196.66  
✅ **Nginx**: Настроен и работает на портах 80/443  

## 📍 Как получить доступ

### Шаг 1: Убедитесь, что DNS настроен на ваш домен

Укажите у регистратора домена, что `cartoshka.site` указывает на IP: **151.247.196.66**

**Примеры A-записей:**
```
cartoshka.site    A    151.247.196.66
www.cartoshka.site    CNAME    cartoshka.site
```

### Шаг 2: После настройки DNS (может занять 5-30 минут)

Откройте в браузере:
- **http://cartoshka.site** - вы попадете на главную страницу приложения
- **https://cartoshka.site** - HTTPS (потребуется SSL сертификат)

## 🔧 Команды управления

### Просмотр статуса всех приложений
```bash
pm2 list
```

### Просмотр логов backend
```bash
pm2 logs backend
```

### Остановка backend
```bash
pm2 stop backend
```

### Перезапуск backend
```bash
pm2 restart backend
```

### Проверка Nginx
```bash
sudo systemctl status nginx
sudo nginx -t  # Проверка синтаксиса конфигурации
```

## 📦 Структура проекта

- **`/root/Картошcka/Anechka_solnce/dist`** - Собранный frontend (статические файлы)
- **`/root/Картошcka/Anechka_solnce/backend`** - Backend API сервер (Node.js)
- **`/etc/nginx/sites-enabled/cartoshka.site`** - Конфигурация Nginx

## 🔐 HTTPS и SSL сертификат

Для включения HTTPS рекомендуется использовать Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cartoshka.site -d www.cartoshka.site
```

Или обновите конфиг вручную в `/etc/nginx/sites-available/cartoshka.site`.

## 📝 Важные переменные окружения

Текущие настройки в `.env`:

```env
NODE_ENV=production
BACKEND_PORT=5000
BACKEND_HOST=0.0.0.0
DB_HOST=151.247.196.66
DB_USER=admin
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://cartoshka.site,https://cartoshka.site
```

Все правильно настроено для работы с вашим доменом! 🎉
