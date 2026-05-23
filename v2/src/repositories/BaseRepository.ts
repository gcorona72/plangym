import type { Table } from 'dexie';

/**
 * Repositorio base genérico — encapsula las operaciones CRUD comunes
 * sobre una tabla de Dexie. Los repositorios específicos extienden esta
 * clase y añaden métodos de dominio.
 *
 * Beneficios:
 *  - Los componentes no conocen Dexie (más fácil cambiar de DB)
 *  - Métodos con nombres del dominio (`findThisWeek` en vez de `where('date').between(...)`)
 *  - Fácil de mockear en tests
 */
export abstract class BaseRepository<TEntity, TKey = string> {
  constructor(protected table: Table<TEntity, TKey>) {}

  async getById(id: TKey): Promise<TEntity | undefined> {
    return this.table.get(id);
  }

  async getAll(): Promise<TEntity[]> {
    return this.table.toArray();
  }

  async create(entity: TEntity): Promise<TKey> {
    return this.table.add(entity);
  }

  async upsert(entity: TEntity): Promise<TKey> {
    return this.table.put(entity);
  }

  async update(id: TKey, patch: Partial<TEntity>): Promise<number> {
    return this.table.update(id as any, patch as any);
  }

  async remove(id: TKey): Promise<void> {
    await this.table.delete(id);
  }

  async count(): Promise<number> {
    return this.table.count();
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }
}
