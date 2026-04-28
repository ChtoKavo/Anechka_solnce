import '../App.css'
import { useState, useEffect } from 'react'
import { adminAPI, profileAPI } from '../services/api'
import logo from '../assets/main/Logo.png'
import searchIcon from '../assets/header/search.jpg'
import favIcon from '../assets/header/fav.png'
import userIcon from '../assets/header/user.png'
import iconVk from '../assets/footer/vk.svg'
import iconOk from '../assets/footer/ok.png'
import iconTg from '../assets/footer/tg.png'
import iconYt from '../assets/footer/youtube.png'

function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        // Проверяем профиль и права администратора
        const profileData = await profileAPI.get()
        setProfile(profileData)

        if (profileData.role !== 'admin') {
          window.location.href = '/profile'
          return
        }

        // Загружаем всех пользователей и рецепты
        const [usersData, recipesData] = await Promise.all([
          adminAPI.getUsers(),
          adminAPI.getRecipes()
        ])

        setUsers(usersData)
        setRecipes(recipesData)
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных')
        console.error('Error loading admin data:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoad()
  }, [])

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${userName}"?`)) {
      return
    }

    try {
      await adminAPI.deleteUser(userId)
      setUsers(users.filter(user => user.id !== userId))
      alert('Пользователь удален')
    } catch (err) {
      alert('Ошибка при удалении пользователя: ' + err.message)
    }
  }

  const handleDeleteRecipe = async (recipeId, recipeName) => {
    if (!window.confirm(`Вы уверены, что хотите удалить рецепт "${recipeName}"?`)) {
      return
    }

    try {
      await adminAPI.deleteRecipe(recipeId)
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId))
      alert('Рецепт удален')
    } catch (err) {
      alert('Ошибка при удалении рецепта: ' + err.message)
    }
  }

  const handlePublishRecipe = async (recipeId, isPublished, recipeName) => {
    try {
      await adminAPI.updateRecipeStatus(recipeId, !isPublished)
      setRecipes(recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, is_published: !isPublished }
          : recipe
      ))
      alert(`Рецепт "${recipeName}" ${!isPublished ? 'опубликован' : 'скрыт'}`)
    } catch (err) {
      alert('Ошибка при изменении статуса рецепта: ' + err.message)
    }
  }

  const handleUserStatus = async (userId, isActive, userName) => {
    try {
      await adminAPI.updateUserStatus(userId, !isActive)
      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, is_active: !isActive }
          : user
      ))
      alert(`Статус пользователя "${userName}" изменен`)
    } catch (err) {
      alert('Ошибка при изменении статуса пользователя: ' + err.message)
    }
  }

  const getProfileLink = () => {
    const token = localStorage.getItem('authToken')
    return token ? '/profile' : '/login'
  }

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-container">
            <a className="logo-section" href="/">
              <img src={logo} alt="Logo" className="logo" />
            </a>
          </div>
        </header>
        <main className="main-content main-content-catalog">
          <p style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</p>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-container">
            <a className="logo-section" href="/">
              <img src={logo} alt="Logo" className="logo" />
            </a>
          </div>
        </header>
        <main className="main-content main-content-catalog">
          <p style={{ textAlign: 'center', padding: '40px', color: 'red' }}>Ошибка: {error}</p>
        </main>
      </div>
    )
  }

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

      <main className="main-content main-content-catalog">
        <section className="admin-page">
          <h1 className="admin-title">АДМИН ПАНЕЛЬ</h1>
          {profile && <p style={{ textAlign: 'center', marginBottom: '20px' }}>Добро пожаловать, {profile.full_name}!</p>}

          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'users' ? 'admin-tab-active' : ''}`}
              type="button"
              onClick={() => setActiveTab('users')}
            >
              ПОЛЬЗОВАТЕЛИ ({users.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'recipes' ? 'admin-tab-active' : ''}`}
              type="button"
              onClick={() => setActiveTab('recipes')}
            >
              РЕЦЕПТЫ ({recipes.length})
            </button>
          </div>

          <div className="admin-table-wrap">
            {activeTab === 'users' ? (
              <table className="admin-table admin-table-users">
                <thead>
                  <tr>
                    <th>Ф.И.О.</th>
                    <th>ЭЛЕКТРОННАЯ ПОЧТА</th>
                    <th>НОМЕР ТЕЛЕФОНА</th>
                    <th>РОЛЬ</th>
                    <th>СТАТУС</th>
                    <th>ДЕЙСТВИЯ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Нет пользователей</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.full_name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td><span style={{ fontWeight: 'bold', color: user.role === 'admin' ? '#ff6b6b' : '#333' }}>{user.role === 'admin' ? 'АДМИН' : 'ПОЛЬЗОВАТЕЛЬ'}</span></td>
                        <td>
                          <span style={{ color: user.is_active ? '#51cf66' : '#ff6b6b' }}>
                            {user.is_active ? '✓ АКТИВЕН' : '✗ НЕАКТИВЕН'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() => handleUserStatus(user.id, user.is_active, user.full_name)}
                            title={user.is_active ? 'Деактивировать' : 'Активировать'}
                            aria-label={user.is_active ? 'Деактивировать' : 'Активировать'}
                          >
                            {user.is_active ? '⊗' : '⊕'}
                          </button>
                          <button
                            type="button"
                            className="admin-ban-button"
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            title="Удалить"
                            aria-label="Удалить"
                          >
                            ⊘
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>НАЗВАНИЕ</th>
                    <th>АВТОР</th>
                    <th>СЛОЖНОСТЬ</th>
                    <th>СТАТУС</th>
                    <th>ДЕЙСТВИЯ</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Нет рецептов</td>
                    </tr>
                  ) : (
                    recipes.map((recipe) => (
                      <tr key={recipe.id}>
                        <td>{recipe.title}</td>
                        <td>{recipe.author || 'Неизвестен'}</td>
                        <td>
                          {recipe.difficulty === 1 ? 'Легко' : recipe.difficulty === 2 ? 'Среднее' : 'Сложно'}
                        </td>
                        <td>
                          <span style={{ color: recipe.is_published ? '#51cf66' : '#ffa94d' }}>
                            {recipe.is_published ? '✓ ОПУБЛИКОВАН' : '○ НЕ ОПУБЛИКОВАН'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() => handlePublishRecipe(recipe.id, recipe.is_published, recipe.title)}
                            title={recipe.is_published ? 'Скрыть' : 'Опубликовать'}
                            aria-label={recipe.is_published ? 'Скрыть' : 'Опубликовать'}
                          >
                            {recipe.is_published ? '◉' : '○'}
                          </button>
                          <button
                            type="button"
                            className="admin-ban-button"
                            onClick={() => handleDeleteRecipe(recipe.id, recipe.title)}
                            title="Удалить"
                            aria-label="Удалить"
                          >
                            ⊘
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
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
            <h3>ССЫЛКИ</h3>
            <a href="/">Главная</a>
            <a href="/catalog">Каталог</a>
            <a href="/favorites">Избранное</a>
            <a href="/profile">Профиль</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminPage
