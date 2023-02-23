import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IamService, IAM_GROUP_UUIDS, IdentityProfileService, MeIamService } from '@b3networks/api/auth';
import { ChangedNavigateRouterData, MethodName, X } from '@b3networks/shared/common';
import { forkJoin, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private profileService: IdentityProfileService,
    private iamService: IamService,
    private meIamService: MeIamService
  ) {
    this._handleRoutingEvents();
  }

  ngOnInit(): void {
    const autoAttendantUuid = IAM_GROUP_UUIDS.autoAttendant;
    this.profileService
      .getProfile()
      .pipe(
        switchMap(profile => {
          return forkJoin([
            this.meIamService.getAssignedGroup(),
            this.iamService.getMemberWithIAM(X.orgUuid, profile.uuid, autoAttendantUuid),
            of(profile),
            this.iamService.getMappedActionsByGroupUuid(autoAttendantUuid)
          ]);
        })
      )
      .subscribe();
  }

  private _handleRoutingEvents() {
    this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd),
        map(e => e as NavigationEnd)
      )
      .subscribe(event => {
        let path = event.url;
        if (path.includes(';')) {
          path = path.split(';')[0];
        }
        if (path.includes('?')) {
          path = path.split('?')[0];
        }
        if (path.startsWith('/')) {
          path = path.substring(1);
        }

        X.fireMessageToParent(MethodName.ChangedNavigateRouter, <ChangedNavigateRouterData>{
          path: path
        });
      });
  }
}
