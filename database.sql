-- =====================================================
-- БАЗА ДАННЫХ ДЛЯ САЙТА РЕЦЕПТОВ "CLOWNS"
-- =====================================================
-- Создание базы данных
CREATE DATABASE IF NOT EXISTS clowns_db;
USE clowns_db;

-- =====================================================
-- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  subscribe_newsletter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_role (role)
);

-- =====================================================
-- ТАБЛИЦА РЕЦЕПТОВ
-- =====================================================
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  difficulty INT DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 3),
  time_minutes INT,
  portions INT,
  calories INT,
  views_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_published (is_published),
  INDEX idx_created_at (created_at)
);

-- =====================================================
-- ТАБЛИЦА ИНГРЕДИЕНТОВ
-- =====================================================
CREATE TABLE ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity VARCHAR(100),
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe_id (recipe_id)
);

-- =====================================================
-- ТАБЛИЦА ЭТАПОВ ПРИГОТОВЛЕНИЯ
-- =====================================================
CREATE TABLE recipe_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  step_number INT NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe_id (recipe_id),
  UNIQUE KEY unique_recipe_step (recipe_id, step_number)
);

-- =====================================================
-- ТАБЛИЦА ИЗБРАННЫХ РЕЦЕПТОВ
-- =====================================================
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_recipe (user_id, recipe_id),
  INDEX idx_user_id (user_id),
  INDEX idx_recipe_id (recipe_id)
);

-- =====================================================
-- ТАБЛИЦА КОММЕНТАРИЕВ
-- =====================================================
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_user_id (user_id)
);

-- =====================================================
-- ТАБЛИЦА КАТЕГОРИЙ РЕЦЕПТОВ
-- =====================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА СВЯЗИ РЕЦЕПТОВ И КАТЕГОРИЙ
-- =====================================================
CREATE TABLE recipe_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  category_id INT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_recipe_category (recipe_id, category_id),
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_category_id (category_id)
);

-- =====================================================
-- ВСТАВКА НАЧАЛЬНЫХ ДАННЫХ - КАТЕГОРИИ
-- =====================================================
INSERT INTO categories (name, description) VALUES
('Новые рецепты', 'Недавно добавленные рецепты'),
('Праздничные', 'Рецепты для особых случаев'),
('Быстрые', 'Рецепты которые готовятся быстро'),
('Экономные', 'Бюджетные рецепты'),
('Диетические', 'Низкокалорийные рецепты');

-- =====================================================
-- ВСТАВКА ТЕСТОВЫХ ДАННЫХ - ПОЛЬЗОВАТЕЛЬ АДМИН
-- =====================================================
-- Пароль: admin123 (bcrypt hash)
INSERT INTO users (full_name, phone, email, password_hash, role, is_active, subscribe_newsletter) VALUES
('Администратор', '+7999999999', 'admin@clowns.local', '$2b$10$lbOhEZ.F1G8hI.X2B2ZcDu6aKFVPk8lR2O5K5pZ8z3X9.c6J0Yy8i', 'admin', TRUE, FALSE),
('Ильина Анна', '+71234567890', 'anna@clowns.local', '$2b$10$lbOhEZ.F1G8hI.X2B2ZcDu6aKFVPk8lR2O5K5pZ8z3X9.c6J0Yy8i', 'user', TRUE, TRUE);

-- =====================================================
-- ВСТАВКА ТЕСТОВЫХ РЕЦЕПТОВ
-- =====================================================
INSERT INTO recipes (user_id, title, description, difficulty, time_minutes, portions, calories, is_published) VALUES
(2, 'КАРТОШКА В МУНДИРЕ', 'Вкусная и простая картошка в мундире', 1, 25, 4, 180, TRUE),
(2, 'КАРТОШКА ФРИ', 'Хрустящая картошка фри для всей семьи', 2, 20, 4, 310, TRUE),
(2, 'КАРТОФЕЛЬНОЕ ПЮРЕ', 'Нежное и пышное картофельное пюре', 1, 30, 4, 120, TRUE);

-- =====================================================
-- ВСТАВКА ИНГРЕДИЕНТОВ ДЛЯ РЕЦЕПТОВ
-- =====================================================
-- Для рецепта "Картошка в мундире" (id=1)
INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES
(1, 'Картофель', '1', 'кг'),
(1, 'Соль', '1', 'ч.л.'),
(1, 'Вода', '2', 'л');

-- Для рецепта "Картошка фри" (id=2)
INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES
(2, 'Картофель', '800', 'г'),
(2, 'Растительное масло', '1', 'л'),
(2, 'Соль и перец', 'по вкусу', '');

-- Для рецепта "Картофельное пюре" (id=3)
INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES
(3, 'Картофель', '1', 'кг'),
(3, 'Молоко', '200', 'мл'),
(3, 'Масло сливочное', '50', 'г'),
(3, 'Соль', 'по вкусу', '');

-- =====================================================
-- ВСТАВКА ЭТАПОВ ПРИГОТОВЛЕНИЯ
-- =====================================================
-- Для рецепта "Картошка в мундире" (id=1)
INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES
(1, 1, 'Помойте картошку и очистите её'),
(1, 2, 'Посолите воду в кастрюле'),
(1, 3, 'Положите картошку в воду'),
(1, 4, 'Варите 20-25 минут до готовности'),
(1, 5, 'Слейте воду и подавайте горячей');

-- Для рецепта "Картошка фри" (id=2)
INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES
(2, 1, 'Нарежьте картофель соломкой'),
(2, 2, 'Замочите картофель в холодной воде на 30 минут'),
(2, 3, 'Разогрейте масло до 180°C'),
(2, 4, 'Обсушите картофель'),
(2, 5, 'Жарьте порциями 3-4 минуты до золотистого цвета'),
(2, 6, 'Переложите на бумажные полотенца и посолите');

-- Для рецепта "Картофельное пюре" (id=3)
INSERT INTO recipe_steps (recipe_id, step_number, description) VALUES
(3, 1, 'Нарежьте картофель кубиками'),
(3, 2, 'Варите в подсоленной воде 15 минут'),
(3, 3, 'Слейте воду и верните в кастрюлю'),
(3, 4, 'Добавьте горячее молоко и масло'),
(3, 5, 'Разомните до гладкой консистенции'),
(3, 6, 'Посолите и поперчите по вкусу');

-- =====================================================
-- ВСТАВКА СВЯЗЕЙ РЕЦЕПТОВ И КАТЕГОРИЙ
-- =====================================================
INSERT INTO recipe_categories (recipe_id, category_id) VALUES
(1, 1), (1, 2),
(2, 1),
(3, 1);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- =====================================================
CREATE INDEX idx_recipes_published ON recipes(is_published);
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_recipes_created ON recipes(created_at DESC);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_comments_recipe ON comments(recipe_id);
CREATE INDEX idx_comments_user ON comments(user_id);
