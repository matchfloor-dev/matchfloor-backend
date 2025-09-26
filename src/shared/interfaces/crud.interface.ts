export interface CRUD<T> {
    create(...args: any[]): Promise<T>;
    update(...args: any[]): Promise<T>;
    delete(...args: any[]): Promise<void>;
    getAll(...args: any[]): Promise<T[]>;
    getById(...args: any[]): Promise<T>;
}
