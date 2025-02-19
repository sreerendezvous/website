import { supabase } from '../supabase/client';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export class BaseService {
  protected table: string;

  constructor(table: string) {
    this.table = table;
  }

  protected query() {
    return supabase.from(this.table);
  }

  protected handleError(error: any): never {
    console.error(`${this.table} service error:`, error);
    throw error;
  }

  protected async execQuery<T>(
    query: PostgrestFilterBuilder<any, any, any[]>
  ): Promise<T[]> {
    const { data, error } = await query;
    if (error) this.handleError(error);
    return data as T[];
  }

  protected async execSingleQuery<T>(
    query: PostgrestFilterBuilder<any, any, any[]>
  ): Promise<T> {
    const { data, error } = await query.single();
    if (error) this.handleError(error);
    return data as T;
  }
}