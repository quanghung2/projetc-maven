import { Component, OnInit } from '@angular/core';
import {
  ActionMapping,
  IamQuery,
  IamService,
  IAM_GROUP_UUIDS,
  IdentityProfileService,
  MeIamService
} from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  actionMapping$: Observable<ActionMapping>;

  constructor(
    private profileService: IdentityProfileService,
    private iamService: IamService,
    private meIamService: MeIamService,
    private iamQuery: IamQuery
  ) {}

  ngOnInit(): void {
    const fileExplorerUuid = IAM_GROUP_UUIDS.fileExplorer;
    this.profileService
      .getProfile()
      .pipe(
        switchMap(profile => {
          return forkJoin([
            this.meIamService.getAssignedGroup(),
            this.iamService.getMemberWithIAM(X.orgUuid, profile.uuid, fileExplorerUuid),
            of(profile),
            this.iamService.getMappedActionsByGroupUuid(fileExplorerUuid)
          ]);
        })
      )
      .subscribe(() => {
        this.actionMapping$ = this.iamQuery.selectActionMapping(fileExplorerUuid);
      });
  }
}
