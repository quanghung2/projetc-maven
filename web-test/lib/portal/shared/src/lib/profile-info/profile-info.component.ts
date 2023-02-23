import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IdentityProfileQuery, Member, ProfileOrg, Team, TeamService } from '@b3networks/api/auth';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { CreateTeamModalComponent, CreateTeamModalInput } from '../create-team-modal/create-team-modal.component';
import { RenameMemberComponent } from '../rename-member/rename-member.component';

@Component({
  selector: 'b3n-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent {
  @Input() type: 'team' | 'member';
  @Input() team: Team;
  @Input() member: Member;
  @Output() closeSidenavEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() memberDetailChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  get isLicenseOrg() {
    return this.profileQuery.currentOrg?.licenseEnabled;
  }

  constructor(
    private dialog: MatDialog,
    private teamService: TeamService,
    private toastService: ToastService,
    private profileQuery: IdentityProfileQuery
  ) {}

  closeSidenav() {
    this.closeSidenavEvent.emit();
  }

  editTeam() {
    const dialogRef = this.dialog.open(CreateTeamModalComponent, {
      width: '450px',
      disableClose: true,
      data: <CreateTeamModalInput>{
        isEdit: true,
        team: this.team
      }
    });

    dialogRef.afterClosed().subscribe(isUpdate => {
      if (isUpdate) {
        this.closeSidenav();
      }
    });
  }

  toggleStatus(team: Team) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: team.active ? 'Disable team' : 'Activate team',
          message: `Are you sure you want to ${team.active ? 'disable' : 'activate'} this team?`,
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
              this.closeSidenav();
            },
            error => {
              this.toastService.error(error?.message || `${team.active ? 'Disable' : 'Activate'} team failed!`);
            }
          );
        }
      });
  }

  openRenameDialog() {
    if (!this.isLicenseOrg) {
      return;
    }
    this.dialog
      .open(RenameMemberComponent, {
        width: '450px',
        data: this.member
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.memberDetailChanged.emit(true);
        }
      });
  }
}
