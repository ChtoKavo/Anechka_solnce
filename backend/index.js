import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql2 from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

// Загрузка переменных окружения
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// ============================================
// КОНФИГУРАЦИЯ ЗАГРУЗКИ ФАЙЛОВ
// ============================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recipe-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения допускаются'));
    }
  }
});

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const PORT = process.env.BACKEND_PORT || 5000;
const BACKEND_HOST = process.env.BACKEND_HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : 
  ['http://localhost:5173', 'http://localhost:3000'];
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clowns_db',
  }
};

// ============================================
// MYSQL ПОДКЛЮЧЕНИЕ (ПУЛЛ)
// ============================================
let pool;

const initDatabase = async () => {
  try {
    console.log(`📡 Подключение к БД ${config.db.host}:${config.db.port}/${config.db.database}...`);
    
    pool = mysql2.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
    });

    // Тест подключения с timeout
    const testConnection = async () => {
      const connection = await pool.getConnection();
      try {
        await connection.ping();
      } finally {
        connection.release();
      }
    };

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout подключения (10 сек)')), 10000)
    );

    await Promise.race([testConnection(), timeoutPromise]);
    console.log('✓ MySQL подключение успешно!');
  } catch (error) {
    console.error('✗ Ошибка подключения к MySQL:', error.message);
    console.error('  Хост:', config.db.host);
    console.error('  Порт:', config.db.port);
    console.error('  БД:', config.db.database);
    console.error('  Пользователь:', config.db.user);
    process.exit(1);
  }
};

// ============================================
// MIDDLEWARE
// ============================================
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ЛОГИРОВАНИЕ ЗАПРОСОВ
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// ДОСТУП К ЗАГРУЖЕННЫМ ФАЙЛАМ
app.use('/uploads', express.static(uploadsDir));

// ============================================
// УТИЛИТЫ ДЛЯ JWT И БЕЗОПАСНОСТИ
// ============================================
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не найден' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Невалидный или истёкший токен' });
  }

  req.userId = decoded.userId;
  next();
};

const adminMiddleware = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT role FROM users WHERE id = ?', [req.userId]);
    connection.release();

    if (!users[0] || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Ошибка проверки прав' });
  }
};

// ============================================
// API МАРШРУТЫ
// ============================================

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает', environment: NODE_ENV });
});

// ============================================
// АУТЕНТИФИКАЦИЯ
// ============================================

