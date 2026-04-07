import { useState } from 'react'
import { authAPI } from '../services/api'
import '../App.css'
import './RegisterPage.css'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    password_confirm: '',
    subscribe_newsletter: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Валидация
      if (!formData.full_name || !formData.phone || !formData.email || !formData.password) {
        throw new Error('Заполните все обязательные поля')
      }
      if (formData.password !== formData.password_confirm) {
        throw new Error('Пароли не совпадают')
      }
      if (formData.password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов')
      }

      const response = await authAPI.register({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        subscribe_newsletter: formData.subscribe_newsletter,
      })

      if (response.token) {
        window.location.href = '/catalog'
      }
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
      console.error('Register error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <main className="main-content-register">
        <section className="register-container">
          <div className="register-box">
            <h1 className="register-title">РЕГИСТРАЦИЯ</h1>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <form onSubmit={handleRegister} className="register-form">
              <input
                type="text"
                name="full_name"
                placeholder="ФИО"
                className="register-input"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Телефон"
                className="register-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="register-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Пароль"
                className="register-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password_confirm"
                placeholder="Повторить Пароль"
                className="register-input"
                value={formData.password_confirm}
                onChange={handleChange}
                required
              />

              <label className="register-check-row">
                <input
                  type="checkbox"
                  name="agree_data"
                  required
                />
                <span>Я соглашаюсь на обработку персональных данных</span>
              </label>

              <label className="register-check-row">
                <input
                  type="checkbox"
                  name="agree_policy"
                  required
                />
                <span>
                  Я соглашаюсь с <a href="#" className="register-policy-link">Политикой Конфиденциальности</a> этого сайта
                </span>
              </label>

              <label className="register-check-row">
                <input
                  type="checkbox"
                  name="subscribe_newsletter"
                  checked={formData.subscribe_newsletter}
                  onChange={handleChange}
                />
                <span>Я соглашаюсь на рассылку</span>
              </label>

              <button type="submit" className="register-button" disabled={loading}>
                {loading ? 'Загрузка...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
              </button>
            </form>

            <div className="register-divider">или</div>
            <a href="/login" className="register-login-link">Войти</a>
          </div>
        </section>
      </main>
    </div>
  )
}
