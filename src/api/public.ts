/**
 * Public API – GET /api/v1/public/
 * Public endpoints (no authentication): config, info, plans.
 */

import { get } from './client'
import { getPublicPrefix } from '@/api/env'

const publicPath = (suffix: string) => `${getPublicPrefix()}/${suffix}`

/**
 * GET /api/v1/public/config/
 * Get public app configuration. No auth required.
 */
export function fetchPublicConfig(): Promise<unknown> {
  return get<unknown>(publicPath('config/'))
}

/**
 * GET /api/v1/public/info/
 * Get basic app information for landing page. No auth required.
 */
export function fetchPublicInfo(): Promise<unknown> {
  return get<unknown>(publicPath('info/'))
}

/**
 * GET /api/v1/public/plans/
 * Get all active subscription plans. No auth required.
 */
export function fetchPublicPlans(): Promise<unknown> {
  return get<unknown>(publicPath('plans/'))
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Admin Public endpoints (no auth required)
 * ───────────────────────────────────────────────────────────────────────────── */

export interface TrustedClient {
  id: number
  name: string
  role: string
  handle?: string
  quote: string
  avatar?: string
  is_active?: boolean
}

export interface Partner {
  id: number
  name: string
  short_name?: string
  description?: string
  category?: string
  logo?: string
  is_active?: boolean
}

/**
 * GET /api/v1/admin/public/trusted-clients/
 * Get trusted clients for home page testimonials. No auth required.
 */
export function fetchTrustedClients(): Promise<TrustedClient[]> {
  return get<TrustedClient[]>('admin/public/trusted-clients/')
}

/**
 * GET /api/v1/admin/public/partners/
 * Get partners for home page. No auth required.
 */
export function fetchPartners(): Promise<Partner[]> {
  return get<Partner[]>('admin/public/partners/')
}
