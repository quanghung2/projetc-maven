import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CacheService, EventStreamService, RoutingService } from './shared';
import { User } from './shared/model/user.model';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading = true;
  switchingAccount = true;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private router: Router,
    private routingService: RoutingService
  ) {}

  ngOnInit() {
    forkJoin([
      this.http.get<any>('/appsip/me').pipe(map(res => new User(res))),
      this.http.get<any>('/appsip/me/callerids'),
      this.http.get<any>('/appsip/accounts')
    ]).subscribe(([userInfo, availableCallerIds, accountList]) => {
      userInfo.availableCallerIds = availableCallerIds;
      this.cacheService.put('user-info', userInfo);
      this.cacheService.put('account-list', accountList);
      this.eventStreamService.trigger('accounts-loaded', accountList);
      if (accountList.length > 0) {
        this.eventStreamService.trigger('switch-account', accountList[0]);
        this.router.navigate(['configure'], { queryParamsHandling: 'merge' });
      } else {
        this.switchingAccount = false;
        this.router.navigate(['landing'], { queryParamsHandling: 'merge' });
      }
      this.loading = false;
    });

    this.eventStreamService.on('switch-account').subscribe(res => {
      this.switchingAccount = true;
      forkJoin([
        this.http.get<any>('/appsip/accounts/' + res.sipUsername),
        this.http.get<any>('/appsip/accounts/' + res.sipUsername + '/incoming'),
        this.http.get<any>('/appsip/accounts/' + res.sipUsername + '/outgoing'),
        this.routingService.getRoutings(res.sipUsername)
      ]).subscribe(([account, incoming, outgoing, routing]) => {
        const userInfo = this.cacheService.get('user-info');
        account.availableCallerIds = userInfo.availableCallerIds;
        account.incoming = incoming;
        account.outgoing = outgoing;
        account.routing = routing;
        this.cacheService.put('current-account', account);
        this.eventStreamService.trigger('switched-account', account);
      });
    });

    this.eventStreamService.on('switched-account').subscribe(() => {
      this.switchingAccount = false;
      this.loading = false;
    });
  }
}
