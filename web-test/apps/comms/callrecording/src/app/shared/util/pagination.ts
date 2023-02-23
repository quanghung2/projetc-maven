export class Pagination {
  static getPageList(currentPage: number, maxPage: number = 999999) {
    let pages = [];

    let minPage = currentPage - 2 < 1 ? 1 : currentPage - 2;
    maxPage = minPage + 5 < maxPage ? minPage + 5 : maxPage;

    for (let i = minPage; i <= maxPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}
