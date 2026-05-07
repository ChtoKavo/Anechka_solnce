import { useState } from 'react'
import { authAPI } from '../services/api'
import '../App.css'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validateLogin = () => {
    const errors = {}

    if (!formData.email.trim()) {
      errors.email = 'Введите Email'
    } else if (!validateEmail(formData.email.trim())) {
      errors.email = 'Введите корректный Email'
    }

    if (!formData.password) {
      errors.password = 'Введите пароль'
    }

    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const validationErrors = validateLogin()

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Пожалуйста, исправьте ошибки в форме')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.login(formData.email, '', formData.password)
      
      if (response.token) {
        window.location.href = '/'
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

            {error && <div className="form-error-box">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div>
                <input
                  type="text"
                  name="email"
                  placeholder="Email"
                  className={`login-input ${fieldErrors.email ? 'input-invalid' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  className={`login-input ${fieldErrors.password ? 'input-invalid' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
              </div>

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
