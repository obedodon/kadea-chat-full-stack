import Alpine from 'alpinejs'

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

Alpine.start()
