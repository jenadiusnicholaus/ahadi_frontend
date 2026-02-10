import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from '@/api/token'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import EventsView from '@/views/EventsView.vue'
import CreateEventView from '@/views/CreateEventView.vue'
import EventContributionsView from '@/views/EventContributionsView.vue'
import EventParticipantsView from '@/views/EventParticipantsView.vue'
import EventWalletView from '@/views/EventWalletView.vue'
import EventTransactionsView from '@/views/EventTransactionsView.vue'
import EventAnnouncementsView from '@/views/EventAnnouncementsView.vue'
import EventInvitationsView from '@/views/EventInvitationsView.vue'
import EditEventView from '@/views/EditEventView.vue'
import EventChatView from '@/views/EventChatView.vue'
import CalendarView from '@/views/CalendarView.vue'
import ProfileView from '@/views/ProfileView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import WalletView from '@/views/WalletView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import SubscriptionsView from '@/views/SubscriptionsView.vue'
import PublicEventDetailView from '@/views/PublicEventDetailView.vue'
import EventContributeView from '@/views/EventContributeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/event/:id',
      name: 'event-public',
      component: PublicEventDetailView,
    },
    {
      path: '/event/:id/contribute',
      name: 'event-contribute',
      component: EventContributeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/events',
      name: 'events',
      component: EventsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/create',
      name: 'events-create',
      component: CreateEventView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id',
      name: 'events-detail',
      redirect: (to) => ({ name: 'event-public', params: { id: to.params.id } }),
    },
    {
      path: '/events/:id/contributions',
      name: 'events-contributions',
      component: EventContributionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/participants',
      name: 'events-participants',
      component: EventParticipantsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/wallet',
      name: 'events-wallet',
      component: EventWalletView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/transactions',
      name: 'events-transactions',
      component: EventTransactionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/announcements',
      name: 'events-announcements',
      component: EventAnnouncementsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/invitations',
      name: 'events-invitations',
      component: EventInvitationsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/edit',
      name: 'events-edit',
      component: EditEventView,
      meta: { requiresAuth: true },
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView,
      meta: { requiresAuth: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: EventChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/chat',
      name: 'events-chat',
      redirect: (to) => ({
        name: 'messages',
        query: { eventId: String(to.params.id ?? '') },
      }),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: EditProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: WalletView,
      meta: { requiresAuth: true },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: SubscriptionsView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const hasToken = !!getAccessToken()
  if (to.meta.requiresAuth && !hasToken) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
