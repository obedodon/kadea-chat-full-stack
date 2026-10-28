import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  /**
   * Un « ping » toutes les 30 secondes garde la connexion ouverte :
   * sans lui, certains hébergeurs coupent une connexion silencieuse.
   */
  pingInterval: '30s',
  transport: null,
})
