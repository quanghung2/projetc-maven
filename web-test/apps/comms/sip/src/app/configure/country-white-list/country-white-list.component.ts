import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';
import { countries } from '../../shared/pipe/country.pipe';

declare var jQuery: any;
declare var X: any;

@Component({
  selector: 'country-white-list',
  templateUrl: './country-white-list.component.html',
  styleUrls: ['./country-white-list.component.scss']
})
export class CountryWhiteListComponent implements OnInit {
  loading = true;
  isAdding = false;
  isRemoving = false;
  currentAccount: any = {};
  countryPrefix: string;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  ngOnInit() {}

  loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.loading = false;
    setTimeout(function () {
      jQuery('.ui.search').search({
        source: countries.map(c => {
          return { title: c.prefix };
        })
      });
    }, 100);
  }

  add() {
    this.countryPrefix = jQuery('#input-country-prefix').val();
    const co = countries.filter(c => this.countryPrefix === c.prefix);
    if (co.length === 0) {
      X.showWarn('Cannot detect input country.');
    } else {
      this.isAdding = true;
      this.http
        .put('/appsip/accounts/' + this.currentAccount.account.username, {
          action: 'addCountryWhiteList',
          data: {
            countries: [this.countryPrefix]
          }
        })
        .subscribe(
          res => {
            this.currentAccount.account = res;
            this.cacheService.put('current-account', this.currentAccount);
            this.isAdding = false;
            X.showSuccess('Your setting has been updated successfully.');
          },
          err => {
            this.isAdding = false;
            X.showWarn('Cannot update your setting. Please check your input.');
          }
        );
    }
  }

  remove(index) {
    this.isRemoving = true;
    this.http
      .put('/appsip/accounts/' + this.currentAccount.account.username, {
        action: 'removeCountryWhiteList',
        data: {
          country: this.currentAccount.account.config.countryWhiteList[index]
        }
      })
      .subscribe(
        res => {
          this.currentAccount.account = res;
          this.cacheService.put('current-account', this.currentAccount);
          this.isRemoving = false;
          X.showSuccess('Your setting has been updated successfully.');
        },
        err => {
          this.isRemoving = false;
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
