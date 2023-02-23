export class CursorPage<T> {
  content: T[] = [];
  limit: number;
  next: string;
  prev: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  withContent(contents: T[]) {
    this.content = contents;
    return this;
  }

  withPageable(limit: number, next?: string, prev?: string): CursorPage<T> {
    this.limit = limit;
    this.next = next;
    this.prev = prev;
    return this;
  }
}
