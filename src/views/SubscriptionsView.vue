<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebNavbar from '@/components/WebNavbar.vue'
import {
  fetchSubscriptionPlans,
  fetchMySubscription,
  subscriptionCheckoutMno,
} from '@/api/payments'

/** Plan from GET /payments/subscriptions/plans/. Backend fields: price_monthly, price_yearly, currency. */
interface Plan {
  id?: number
  name?: string
  plan_type?: string
  description?: string
  /** Backend: price_monthly */
  price_monthly?: number
  /** Backend: price_yearly */
  price_yearly?: number
  /** Backend: currency (e.g. TZS) */
  currency?: string
  max_events?: number
  max_participants_per_event?: number
  transaction_fee_percent?: number
  features?: string[] | Record<string, unknown>
  [key: string]: unknown
}

const router = useRouter()

const loading = ref(true)
const error = ref('')
const plans = ref<Plan[]>([])
const currentSubscription = ref<Record<string, unknown> | null>(null)
const recommendation = ref<{ message?: string; example?: string } | null>(null)

const showSubscribeModal = ref(false)
const selectedPlan = ref<Plan | null>(null)
const billingCycle = ref<'MONTHLY' | 'YEARLY'>('MONTHLY')
const selectedProvider = ref('')
const phoneNumber = ref('')
const subscribeError = ref('')
const subscribing = ref(false)

const PROVIDERS = [
  { name: 'Tigo', color: '#002B5B' },
  { name: 'Airtel', color: '#ED1C24' },
  { name: 'Vodacom', color: '#E60000' },
  { name: 'Halotel', color: '#00A651' },
]

const FEE_COMPARISON = [
  { plan: 'Free', fee: '5%', amount: '50,000' },
  { plan: 'Basic', fee: '4%', amount: '40,000' },
  { plan: 'Premium', fee: '3%', amount: '30,000' },
  { plan: 'VIP', fee: '2%', amount: '20,000' },
]

/** Normalize plan from API (backend may send price_monthly, price_yearly, currency). */
function normalizePlan(raw: Record<string, unknown>): Plan {
  return {
    ...raw,
    price_monthly: Number(raw.price_monthly ?? raw.monthly_price ?? 0),
    price_yearly: Number(raw.price_yearly ?? raw.yearly_price ?? 0),
    currency: (raw.currency as string) ?? 'TZS',
  } as Plan
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [plansRes, myRes] = await Promise.all([
      fetchSubscriptionPlans() as Promise<{ plans?: Record<string, unknown>[] }>,
      fetchMySubscription() as Promise<{
        subscription?: Record<string, unknown>
        has_subscription?: boolean
        recommendation?: { message?: string; example?: string }
      }>,
    ])
    const rawPlans = Array.isArray(plansRes?.plans) ? plansRes.plans : []
    plans.value = rawPlans.map((p) => normalizePlan(p))
    const sub = myRes?.subscription ?? (myRes?.has_subscription ? myRes : null)
    currentSubscription.value = sub && typeof sub === 'object' ? sub : null
    recommendation.value = myRes?.recommendation ?? null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load plans'
    plans.value = []
    currentSubscription.value = null
    recommendation.value = null
  } finally {
    loading.value = false
  }
}

function planColor(planType: string): string {
  const t = (planType || '').toUpperCase()
  if (t === 'INSTITUTIONAL' || t === 'VIP') return '#7c3aed'
  if (t === 'PREMIUM') return '#d97706'
  if (t === 'BASIC') return '#1a283b'
  return '#64748b'
}

function planIcon(planType: string): string {
  const t = (planType || '').toUpperCase()
  if (t === 'INSTITUTIONAL' || t === 'VIP') return '◆'
  if (t === 'PREMIUM') return '★'
  if (t === 'BASIC') return '▸'
  return '○'
}

function isCurrentPlan(plan: Plan): boolean {
  const currentType = (currentSubscription.value?.plan_type as string) ?? 'FREE'
  return (plan.plan_type ?? '').toUpperCase() === currentType.toUpperCase()
}