// РЕГИСТРАЦИЯ
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, phone, email, password, subscribe_newsletter } = req.body;

    if (!full_name || !phone || !email || !password) {
      return res.status(400).json({ error: 'Не все поля заполнены' });
    }

    const connection = await pool.getConnection();

    // ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОЛЬЗОВАТЕЛЯ
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email или телефон уже зарегистрированы' });
    }

    // ХЕШИРОВАНИЕ ПАРОЛЯ
    const password_hash = await bcrypt.hash(password, 10);

    // ВСТАВКА НОВОГО ПОЛЬЗОВАТЕЛЯ
    const [result] = await connection.execute(
      'INSERT INTO users (full_name, phone, email, password_hash, subscribe_newsletter) VALUES (?, ?, ?, ?, ?)',
      [full_name, phone, email, password_hash, subscribe_newsletter ? 1 : 0]
    );

    connection.release();

    const token = generateToken(result.insertId);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: result.insertId,
        full_name,
        email,
        phone,
      },
    });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// ВХОД (LOGIN)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: 'Email/телефон и пароль обязательны' });
    }

    const connection = await pool.getConnection();

    // ПОИСК ПОЛЬЗОВАТЕЛЯ
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email || '', phone || '']
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user = users[0];

    // ПРОВЕРКА ПАРОЛЯ
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    connection.release();

    const token = generateToken(user.id);

    res.json({
      message: 'Успешный вход',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// ПРОВЕРКА ТОКЕНА
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT id, full_name, email, phone, role FROM users WHERE id = ?', [req.userId]);
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Ошибка проверки токена:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// РЕЦЕПТЫ
// ============================================

// ПОЛУЧИТЬ ВСЕ РЕЦЕПТЫ
app.get('/api/recipes', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [recipes] = await connection.execute(
      `SELECT r.*, u.full_name as author 
       FROM recipes r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.is_published = 1 
       ORDER BY r.created_at DESC 
       LIMIT 100`
    );
    connection.release();

    res.json(recipes);
  } catch (err) {
    console.error('Ошибка получения рецептов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ПОЛУЧИТЬ РЕЦЕПТ ПО ID
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [recipes] = await connection.execute(
      `SELECT r.*, u.full_name as author 
       FROM recipes r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Рецепт не найден' });
    }

    const recipe = recipes[0];

    // ПОЛУЧИТЬ ИНГРЕДИЕНТЫ
    const [ingredients] = await connection.execute(
      'SELECT * FROM ingredients WHERE recipe_id = ?',
      [id]
    );

    // ПОЛУЧИТЬ ШАГИ
    const [steps] = await connection.execute(
      'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number',
      [id]
    );

    connection.release();

    res.json({ ...recipe, ingredients, steps });
  } catch (err) {
    console.error('Ошибка получения рецепта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// СОЗДАТЬ РЕЦЕПТ
app.post('/api/recipes', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { title, description, image_url, difficulty, time_minutes, portions, calories, ingredients: ingr, steps: stps } = req.body;

    console.log('Creating recipe:', { title, difficulty, time_minutes, portions, calories, ingr_count: ingr?.length, stps_count: stps?.length });

    if (!title) {
      return res.status(400).json({ error: 'Название рецепта обязательно' });
    }

    connection = await pool.getConnection();

    // СОЗДАТЬ РЕЦЕПТ
    const [result] = await connection.execute(
      `INSERT INTO recipes (user_id, title, description, image_url, difficulty, time_minutes, portions, calories, is_published) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [req.userId, title, description || '', image_url || null, difficulty || 1, parseInt(time_minutes) || 0, parseInt(portions) || 1, calories || 0]
    );

    const recipeId = result.insertId;
    console.log('Recipe created with ID:', recipeId);

    // ДОБАВИТЬ ИНГРЕДИЕНТЫ
    if (ingr && Array.isArray(ingr) && ingr.length > 0) {
      for (const ingredient of ingr) {
        if (ingredient.name && ingredient.quantity) {
          await connection.execute(
            'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
            [recipeId, ingredient.name, ingredient.quantity || '', ingredient.unit || '']
          );
        }
      }
      console.log('Ingredients added:', ingr.length);
    }

    // ДОБАВИТЬ ШАГИ
    if (stps && Array.isArray(stps) && stps.length > 0) {
      for (let i = 0; i < stps.length; i++) {
        const stepText = stps[i].text || stps[i].description || '';
        if (stepText) {
          await connection.execute(
            'INSERT INTO recipe_steps (recipe_id, step_number, description, image_url) VALUES (?, ?, ?, ?)',
            [recipeId, i + 1, stepText, stps[i].image_url || null]
          );
        }
      }
      console.log('Steps added:', stps.length);
    }

    connection.release();

    res.status(201).json({
      message: 'Рецепт успешно создан',
      recipeId,
    });
  } catch (err) {
    if (connection) connection.release();
    console.error('Ошибка создания рецепта:', err.message, err.stack);
    res.status(500).json({ error: 'Ошибка сервера при создании рецепта: ' + err.message });
  }
});

// ОБНОВИТЬ РЕЦЕПТ
app.put('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, time_minutes, portions, calories } = req.body;

    const connection = await pool.getConnection();

    // ПРОВЕРИТЬ ПРАВО СОБСТВЕННОСТИ
    const [recipes] = await connection.execute('SELECT user_id FROM recipes WHERE id = ?', [id]);

    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Рецепт не найден' });
    }

    if (recipes[0].user_id !== req.userId) {
      connection.release();
      return res.status(403).json({ error: 'Вы не можете редактировать этот рецепт' });
    }

    // ОБНОВИТЬ РЕЦЕПТ
    await connection.execute(
      'UPDATE recipes SET title = ?, description = ?, difficulty = ?, time_minutes = ?, portions = ?, calories = ? WHERE id = ?',
      [title, description, difficulty, time_minutes, portions, calories, id]
    );

    connection.release();

    res.json({ message: 'Рецепт успешно обновлен' });
  } catch (err) {
    console.error('Ошибка обновления рецепта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// УДАЛИТЬ РЕЦЕПТ
app.delete('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    // ПРОВЕРИТЬ ПРАВО СОБСТВЕННОСТИ
    const [recipes] = await connection.execute('SELECT user_id FROM recipes WHERE id = ?', [id]);

    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Рецепт не найден' });
    }

    if (recipes[0].user_id !== req.userId) {
      connection.release();
      return res.status(403).json({ error: 'Вы не можете удалить этот рецепт' });
    }

    // УДАЛИТЬ РЕЦЕПТ (каскадное удаление через FOREIGN KEY)
    await connection.execute('DELETE FROM recipes WHERE id = ?', [id]);

    connection.release();

    res.json({ message: 'Рецепт успешно удален' });
  } catch (err) {
    console.error('Ошибка удаления рецепта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// ИЗБРАННЫЕ РЕЦЕПТЫ
// ============================================

// ПОЛУЧИТЬ ИЗБРАННЫЕ РЕЦЕПТЫ ПОЛЬЗОВАТЕЛЯ
app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [favorites] = await connection.execute(
      `SELECT r.* FROM recipes r 
       INNER JOIN favorites f ON r.id = f.recipe_id 
       WHERE f.user_id = ? 
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    connection.release();

    res.json(favorites);
  } catch (err) {
    console.error('Ошибка получения избранных:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ДОБАВИТЬ В ИЗБРАННЫЕ
app.post('/api/favorites/:recipeId', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const connection = await pool.getConnection();

    // ПРОВЕРИТЬ СУЩЕСТВОВАНИЕ РЕЦЕПТА
    const [recipes] = await connection.execute('SELECT id FROM recipes WHERE id = ?', [recipeId]);

    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Рецепт не найден' });
    }

    // ДОБАВИТЬ В ИЗБРАННЫЕ
    await connection.execute(
      'INSERT IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)',
      [req.userId, recipeId]
    );

    connection.release();

    res.status(201).json({ message: 'Рецепт добавлен в избранные' });
  } catch (err) {
    console.error('Ошибка добавления в избранные:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// УДАЛИТЬ ИЗ ИЗБРАННЫХ
app.delete('/api/favorites/:recipeId', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const connection = await pool.getConnection();

    await connection.execute(
      'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
      [req.userId, recipeId]
    );

    connection.release();

    res.json({ message: 'Рецепт удален из избранных' });
  } catch (err) {
    console.error('Ошибка удаления из избранных:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
// ============================================

// ПОЛУЧИТЬ ПРОФИЛЬ
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, full_name, email, phone, avatar_url, bio, role, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // ПОЛУЧИТЬ РЕЦЕПТЫ ПОЛЬЗОВАТЕЛЯ
    const [recipes] = await connection.execute(
      'SELECT id, title, image_url, difficulty FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    connection.release();

    res.json({ ...users[0], recipes });
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ОБНОВИТЬ ПРОФИЛЬ
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { full_name, bio, avatar_url, phone, email } = req.body;
    const connection = await pool.getConnection();

    // Если меняем email или phone, проверяем уникальность
    if (email) {
      const [existingEmail] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.userId]
      );
      if (existingEmail.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Эта почта уже зарегистрирована' });
      }
    }

    if (phone) {
      const [existingPhone] = await connection.execute(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, req.userId]
      );
      if (existingPhone.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Этот телефон уже зарегистрирован' });
      }
    }

    // Обновляем профиль
    const updates = [];
    const values = [];
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (updates.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Нечего обновлять' });
    }

    values.push(req.userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await connection.execute(query, values);
    connection.release();

    res.json({ message: 'Профиль успешно обновлен' });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// АДМИН ПАНЕЛЬ
// ============================================

// ПОЛУЧИТЬ ВСЕ ПОЛЬЗОВАТЕЛЕЙ
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, full_name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    connection.release();

    res.json(users);
  } catch (err) {
    console.error('Ошибка получения пользователей:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ПОЛУЧИТЬ ВСЕ РЕЦЕПТЫ (для админа)
app.get('/api/admin/recipes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [recipes] = await connection.execute(
      `SELECT r.*, u.full_name as author 
       FROM recipes r 
       LEFT JOIN users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC`
    );
    connection.release();

    res.json(recipes);
  } catch (err) {
    console.error('Ошибка получения рецептов администратором:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ (админ)
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.execute('DELETE FROM users WHERE id = ?', [id]);

    connection.release();

    res.json({ message: 'Пользователь удален' });
  } catch (err) {
    console.error('Ошибка удаления пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// УДАЛИТЬ РЕЦЕПТ (админ)
app.delete('/api/admin/recipes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.execute('DELETE FROM recipes WHERE id = ?', [id]);

    connection.release();

    res.json({ message: 'Рецепт удален' });
  } catch (err) {
    console.error('Ошибка удаления рецепта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ИЗМЕНИТЬ СТАТУС ПУБЛИКАЦИИ РЕЦЕПТА (админ)
app.put('/api/admin/recipes/:id/publish', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    const connection = await pool.getConnection();

    await connection.execute('UPDATE recipes SET is_published = ? WHERE id = ?', [is_published ? 1 : 0, id]);

    connection.release();

    res.json({ message: 'Статус рецепта обновлен' });
  } catch (err) {
    console.error('Ошибка обновления статуса рецепта:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ИЗМЕНИТЬ СТАТУС АКТИВНОСТИ ПОЛЬЗОВАТЕЛЯ (админ)
app.put('/api/admin/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const connection = await pool.getConnection();

    await connection.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

    connection.release();

    res.json({ message: 'Статус пользователя обновлен' });
  } catch (err) {
    console.error('Ошибка обновления статуса пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// ЗАГРУЗКА ИЗОБРАЖЕНИЯ (ПЕРЕД 404!)
// ============================================
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('Файл загружен:', imageUrl);
    
    res.json({
      message: 'Файл успешно загружен',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Ошибка загрузки файла:', err.message);
    res.status(500).json({ error: 'Ошибка загрузки файла: ' + err.message });
  }
});

// ============================================
// 404 - Not Found (в конце!)
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
    method: req.method,
  });
});

// ============================================
// ОБРАБОТЧИК ОШИБОК (должен быть в конце!)
// ============================================
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, BACKEND_HOST, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║ 🍟 CLOWNS API СЕРВЕР ЗАПУЩЕН 🍟           ║
╠═══════════════════════════════════════════╣
║ IP адрес: http://${BACKEND_HOST}:${PORT}
║ Окружение: ${NODE_ENV}
║ Разрешённые источники: ${ALLOWED_ORIGINS.join(', ')}
║ Версия Node: ${process.version}
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServer();