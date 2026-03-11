import { integer, varchar } from 'drizzle-orm/pg-core';
import { createTable, idGenerator } from '../../database/helpers';

export const albums = createTable('albums', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('album')),
  name: varchar('name', { length: 255 }).notNull(),
  year: integer('year').notNull(),
});
