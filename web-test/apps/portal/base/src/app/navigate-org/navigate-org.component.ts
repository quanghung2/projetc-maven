import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionQuery } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent, UUID_V4_REGEX } from '@b3networks/shared/common';
import { distinctUntilKeyChanged, filter, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-navigate-org',
  templateUrl: './navigate-org.component.html',
  styleUrls: ['./navigate-org.component.scss']
})
export class NavigateOrgComponent extends DestroySubscriberComponent implements OnInit {
  constructor(private sessionQuery: SessionQuery, private router: Router) {
    super();
  }

  ngOnInit(): void {
    this.sessionQuery.currentOrg$
      .pipe(
        filter(currentOrg => !!currentOrg),
        distinctUntilKeyChanged('orgUuid'),
        takeUntil(this.destroySubscriber$),
        tap(currentOrg => {
          const url = this.router.url;
          const rs: RegExpMatchArray = url.match(UUID_V4_REGEX);
          const params = url.split('/').filter(char => char !== '');

          if (!rs && params.length) {
            this.router.navigate([currentOrg.orgUuid, ...params]);
          } else {
            this.router.navigate([currentOrg.orgUuid, 'home']);
          }
        })
      )
      .subscribe();
  }
}
