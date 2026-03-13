import { sql } from 'drizzle-orm';
import { toSnakeCase } from 'drizzle-orm/casing';
import { pgTableCreator, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const createTable = pgTableCreator((name) => `${name}`);

export const timestamps = {
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'string',
  }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'string',
  }).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
};

export const idGenerator = (title: string) =>
  `${title.toLowerCase().replace(/\s+/g, '-')}-${nanoid(16)}`;

/**
 * Creates a key-value for file upload columns
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with only url column
 */
export function createFileUrlColumn<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`),
  } as Record<`${T}Url`, ReturnType<typeof text>>;
}

/**
 * Creates a key-value for NOT NULL file upload columns
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with only NOT NULL url column
 */
export function createRequiredFileUrlColumn<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`).notNull(),
  } as Record<`${T}Url`, ReturnType<ReturnType<typeof text>['notNull']>>;
}

/**
 * Creates a pair of columns for file uploads (fileName and url)
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with fileName and url columns
 */
export function createFileColumns<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}FileName`]: text(`${snakeCase}_file_name`),
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`),
  } as Record<`${T}FileName` | `${T}Url`, ReturnType<typeof text>>;
}

/** * Creates a pair of NOT NULL columns for file uploads (fileName and url)
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with NOT NULL fileName and url columns
 */
export function createRequiredFileColumns<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}FileName`]: text(`${snakeCase}_file_name`).notNull(),
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`).notNull(),
  } as Record<
    `${T}FileName` | `${T}Url`,
    ReturnType<ReturnType<typeof text>['notNull']>
  >;
}
