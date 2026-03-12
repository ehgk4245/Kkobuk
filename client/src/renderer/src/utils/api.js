const BASE_URL = import.meta.env.VITE_API_BASE_URL
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL

export async function aiFetch(url, options = {}) {
  const token = localStorage.getItem('accessToken')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`
  }

  let res = await fetch(`${AI_BASE_URL}${url}`, { ...options, headers })

  if (res.status === 401) {
    const ok = await refreshTokens()
    if (!ok) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.hash = '/'
      throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
    }
    const newToken = localStorage.getItem('accessToken')
    headers.Authorization = `Bearer ${newToken}`
    res = await fetch(`${AI_BASE_URL}${url}`, { ...options, headers })
  }

  return res
}

async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false

  const res = await fetch(`${BASE_URL}/auth/reissue`, {
    method: 'POST',
    headers: { 'X-Refresh-Token': refreshToken }
  })
  if (!res.ok) return false

  const { accessToken, refreshToken: newRefreshToken } = await res.json()
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', newRefreshToken)
  return true
}

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('accessToken')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`
  }

  let res = await fetch(`${BASE_URL}${url}`, { ...options, headers })

  if (res.status === 401) {
    const ok = await refreshTokens()
    if (!ok) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.hash = '/'
      throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.')
    }
    const newToken = localStorage.getItem('accessToken')
    headers.Authorization = `Bearer ${newToken}`
    res = await fetch(`${BASE_URL}${url}`, { ...options, headers })
  }

  return res
}
