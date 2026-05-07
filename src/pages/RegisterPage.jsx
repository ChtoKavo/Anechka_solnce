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
    agree_data: false,
    agree_policy: false,
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^\+?[\d\s\-()]{6,20}$/.test(phone)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errors = {}

    if (!formData.full_name.trim()) {
      errors.full_name = 'Введите ФИО'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Введите телефон'
    } else if (!validatePhone(formData.phone.trim())) {
      errors.phone = 'Введите корректный телефон'
    }

    if (!formData.email.trim()) {
      errors.email = 'Введите Email'
    } else if (!validateEmail(formData.email.trim())) {
      errors.email = 'Введите корректный Email'
    }

    if (!formData.password) {
      errors.password = 'Введите пароль'
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен быть не менее 6 символов'
    }

    if (!formData.password_confirm) {
      errors.password_confirm = 'Повторите пароль'
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Пароли не совпадают'
    }

    if (!formData.agree_data) {
      errors.agree_data = 'Необходимо согласие на обработку данных'
    }

    if (!formData.agree_policy) {
      errors.agree_policy = 'Необходимо согласиться с политикой конфиденциальности'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Пожалуйста, исправьте ошибки в форме')
      return
    }

    setLoading(true)

    try {
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

            {error && <div className="form-error-box">{error}</div>}

            <form onSubmit={handleRegister} className="register-form">
              <div>
                <input
                  type="text"
                  name="full_name"
                  placeholder="ФИО"
                  className={`register-input ${fieldErrors.full_name ? 'input-invalid' : ''}`}
                  value={formData.full_name}
                  onChange={handleChange}
                />
                {fieldErrors.full_name && <div className="field-error">{fieldErrors.full_name}</div>}
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Телефон"
                  className={`register-input ${fieldErrors.phone ? 'input-invalid' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                />
                {fieldErrors.phone && <div className="field-error">{fieldErrors.phone}</div>}
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={`register-input ${fieldErrors.email ? 'input-invalid' : ''}`}
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
                  className={`register-input ${fieldErrors.password ? 'input-invalid' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
              </div>
              <div>
                <input
                  type="password"
                  name="password_confirm"
                  placeholder="Повторить Пароль"
                  className={`register-input ${fieldErrors.password_confirm ? 'input-invalid' : ''}`}
                  value={formData.password_confirm}
                  onChange={handleChange}
                />
                {fieldErrors.password_confirm && <div className="field-error">{fieldErrors.password_confirm}</div>}
              </div>

              <label className="register-check-row">
                <input
                  type="checkbox"
                  name="agree_data"
                  checked={formData.agree_data}
                  onChange={handleChange}
                />
                <span>Я соглашаюсь на обработку персональных данных</span>
              </label>
              {fieldErrors.agree_data && <div className="field-error field-error-checkbox">{fieldErrors.agree_data}</div>}

              <label className="register-check-row">
                <input
                  type="checkbox"
                  name="agree_policy"
                  checked={formData.agree_policy}
                  onChange={handleChange}
                />
                <span>
                  Я соглашаюсь с <a href="#" className="register-policy-link">Политикой Конфиденциальности</a> этого сайта
                </span>
              </label>
              {fieldErrors.agree_policy && <div className="field-error field-error-checkbox">{fieldErrors.agree_policy}</div>}

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