function canUpgrade(plan: Plan): boolean {
  const order = ['FREE', 'BASIC', 'PREMIUM', 'VIP', 'INSTITUTIONAL']
  const current = ((currentSubscription.value?.plan_type as string) ?? 'FREE').toUpperCase()
  const target = (plan.plan_type ?? 'FREE').toUpperCase()
  return order.indexOf(target) > order.indexOf(current)
}

function planFeaturesList(plan: Plan): string[] {
  const f = plan.features
  if (Array.isArray(f)) return f
  if (f && typeof f === 'object') return Object.keys(f).filter((k) => (f as Record<string, unknown>)[k])
  return []
}

function openSubscribe(plan: Plan) {
  selectedPlan.value = plan
  billingCycle.value = 'MONTHLY'
  selectedProvider.value = ''
  phoneNumber.value = ''
  subscribeError.value = ''
  showSubscribeModal.value = true
}

function closeSubscribe() {
  showSubscribeModal.value = false
  selectedPlan.value = null
}

const selectedPlanPrice = computed(() => {
  const plan = selectedPlan.value
  if (!plan) return 0
  return billingCycle.value === 'YEARLY'
    ? (plan.price_yearly ?? (plan.price_monthly ?? 0) * 12)
    : (plan.price_monthly ?? 0)
})

/** Currency for selected plan (for summary). */
const selectedPlanCurrency = computed(() => selectedPlan.value?.currency ?? 'TZS')

async function doSubscribe() {
  const plan = selectedPlan.value
  if (!plan?.id) return
  if (!selectedProvider.value || !phoneNumber.value.trim()) {
    subscribeError.value = 'Please select a provider and enter your phone number.'
    return
  }
  subscribing.value = true
  subscribeError.value = ''
  try {
    const res = await subscriptionCheckoutMno({
      plan_id: plan.id,
      billing_cycle: billingCycle.value,
      provider: selectedProvider.value,
      account_number: phoneNumber.value.trim(),
    }) as { success?: boolean; message?: string; error?: string }
    if (res?.success !== false) {
      closeSubscribe()
      await load()
      router.push({ name: 'profile' })
    } else {
      subscribeError.value = (res?.message ?? res?.error) || 'Payment could not be started.'
    }
  } catch (e) {
    subscribeError.value = e instanceof Error ? e.message : 'Request failed'
  } finally {
    subscribing.value = false
  }
}

/** Plan order for steps (Premium is step 3 / highlighted). */
const PLAN_ORDER = ['FREE', 'BASIC', 'PREMIUM', 'VIP', 'INSTITUTIONAL']

const sortedPlans = computed(() => {
  const list = [...plans.value]
  return list.sort((a, b) => {
    const aType = (a.plan_type ?? 'FREE').toUpperCase()
    const bType = (b.plan_type ?? 'FREE').toUpperCase()
    return PLAN_ORDER.indexOf(aType) - PLAN_ORDER.indexOf(bType)
  })
})

function isPremiumPlan(plan: Plan): boolean {
  return (plan.plan_type ?? '').toUpperCase() === 'PREMIUM'
}

function stepNumber(plan: Plan): number {
  const t = (plan.plan_type ?? 'FREE').toUpperCase()
  const i = PLAN_ORDER.indexOf(t)
  return i >= 0 ? i + 1 : 0
}

function yearlySavingsPercent(plan: Plan): number {
  const monthly = plan.price_monthly ?? 0
  const yearly = plan.price_yearly ?? 0
  if (monthly <= 0 || yearly <= 0) return 0
  const fullYear = monthly * 12
  if (fullYear <= 0) return 0
  return Math.round((1 - yearly / fullYear) * 100)
}

/** Format amount for display (compact). */
function formatPrice(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(Math.round(value))
}

/** Formatted monthly price with currency (e.g. "TZS 10,000" or "TZS 10K"). */
function formattedMonthlyPrice(plan: Plan): string {
  const cur = plan.currency ?? 'TZS'
  const val = plan.price_monthly ?? 0
  if (val === 0) return `${cur} 0`
  return `${cur} ${val >= 1000 ? formatPrice(val) : val.toLocaleString()}`
}

