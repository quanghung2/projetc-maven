import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery, MeIamQuery } from '@b3networks/api/auth';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { filter, takeUntil } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'b3n-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent extends DestroySubscriberComponent implements OnInit {
  readonly links: KeyValue<string, string>[] = [
    { key: 'bundles', value: 'Bundles' },
    { key: 'orders', value: 'Orders' }
  ];
  hasPermissionGroup: boolean;

  constructor(private meIamQuery: MeIamQuery, private profileQuery: IdentityProfileQuery) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.profileQuery.currentOrg$, this.meIamQuery.selectGrantedManageBizHub()])
      .pipe(
        filter(([org]) => !!org),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([org, hasPermissionGroup]) => {
        this.hasPermissionGroup = org.isOwner || (org.isAdmin && hasPermissionGroup);
      });
  }
}
