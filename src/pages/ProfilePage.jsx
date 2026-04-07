import '../App.css'
import { useState, useEffect } from 'react'
import { profileAPI, recipesAPI, uploadAPI } from '../services/api'
import logo from '../assets/main/Logo.png'
import searchIcon from '../assets/header/search.jpg'
import favIcon from '../assets/header/fav.png'
import userIcon from '../assets/header/user.png'
import avatar from '../assets/profile/ava.png'
import controlsIcon from '../assets/profile/controls.png'
import recMundire from '../assets/catalog/в мундире.png'
import iconVk from '../assets/footer/vk.svg'
import iconOk from '../assets/footer/ok.png'
import iconTg from '../assets/footer/tg.png'
import iconYt from '../assets/footer/youtube.png'

const initialIngredients = [{ name: '', quantity: '' }]
const initialSteps = [{ text: '', image: null }]

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [recipeImage, setRecipeImage] = useState(null)
  const [recipeName, setRecipeName] = useState('')
  const [recipeAuthor, setRecipeAuthor] = useState('')
  const [recipeTime, setRecipeTime] = useState('')
  const [recipeCalories, setRecipeCalories] = useState('')
  const [recipePortions, setRecipePortions] = useState('')
  const [recipeDescription, setRecipeDescription] = useState('')
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [steps, setSteps] = useState(initialSteps)
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
    const loadProfile = async () => {
      try {
        setLoading(true)
        const data = await profileAPI.get()
        setProfile(data)
        setRecipes(data.recipes || [])
      } catch (err) {
        setError(err.message || 'Ошибка загрузки профиля')
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { name: '', quantity: '' }])
  }

  const removeIngredient = (indexToRemove) => {
    setIngredients((prev) => {
      if (prev.length === 1) {
        return prev
      }
      return prev.filter((_, index) => index !== indexToRemove)
    })
  }

  const updateIngredient = (indexToUpdate, field, value) => {
    setIngredients((prev) =>
      prev.map((item, index) =>
        index === indexToUpdate
          ? { ...item, [field]: value }
          : item,
      ),
    )
  }

  const addStep = () => {
    setSteps((prev) => [...prev, { text: '', image: null }])
  }

  const removeStep = (indexToRemove) => {
    setSteps((prev) => {
      if (prev.length === 1) {
        return prev
      }
      return prev.filter((_, index) => index !== indexToRemove)
    })
  }

  const updateStep = (indexToUpdate, field, value) => {
    setSteps((prev) =>
      prev.map((item, index) =>
        index === indexToUpdate
          ? { ...item, [field]: value }
          : item,
      ),
    )
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    resetForm()
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const resetForm = () => {
    setRecipeImage(null)
    setRecipeName('')
    setRecipeAuthor('')
    setRecipeTime('')
    setRecipeCalories('')
    setRecipePortions('')
    setRecipeDescription('')
    setIngredients(initialIngredients)
    setSteps(initialSteps)
  }

  const handleCreateRecipeSubmit = async (event) => {
    event.preventDefault()

    if (!recipeName || !recipeTime || ingredients.some(ing => !ing.name || !ing.quantity) || steps.some(step => !step.text)) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    try {
      // Загрузка основного изображения рецепта если оно есть
      let imageUrl = null
      if (recipeImage) {
        const uploadResult = await uploadAPI.uploadImage(recipeImage)
        imageUrl = uploadResult.imageUrl
        console.log('Основное изображение загружено:', imageUrl)
      }

      // Загрузка изображений для каждого шага
      const stepsWithImages = await Promise.all(
        steps
          .filter(step => step.text)
          .map(async (step) => {
            let stepImageUrl = null
            if (step.image) {
              const uploadResult = await uploadAPI.uploadImage(step.image)
              stepImageUrl = uploadResult.imageUrl
              console.log('Изображение шага загружено:', stepImageUrl)
            }
            return {
              text: step.text,
              description: step.text,
              image_url: stepImageUrl
            }
          })
      )

      const recipeData = {
        title: recipeName,
        description: recipeDescription,
        image_url: imageUrl,
        difficulty: 2,
        time_minutes: parseInt(recipeTime) || 0,
        portions: parseInt(recipePortions) || 1,
        calories: recipeCalories,
        ingredients: ingredients.filter(ing => ing.name && ing.quantity),
        steps: stepsWithImages
      }

      const result = await recipesAPI.create(recipeData)
      
      // Загружаем созданный рецепт чтобы получить полные данные
      const newRecipe = await recipesAPI.getById(result.recipeId)
      setRecipes([...recipes, newRecipe])
      closeCreateModal()
      resetForm()
      alert('Рецепт успешно создан!')
    } catch (err) {
      console.error('Error creating recipe:', err)
      alert('Ошибка при создании рецепта: ' + err.message)
    }
  }

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      return
    }

    try {
      await recipesAPI.delete(recipeId)
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId))
      alert('Рецепт удалён')
    } catch (err) {
      console.error('Error deleting recipe:', err)
      alert('Ошибка при удалении рецепта: ' + err.message)
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
        <section className="profile-page">
          <h1 className="profile-title">ЛИЧНЫЙ КАБИНЕТ</h1>

          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка профиля...</div>}
          {error && <div style={{ color: 'red', padding: '20px' }}>Ошибка: {error}</div>}

          {!loading && profile && (
            <>
              <div className="profile-card">
                <div className="profile-card-main">
                  <img src={profile.avatar_url || avatar} alt="Аватар" className="profile-avatar" />
                  <div className="profile-card-info">
                    <h2 className="profile-name">{profile.full_name || 'Неизвестный пользователь'}</h2>
                  </div>
                </div>

                <a className="profile-controls" href="/settings" aria-label="Настройки профиля">
                  <img src={controlsIcon} alt="Настройки" />
                </a>
              </div>

              <div className="profile-recipes-head">
                <h2 className="profile-recipes-title">ВАШИ РЕЦЕПТЫ</h2>
                <button
                  className="profile-add-button"
                  type="button"
                  aria-label="Добавить рецепт"
                  onClick={openCreateModal}
                >
                  +
                </button>
              </div>

              {recipes.length === 0 ? (
                <div style={{ padding: '20px' }}>У вас ещё нет рецептов</div>
              ) : (
                <div className="profile-recipes-grid">
                  {recipes.map((recipe) => (
                    <article className="profile-recipe-card" key={recipe.id}>
                      <div className="profile-recipe-image-wrap">
                        <img src={recipe.image_url || recMundire} alt={recipe.title} className="profile-recipe-image" />
                      </div>
                      <div className="profile-recipe-body">
                        <h3 className="profile-recipe-title">{recipe.title}</h3>
                        <div className="profile-recipe-actions">
                          <button 
                            className="profile-recipe-action" 
                            type="button" 
                            aria-label="Удалить рецепт"
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            <span className="profile-recipe-action-icon">&#128465;</span>
                          </button>
                          <button className="profile-recipe-action" type="button" aria-label="Редактировать рецепт">
                            <span className="profile-recipe-action-icon">&#9998;</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {isCreateModalOpen && (
          <div className="profile-modal-overlay" role="presentation" onClick={closeCreateModal}>
            <section
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Добавление рецепта"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-modal-head">
                <h2 className="profile-modal-title">НОВЫЙ РЕЦЕПТ</h2>
                <button
                  className="profile-modal-close"
                  type="button"
                  aria-label="Закрыть"
                  onClick={closeCreateModal}
                >
                  ×
                </button>
              </div>

              <form className="profile-modal-form" onSubmit={handleCreateRecipeSubmit}>
                <label className="profile-modal-label" htmlFor="recipe-image">
                  ФОТО РЕЦЕПТА
                </label>
                <input
                  id="recipe-image"
                  type="file"
                  accept="image/*"
                  className="profile-modal-input profile-modal-file"
                  onChange={(event) => setRecipeImage(event.target.files?.[0] || null)}
                />
                {recipeImage && <p className="profile-modal-file-name">{recipeImage.name}</p>}

                <label className="profile-modal-label" htmlFor="recipe-name">НАЗВАНИЕ</label>
                <input
                  id="recipe-name"
                  type="text"
                  className="profile-modal-input"
                  value={recipeName}
                  onChange={(event) => setRecipeName(event.target.value)}
                />

                <div className="profile-modal-grid-two">
                  <div>
                    <label className="profile-modal-label" htmlFor="recipe-author">АВТОР</label>
                    <input
                      id="recipe-author"
                      type="text"
                      className="profile-modal-input"
                      value={recipeAuthor}
                      onChange={(event) => setRecipeAuthor(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="profile-modal-label" htmlFor="recipe-time">ВРЕМЯ</label>
                    <input
                      id="recipe-time"
                      type="text"
                      className="profile-modal-input"
                      placeholder="например, 1 час"
                      value={recipeTime}
                      onChange={(event) => setRecipeTime(event.target.value)}
                    />
                  </div>
                </div>

                <div className="profile-modal-grid-two">
                  <div>
                    <label className="profile-modal-label" htmlFor="recipe-calories">КАЛОРИИ</label>
                    <input
                      id="recipe-calories"
                      type="text"
                      className="profile-modal-input"
                      placeholder="например, 100 г - 187,3 ккал"
                      value={recipeCalories}
                      onChange={(event) => setRecipeCalories(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="profile-modal-label" htmlFor="recipe-portions">КОЛ-ВО ПОРЦИЙ</label>
                    <input
                      id="recipe-portions"
                      type="number"
                      min="1"
                      className="profile-modal-input"
                      value={recipePortions}
                      onChange={(event) => setRecipePortions(event.target.value)}
                    />
                  </div>
                </div>

                <div className="profile-modal-section">
                  <div className="profile-modal-section-head">
                    <h3>ИНГРЕДИЕНТЫ</h3>
                    <button type="button" className="profile-modal-add" onClick={addIngredient}>+ ингредиент</button>
                  </div>

                  {ingredients.map((ingredient, index) => (
                    <div className="profile-modal-grid-two profile-modal-list-row" key={`ingredient-${index}`}>
                      <input
                        type="text"
                        className="profile-modal-input"
                        placeholder="Название"
                        value={ingredient.name}
                        onChange={(event) => updateIngredient(index, 'name', event.target.value)}
                      />
                      <div className="profile-modal-list-last-col">
                        <input
                          type="text"
                          className="profile-modal-input"
                          placeholder="Количество"
                          value={ingredient.quantity}
                          onChange={(event) => updateIngredient(index, 'quantity', event.target.value)}
                        />
                        <button
                          type="button"
                          className="profile-modal-remove"
                          onClick={() => removeIngredient(index)}
                          aria-label="Удалить ингредиент"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <label className="profile-modal-label" htmlFor="recipe-description">ОПИСАНИЕ</label>
                <textarea
                  id="recipe-description"
                  className="profile-modal-input profile-modal-textarea"
                  value={recipeDescription}
                  onChange={(event) => setRecipeDescription(event.target.value)}
                />

                <div className="profile-modal-section">
                  <div className="profile-modal-section-head">
                    <h3>КАК ПРИГОТОВИТЬ</h3>
                    <button type="button" className="profile-modal-add" onClick={addStep}>+ шаг</button>
                  </div>

                  {steps.map((step, index) => (
                    <div className="profile-modal-step" key={`step-${index}`}>
                      <label className="profile-modal-label" htmlFor={`step-image-${index}`}>
                        ФОТО ШАГА {index + 1}
                      </label>
                      <div className="profile-modal-step-head">
                        <input
                          id={`step-image-${index}`}
                          type="file"
                          accept="image/*"
                          className="profile-modal-input profile-modal-file"
                          onChange={(event) => updateStep(index, 'image', event.target.files?.[0] || null)}
                        />
                        <button
                          type="button"
                          className="profile-modal-remove"
                          onClick={() => removeStep(index)}
                          aria-label="Удалить шаг"
                        >
                          ×
                        </button>
                      </div>
                      {step.image && <p className="profile-modal-file-name">{step.image.name}</p>}
                      <textarea
                        className="profile-modal-input profile-modal-textarea"
                        placeholder="Описание шага"
                        value={step.text}
                        onChange={(event) => updateStep(index, 'text', event.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="profile-modal-actions">
                  <button type="button" className="profile-modal-btn profile-modal-btn-secondary" onClick={closeCreateModal}>
                    ОТМЕНА
                  </button>
                  <button type="submit" className="profile-modal-btn profile-modal-btn-primary">
                    СОХРАНИТЬ
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
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
            {profile && profile.role === 'admin' && <a href="/admin" className="footer-admin-button">АДМИН-ПАНЕЛЬ</a>}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ProfilePage