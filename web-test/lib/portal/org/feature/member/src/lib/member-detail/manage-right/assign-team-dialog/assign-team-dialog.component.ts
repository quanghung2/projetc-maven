import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Team, TeamQuery, TeamService } from '@b3networks/api/auth';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

export interface AssignTeamDialogData {
  adminUUid: string;
  excludedTeamUuids: string[];
}

@Component({
  selector: 'b3n-assign-team-dialog',
  templateUrl: './assign-team-dialog.component.html',
  styleUrls: ['./assign-team-dialog.component.scss']
})
export class AssignTeamDialogComponent extends DestroySubscriberComponent implements OnInit {
  selectedTeams = new UntypedFormControl();
  teams: Team[] = [];
  isLoading: boolean;

  constructor(
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    @Inject(MAT_DIALOG_DATA) private data: AssignTeamDialogData,
    private dialogRef: MatDialogRef<AssignTeamDialogComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    this.teamQuery
      .selectAll({ sortBy: 'name' })
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(allTeams => {
        this.teams = allTeams.filter(item => !this.data.excludedTeamUuids.includes(item.uuid));
      });
  }

  assign() {
    this.isLoading = true;

    let streams: Observable<void>[] = [];
    this.selectedTeams.value.forEach(teamUuid => {
      streams.push(this.teamService.assignAdminForTeam(X.orgUuid, teamUuid, this.data.adminUUid));
    });
    forkJoin(streams)
      .pipe(
        finalize(() => (this.isLoading = false)),
        catchError(_ => of([]))
      )
      .subscribe(_ => {
        this.dialogRef.close(true);
      });
  }
}
