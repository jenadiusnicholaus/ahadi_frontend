/**
 * Invitation templates API – GET /api/v1/invitation-templates/
 * View and list invitation card templates: list all, by id, categories, by category, free, premium.
 */

import { get } from './client'
import { getInvitationTemplatesPrefix } from '@/api/env'

const invitationTemplatesPath = (suffix: string) => `${getInvitationTemplatesPrefix()}/${suffix}`

// --- Types (from Swagger schema) ---

export interface InvitationTemplate {
  id: number
  name: string
  slug: string
  description: string
  category: string
  category_display: string
  template_type: string
  canvas_style: string
  design_config: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  preview_image: string
  preview_image_url: string
  is_active: boolean
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedInvitationTemplatesResponse {
  count: number
  next: string | null
  previous: string | null
  results: InvitationTemplate[]
}

/** Category option from GET invitation-templates/categories/ (may be object or string). */
export interface InvitationTemplateCategoryOption {
  category?: string
  category_display?: string
  name?: string
  id?: number
  [key: string]: unknown
}

/** Normalize API response to InvitationTemplate[]. */
function normalizeTemplateList(data: unknown): InvitationTemplate[] {
  if (Array.isArray(data)) return data as InvitationTemplate[]
  const o = data as PaginatedInvitationTemplatesResponse | null
  return (o?.results ?? []) as InvitationTemplate[]
}

// --- Endpoints ---

/**
 * GET /api/v1/invitation-templates/
 * List all active templates. Params: page.
 */
export function fetchInvitationTemplates(params?: { page?: number }): Promise<PaginatedInvitationTemplatesResponse> {
  const search: Record<string, string> = {}
  if (params?.page != null) search.page = String(params.page)
  return get<PaginatedInvitationTemplatesResponse>(
    invitationTemplatesPath(''),
    Object.keys(search).length ? search : undefined
  )
}

/**
 * GET /api/v1/invitation-templates/{id}/
 * Get template details.
 */
export function fetchInvitationTemplateById(id: number): Promise<InvitationTemplate> {
  return get<InvitationTemplate>(invitationTemplatesPath(`${id}/`))
}

/**
 * GET /api/v1/invitation-templates/categories/
 * List available template categories. Returns array of category options (or strings).
 */
export function fetchInvitationTemplateCategories(): Promise<InvitationTemplateCategoryOption[]> {
  return get<
    | InvitationTemplateCategoryOption[]
    | string[]
    | { results?: InvitationTemplateCategoryOption[] | string[] }
  >(invitationTemplatesPath('categories/')).then((data) => {
    if (Array.isArray(data)) {
      return data.map((c) =>
        typeof c === 'string' ? { category: c, category_display: c } : (c as InvitationTemplateCategoryOption)
      ) as InvitationTemplateCategoryOption[]
    }
    const results = (data as { results?: InvitationTemplateCategoryOption[] }).results ?? []
    return Array.isArray(results)
      ? (results.map((c) =>
          typeof c === 'string' ? { category: c, category_display: c } : (c as InvitationTemplateCategoryOption)
        ) as InvitationTemplateCategoryOption[])
      : []
  })
}

/**
 * GET /api/v1/invitation-templates/by_category/
 * Filter by category. Params: category (e.g. WEDDING). Returns list of templates.
 */
export function fetchInvitationTemplatesByCategory(category: string): Promise<InvitationTemplate[]> {
  return get<unknown>(invitationTemplatesPath('by_category/'), { category }).then(normalizeTemplateList)
}

/**
 * GET /api/v1/invitation-templates/free_templates/
 * Get free templates.
 */
export function fetchFreeInvitationTemplates(): Promise<InvitationTemplate[]> {
  return get<unknown>(invitationTemplatesPath('free_templates/')).then(normalizeTemplateList)
}

/**
 * GET /api/v1/invitation-templates/premium_templates/
 * Get premium templates.
 */
export function fetchPremiumInvitationTemplates(): Promise<InvitationTemplate[]> {
  return get<unknown>(invitationTemplatesPath('premium_templates/')).then(normalizeTemplateList)
}
