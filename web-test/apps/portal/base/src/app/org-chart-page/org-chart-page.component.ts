import { Component, OnInit } from '@angular/core';
import { MemberStatus, ProfileOrg, Team, TeamQuery, TeamService } from '@b3networks/api/auth';
import { DirectoryMember, DirectoryMemberService, GetDirectoryMembersReq } from '@b3networks/api/directory';
import { SessionQuery } from '@b3networks/portal/base/shared';
import { B3_ORG_UUID, B3_UAT_ORG_UUID, DestroySubscriberComponent } from '@b3networks/shared/common';
import { OrgChartData } from '@b3networks/shared/ui/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, map, takeUntil } from 'rxjs';

@Component({
  selector: 'b3n-org-chart-page',
  templateUrl: './org-chart-page.component.html',
  styleUrls: ['./org-chart-page.component.scss']
})
export class OrgChartPageComponent extends DestroySubscriberComponent implements OnInit {
  isLoading: boolean;
  teamsData: OrgChartData[] = [];
  isPageNotFound = false;

  constructor(
    private toastService: ToastService,
    private sessionQuery: SessionQuery,
    private teamService: TeamService,
    private teamQuery: TeamQuery,
    private directoryService: DirectoryMemberService
  ) {
    super();
  }

  private async _getTeams(orgUuid: string) {
    return await this.teamService.getTeams(orgUuid).toPromise();
  }

  private async _getMembers(teamUuid: string): Promise<DirectoryMember[]> {
    const req = <GetDirectoryMembersReq>{
      filterExtension: true,
      status: [MemberStatus.active],
      sort: 'asc',
      team: teamUuid
    };
    return await this.directoryService
      .getMembers(req)
      .pipe(map(page => page.content))
      .toPromise();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.sessionQuery.currentOrg$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(org => org != null)
      )
      .subscribe(
        async (currentOrg: ProfileOrg) => {
          if (currentOrg.orgUuid !== B3_ORG_UUID && currentOrg.orgUuid !== B3_UAT_ORG_UUID) {
            this.isPageNotFound = currentOrg.orgUuid !== B3_ORG_UUID && currentOrg.orgUuid !== B3_UAT_ORG_UUID;
            return;
          }
          this._getTeams(currentOrg.orgUuid)
            .then(() => {
              const listTeamsActive = this.teamQuery.getAll().filter(teamItem => teamItem.active);
              Promise.all(listTeamsActive.map((teamActive: Team) => this._getMembers(teamActive.uuid)))
                .then((listMembers: DirectoryMember[][]) => {
                  this.teamsData = [
                    ...listMembers.map(
                      (members: DirectoryMember[], index: number) =>
                        <OrgChartData>{
                          ...listTeamsActive[index],
                          membersDirectory: members
                        }
                    )
                  ];
                })
                .catch(({ error }) => this.toastService.error(error.message))
                .finally(() => (this.isLoading = false));
            })
            .catch(({ error }) => {
              this.toastService.error(error.message);
              this.isLoading = false;
            });
        },
        error => {
          this.toastService.error(error.message);
          this.isLoading = false;
        }
      );
  }
}
