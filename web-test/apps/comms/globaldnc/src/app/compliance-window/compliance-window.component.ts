import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { format, subDays } from 'date-fns';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { CacheService, EventStreamService } from '../shared';

declare let X: any;

@Component({
  selector: 'compliance-window',
  templateUrl: './compliance-window.component.html',
  styleUrls: ['./compliance-window.component.scss']
})
export class ComplianceWindowComponent implements OnDestroy {
  loading = true;
  isLooked = false;
  expandNote = false;
  expiredDate: string;
  lookuping = false;
  searching = false;
  number = '';
  lookResult: any = [];
  price: any = {};
  searchRequest: any = {
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(subDays(new Date(), 30), 'yyyy-MM-dd')
  };
  pagination: any = {
    currentPage: 1,
    perPage: 10
  };
  searchResult: any = {
    totalCount: 0,
    entries: []
  };
  subscriptions = new Array<Subscription>();

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    this.price = this.cacheService.get('price-info');
    if (!this.price) {
      this.price = {};
    }

    this.subscriptions.push(
      this.eventStreamService.on('compliance-window:look-up').subscribe(e => {
        this.eventStreamService.trigger('hide-confirmation');
        this.lookup();
      })
    );
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  beforeLookup() {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Search numbers',
      message: 'WARNING: Searching number can be charged. Are you sure you want to do this?',
      type: 'yesno',
      okEvent: {
        event: 'compliance-window:look-up',
        data: {}
      },
      cancelEvent: {}
    });
  }

  lookup() {
    this.lookuping = true;
    this.isLooked = true;
    this.expiredDate = null;
    const params = new HttpParams()
      .set('media', 'voice,fax,sms')
      .set('remarks', 'check for client')
      .set('numbers', this.number)
      .set('appId', environment.settings.appId)
      .set('credentialUuid', '')
      .set('credentialType', 'identity');
    this.http.get<any>(`/dnc/api/v2/private/lookup`, { params: params }).subscribe(
      res => {
        this.lookResult = res.entries;
        /*this.lookResult.forEach(e => {
        if (!this.expiredDate || this.expiredDate > e.expiredAt) {
          this.expiredDate = e.expiredAt;
        }
      });*/
        this.expiredDate = format(new Date(), 'yyyy-MM-dd'); //https://gitlab.com/b3networks/issue-board/issues/663
        this.lookuping = false;
      },
      res => {
        X.showWarn(`Cannot lookup because ${res.message.toLowerCase()}`);
      }
    );
    this.searchRequest.from = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    this.searchRequest.to = format(new Date(), 'yyyy-MM-dd');
    this.search();
  }

  search() {
    this.searching = true;
    const params = new HttpParams()
      .set('from', this.searchRequest.from + ' 00:00:00')
      .set('to', this.searchRequest.to + ' 23:59:59')
      .set('page', this.pagination.currentPage)
      .set('perPage', this.pagination.perPage);
    this.http
      .get(`/dnc/api/v2/private/logs/${this.number}`, {
        params: params,
        observe: 'response'
      })
      .subscribe(
        res => {
          this.searchResult.totalCount = res.headers.get('x-hoiio-pagination-total-count');
          this.searchResult.entries = res.body;
          this.searchResult.entries.forEach(en => {
            en.medium = JSON.parse(en.medium);
            if (en.remark) {
              en.remark = en.remark.split('\n');
              en.remark.forEach(re => {
                if (re.indexOf('[Remarks]') > -1) {
                  en.remark = re.replace('[Remarks]', '');
                }
              });
            }
          });
          this.searching = false;
        },
        res => {
          X.showWarn(`Cannot get log because ${res.message.toLowerCase()}`);
        }
      );
  }

  changePage(page) {
    this.pagination.currentPage = page;
    this.search();
  }

  changePerPage(perPage) {
    this.pagination.currentPage = 1;
    this.pagination.perPage = perPage;
    this.search();
  }

  changeFrom(date) {
    this.searchRequest.from = format(date, 'yyyy-MM-dd');
  }

  changeTo(date) {
    this.searchRequest.to = format(date, 'yyyy-MM-dd');
    this.search();
  }
}
