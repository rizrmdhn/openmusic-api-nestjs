import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import * as relations from './relations';

type FullSchema = typeof schema & typeof relations;

export type DB = PostgresJsDatabase<FullSchema>;
export type DBType = Parameters<Parameters<DB['transaction']>[0]>[0];
export type DBorTx = DB | DBType;
