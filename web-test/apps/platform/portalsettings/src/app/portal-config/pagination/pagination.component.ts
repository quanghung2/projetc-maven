import { Component, EventEmitter, Input, OnInit, Output, SimpleChange } from '@angular/core';

@Component({
  selector: 'pagination',
  templateUrl: 'pagination.component.html',
  styleUrls: ['pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  @Input() totalCount: number = 0;
  @Input() perPage: number = 0;
  @Input() currentPage: number;
  @Input() range: number = 5;
  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];
  totalPages: number = 1;

  constructor() {}

  ngOnInit() {
    this.pages = this.createPageArray();
  }

  isFirstPage() {
    return this.currentPage == 1;
  }

  isLastPage() {
    return this.currentPage == Math.ceil(this.totalCount / this.perPage);
  }

  changePage(page: number) {
    this.pages = this.slideTo(this.currentPage, page);
    this.currentPage = page;

    this.pageChange.emit(this.currentPage);
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    this.totalCount = +this.totalCount;
    this.perPage = +this.perPage;
    this.range = +this.range;
    this.totalPages = Math.ceil(this.totalCount / this.perPage);

    this.pages = this.createPageArray();
  }

  slideTo(fromPage, toPage) {
    var pages = [];
    var startPage,
      endPage,
      remain = 1;
    var middlePosition = Math.floor(this.range / 2);

    if (this.totalPages <= this.range) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      if (toPage < fromPage) {
        /** Go to previous page */
        endPage = toPage + middlePosition <= toPage ? toPage + middlePosition : toPage;
        startPage = endPage - this.range + remain >= 1 ? endPage - this.range + remain : 1;

        if (endPage - startPage + remain < this.range && endPage - startPage + remain > 0) {
          endPage += this.range - (endPage - startPage + remain);
        }
      } else if (toPage >= fromPage) {
        /** Go to next page */
        startPage = toPage - middlePosition > 0 ? toPage - middlePosition : 1;
        endPage = startPage + this.range - remain < this.totalPages ? startPage + this.range - remain : this.totalPages;

        if (endPage - startPage + remain < this.range && endPage - startPage + remain > 0) {
          startPage -= this.range - (endPage - startPage + remain);
        }
      }
    }

    if (startPage <= endPage) {
      for (var i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  createPageArray() {
    let pages = [];
    const totalPages = Math.ceil(this.totalCount / this.perPage);
    const halfWay = Math.ceil(this.range / 2);

    const isStart = this.currentPage <= halfWay;
    const isEnd = totalPages - halfWay < this.currentPage;
    const isMiddle = !isStart && !isEnd;

    let i = 1;
    while (i <= totalPages && i <= this.range) {
      let pageNumber = this.calculatePageNumber(i, totalPages);

      pages.push(pageNumber);
      i++;
    }
    return pages;
  }

  calculatePageNumber(i: number, totalPages: number) {
    let halfWay = Math.ceil(this.range / 2);
    if (i === this.range) {
      return totalPages;
    } else if (i === 1) {
      return i;
    } else if (this.range < totalPages) {
      if (totalPages - halfWay < this.currentPage) {
        return totalPages - this.range + i;
      } else if (halfWay < this.currentPage) {
        return this.currentPage - halfWay + i;
      } else {
        return i;
      }
    } else {
      return i;
    }
  }
}
