import '../App.css'
import { useMemo, useState, useEffect } from 'react'
import { authAPI, profileAPI, uploadAPI } from '../services/api'
import logo from '../assets/main/Logo.png'
import searchIcon from '../assets/header/search.jpg'
import favIcon from '../assets/header/fav.png'
import userIcon from '../assets/header/user.png'
import avatar from '../assets/profile/ava.png'
import iconVk from '../assets/footer/vk.svg'
import iconOk from '../assets/footer/ok.png'
import iconTg from '../assets/footer/tg.png'
import iconYt from '../assets/footer/youtube.png'

function SettingsPage() {
  // Состояние пользователя
  const [userData, setUserData] = useState({
    full_name: '',
    phone: '',
    email: '',
    avatar_url: '',
    bio: ''
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Состояние модального окна редактирования
  const [editModal, setEditModal] = useState({
    open: false,
    field: null,
    value: '',
    file: null,
    isSaving: false,
    error: ''
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Загрузка данных пользователя
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true)
        const profileData = await profileAPI.get()
        
        setUserData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          avatar_url: profileData.avatar_url || '',
          bio: profileData.bio || ''
        })
        
        if (profileData.avatar_url) {
          setAvatarPreview(profileData.avatar_url)
        }
        
        setIsAdmin(profileData.role === 'admin')
        setError('')
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err)
        setError('Не удалось загрузить данные профиля')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }


  const modalTitle = useMemo(() => {
    if (editModal.field === 'phone') {
      return 'ИЗМЕНИТЬ ТЕЛЕФОН'
    }
    if (editModal.field === 'email') {
      return 'ИЗМЕНИТЬ ПОЧТУ'
    }
    if (editModal.field === 'avatar') {
      return 'ИЗМЕНИТЬ АВАТАР'
    }
    return 'ИЗМЕНИТЬ'
  }, [editModal.field])

  const openEditModal = (field) => {
    if (field === 'phone') {
      setEditModal({ open: true, field, value: userData.phone, file: null, isSaving: false, error: '' })
      return
    }

    if (field === 'email') {
      setEditModal({ open: true, field, value: userData.email, file: null, isSaving: false, error: '' })
      return
    }

    setEditModal({ open: true, field: 'avatar', value: '', file: null, isSaving: false, error: '' })
  }

  const closeEditModal = () => {
    setEditModal({ open: false, field: null, value: '', file: null, isSaving: false, error: '' })
    setSuccessMessage('')
  }

  const handleLogout = () => {
    if (!window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      return
    }

    authAPI.logout()
    window.location.href = '/login'
  }

  const handleSaveChanges = async (event) => {
    event.preventDefault()
    setEditModal((prev) => ({ ...prev, isSaving: true, error: '' }))

    try {
      const updateData = {}

      if (editModal.field === 'phone') {
        if (!editModal.value.trim()) {
          throw new Error('Телефон не может быть пустым')
        }
        if (!/^\+?[\d\s\-()]+$/.test(editModal.value)) {
          throw new Error('Некорректный формат телефона')
        }
        updateData.phone = editModal.value
      } else if (editModal.field === 'email') {
        if (!editModal.value.trim()) {
          throw new Error('Email не может быть пустым')
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editModal.value)) {
          throw new Error('Некорректный формат email')
        }
        updateData.email = editModal.value
      } else if (editModal.field === 'avatar') {
        if (!editModal.file) {
          throw new Error('Пожалуйста, выберите файл')
        }

        // Загружаем аватар
        const uploadResponse = await uploadAPI.uploadImage(editModal.file)
        updateData.avatar_url = uploadResponse.imageUrl
      }

      // Обновляем профиль
      await profileAPI.update(updateData)

      // Обновляем локальное состояние
      setUserData((prev) => ({
        ...prev,
        ...updateData
      }))

      if (updateData.avatar_url) {
        setAvatarPreview(updateData.avatar_url)
      }

      setSuccessMessage('Профиль успешно обновлен')
      setTimeout(() => {
        closeEditModal()
      }, 1000)
    } catch (err) {
      console.error('Ошибка сохранения:', err)
      setEditModal((prev) => ({
        ...prev,
        error: err.message || 'Ошибка при сохранении',
        isSaving: false
      }))
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
            <a className="icon-button" href="/profile" aria-label="Профиль">
              <img src={userIcon} alt="Профиль" />
            </a>
          </div>
        </div>
      </header>

      <main className="main-content main-content-catalog">
        <section className="settings-page">
          <h1 className="settings-title">НАСТРОЙКИ</h1>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Загрузка...</p>
            </div>
          ) : error ? (
            <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
              <p>{error}</p>
            </div>
          ) : (
            <div className="settings-card">
              <div className="settings-avatar-col">
                <img
                  src={avatarPreview || avatar}
                  alt="Аватар"
                  className="settings-avatar"
                  style={{ maxWidth: '150px', maxHeight: '150px' }}
                />
                <button className="settings-link-button" type="button" onClick={() => openEditModal('avatar')}>
                  Изменить
                </button>
              </div>

              <div className="settings-main-col">
                <h2 className="settings-name">{userData.full_name || 'Профиль пользователя'}</h2>

                {successMessage && (
                  <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                    {successMessage}
                  </div>
                )}

                <div className="settings-grid">
                  <div className="settings-block">
                    <h3 className="settings-block-title">УЧЕТНЫЕ ДАННЫЕ</h3>

                    <div className="settings-fields">
                      <div className="settings-field">
                        <span className="settings-field-label">Телефон</span>
                        <span className="settings-field-value">{userData.phone || 'Не указан'}</span>
                        <button className="settings-link-button" type="button" onClick={() => openEditModal('phone')}>
                          Изменить
                        </button>
                      </div>

                      <div className="settings-field">
                        <span className="settings-field-label">Почта</span>
                        <span className="settings-field-value">{userData.email || 'Не указана'}</span>
                        <button className="settings-link-button" type="button" onClick={() => openEditModal('email')}>
                          Изменить
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-block settings-account-block">
                    <h3 className="settings-block-title">УПРАВЛЕНИЕ АККАУНТОМ</h3>
                    <button className="settings-link-button" type="button" onClick={handleLogout}>
                      Выйти из аккаунта
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editModal.open && (
            <div className="profile-modal-overlay" role="presentation" onClick={closeEditModal}>
              <section
                className="profile-modal settings-edit-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Редактирование данных"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="profile-modal-head">
                  <h2 className="profile-modal-title">{modalTitle}</h2>
                  <button
                    className="profile-modal-close"
                    type="button"
                    aria-label="Закрыть"
                    onClick={closeEditModal}
                    disabled={editModal.isSaving}
                  >
                    ×
                  </button>
                </div>

                <form className="profile-modal-form" onSubmit={handleSaveChanges}>
                  {editModal.error && (
                    <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe0e0' }}>
                      {editModal.error}
                    </div>
                  )}

                  {editModal.field === 'avatar' ? (
                    <>
                      <label className="profile-modal-label" htmlFor="settings-avatar-file">
                        ВЫБРАТЬ ФОТО
                      </label>
                      <input
                        id="settings-avatar-file"
                        type="file"
                        accept="image/*"
                        className="profile-modal-input profile-modal-file"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null
                          setEditModal((prev) => ({ ...prev, file: selectedFile }))
                        }}
                      />
                      {editModal.file && <p className="profile-modal-file-name">{editModal.file.name}</p>}
                    </>
                  ) : (
                    <>
                      <label className="profile-modal-label" htmlFor="settings-value">
                        НОВОЕ ЗНАЧЕНИЕ
                      </label>
                      <input
                        id="settings-value"
                        type="text"
                        className="profile-modal-input"
                        value={editModal.value}
                        onChange={(event) => setEditModal((prev) => ({ ...prev, value: event.target.value }))}
                      />
                    </>
                  )}

                  <div className="profile-modal-actions">
                    <button
                      type="button"
                      className="profile-modal-btn profile-modal-btn-secondary"
                      onClick={closeEditModal}
                      disabled={editModal.isSaving}
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="submit"
                      className="profile-modal-btn profile-modal-btn-primary"
                      disabled={editModal.isSaving}
                    >
                      {editModal.isSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
                    </button>
                  </div>
                </form>
              </section>
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

export default SettingsPage