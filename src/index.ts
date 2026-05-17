export interface StringMap {
  [key: string]: string
}
export interface DB {
  param(i: number): string
  execute(sql: string, args?: any[], ctx?: any): Promise<number>
  query<T>(sql: string, args?: any[], m?: StringMap): Promise<T[]>
}

export interface SavedItem<ID, T> {
  id: ID
  items: T[]
}
// tslint:disable-next-line:max-classes-per-file
export class ArrayRepository<ID, T> {
  constructor(
    protected select: <K>(sql: string, args?: any[]) => Promise<K[]>,
    protected execute: (sql: string, args?: any[]) => Promise<number>,
    protected table: string,
    protected field: string,
    id?: string,
  ) {
    this.id = id && id.length > 0 ? id : "id"
    this.load = this.load.bind(this)
    this.insert = this.insert.bind(this)
    this.update = this.update.bind(this)
  }
  id: string
  load(id: ID): Promise<T[] | null> {
    return this.select<SavedItem<ID, T>>(`select ${this.id} as id, ${this.field} as items from ${this.table} where ${this.id} = $1`, [id]).then((objs) => {
      if (objs && objs.length > 0) {
        if (objs[0].items && objs[0].items.length > 0) {
          return objs[0].items
        } else {
          return []
        }
      } else {
        return null
      }
    })
  }
  insert(id: ID, arr: T[]): Promise<number> {
    const sql = `insert into ${this.table}(${this.id}, ${this.field}) values ($1, $2)`
    return this.execute(sql, [id, arr])
  }
  update(id: ID, arr: T[]): Promise<number> {
    const sql = `update ${this.table} set ${this.field} = $1 where ${this.id} = $2`
    return this.execute(sql, [arr, id])
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SqlSavedRepository {
  constructor(
    protected db: DB,
    protected table: string,
    protected userId: string,
    protected id: string,
    protected saveAt: string,
  ) {
    this.isSaved = this.isSaved.bind(this)
    this.save = this.save.bind(this)
    this.remove = this.remove.bind(this)
    this.count = this.count.bind(this)
  }
  isSaved(userId: string, id: string): Promise<boolean> {
    const sql = `select ${this.userId} from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`
    return this.db.query<any>(sql, [userId, id]).then((rows) => {
      return rows.length > 0 ? true : false
    })
  }
  save(userId: string, id: string): Promise<number> {
    const sql = `insert into ${this.table} (${this.userId}, ${this.id}, ${this.saveAt}) values (${this.db.param(1)}, ${this.db.param(2)}, ${this.db.param(3)}) on conflict (${this.userId}, ${this.id}) do nothing`
    return this.db.execute(sql, [userId, id, new Date()])
  }
  remove(userId: string, id: string): Promise<number> {
    const sql = `delete from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`
    return this.db.execute(sql, [userId, id])
  }
  count(userId: string): Promise<number> {
    const sql = `select count(*) as total from ${this.table} where ${this.userId} = ${this.db.param(1)}`
    return this.db.query<any>(sql, [userId]).then((rows) => {
      return rows[0]["total"] as number
    })
  }
}

export interface SavedRepository<UID, ID> {
  isSaved(userId: UID, id: ID): Promise<boolean>
  save(userId: UID, id: ID): Promise<number>
  remove(userId: UID, id: ID): Promise<number>
  count(userId: UID): Promise<number>
}
// tslint:disable-next-line:max-classes-per-file
export class SavedService<UID, ID> {
  constructor(protected savedRepository: SavedRepository<UID, ID>, protected max: number) {
    this.isSaved = this.isSaved.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
  }
  isSaved(userId: UID, id: ID): Promise<boolean> {
    return this.savedRepository.isSaved(userId, id)
  }
  save(userId: UID, id: ID): Promise<number> {
    return this.savedRepository.count(userId).then((count) => {
      if (count >= this.max) {
        return -1
      } else {
        return this.savedRepository.save(userId, id)
      }
    })
  }
  remove(userId: UID, id: ID): Promise<number> {
    return this.savedRepository.remove(userId, id)
  }
}
export const SavedUseCase = SavedService
