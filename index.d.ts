declare class Storage {

  constructor(options: nattyStorage.IStorageOptions)

  private _lazyInit(): void

  isOutdated(): boolean

  data(data: object): void

  set(path: string, data: any): void

  asyncSet(path: string, data: any): Promise<void>

  get(path?: string, fallbackValue?: any): any

  asyncGet(path?: string, fallbackValue?: any): Promise<any>

  sure(path: string): any

  has(path: string): nattyStorage.IHasReturn

  asyncHas(path: string): Promise<nattyStorage.IHasReturn>

  remove(path?: string): void

  asyncRemove(path?: string): Promise<void>

  destroy(): void

  asyncDestroy(): Promise<void>

  dump(): void
}

declare class ParentEnv { }

declare class Env extends ParentEnv {
  constructor()
  get(): any
}

export = nattyStorage

declare function nattyStorage(options: nattyStorage.IStorageOptions): Storage

declare namespace nattyStorage {

  interface IStorageOptions {
    key: string
    type?: 'variable' | 'sessionStorage' | 'localStorage' | undefined
    tag?: string
    duration?: number
    until?: number
  }

  interface IHasReturn {
    has: boolean
    value: any
  }

  const version: string

  const supportStorage: boolean

  let _variable: object

  function each(fn: (Storage: Storage) => any): void

  function clean(): void

  function list(): void

  function env(key: string, hash: object): Env
}
