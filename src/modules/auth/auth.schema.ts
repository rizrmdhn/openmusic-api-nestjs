import { text, varchar } from 'drizzle-orm/pg-core';
import { createTable, idGenerator } from '../../database/helpers';

export const refreshToken = createTable('refresh_tokens', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('refresh_token')),
  token: text('token').notNull(),
});

export type RefreshToken = typeof refreshToken.$inferSelect;
export type NewRefreshToken = typeof refreshToken.$inferInsert;
