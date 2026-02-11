import Cookies from 'js-cookie'

// Check if we're on localhost (development)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export const setCookie = (name: string, value: string, days: number = 7) => {
  Cookies.set(name, value, { 
    expires: days, 
    secure: !isLocalhost, // Only secure on production (HTTPS)
    sameSite: 'lax' 
  })
}

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name)
}

export const removeCookie = (name: string) => {
  Cookies.remove(name)
}

export const clearAllCookies = () => {
  const cookies = Cookies.get()
  Object.keys(cookies).forEach((cookieName) => {
    Cookies.remove(cookieName)
  })
}
