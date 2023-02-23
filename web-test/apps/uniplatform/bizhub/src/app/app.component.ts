import { Component, OnInit } from '@angular/core';
import { IAM_GROUP_UUIDS, IamService, IdentityProfileService, MeIamService } from '@b3networks/api/auth';
import { forkJoin, of } from 'rxjs';
import { X } from '@b3networks/shared/common';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private meIamService: MeIamService,
    private identityService: IdentityProfileService,
    private iamService: IamService
  ) {}

  ngOnInit(): void {
    const businessHubUuid = IAM_GROUP_UUIDS.businessHub;
    this.identityService
      .getProfile()
      .pipe(
        switchMap(profile => {
          return forkJoin([
            this.meIamService.getAssignedGroup(),
            this.iamService.getMemberWithIAM(X.orgUuid, profile.uuid, businessHubUuid),
            of(profile),
            this.iamService.getMappedActionsByGroupUuid(businessHubUuid)
          ]);
        })
      )
      .subscribe();
  }
}
