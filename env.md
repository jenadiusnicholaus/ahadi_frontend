# =============================================================================
# API URL – single place for all API links (change here, used everywhere in app)
# =============================================================================
# Base URL for all API requests (no trailing slash).
# Examples: https://ahadiapi.quantumvision-tech.com/api/v1
#           http://192.168.1.132:8003/api/v1
#           http://127.0.0.1:8003/api/v1
API_BASE_URL=https://ahadiapi.quantumvision-tech.com/api/v1

# API path prefixes (relative to API_BASE_URL). No leading slash.
API_AUTH_PREFIX=auth
API_EVENTS_PREFIX=events
API_PUBLIC_PREFIX=public
API_PAYMENTS_PREFIX=payments
API_CHAT_PREFIX=chat
API_INBOX_PREFIX=inbox
API_DIRECT_MESSAGES_PREFIX=direct-messages
API_INVITATIONS_PREFIX=invitations
API_INVITATION_TEMPLATES_PREFIX=invitation-templates
API_ANNOUNCEMENTS_PREFIX=announcements
API_PARTICIPANTS_PREFIX=participants
API_EVENT_TYPES_PREFIX=event-types
API_WHATSAPP_PREFIX=whatsapp

# Timeout (seconds). Sandbox: 300; production: 60
API_RECEIVE_TIMEOUT=300

# Auth header scheme: Bearer (default) or Token
VITE_AUTH_SCHEME=Bearer

# =============================================================================
# Other URLs (WebSocket, Web app)
# =============================================================================
WEBSOCKET_BASE_URL=ws://192.168.1.132:8005
WEB_APP_BASE_URL=http://162.0.233.47:8080

# Environment: sandbox or production
APP_ENVIRONMENT=sandbox

# =============================================================================
# OAuth / third-party
# =============================================================================
GOOGLE_CLIENT_ID=420635386839-793qmljq70s44a8pbpguigj600pgal2b.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_CLIENT_TOKEN=
