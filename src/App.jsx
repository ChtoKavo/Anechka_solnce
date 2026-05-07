import './App.css'
import { useState, useEffect } from 'react'
import { profileAPI, favoritesAPI } from './services/api'
import banner from './assets/main/banner.png'
import bannerHeinz from './assets/main/banner_hainz.png'
import logo from './assets/main/Logo.png'
import searchIcon from './assets/header/search.jpg'
import favIcon from './assets/header/fav.png'
import userIcon from './assets/header/user.png'
import hatGreen from './assets/catalog/green.png'
import hatRed from './assets/catalog/red.png'
import recMundire from './assets/catalog/в мундире.png'
import recMundireSyr from './assets/catalog/в мундире с сыром.png'
import recChips from './assets/catalog/чипсы.png'
import recPure from './assets/catalog/пюре.png'
import recGriby from './assets/catalog/с грибами.png'
import recFri from './assets/catalog/фри.png'
import recGarmoshka from './assets/catalog/гармошка.png'
import recZapekanka from './assets/catalog/запеканка.png'
import iconVk from './assets/footer/vk.svg'
import iconOk from './assets/footer/ok.png'
import iconTg from './assets/footer/tg.png'
import iconYt from './assets/footer/youtube.png'
import CatalogPage from './pages/CatalogPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RecipePage from './pages/RecipePage.jsx'
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import RecipeCardWithPreview from './components/RecipeCardWithPreview.jsx'

const newRecipes = [
  { id: 1, img: recMundire, title: 'КАРТОШКА В МУНДИРЕ', difficulty: 3 },
  { id: 2, img: recMundireSyr, title: 'КАРТОША В МУНДИРЕ С СЫРОМ', difficulty: 3 },
  { id: 3, img: recChips, title: 'КАРТОФЕЛЬНЫЕ ЧИПСЫ', difficulty: 3 },
  { id: 7, img: recPure, title: 'КАРТОФЕЛЬНОЕ ПЮРЕ', difficulty: 3 },
  { id: 4, img: recGriby, title: 'КАРТОШКА В ДУХОВКЕ С ГРИБАМИ', difficulty: 1 },
  { id: 5, img: recFri, title: 'КАРТОШКА ФРИ', difficulty: 3 },
  { id: 6, img: recGarmoshka, title: 'КАРТОШКА-ГАРМОШКА', difficulty: 3 },
  { id: 8, img: recZapekanka, title: 'КАРТОФЕЛЬНАЯ ЗАПЕКАНКА С ФАРШЕМ', difficulty: 2 },
]

const festiveRecipes = [
  { id: 1, img: recMundire, title: 'КАРТОШКА В МУНДИРЕ', difficulty: 1 },
  { id: 2, img: recMundireSyr, title: 'КАРТОША В МУНДИРЕ С СЫРОМ', difficulty: 2 },
  { id: 3, img: recChips, title: 'КАРТОФЕЛЬНЫЕ ЧИПСЫ', difficulty: 2 },
  { id: 7, img: recPure, title: 'КАРТОФЕЛЬНОЕ ПЮРЕ', difficulty: 1 },
]

function renderDifficulty(level) {
  return (
    <>
      {Array.from({ length: level }).map((_, index) => (
        <img src={hatGreen} alt="" key={`green-${level}-${index}`} className="hat-icon" />
      ))}
      {Array.from({ length: 3 - level }).map((_, index) => (
        <img src={hatRed} alt="" key={`red-${level}-${index}`} className="hat-icon hat-icon--empty" />
      ))}
    </>
  )
}

const isAuthenticated = () => Boolean(localStorage.getItem('authToken'))

const getProfileLink = () => {
  return isAuthenticated() ? '/profile' : '/login'
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const showNotification = (message, duration = 3000) => {
    setNotification(message)
    setTimeout(() => {
      setNotification(null)
    }, duration)
  }

  const handleAddToFavorite = async (recipeId, recipeName, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const token = localStorage.getItem('authToken')
    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      await favoritesAPI.add(recipeId)
      showNotification(`✨ "${recipeName}" добавлено в избранное!`)
    } catch (err) {
      showNotification(`❌ Ошибка: ${err.message}`)
      console.error('Error adding to favorites:', err)
    }
  }

  const renderRecipeCardWithHandler = (recipe) => {
    return (
      <RecipeCardWithPreview
        key={recipe.id}
        recipe={recipe}
        onFavoriteClick={handleAddToFavorite}
        renderDifficulty={renderDifficulty}
        favIcon={favIcon}
        showNotification={showNotification}
        isBasicCard={true}
      />
    )
  }

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const profileData = await profileAPI.get()
        setIsAdmin(profileData.role === 'admin')
      } catch (err) {
        console.log('User not logged in')
      }
    }

    const currentPath = window.location.pathname.toLowerCase()
    const token = localStorage.getItem('authToken')
    if (token && !currentPath.includes('/login') && !currentPath.includes('/register')) {
      loadUserRole()
    }
  }, [])

  const pathname = window.location.pathname.toLowerCase()

  if (pathname.includes('/recipe')) {
    return <RecipePage />
  }

  if (pathname.includes('/catalog')) {
    return <CatalogPage />
  }

  if (pathname.includes('/favorites')) {
    return <FavoritesPage />
  }

  if (pathname === '/login' || pathname.includes('/login')) {
    return <LoginPage />
  }

  if (pathname === '/register' || pathname.includes('/register')) {
    return <RegisterPage />
  }

  if (pathname.includes('/profile')) {
    return <ProfilePage />
  }

  if (pathname.includes('/settings')) {
    return <SettingsPage />
  }

  if (pathname.includes('/admin')) {
    return <AdminPage />
  }

  return (
    <div className="app">
      {notification && (
        <div className="notification-toast">
          <div className="notification-content">
            {notification}
          </div>
        </div>
      )}

      <section className="banner">
        <div className="banner-image">
          <img src={banner} alt="Изысканные рецепты для всех" />
        </div>
      </section>

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

      <main className="main-content">
        <section className="recipes-section">
          <h2 className="recipes-title">НОВЫЕ РЕЦЕПТЫ</h2>
          <div className="recipes-grid">
            {newRecipes.map(renderRecipeCardWithHandler)}
          </div>
        </section>

        <div className="heinz-banner">
          <img src={bannerHeinz} alt="Кетчуп Heinz" />
        </div>

        <section className="recipes-section">
          <h2 className="recipes-title">ПРАЗДНИЧНЫЕ БЛЮДА</h2>
          <div className="recipes-grid">
            {festiveRecipes.map(renderRecipeCardWithHandler)}
          </div>
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

export default App
