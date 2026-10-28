import Alpine from 'alpinejs'
import { Transmit } from '@adonisjs/transmit-client'

/* ==========================================================================
   Temps réel (écrans 06 et 07)
   ========================================================================== */

/** Le jeton CSRF de la page : le serveur l'exige sur chaque requête POST. */
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? ''
}

/**
 * Ajoute un message (HTML préparé par le serveur) à la fin du fil,
 * avec le séparateur « Aujourd'hui » si besoin, et sans jamais l'afficher deux fois.
 */
function appendMessage(html) {
  const thread = document.querySelector('[data-thread]')
  if (!thread) return

  const template = document.createElement('template')
  template.innerHTML = html.trim()
  const node = template.content.firstElementChild
  if (!node || thread.querySelector(`[data-message-id="${node.dataset.messageId}"]`)) return

  thread.querySelector('[data-thread-empty]')?.remove()

  const label = node.dataset.dayLabel
  const days = thread.querySelectorAll('[data-day]')
  if (label && days[days.length - 1]?.dataset.day !== label) {
    const separator = document.createElement('p')
    separator.className = 'kc-day'
    separator.dataset.day = label
    separator.append(document.createElement('span'))
    separator.firstChild.textContent = label
    thread.append(separator)
  }

  // On ne fait défiler que si on était déjà en bas (ou si c'est mon message)
  const nearBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 150
  thread.append(node)
  if (nearBottom || node.classList.contains('kc-msg--mine')) {
    thread.scrollTop = thread.scrollHeight
  }
}

/**
 * Accusés de lecture : mes messages envoyés avant « readUpTo » ont été lus,
 * leurs deux barres passent à l'orange.
 */
function markAsRead(conversationId, readUpTo) {
  if (String(conversationId) !== document.body.dataset.conversationId) return
  document.querySelectorAll('.kc-msg--mine[data-sent-at]').forEach((message) => {
    if (Number(message.dataset.sentAt) <= readUpTo) {
      message.classList.add('is-read')
      message.querySelector('.kc-tick')?.setAttribute('title', 'Lu')
    }
  })
}

/** Redemande la liste de gauche au serveur (aperçu, heure, non-lus, nouvelles discussions). */
async function refreshList() {
  const list = document.querySelector('[data-chat-list]')
  if (!list) return
  const active = document.body.dataset.conversationId || ''
  const response = await fetch(`/conversations/sidebar?active=${active}`, {
    headers: { Accept: 'text/html' },
  })
  if (response.ok) {
    list.innerHTML = await response.text()
  }
}

/**
 * S'abonne à mon canal users/<id>. Le serveur y annonce chaque nouveau message
 * de mes discussions ; on redemande alors le message et la liste au serveur.
 */
async function startRealtime() {
  const userId = document.body.dataset.userId
  if (!userId) return

  const transmit = new Transmit({
    baseUrl: window.location.origin,
    beforeSubscribe: (request) => request.headers.set('X-CSRF-TOKEN', csrfToken()),
    beforeUnsubscribe: (request) => request.headers.set('X-CSRF-TOKEN', csrfToken()),
  })

  const subscription = transmit.subscription(`users/${userId}`)
  subscription.onMessage(async (event) => {
    if (event.type === 'read') {
      markAsRead(event.conversationId, event.readUpTo)
      return
    }

    const openId = document.body.dataset.conversationId
    const alreadyShown = document.querySelector(`[data-message-id="${event.messageId}"]`)

    if (event.type === 'message' && String(event.conversationId) === openId && !alreadyShown) {
      const response = await fetch(
        `/conversations/${event.conversationId}/messages/${event.messageId}`,
        { headers: { Accept: 'text/html' } }
      )
      if (response.ok) appendMessage(await response.text())
    }
    await refreshList()
  })
  await subscription.create()
}

startRealtime().catch((error) => console.error('Temps réel indisponible :', error))

Alpine.data('alert', function () {
  return {
    isVisible: false,
    dismiss() {
      this.isVisible = false
    },
    init() {
      setTimeout(() => {
        this.isVisible = true
      }, 80)
      setTimeout(() => {
        this.dismiss()
      }, 5000)
    },
  }
})

Alpine.data('themeToggle', function () {
  return {
    theme: 'light',
    init() {
      this.theme = this.$el.dataset.initialTheme || 'light'
    },
    toggle() {
      const next = this.theme === 'dark' ? 'light' : 'dark'
      this.theme = next
      document.documentElement.setAttribute('data-theme', next)
      document.cookie = `app_theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    },
  }
})

/**
 * 09 · Fenêtre « Nouvelle discussion ».
 * Cherche des personnes pendant qu'on tape (GET /users/search), puis on en choisit une.
 */
Alpine.data('newChat', function () {
  return {
    open: false,
    q: '',
    results: [],
    selected: null,
    searched: false,
    show() {
      this.open = true
      this.$nextTick(() => this.$refs.q.focus())
    },
    close() {
      this.open = false
      this.clear()
    },
    clear() {
      this.q = ''
      this.results = []
      this.selected = null
      this.searched = false
    },
    async search() {
      const q = this.q.trim()
      this.selected = null
      if (q.length < 2) {
        this.results = []
        this.searched = false
        return
      }
      try {
        const response = await fetch(`/users/search?q=${encodeURIComponent(q)}`, {
          headers: { Accept: 'application/json' },
        })
        // On ignore une réponse arrivée après une frappe plus récente
        if (q !== this.q.trim()) return
        this.results = response.ok ? await response.json() : []
      } catch {
        this.results = []
      }
      this.searched = true
    },
    get countLabel() {
      const total = this.results.length
      if (total === 0) return 'Aucune personne trouvée'
      return total === 1 ? '1 personne trouvée' : `${total} personnes trouvées`
    },
  }
})

/**
 * 07 · Zone d'écriture : envoie le message sans recharger la page.
 * Sans JavaScript, le formulaire reste un envoi classique.
 */
Alpine.data('composer', function () {
  return {
    sending: false,
    async send(form) {
      const input = form.elements.body
      if (!input.value.trim() || this.sending) return

      this.sending = true
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        })
        if (response.ok) {
          const { html } = await response.json()
          appendMessage(html)
          input.value = ''
          refreshList()
        }
      } catch {
        // Réseau coupé : on garde le texte pour que l'utilisateur puisse réessayer
      } finally {
        this.sending = false
        input.focus()
      }
    },
  }
})

Alpine.start()
