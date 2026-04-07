// ============================================
// API SERVICE ДЛЯ ФРОНТЕНДА
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// Для загрузки файлов используем относительный путь (Nginx проксирует на backend)

// Сохранение токена
const setToken = (token) => localStorage.setItem('authToken', token);
const getToken = () => localStorage.getItem('authToken');
const removeToken = () => localStorage.removeItem('authToken');

// Заголовки с токеном
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Функция для обработки ошибок
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Ошибка сервера');
  }

  return data;
};

// ============================================
// АУТЕНТИФИКАЦИЯ
// ============================================

export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(response);
    if (data.token) setToken(data.token);
    return data;
  },

  login: async (email, phone, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, password }),
    });
    const data = await handleResponse(response);
    if (data.token) setToken(data.token);
    return data;
  },

  verify: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  logout: () => {
    removeToken();
  },
};

// ============================================
// РЕЦЕПТЫ
// ============================================

export const recipesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/recipes`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`);
    return handleResponse(response);
  },

  create: async (recipeData) => {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(recipeData),
    });
    return handleResponse(response);
  },

  update: async (id, recipeData) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(recipeData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================
// ИЗБРАННЫЕ РЕЦЕПТЫ
// ============================================

export const favoritesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  add: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${recipeId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  remove: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${recipeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================
// ПРОФИЛЬ
// ============================================

export const profileAPI = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  update: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },
};

// ============================================
// ЗАГРУЗКА ФАЙЛОВ
// ============================================

export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
};

// ============================================
// АДМИНИСТРАТОР
// ============================================

export const adminAPI = {
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getRecipes: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/recipes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  deleteRecipe: async (recipeId) => {
    const response = await fetch(`${API_BASE_URL}/admin/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateRecipeStatus: async (recipeId, isPublished) => {
    const response = await fetch(`${API_BASE_URL}/admin/recipes/${recipeId}/publish`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_published: isPublished }),
    });
    return handleResponse(response);
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });
    return handleResponse(response);
  },
};

export default {
  authAPI,
  recipesAPI,
  favoritesAPI,
  profileAPI,
  adminAPI,
  setToken,
  getToken,
  removeToken,
};
