import { useState, useEffect } from 'react';
import { recipesAPI, favoritesAPI, profileAPI } from '../services/api';
import logo from '../assets/main/Logo.png';
import searchIcon from '../assets/header/search.jpg';
import fav from '../assets/header/fav.png';
import user from '../assets/header/user.png';
import recipe1 from '../assets/strrecept/1.png';
import recipe2 from '../assets/strrecept/2.png';
import recipe3 from '../assets/strrecept/3.png';
import recipe4 from '../assets/strrecept/4.png';
import recipe5 from '../assets/strrecept/5.png';
import recipe6 from '../assets/strrecept/6.png';
import recipe7 from '../assets/strrecept/7.png';
import recipe8 from '../assets/strrecept/8.png';
import recipe9 from '../assets/strrecept/9.png';
import recipe10 from '../assets/strrecept/10.png';
import recipe11 from '../assets/strrecept/11.png';
import recipe12 from '../assets/strrecept/12.png';
import vk from '../assets/footer/vk.svg';
import ok from '../assets/footer/ok.png';
import tg from '../assets/footer/tg.png';
import youtube from '../assets/footer/youtube.png';

const recipeImages = {
  1: recipe1, 2: recipe2, 3: recipe3, 4: recipe4, 5: recipe5, 6: recipe6,
  7: recipe7, 8: recipe8, 9: recipe9, 10: recipe10, 11: recipe11, 12: recipe12,
};

export default function RecipePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id') || 1;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  const getProfileLink = () => {
    const token = localStorage.getItem('authToken')
    return token ? '/profile' : '/login'
  }

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const data = await recipesAPI.getById(recipeId);
        setRecipe(data.recipe || data);
      } catch (err) {
        setError(err.message);
        console.error('Error loading recipe:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadUserRole = async () => {
      try {
        const profileData = await profileAPI.get();
        setIsAdmin(profileData.role === 'admin');
      } catch (err) {
        console.log('User not logged in');
      }
    };

    loadRecipe();
    loadUserRole();
  }, [recipeId]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Загрузка рецепта...</div>;
  if (error) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>Ошибка: {error}</div>;
  if (!recipe) return <div style={{ padding: '50px', textAlign: 'center' }}>Рецепт не найден</div>;

  const renderDifficulty = (level) => {
    const icons = Array(level || 1).fill('🟢') + Array(Math.max(0, 3 - (level || 1))).fill('⚪');
    return icons;
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <a className="logo-section" href="/">
            <img src={logo} alt="Logo" className="logo" />
          </a>

          <div className="search-section">
            <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
              <input
                type="text"
                placeholder="НАЙТИ РЕЦЕПТ"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-button" type="submit" aria-label="Поиск">
                <img src={searchIcon} alt="Поиск" />
              </button>
            </form>
          </div>

          <div className="icons-section">
            <a className="icon-button" href="/favorites" aria-label="Избранное">
              <img src={fav} alt="Избранное" />
            </a>
            <a className="icon-button" href={getProfileLink()} aria-label="Профиль">
              <img src={user} alt="Профиль" />
            </a>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <ul className="nav-menu">
          <li><a href="/">ПЕРВОЕ</a></li>
          <li><a href="/">ВТОРОЕ</a></li>
          <li><a href="/">ДЕСЕРТЫ</a></li>
          <li><a href="/">САЛАТЫ</a></li>
          <li><a href="/">ЗАКУСКИ</a></li>
        </ul>
      </nav>

      <main className="main-content-recipe">
        <section className="recipe-detail">
          <div className="recipe-image-container">
            <img src={recipe.image_url || recipe1} alt={recipe.title || recipe.name} className="recipe-detail-image" />
            <span className="recipe-number">{recipe.id}</span>
          </div>

          <div className="recipe-right">
            <div className="recipe-info">
              <h1 className="recipe-title">{recipe.title || recipe.name}</h1>
              <p className="recipe-author">{recipe.author || 'Автор неизвестен'}</p>
              <div className="recipe-meta">
                <span className="recipe-time">⏱ {recipe.time_minutes ? recipe.time_minutes + ' мин' : 'Время неизвестно'}</span>
                <span className="recipe-calories">🔥 {recipe.calories ? recipe.calories + ' ккал' : 'Калории неизвестны'}</span>
              </div>
            </div>

            <div className="recipe-ingredients-table">
              <h2>ИНГРЕДИЕНТЫ</h2>
              <table>
                <thead>
                  <tr>
                    <th>НАЗВАНИЕ</th>
                    <th>КОЛИЧЕСТВО</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients && recipe.ingredients.map((ing, idx) => (
                    <tr key={idx}>
                      <td>{ing.name}</td>
                      <td>{ing.quantity} {ing.unit || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="recipe-difficulty">
              <span>СЛОЖНОСТЬ:</span>
              <span className="difficulty-icons">{renderDifficulty(recipe.difficulty || 1)}</span>
            </div>
          </div>
        </section>

        <section className="recipe-description">
          <h2>ОПИСАНИЕ</h2>
          <p>{recipe.description || 'Описание отсутствует'}</p>
        </section>

        <section className="recipe-cooking">
          <h2>КАК ПРИГОТОВИТЬ</h2>
          <ol className="cooking-steps">
            {recipe.steps && recipe.steps.map((step, idx) => (
              <li key={idx} className="cooking-step-item">
                <div className="cooking-step-image">
                  <img src={step.image_url || recipe1} alt={`Шаг ${idx + 1}`} />
                </div>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo-col">
            <img src={logo} alt="Logo" className="footer-logo" />
            <div className="footer-socials">
              <a href="#" className="footer-social-link"><img src={vk} alt="ВКонтакте" /></a>
              <a href="#" className="footer-social-link"><img src={ok} alt="Одноклассники" /></a>
              <a href="#" className="footer-social-link"><img src={tg} alt="Telegram" /></a>
              <a href="#" className="footer-social-link"><img src={youtube} alt="YouTube" /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">СТРАНИЦЫ</h4>
            <ul className="footer-links">
              <li><a href="/">Главная</a></li>
              <li><a href="/catalog">Каталог</a></li>
              <li><a href="/favorites">Избранное</a></li>
              <li><a href="/profile">Профиль</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">КАТЕГОРИИ</h4>
            <ul className="footer-links">
              <li><a href="/">ПЕРВОЕ</a></li>
              <li><a href="/">ВТОРОЕ</a></li>
              <li><a href="/">ДЕСЕРТЫ</a></li>
              <li><a href="/">САЛАТЫ</a></li>
            </ul>
          </div>

          <div className="footer-admin-col">
            {isAdmin && <a href="/admin" className="footer-admin-button">АДМИН-ПАНЕЛЬ</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
