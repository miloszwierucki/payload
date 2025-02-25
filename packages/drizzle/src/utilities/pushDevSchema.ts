import prompts from 'prompts'

import type { DrizzleAdapter } from '../types.js'

/**
 * Pushes the development schema to the database using Drizzle.
 *
 * @param {DrizzleAdapter} adapter - The PostgresAdapter instance connected to the database.
 * @returns {Promise<void>} - A promise that resolves once the schema push is complete.
 */
export const pushDevSchema = async (adapter: DrizzleAdapter) => {
  const { pushSchema } = adapter.requireDrizzleKit()

  // This will prompt if clarifications are needed for Drizzle to push new schema
  const { apply, hasDataLoss, warnings } = await pushSchema(
    adapter.schema,
    adapter.drizzle,
    adapter.schemaName ? [adapter.schemaName] : undefined,
  )

  if (warnings.length) {
    let message = `Warnings detected during schema push: \n\n${warnings.join('\n')}\n\n`

    if (hasDataLoss) {
      message += `DATA LOSS WARNING: Possible data loss detected if schema is pushed.\n\n`
    }

    message += `Accept warnings and push schema to database?`

    const { confirm: acceptWarnings } = await prompts(
      {
        name: 'confirm',
        type: 'confirm',
        initial: false,
        message,
      },
      {
        onCancel: () => {
          process.exit(0)
        },
      },
    )

    // Exit if user does not accept warnings.
    // Q: Is this the right type of exit for this interaction?
    if (!acceptWarnings) {
      process.exit(0)
    }
  }

  await apply()
  const migrationsTable = adapter.schemaName
    ? `"${adapter.schemaName}"."payload_migrations"`
    : '"payload_migrations"'

  const result = await adapter.execute({
    drizzle: adapter.drizzle,
    raw: `SELECT * FROM ${migrationsTable} WHERE batch = '-1'`,
  })

  const devPush = result.rows

  if (!devPush.length) {
    await adapter.execute({
      drizzle: adapter.drizzle,
      raw: `INSERT INTO ${migrationsTable} (name, batch) VALUES ('dev', '-1')`,
    })
  } else {
    await adapter.execute({
      drizzle: adapter.drizzle,
      raw: `UPDATE ${migrationsTable} SET updated_at = CURRENT_TIMESTAMP WHERE batch = '-1'`,
    })
  }
}
