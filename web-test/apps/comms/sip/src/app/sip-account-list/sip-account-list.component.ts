import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare var X: any;

@Component({
  selector: 'sip-account-list',
  templateUrl: './sip-account-list.component.html',
  styleUrls: ['./sip-account-list.component.scss']
})
export class SipAccountListComponent {
  loading = true;
  searchStr = '';
  accountList: any = [];
  pagination: any = {
    currentPage: 1,
    perPage: 10
  };
  searchResult: any = {
    totalCount: 0,
    totalItems: [],
    itemsPerPage: []
  };

  constructor(private eventStreamService: EventStreamService, private cacheService: CacheService) {
    this.eventStreamService.on('show-sip-account-list').subscribe(res => {
      this.eventStreamService.trigger('open-modal', 'sip-account-list-modal');
      const accList = this.cacheService.get('account-list');
      this.loadInfo(accList);
    });
  }

  loadInfo(accList) {
    this.accountList = accList;
    this.search('');
    this.loading = false;
  }

  search(keyword: any) {
    this.pagination.currentPage = 1;
    this.loading = true;
    const searchResult = this.accountList.filter(
      res =>
        res.sipUsername.indexOf(keyword) !== -1 ||
        res.sipDomain.indexOf(keyword) !== -1 ||
        res.numbers.filter(n => n.indexOf(keyword) !== -1).length > 0
    );
    this.searchResult = {
      totalCount: searchResult.length,
      totalItems: searchResult.sort(item => item.sipUsername)
    };
    this.onPageChanged(1);

    const self = this;
    setTimeout(function () {
      self.loading = false;
    }, 500);
  }

  onPageChanged(page: number) {
    this.pagination.currentPage = page;
    this.searchResult.itemsPerPage = this.searchResult.totalItems.slice(
      (page - 1) * this.pagination.perPage,
      page * this.pagination.perPage
    );
  }

  switchAccount(account) {
    this.eventStreamService.trigger('switch-account', account);
    this.eventStreamService.trigger('close-modal', 'sip-account-list-modal');
  }
}
