import '../App.css'
import { useMemo, useState, useEffect } from 'react'
import { authAPI, profileAPI } from '../services/api'
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
  const [profileName] = useState('ИЛЬИНА АННА')
  const [phone, setPhone] = useState('+7 962 755 34 50')
  const [email, setEmail] = useState('ilina1409anna@gmail.com')
  const [avatarFileName, setAvatarFileName] = useState('')
  const [editModal, setEditModal] = useState({ open: false, field: null, value: '', file: null })
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`
    }
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

    loadUserRole()
  }, [])

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
      setEditModal({ open: true, field, value: phone, file: null })
      return
    }

    if (field === 'email') {
      setEditModal({ open: true, field, value: email, file: null })
      return
    }

    setEditModal({ open: true, field: 'avatar', value: '', file: null })
  }

  const closeEditModal = () => {
    setEditModal({ open: false, field: null, value: '', file: null })
  }

  const handleLogout = () => {
    if (!window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      return
    }

    authAPI.logout()
    window.location.href = '/login'
  }

  const handleSaveChanges = (event) => {
    event.preventDefault()

    if (editModal.field === 'phone') {
      setPhone(editModal.value)
    }

    if (editModal.field === 'email') {
      setEmail(editModal.value)
    }

    if (editModal.field === 'avatar' && editModal.file) {
      setAvatarFileName(editModal.file.name)
    }

    closeEditModal()
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

          <div className="settings-card">
            <div className="settings-avatar-col">
              <img src={avatar} alt="Аватар" className="settings-avatar" />
              <button className="settings-link-button" type="button" onClick={() => openEditModal('avatar')}>
                Изменить
              </button>
              {avatarFileName && <span className="settings-avatar-file">{avatarFileName}</span>}
            </div>

            <div className="settings-main-col">
              <h2 className="settings-name">{profileName}</h2>

              <div className="settings-grid">
                <div className="settings-block">
                  <h3 className="settings-block-title">УЧЕТНЫЕ ДАННЫЕ</h3>

                  <div className="settings-fields">
                    <div className="settings-field">
                      <span className="settings-field-label">Телефон</span>
                      <span className="settings-field-value">{phone}</span>
                      <button className="settings-link-button" type="button" onClick={() => openEditModal('phone')}>
                        Изменить
                      </button>
                    </div>

                    <div className="settings-field">
                      <span className="settings-field-label">Почта</span>
                      <span className="settings-field-value">{email}</span>
                      <button className="settings-link-button" type="button" onClick={() => openEditModal('email')}>
                        Изменить
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-block settings-account-block">
                  <h3 className="settings-block-title">УПРАВЛЕНИЕ АККАУНТОМ</h3>
                  <button className="settings-link-button" type="button" onClick={handleLogout}>Выйти из аккаунта</button>
                </div>
              </div>
            </div>
          </div>

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
                  <button className="profile-modal-close" type="button" aria-label="Закрыть" onClick={closeEditModal}>
                    ×
                  </button>
                </div>

                <form className="profile-modal-form" onSubmit={handleSaveChanges}>
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
                    <button type="button" className="profile-modal-btn profile-modal-btn-secondary" onClick={closeEditModal}>
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