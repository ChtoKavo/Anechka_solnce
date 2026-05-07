import { useState, useEffect } from 'react'
import '../App.css'
import { recipesAPI, favoritesAPI, profileAPI } from '../services/api'
import logo from '../assets/main/Logo.png'
import searchIcon from '../assets/header/search.jpg'
import favIcon from '../assets/header/fav.png'
import userIcon from '../assets/header/user.png'
import hatGreen from '../assets/catalog/green.png'
import hatRed from '../assets/catalog/red.png'
import recMundire from '../assets/catalog/в мундире.png'
import recMundireSyr from '../assets/catalog/в мундире с сыром.png'
import recChips from '../assets/catalog/чипсы.png'
import recPure from '../assets/catalog/пюре.png'
import recGriby from '../assets/catalog/с грибами.png'
import recFri from '../assets/catalog/фри.png'
import recGarmoshka from '../assets/catalog/гармошка.png'
import recZapekanka from '../assets/catalog/запеканка.png'
import recZapechennaya from '../assets/catalog/запеченная.png'
import iconVk from '../assets/footer/vk.svg'
import iconOk from '../assets/footer/ok.png'
import iconTg from '../assets/footer/tg.png'
import iconYt from '../assets/footer/youtube.png'
import RecipeCardWithPreview from '../components/RecipeCardWithPreview.jsx'

const filterItems = [
  'По блюдам',
  'По кухням мира',
  'По времени',
  'По сложности',
  'По способу',
  'По сезонности',
  'По калорийности',
]

const catalogRecipes = [
  { id: 1, img: recMundire, title: 'КАРТОШКА В МУНДИРЕ', difficulty: 1 },
  { id: 2, img: recMundireSyr, title: 'КАРТОША В МУНДИРЕ С СЫРОМ', difficulty: 1 },
  { id: 3, img: recChips, title: 'КАРТОФЕЛЬНЫЕ ЧИПСЫ', difficulty: 2 },
  { id: 4, img: recGriby, title: 'КАРТОШКА В ДУХОВКЕ С ГРИБАМИ', difficulty: 2 },
  { id: 5, img: recFri, title: 'КАРТОШКА ФРИ', difficulty: 2 },
  { id: 6, img: recGarmoshka, title: 'КАРТОШКА-ГАРМОШКА', difficulty: 2 },
  { id: 7, img: recPure, title: 'КАРТОФЕЛЬНОЕ ПЮРЕ', difficulty: 1 },
  { id: 8, img: recZapekanka, title: 'КАРТОФЕЛЬНАЯ ЗАПЕКАНКА С ФАРШЕМ', difficulty: 3 },
  { id: 9, img: recZapechennaya, title: 'ЗАПЕЧЁННАЯ КАРТОШКА', difficulty: 3 },
]

function renderCompactDifficulty(level) {
  const icons = Array.from({ length: level }, (_, index) => {
    if (level === 3 && index === level - 1) {
      return hatRed
    }

    return hatGreen
  })

  return icons.map((icon, index) => (
    <img src={icon} alt="" key={`${level}-${index}`} className="hat-icon" />
  ))
}

function CatalogPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Читать параметр search из URL - обновлять при изменении URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    console.log('Search param from URL:', searchParam)
    
    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam)
      setSearchQuery(decodedSearch)
      console.log('Setting search query to:', decodedSearch)
    } else {
      setSearchQuery('')
    }

    const loadRecipes = async () => {
      try {
        setLoading(true)
        const data = await recipesAPI.getAll()
        const recipesArray = Array.isArray(data) ? data : data.recipes || []
        console.log('Loaded recipes:', recipesArray)
        setRecipes(recipesArray)
      } catch (err) {
        setError(err.message)
        console.error('Error loading recipes:', err)
      } finally {
        setLoading(false)
      }
    }

    const loadFavorites = async () => {
      try {
        const data = await favoritesAPI.getAll()
        const favoriteIds = Array.isArray(data) ? data.map(f => f.id) : (data.favorites || []).map(f => f.id)
        setFavorites(favoriteIds)
      } catch (err) {
        console.log('Not logged in or favorites not available')
      }
    }

    const loadUserRole = async () => {
      try {
        const profileData = await profileAPI.get()
        setIsAdmin(profileData.role === 'admin')
      } catch (err) {
        console.log('User not logged in or profile not available')
      }
    }

    loadRecipes()
    loadFavorites()
    loadUserRole()

    // Слушать изменения URL при использовании browser.back() или других навигаций
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      const decodedSearch = searchParam ? decodeURIComponent(searchParam) : ''
      console.log('URL changed, new search:', decodedSearch)
      setSearchQuery(decodedSearch)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const getProfileLink = () => {
    const token = localStorage.getItem('authToken')
    return token ? '/profile' : '/login'
  }

  const getFilteredRecipes = () => {
    if (!searchQuery.trim()) {
      return recipes
    }
    
    const query = searchQuery.toLowerCase()
    console.log('Filtering recipes with query:', query, 'Total recipes:', recipes.length)
    
    const filtered = recipes.filter(recipe => {
      // Ищем по названию, описанию и автору
      const title = (recipe.title || '').toLowerCase()
      const description = (recipe.description || '').toLowerCase()
      const author = (recipe.author || '').toLowerCase()
      
      const matches = title.includes(query) || description.includes(query) || author.includes(query)
      
      if (matches) {
        console.log('Match found:', recipe.title)
      }
      
      return matches
    })
    
    console.log('Filtered results:', filtered.length)
    return filtered
  }

  const toggleFavorite = async (recipeId, recipeName, e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      if (favorites.includes(recipeId)) {
        await favoritesAPI.remove(recipeId)
        setFavorites(favorites.filter(id => id !== recipeId))
      } else {
        await favoritesAPI.add(recipeId)
        setFavorites([...favorites, recipeId])
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Требуется авторизация')
    }
  }
  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <a className="logo-section" href="/">
            <img src={logo} alt="Logo" className="logo" />
          </a>

          <div className="search-section">
            <input
              type="text"
              placeholder="НАЙТИ РЕЦЕПТ"
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value
                console.log('Search input changed to:', value)
                setSearchQuery(value)
              }}
            />
            <button
              className="search-button"
              type="button"
              onClick={() => {
                if (searchQuery.trim()) {
                  console.log('Search button clicked, navigating to /catalog?search=', searchQuery)
                  window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
                }
              }}
              aria-label="Поиск"
            >
              <img src={searchIcon} alt="Поиск" />
            </button>
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
        <section className="catalog-page">
          <div className="catalog-page-head">
            <h1 className="catalog-heading">КАТАЛОГ</h1>
            <p className="catalog-subheading">ВСЕ</p>
          </div>

          <div className="catalog-layout">
            <aside className="catalog-filter">
              <h2 className="catalog-filter-title">ФИЛЬТР</h2>
              <div className="catalog-filter-list">
                {filterItems.map((item) => (
                  <button className="catalog-filter-select" key={item} type="button">
                    <span>{item}</span>
                    <span className="catalog-filter-arrow" />
                  </button>
                ))}
              </div>
              <button className="catalog-filter-button" type="button">ФИЛЬТРОВАТЬ</button>
              <button className="catalog-reset-button" type="button">СБРОСИТЬ</button>
            </aside>

            <div className="catalog-results">
              {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка рецептов...</div>}
              {error && <div style={{ color: 'red', padding: '20px' }}>Ошибка: {error}</div>}
              {!loading && recipes.length === 0 && <div style={{ padding: '20px' }}>Рецепты не найдены</div>}
              
              {!loading && recipes.length > 0 && getFilteredRecipes().length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  Рецепты с названием "{searchQuery}" не найдены
                </div>
              )}
              
              {!loading && recipes.length > 0 && getFilteredRecipes().length > 0 && (
                <>
                  <div className="catalog-grid">
                    {getFilteredRecipes().map((recipe) => (
                      <RecipeCardWithPreview
                        key={recipe.id}
                        recipe={recipe}
                        onFavoriteClick={toggleFavorite}
                        renderDifficulty={renderCompactDifficulty}
                        favIcon={favIcon}
                        isBasicCard={false}
                      />
                    ))}
                  </div>

                  <div className="catalog-pagination">
                    <button className="catalog-pagination-button" type="button" aria-label="Предыдущая страница">
                      &#8249;
                    </button>
                    <span className="catalog-pagination-current">1</span>
                    <button className="catalog-pagination-button" type="button" aria-label="Следующая страница">
                      &#8250;
                    </button>
                  </div>
                </>
              )}
            </div>
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

export default CatalogPage
