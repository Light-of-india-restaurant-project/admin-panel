import axios, { AxiosResponse } from 'axios'
import { getCookie } from '@/utils/cookie'
import { AUTH_CONFIG, API_BASE_URL } from '@/constants/config'

const getToken = () => getCookie(AUTH_CONFIG.accessTokenKey)

// Error parser
const parseApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Something went wrong'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong'
}

axios.interceptors.request.use(
  async (config) => {
    return config
  },
  (error) => Promise.reject(error)
)

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle 401 - redirect to login
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

interface ApiRequestParams {
  url: string
  params?: Record<string, unknown>
  body?: unknown
  contentType?: string
}

const get = async <T = unknown>({ url, params }: ApiRequestParams): Promise<T> => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }

  const fullUrl = `${API_BASE_URL}/${url}`

  return axios
    .get(fullUrl, {
      headers,
      params,
      withCredentials: true,
    })
    .then((response: AxiosResponse) => {
      return response.data
    })
    .catch((error) => {
      const errorMessage = parseApiError(error)
      throw Error(errorMessage)
    })
}

const post = async <T = unknown>({
  url,
  body,
  contentType = 'application/json',
}: ApiRequestParams): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/${url}`

  const headers = {
    Accept: 'application/json',
    'Content-Type': contentType,
    Authorization: `Bearer ${getToken()}`,
  }

  return axios
    .post(fullUrl, body, { headers, withCredentials: true })
    .then((response: AxiosResponse) => response.data)
    .catch((error) => {
      throw Error(parseApiError(error))
    })
}

const put = async <T = unknown>({
  url,
  body,
  contentType = 'application/json',
}: ApiRequestParams): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/${url}`
  const headers = {
    Accept: 'application/json',
    'Content-Type': contentType,
    Authorization: `Bearer ${getToken()}`,
  }
  return axios
    .put(fullUrl, body, { headers, withCredentials: true })
    .then((response: AxiosResponse) => response.data)
    .catch((error) => {
      throw Error(parseApiError(error))
    })
}

const deleteApi = async <T = unknown>({ url }: ApiRequestParams): Promise<T> => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }

  const fullUrl = `${API_BASE_URL}/${url}`

  return axios
    .delete(fullUrl, { headers, withCredentials: true })
    .then((response: AxiosResponse) => {
      return response.data
    })
    .catch((error) => {
      throw Error(parseApiError(error))
    })
}

const patch = async <T = unknown>({
  url,
  body,
  contentType = 'application/json',
}: ApiRequestParams): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/${url}`
  const headers = {
    Accept: 'application/json',
    'Content-Type': contentType,
    Authorization: `Bearer ${getToken()}`,
  }
  return axios
    .patch(fullUrl, body, { headers, withCredentials: true })
    .then((response: AxiosResponse) => response.data)
    .catch((error) => {
      throw Error(parseApiError(error))
    })
}

export { get, post, put, deleteApi, patch }
