import { text, varchar } from 'drizzle-orm/pg-core';
import { createTable, idGenerator } from '../../database/helpers';

export const users = createTable('users', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('user')),
  fullname: varchar('fullname', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
