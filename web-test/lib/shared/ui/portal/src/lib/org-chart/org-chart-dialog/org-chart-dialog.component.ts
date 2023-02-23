import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MemberStatus } from '@b3networks/api/auth';
import { DirectoryMember, DirectoryMemberService, GetDirectoryMembersReq } from '@b3networks/api/directory';
import { UserQuery } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { OrgChartData } from '@b3networks/shared/ui/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'b3n-org-chart-dialog',
  templateUrl: './org-chart-dialog.component.html',
  styleUrls: ['./org-chart-dialog.component.scss']
})
export class OrgChartDialogComponent extends DestroySubscriberComponent implements OnInit {
  teamsData: OrgChartData[] = [];
  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { identityUuid: string },
    private toastService: ToastService,
    private directoryService: DirectoryMemberService,
    private userQuery: UserQuery
  ) {
    super();
  }

  ngOnInit() {
    this.isLoading = true;
    const teams = this.userQuery.getEntity(this.data.identityUuid).teams;
    forkJoin([
      ...teams.map(team => {
        return this._getMembers(team.uuid).pipe(
          catchError(() => of([])),
          map((listMembers: DirectoryMember[]) => {
            return <OrgChartData>{
              ...team,
              membersDirectory: listMembers
            };
          })
        );
      })
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        listMembers => {
          this.teamsData = listMembers;
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private _getMembers(teamUuid: string) {
    const req = <GetDirectoryMembersReq>{
      filterExtension: true,
      status: [MemberStatus.active],
      sort: 'asc',
      team: teamUuid
    };
    return this.directoryService.getMembers(req).pipe(map(page => page.content));
  }
}
