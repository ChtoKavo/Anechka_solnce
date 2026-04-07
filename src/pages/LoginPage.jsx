import { useState } from 'react'
import { authAPI } from '../services/api'
import '../App.css'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Проверка что заполнено хотя бы email или phone
      if (!formData.email && !formData.phone) {
        throw new Error('Введите Email или Телефон')
      }
      if (!formData.password) {
        throw new Error('Введите пароль')
      }

      const response = await authAPI.login(formData.email, formData.phone, formData.password)
      
      if (response.token) {
        window.location.href = '/catalog'
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <main className="main-content-login">
        <section className="login-container">
          <div className="login-box">
            <h1 className="login-title">АВТОРИЗАЦИЯ</h1>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                name="email"
                placeholder="Email"
                className="login-input"
                value={formData.email}
                onChange={handleChange}
              />

              <input
                type="text"
                name="phone"
                placeholder="или Телефон"
                className="login-input"
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Пароль"
                className="login-input"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <a href="#" className="login-forgot">Забыли пароль?</a>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Загрузка...' : 'ВОЙТИ'}
              </button>
            </form>

            <div className="login-divider">или</div>

            <a href="/register" className="login-register">Зарегистрироваться</a>
          </div>
        </section>
      </main>
    </div>
  )
}
