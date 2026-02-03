/** Minimal types for Google Identity Services (accounts.google.com/gsi/client) */
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope?: string
            callback: (tokenResponse: { access_token: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export {}
