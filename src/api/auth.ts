import { getAuthPrefix } from '@/api/client'
import { post } from '@/api/client'

/** Response from POST /auth/social/google/ (shape may vary by backend) */
export interface GoogleAuthResponse {
  access?: string
  refresh?: string
  user?: unknown
  [key: string]: unknown
}

/**
 * Sign in with Google by sending id_token or access_token to the backend.
 * POST {API_BASE_URL}/{API_AUTH_PREFIX}/social/google/
 */
export async function signInWithGoogle(params: {
  id_token?: string
  access_token?: string
}): Promise<GoogleAuthResponse> {
  const prefix = getAuthPrefix()
  const path = `${prefix}/social/google/`
  const body =
    params.id_token != null
      ? { id_token: params.id_token }
      : params.access_token != null
        ? { access_token: params.access_token }
        : null
  if (!body) throw new Error('Either id_token or access_token is required')
  return post<GoogleAuthResponse>(path, body)
}

/**
 * Request OTP for phone verification.
 * POST {API_BASE_URL}/{API_AUTH_PREFIX}/request-otp/
 */
export async function requestOtp(phone: string): Promise<void> {
  const prefix = getAuthPrefix()
  const path = `${prefix}/request-otp/`
  await post(path, { phone: phone.trim() })
}

/** Response from POST verify-otp (data may contain access, refresh, user) */
export interface VerifyOtpResponse {
  success?: boolean
  message?: string
  data?: {
    access?: string
    access_token?: string
    refresh?: string
    refresh_token?: string
    user?: unknown
    requires_phone_link?: boolean
  }
}

/**
 * Verify OTP and get tokens.
 * POST {API_BASE_URL}/{API_AUTH_PREFIX}/verify-otp/
 */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  const prefix = getAuthPrefix()
  const path = `${prefix}/verify-otp/`
  return post<VerifyOtpResponse>(path, { phone: phone.trim(), code: code.trim() })
}

/**
 * Logout: blacklist refresh token.
 * POST {API_BASE_URL}/{API_AUTH_PREFIX}/logout/
 */
export async function logoutApi(refreshToken: string): Promise<void> {
  const prefix = getAuthPrefix()
  const path = `${prefix}/logout/`
  await post(path, { refresh: refreshToken })
}
