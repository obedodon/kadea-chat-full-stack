import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  /**
   * Connexion utilisée par défaut pour toutes les requêtes.
   * Kadea Chat utilise PostgreSQL, comme l'exige le brief.
   */
  connection: 'pg',

  /**
   * Affiche les requêtes SQL lisiblement dans les logs en développement.
   */
  prettyPrintDebugQueries: true,

  connections: {
    /**
     * Connexion PostgreSQL. Les valeurs viennent du fichier .env,
     * pour ne jamais écrire de mot de passe dans le code.
     */
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
      /**
       * Envoie les requêtes SQL dans les logs en développement.
       */
      debug: app.inDev,
    },
  },
})

export default dbConfig
