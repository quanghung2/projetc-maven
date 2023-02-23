import { Pageable } from './pageable';

export class Page<T> {
  content: T[] = [];
  page: number;
  perPage: number;
  totalCount: number;

  constructor(obj?: Partial<Page<T>>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get numberOfPages(): number {
    return this.perPage > 0 ? Math.ceil(this.totalCount / this.perPage) : 0;
  }

  withContent(contents: T[]) {
    this.content = contents;
    return this;
  }

  withTotalCount(totalCount: number) {
    this.totalCount = totalCount;
    return this;
  }

  withPageable(pageable: Pageable): Page<T> {
    this.page = pageable.page;
    this.perPage = pageable.perPage;
    return this;
  }

  /**
   * This method can use when totalCount = 0 for streaming data from ms-data
   */
  canHasTheNextPage() {
    return (
      this.numberOfPages > this.page ||
      (this.totalCount === 0 && this.perPage > 0 && this.content.length === this.perPage)
    );
  }
}
