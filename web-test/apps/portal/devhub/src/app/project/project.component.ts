import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { ProjectQuery, UserService } from '@b3networks/api/flow';
import { ApiKeyManagementService } from '@b3networks/api/integration';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent extends DestroySubscriberComponent implements OnInit {
  constructor(
    private projectQuery: ProjectQuery,
    private profileQuery: IdentityProfileQuery,
    private userService: UserService,
    private apiKeyService: ApiKeyManagementService
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([
      this.projectQuery.selectActive().pipe(
        filter(p => !!p?.subscriptionUuid),
        distinctUntilChanged((x, y) => x?.subscriptionUuid === y?.subscriptionUuid)
      ),
      this.userService.getLimitResource(),
      this.apiKeyService.getDeveloperLicenses(),
      this.profileQuery
        .select(state => state.currentOrg)
        .pipe(
          takeUntil(this.destroySubscriber$),
          filter(profileOrg => !!profileOrg),
          take(1)
        )
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([project, , licenses, profileOrg]) => {
        const license = licenses?.find(license => license?.subUuid === project?.subscriptionUuid);
        const apiKeyId = license?.assignedApiKeyId;
        if (!profileOrg.isMember) {
          this.apiKeyService.getAssignedApiKey(apiKeyId).subscribe();
        }
      });
  }
}
