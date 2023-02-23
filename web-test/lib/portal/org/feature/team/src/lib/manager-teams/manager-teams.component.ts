import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery, ProfileOrg, Team, TeamQuery, TeamService } from '@b3networks/api/auth';
import { CreateTeamModalComponent, CreateTeamModalInput } from '@b3networks/portal/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, forkJoin } from 'rxjs';
import { debounceTime, filter, finalize, startWith, takeUntil } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';

@Component({
  selector: 'b3networks-manager-teams',
  templateUrl: './manager-teams.component.html',
  styleUrls: ['./manager-teams.component.scss']
})
export class ManagerTeamsComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns = ['uuid', 'name', 'status', 'actions'];

  profileOrg: ProfileOrg;
  searchTeam = new UntypedFormControl('');
  isLoading: boolean;
  selectedTeam: Team;
  isManageAll: boolean;

  dataSource: MatTableDataSource<Team> = new MatTableDataSource<Team>();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('sidenav') matSidenav: MatSidenav;

  constructor(
    private profileQuery: IdentityProfileQuery,
    private teamService: TeamService,
    private dialog: MatDialog,
    private teamQuery: TeamQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        this.profileOrg = org;

        combineLatest([
          this.teamQuery.selectAll({ sortBy: 'name' }),
          this.teamQuery.selectAllManagedByAdmin(this.profileQuery.getProfile().uuid),
          this.searchTeam.valueChanges.pipe(startWith(''), debounceTime(300))
        ])
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe(([teams, managedTeams, searchText]) => {
            this.isManageAll = org.isOwner || !org.licenseEnabled || !managedTeams.length;
            let result = this.isManageAll ? teams : managedTeams;

            if (searchText?.trim().length) {
              result = result.filter(
                item =>
                  item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                  item.uuid.toLowerCase() === searchText.trim().toLowerCase()
              );
            }
            this.updateDataSource(result);
          });

        this.getTeams();
      });
  }

  createTeam() {
    this.dialog.open(CreateTeamModalComponent, {
      width: '450px',
      disableClose: true,
      data: <CreateTeamModalInput>{
        isEdit: false
      }
    });
  }

  editTeam(team: Team) {
    this.dialog.open(CreateTeamModalComponent, {
      width: '450px',
      disableClose: true,
      data: <CreateTeamModalInput>{
        isEdit: true,
        team
      }
    });
  }

  toggleTeamStatus(team: Team) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: team.active ? 'Disable team' : 'Activate team',
          message: `Are you sure to ${team.active ? 'disable' : 'activate'} <strong>${team?.name}</strong>?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          color: team.active ? 'warn' : 'primary'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          const body: Partial<Team> = { active: !team.active };
          this.teamService.updateTeam(X.orgUuid, team.uuid, body).subscribe(
            _ => {
              this.toastService.success(`${team.active ? 'Disable' : 'Activate'} team successfully!`);
            },
            error => {
              this.toastService.error(error?.message || `${team.active ? 'Disable' : 'Activate'} team failed!`);
            }
          );
        }
      });
  }

  refresh() {
    this.getTeams();
  }

  private getTeams() {
    this.isLoading = true;
    forkJoin([
      this.teamService.getTeams(this.profileOrg.orgUuid),
      this.teamService.getTeamsManagedByAdmin(this.profileOrg.orgUuid, this.profileQuery.identityUuid)
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe();
  }

  private updateDataSource(data: Team[]) {
    this.dataSource = new MatTableDataSource<Team>(data);
    this.dataSource.paginator = this.paginator;
  }

  openSideNav(element: Team) {
    this.selectedTeam = element;
    this.teamService.setActiveTeam(this.selectedTeam);
    if (this.selectedTeam.active) {
      this.teamService.getPolicyDocument(this.profileOrg.orgUuid, this.selectedTeam.uuid).subscribe();
    }
    this.matSidenav.toggle();
  }
}
