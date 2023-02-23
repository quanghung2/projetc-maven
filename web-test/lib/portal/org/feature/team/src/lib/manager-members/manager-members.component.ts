import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TeamMember, TeamService } from '@b3networks/api/auth';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { debounceTime, finalize, takeUntil } from 'rxjs/operators';
import {
  AddTeamMemberModalComponent,
  AddTeamMemberModalInput
} from '../add-team-member-modal/add-team-member-modal.component';

@Component({
  selector: 'b3networks-manager-members',
  templateUrl: './manager-members.component.html',
  styleUrls: ['./manager-members.component.scss']
})
export class ManagerMembersComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns = ['name', 'email', 'actions'];
  isLoading: boolean;
  searchMember = new UntypedFormControl('');

  teamMembersOrigin: TeamMember[] = [];
  dataSource: MatTableDataSource<TeamMember> = new MatTableDataSource<TeamMember>();

  @Input() set uuid(uuid: string) {
    this.teamUuid = uuid;
    this.getTeamMember();
  }
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  private teamUuid: string;
  constructor(private teamService: TeamService, private toastService: ToastService, private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.searchMember.valueChanges
      .pipe(takeUntil(this.destroySubscriber$), debounceTime(300))
      .subscribe((text: string) => {
        const teamMembersOrigin = [...this.teamMembersOrigin];
        if (text?.trim().length) {
          const data = teamMembersOrigin.filter(item =>
            item.identity.displayName?.toLowerCase().includes(text.toLowerCase())
          );

          this.updateDataSource(data);
          return;
        }

        this.updateDataSource(this.teamMembersOrigin);
      });
  }

  addMember() {
    this.dialog
      .open(AddTeamMemberModalComponent, {
        width: '500px',
        disableClose: true,
        data: <AddTeamMemberModalInput>{
          uuid: this.teamUuid
        }
      })
      .afterClosed()
      .subscribe(isSuccess => {
        if (isSuccess) {
          this.getTeamMember();
        }
      });
  }

  confirmDeleteMember(orgTeamMember: TeamMember) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Remove member',
          message: 'Are you sure you want to remove this member out of team?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          color: 'warn'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteMember(orgTeamMember);
        }
      });
  }

  private deleteMember(orgTeamMember: TeamMember) {
    const memberUuid = orgTeamMember.identity.uuid;
    this.teamService.deleteMember(X.orgUuid, this.teamUuid, memberUuid).subscribe(
      _ => {
        this.teamMembersOrigin = this.teamMembersOrigin.filter(item => item.identity.uuid !== memberUuid);
        this.updateDataSource(this.teamMembersOrigin);
        this.toastService.success('Remove member successfully!');
      },
      error => {
        this.toastService.error(error?.message || 'Remove member failed!');
      }
    );
  }

  private getTeamMember() {
    this.teamService
      .getTeamMember(X.orgUuid, this.teamUuid)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(members => {
        members = members?.sort((a, b) => a.identity.displayName.localeCompare(b.identity.displayName));
        this.teamMembersOrigin = [...members];
        this.updateDataSource(members);
      });
  }

  private updateDataSource(data: TeamMember[]) {
    this.dataSource = new MatTableDataSource<TeamMember>(data);
    this.dataSource.paginator = this.paginator;
  }
}