/** Formatted yearly price with currency. */
function formattedYearlyPrice(plan: Plan): string {
  const cur = plan.currency ?? 'TZS'
  const val = plan.price_yearly ?? 0
  if (val === 0) return `${cur} 0`
  return `${cur} ${val >= 1000 ? formatPrice(val) : val.toLocaleString()}`
}

onMounted(load)
</script>

<template>
  <div class="subscriptions-page">
    <WebNavbar />
    <main class="subscriptions-main">
      <header class="sub-header">
        <h1 class="sub-title">Subscription Plans</h1>
      </header>

      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="error" class="state state-error">
        <p>{{ error }}</p>
        <button type="button" class="btn-retry" @click="load">Retry</button>
      </div>
      <template v-else>
        <div class="plans-top-row">
          <!-- Current Plan Card (Flutter-style) -->
          <section class="current-plan-card" :style="{ borderColor: planColor((currentSubscription?.plan_type as string) ?? '') + '50' }">
            <div
              class="current-plan-inner"
              :style="{
                background: `linear-gradient(135deg, ${planColor((currentSubscription?.plan_type as string) ?? '')}20, ${planColor((currentSubscription?.plan_type as string) ?? '')}08)`,
              }"
            >
              <div
                class="current-plan-icon"
                :style="{ backgroundColor: planColor((currentSubscription?.plan_type as string) ?? '') + '30' }"
              >
                {{ planIcon((currentSubscription?.plan_type as string) ?? '') }}
              </div>
              <div class="current-plan-text">
                <span class="current-plan-label">Current Plan</span>
                <span
                  class="current-plan-name"
                  :style="{ color: planColor((currentSubscription?.plan_type as string) ?? '') }"
                >
                  {{ (currentSubscription?.plan_name ?? currentSubscription?.plan ?? 'Free') }}
                </span>
                <span v-if="currentSubscription?.expires_at" class="current-plan-expiry">
                  Expires in {{ currentSubscription?.days_remaining ?? 0 }} days
                </span>
              </div>
              <div class="current-plan-fee">
                <span class="current-plan-fee-label">Fee</span>
                <span
                  class="current-plan-fee-value"
                  :style="{ color: planColor((currentSubscription?.plan_type as string) ?? '') }"
                >
                  {{ (currentSubscription?.transaction_fee_percent ?? 5) }}%
                </span>
              </div>
            </div>
          </section>

          <!-- Value Proposition Card -->
          <section v-if="recommendation?.message" class="value-card">
          <div class="value-header">
            <span class="value-icon">💡</span>
            <span class="value-message">{{ recommendation.message.replace(/^💡\s*/, '') }}</span>
          </div>
          <p v-if="recommendation.example" class="value-example">{{ recommendation.example }}</p>
          <div class="fee-comparison">
            <p class="fee-comparison-title">Fee on TZS 1,000,000 withdrawal:</p>
            <div class="fee-chips">
              <span
                v-for="row in FEE_COMPARISON"
                :key="row.plan"
                class="fee-chip"
                :class="{ first: row.plan === 'Free' }"
              >
                <span class="fee-chip-plan">{{ row.plan }}</span>
                <span class="fee-chip-amount">TZS {{ row.amount }}</span>
              </span>
            </div>
          </div>
        </section>
        </div>

        <!-- Choose Your Plan - Steps (Premium highlighted) -->
        <h2 class="section-title">Choose Your Plan</h2>
        <p class="section-subtitle">Upgrade step by step — Premium gives you the best value</p>

        <div class="steps-container">
          <div
            v-for="(plan, i) in sortedPlans"
            :key="i"
            class="step-wrapper"
            :class="{ 'step-premium': isPremiumPlan(plan) }"
            :style="{ marginTop: (i * 24) + 'px' }"
          >
            <div
              class="plan-card"
              :class="{ 'plan-card-featured': isPremiumPlan(plan) }"
              :style="{ borderColor: isCurrentPlan(plan) ? planColor(plan.plan_type as string) : (isPremiumPlan(plan) ? '#d97706' : '#e2e8f0') }"
            >
              <div v-if="isPremiumPlan(plan)" class="plan-recommended-badge">Most Popular</div>
              <div class="plan-card-header" :style="{ background: planColor(plan.plan_type as string) + '15' }">
                <div class="plan-card-header-left">
                  <span class="plan-card-name" :style="{ color: planColor(plan.plan_type as string) }">
                    {{ plan.name ?? plan.plan_type ?? 'Plan' }}
                  </span>
                  <span v-if="isCurrentPlan(plan)" class="plan-badge">CURRENT</span>
                  <p class="plan-card-desc">
                    {{ plan.description || `Perfect for ${(plan.plan_type ?? '').toLowerCase()} users` }}
                  </p>
                </div>
                <div class="plan-card-price-wrap">
                  <span class="plan-card-price" :style="{ color: planColor(plan.plan_type as string) }">
                    {{ formattedMonthlyPrice(plan) }}
                  </span>
                  <span class="plan-card-period">/month</span>
                </div>
              </div>
              <div class="plan-card-body">
                <div class="plan-stats-row">
                  <div class="plan-stat">
                    <span class="plan-stat-icon">📅</span>
                    <span class="plan-stat-value">{{ plan.max_events === -1 ? 'Unlimited' : (plan.max_events ?? 0) }}</span>
                    <span class="plan-stat-label">Events</span>
                  </div>
                  <div class="plan-stat">
                    <span class="plan-stat-icon">👥</span>
                    <span class="plan-stat-value">{{ plan.max_participants_per_event ?? 0 }}</span>
                    <span class="plan-stat-label">Participants</span>
                  </div>
                  <div class="plan-stat">
                    <span class="plan-stat-icon">%</span>
                    <span class="plan-stat-value">{{ plan.transaction_fee_percent ?? 5 }}%</span>
                    <span class="plan-stat-label">Fee</span>
                  </div>
                </div>
                <ul class="plan-features-list">
                  <li v-for="(feat, j) in planFeaturesList(plan)" :key="j" class="plan-feature-item">
                    <span class="plan-feature-check">✓</span>
                    <span>{{ feat }}</span>
                  </li>
                </ul>
                <div v-if="!((plan.price_monthly ?? 0) === 0 || (plan.plan_type ?? '').toUpperCase() === 'FREE') && yearlySavingsPercent(plan) > 0" class="plan-yearly-badge">
                  Save {{ yearlySavingsPercent(plan) }}% yearly ({{ formattedYearlyPrice(plan) }}/yr)
                </div>
                <button
                  v-if="!isCurrentPlan(plan) && canUpgrade(plan)"
                  type="button"
                  class="btn-upgrade-plan"
                  :style="{ backgroundColor: planColor(plan.plan_type as string), color: '#fff' }"
                  @click="openSubscribe(plan)"
                >
                  Upgrade to {{ plan.name ?? plan.plan_type }}
                </button>
                <p v-else-if="!isCurrentPlan(plan)" class="plan-higher">You have a higher plan</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Subscribe Modal (Flutter bottom sheet style) -->
    <Teleport to="body">
      <div v-if="showSubscribeModal" class="modal-backdrop" @click.self="closeSubscribe">
        <div class="subscribe-modal">
          <div class="modal-handle" />
          <h3 class="modal-title">Subscribe to {{ selectedPlan?.name ?? selectedPlan?.plan_type ?? 'Plan' }}</h3>

          <div class="modal-section">
            <label class="modal-label">Billing Cycle</label>
            <div class="billing-options">
              <button
                type="button"
                class="billing-option"
                :class="{ active: billingCycle === 'MONTHLY' }"
                @click="billingCycle = 'MONTHLY'"
              >
                Monthly<br>
                <strong>{{ selectedPlan ? formattedMonthlyPrice(selectedPlan) : '0' }}</strong>
              </button>
              <button
                type="button"
                class="billing-option"
                :class="{ active: billingCycle === 'YEARLY' }"
                @click="billingCycle = 'YEARLY'"
              >
                Yearly
                <span v-if="selectedPlan && yearlySavingsPercent(selectedPlan) > 0" class="billing-badge">Save {{ yearlySavingsPercent(selectedPlan) }}%</span>
                <strong>{{ selectedPlan ? formattedYearlyPrice(selectedPlan) : '0' }}</strong>
              </button>
            </div>
          </div>

          <div class="modal-section">
            <label class="modal-label">Payment Method</label>
            <div class="provider-options">
              <button
                v-for="prov in PROVIDERS"
                :key="prov.name"
                type="button"
                class="provider-option"
                :class="{ active: selectedProvider === prov.name }"
                :style="{ borderColor: selectedProvider === prov.name ? prov.color : '#e2e8f0' }"
                @click="selectedProvider = prov.name"
              >
                <span class="provider-letter" :style="{ backgroundColor: prov.color }">{{ prov.name[0] }}</span>
                {{ prov.name }}
              </button>
            </div>
          </div>

          <div class="modal-section">
            <label class="modal-label">Phone Number</label>
            <input
              v-model="phoneNumber"
              type="tel"
              placeholder="07XXXXXXXX"
              class="modal-input"
            />
          </div>

          <div class="modal-summary">
            <div class="summary-row">
              <span>Plan</span>
              <span>{{ selectedPlan?.name ?? selectedPlan?.plan_type }}</span>
            </div>
            <div class="summary-row">
              <span>Billing</span>
              <span>{{ billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly' }}</span>
            </div>
            <div class="summary-row bold">
              <span>Amount</span>
              <span>{{ selectedPlanCurrency }} {{ selectedPlanPrice.toLocaleString() }}</span>
            </div>
          </div>

          <p v-if="subscribeError" class="modal-error">{{ subscribeError }}</p>

          <button
            type="button"
            class="btn-subscribe"
            :disabled="subscribing"
            @click="doSubscribe"
          >
            {{ subscribing ? 'Processing…' : 'Subscribe Now' }}
          </button>
          <button type="button" class="btn-cancel-modal" @click="closeSubscribe">Cancel</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.subscriptions-page { min-height: 100vh; background: #fff; width: 100%; }
.subscriptions-main { width: 100%; max-width: 100%; margin: 0 auto; padding: 24px 20px; padding-top: 72px; box-sizing: border-box; }
.sub-header { margin-bottom: 24px; }
.sub-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.state { text-align: center; padding: 48px; color: #64748b; }
.state-error { color: #dc2626; }
.btn-retry { margin-top: 12px; padding: 8px 16px; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }

.plans-top-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 24px;
}

.plans-top-row .current-plan-card {
  flex: 1;
  min-width: 280px;
}

.plans-top-row .value-card {
  flex: 1;
  min-width: 280px;
}

.current-plan-card {
  border-radius: 16px;
  border-width: 1px;
  border-style: solid;
  margin-bottom: 0;
  overflow: hidden;
}
.current-plan-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.current-plan-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #1e293b;
}
.current-plan-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.current-plan-label { font-size: 12px; color: #64748b; font-weight: 500; }
.current-plan-name { font-size: 24px; font-weight: 700; }
.current-plan-expiry { font-size: 12px; color: #64748b; }
.current-plan-fee { text-align: right; }
.current-plan-fee-label { font-size: 12px; color: #64748b; display: block; }
.current-plan-fee-value { font-size: 20px; font-weight: 700; }

.value-card {
  background: linear-gradient(135deg, #fef9c3, #ffedd5);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 0;
}
.value-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.value-icon { font-size: 20px; }
.value-message { font-size: 14px; font-weight: 600; color: #92400e; flex: 1; }
.value-example { font-size: 12px; color: #78350f; margin: 0 0 12px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 8px; }
.fee-comparison { margin-top: 12px; }
.fee-comparison-title { font-size: 11px; font-weight: 500; color: #57534e; margin: 0 0 8px; }
.fee-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.fee-chip {
  padding: 6px 10px;
  border-radius: 6px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.fee-chip.first { background: #f1f5f9; border-color: #e2e8f0; }
.fee-chip-plan { font-size: 10px; font-weight: 600; color: #166534; }
.fee-chip.first .fee-chip-plan { color: #64748b; }
.fee-chip-amount { font-size: 11px; font-weight: 700; color: #14532d; }
.fee-chip.first .fee-chip-amount { color: #475569; }

.section-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
.section-subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px; }

/* Staircase layout: plans as ascending steps, no numbers */
.steps-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  padding-bottom: 24px;
}

.step-wrapper {
  flex: 1;
  min-width: 260px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-wrapper.step-premium {
  min-width: 280px;
  max-width: 360px;
}

.plan-recommended-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #d97706, #b45309);
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
  z-index: 2;
}

.plan-card {
  position: relative;
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 4px 4px;
  border: 2px solid #e2e8f0;
  margin-bottom: 0;
  overflow: visible;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 6px 0 -2px #cbd5e1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}


.plan-card-featured {
  border-width: 2px;
  border-color: #d97706;
  box-shadow: 0 10px 25px -5px rgba(217, 119, 6, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
  padding-top: 8px;
}

@media (max-width: 900px) {
  .plan-card-featured { transform: scale(1); }
  .step-wrapper { max-width: none; }
  .step-wrapper.step-premium { max-width: none; }
  .step-wrapper[style*="margin-top"] { margin-top: 16px !important; }
}
.plan-card-header {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.plan-card-header-left { flex: 1; min-width: 0; }
.plan-card-name { font-size: 20px; font-weight: 700; display: inline-block; margin-right: 8px; }
.plan-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #1a283b;
  vertical-align: middle;
}
.plan-card-desc { font-size: 13px; color: #64748b; margin: 8px 0 0; }
.plan-card-price-wrap { text-align: right; }
.plan-card-price { font-size: 24px; font-weight: 700; }
.plan-card-period { font-size: 12px; color: #64748b; display: block; }
.plan-card-body { padding: 20px; }
.plan-stats-row { display: flex; gap: 16px; margin-bottom: 16px; }
.plan-stat { flex: 1; text-align: center; }
.plan-stat-icon { font-size: 20px; display: block; margin-bottom: 4px; }
.plan-stat-value { font-size: 16px; font-weight: 700; display: block; }
.plan-stat-label { font-size: 11px; color: #64748b; }
.plan-features-list { list-style: none; padding: 0; margin: 0 0 16px; }
.plan-feature-item { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.plan-feature-check { color: #16a34a; font-weight: 700; }
.plan-yearly-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 12px;
  color: #166534;
  font-weight: 500;
}
.btn-upgrade-plan {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}
.btn-upgrade-plan:hover { opacity: 0.95; }
.plan-higher { text-align: center; font-size: 14px; color: #94a3b8; margin: 0; }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.subscribe-modal {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-handle {
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 0 auto 20px;
}
.modal-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 24px; }
.modal-section { margin-bottom: 24px; }
.modal-label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #374151; }
.billing-options { display: flex; gap: 12px; }
.billing-option {
  flex: 1;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
}
.billing-option.active { border-width: 2px; border-color: #1a283b; background: #f8fafc; }
.billing-badge { display: block; font-size: 10px; color: #16a34a; font-weight: 700; margin: 4px 0 0; }
.provider-options { display: flex; flex-wrap: wrap; gap: 12px; }
.provider-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  min-width: 100px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 13px;
  cursor: pointer;
}
.provider-option.active { background: #f1f5f9; }
.provider-letter {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-input {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-sizing: border-box;
}
.modal-summary {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #64748b; }
.summary-row.bold { font-weight: 700; color: #1e293b; }
.modal-error { color: #dc2626; font-size: 14px; margin-bottom: 12px; }
.btn-subscribe {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #1a283b;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}
.btn-subscribe:hover:not(:disabled) { opacity: 0.95; }
.btn-subscribe:disabled { opacity: 0.7; cursor: wait; }
.btn-cancel-modal {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
}
.btn-cancel-modal:hover { color: #1e293b; }
</style>
