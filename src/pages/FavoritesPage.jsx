import { useState, useEffect } from 'react'
import '../App.css'
import { favoritesAPI, profileAPI } from '../services/api'
import logo from '../assets/main/Logo.png'
import searchIcon from '../assets/header/search.jpg'
import favIcon from '../assets/header/fav.png'
import userIcon from '../assets/header/user.png'
import hatGreen from '../assets/catalog/green.png'
import hatRed from '../assets/catalog/red.png'
import recMundire from '../assets/catalog/в мундире.png'
import iconVk from '../assets/footer/vk.svg'
import iconOk from '../assets/footer/ok.png'
import iconTg from '../assets/footer/tg.png'
import iconYt from '../assets/footer/youtube.png'

function renderDifficulty(level) {
  return (
    <>
      {Array.from({ length: level || 1 }).map((_, index) => (
        <img src={hatGreen} alt="" key={`green-${level}-${index}`} className="hat-icon" />
      ))}
      {Array.from({ length: Math.max(0, 3 - (level || 1)) }).map((_, index) => (
        <img src={hatRed} alt="" key={`red-${level}-${index}`} className="hat-icon hat-icon--empty" />
      ))}
    </>
  )
}

function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const getProfileLink = () => {
    const token = localStorage.getItem('authToken')
    return token ? '/profile' : '/login'
  }

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true)
        const data = await favoritesAPI.getAll()
        setFavorites(Array.isArray(data) ? data : data.favorites || [])
      } catch (err) {
        setError(err.message || 'Не авторизованы')
        console.error('Error loading favorites:', err)
      } finally {
        setLoading(false)
      }
    }

    const loadUserRole = async () => {
      try {
        const profileData = await profileAPI.get()
        setIsAdmin(profileData.role === 'admin')
      } catch (err) {
        console.log('User not logged in')
      }
    }

    loadFavorites()
    loadUserRole()
  }, [])
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
              <img src={favIcon} alt="Избранное" />
            </a>
            <a className="icon-button" href={getProfileLink()} aria-label="Профиль">
              <img src={userIcon} alt="Профиль" />
            </a>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <ul className="nav-menu">
          <li><a href="#first">ПЕРВОЕ</a></li>
          <li><a href="#second">ВТОРОЕ</a></li>
          <li><a href="#desserts">ДЕСЕРТЫ</a></li>
          <li><a href="#salads">САЛАТЫ</a></li>
          <li><a href="#appetizers">ЗАКУСКИ</a></li>
          <li><a href="#drinks">НАПИТКИ</a></li>
        </ul>
      </nav>

      <main className="main-content main-content-catalog">
        <section className="favorites-page">
          <div className="favorites-page-head">
            <h1 className="catalog-heading">ИЗБРАННОЕ</h1>
            <p className="catalog-subheading">МОИ РЕЦЕПТЫ</p>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}
          {error && <div style={{ color: 'red', padding: '20px' }}>Ошибка: {error}</div>}
          {!loading && favorites.length === 0 && <div style={{ padding: '20px' }}>Избранные рецепты не найдены</div>}

          {!loading && favorites.length > 0 && (
            <div className="favorites-grid">
              {favorites.map((recipe) => (
                <a href={`/recipe?id=${recipe.id}`} style={{ textDecoration: 'none' }} key={recipe.id}>
                  <div className="recipe-card">
                    <div className="recipe-card-img">
                      <img src={recipe.image_url || recMundire} alt={recipe.title} />
                    </div>
                    <div className="recipe-card-body">
                      <h3 className="recipe-card-title">{recipe.title}</h3>
                      <p className="recipe-card-author">{recipe.author || 'Автор'}</p>
                      <div className="recipe-card-footer">
                        <div className="recipe-difficulty">{renderDifficulty(recipe.difficulty)}</div>
                        <button className="recipe-fav" type="button" aria-label="Добавлено в избранное">
                          <img src={favIcon} alt="Избранное" />
                        </button>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo-col">
            <img src={logo} alt="Logo" className="footer-logo" />
            <div className="footer-socials">
              <a href="#" className="footer-social-link"><img src={iconVk} alt="ВКонтакте" /></a>
              <a href="#" className="footer-social-link"><img src={iconOk} alt="Одноклассники" /></a>
              <a href="#" className="footer-social-link"><img src={iconTg} alt="Telegram" /></a>
              <a href="#" className="footer-social-link"><img src={iconYt} alt="YouTube" /></a>
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
            <h4 className="footer-col-title">ДОКУМЕНТАЦИЯ</h4>
            <ul className="footer-links">
              <li><a href="#">Условия пользователя</a></li>
              <li><a href="#">Условия использования</a></li>
              <li><a href="#">Политикой Конфиденциальности</a></li>
            </ul>
          </div>

          <div className="footer-admin-col">
            {isAdmin && <a href="/admin" className="footer-admin-button">АДМИН-ПАНЕЛЬ</a>}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default FavoritesPage
