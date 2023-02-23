import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  IAMGrantedPermission,
  IamService,
  IAM_AUTH_ACTIONS,
  IAM_AUTH_RESOURCES,
  IAM_SERVICES,
  Member,
  OrgMemberService,
  PolicyDocument,
  ProfileOrg,
  Team,
  TeamQuery,
  TeamService,
  UpdateIAMGroupMemberReq
} from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';
import { IAMGroupUI } from '../../members/members.component';
import { AssignTeamDialogComponent, AssignTeamDialogData } from './assign-team-dialog/assign-team-dialog.component';

@Component({
  selector: 'pom-manage-right',
  templateUrl: './manage-right.component.html',
  styleUrls: ['./manage-right.component.scss']
})
export class ManageRightComponent implements OnInit, OnChanges {
  @Input() member: Member;
  @Input() profileOrg: ProfileOrg;
  @Input() groups: IAMGroupUI[];

  teams$: Observable<Team[]>;

  managePeopleFG: UntypedFormGroup;
  manageVipFG: UntypedFormGroup;

  constructor(
    private teamService: TeamService,
    private teamQuery: TeamQuery,
    private orgMemberService: OrgMemberService,
    private iamService: IamService,
    private dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private toastr: ToastService
  ) {
    this._initForm();
  }

  ngOnInit(): void {}

  ngOnChanges() {
    if (this.member && this.profileOrg) {
      if (!this.profileOrg.isOwner) {
        this.managePeopleFG.disable();
      }

      this.teams$ = this.teamQuery.selectAllManagedByAdmin(this.member.uuid).pipe(
        filter(l => l != null),
        tap(teams => {
          const manageTeam = teams.length > 0;
          if (manageTeam !== this.managePeopleFG.get('everyone').value) {
            this.managePeopleFG.get('everyone').setValue(!manageTeam);
          }
        })
      );

      this.teamService.getTeamsManagedByAdmin(this.profileOrg.orgUuid, this.member.uuid).subscribe();
    }
  }

  toggleSection($event, group: IAMGroupUI) {
    if ($event.checked) {
      this.iamService
        .updateIAMGroupMember(X.orgUuid, this.member.uuid, <UpdateIAMGroupMemberReq>{
          adds: [group.uuid]
        })
        .subscribe();
    } else {
      this.iamService
        .updateIAMGroupMember(X.orgUuid, this.member.uuid, <UpdateIAMGroupMemberReq>{
          removes: [group.uuid]
        })
        .subscribe();
    }
  }

  assign(teams: Team[]) {
    this.dialog.open(AssignTeamDialogComponent, {
      width: '500px',
      data: <AssignTeamDialogData>{
        adminUUid: this.member.uuid,
        excludedTeamUuids: teams.map(item => item.uuid)
      }
    });
  }

  revokeManagement(team: Team) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Revoke team admin role',
          message: `<p>Are you sure to revoke the admin privilege of <strong>${this.member.displayName}</strong> on the <strong>${team.name}</strong> team?</p>`,
          confirmLabel: 'Revoke'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.teamService.deleteAdminForTeam(X.orgUuid, team.uuid, this.member.uuid).subscribe();
        }
      });
  }

  toggleManagePeople(teams: Team[], e: MatSlideToggleChange) {
    if (e.checked) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '500px',
          data: <ConfirmDialogInput>{
            title: 'Revoke all admin role of all teams',
            message: `<p>Are you sure to revoke the admin privilege of <strong>${this.member.displayName}</strong> on the <strong>all</strong>  teams? Then this admin will manage the whole organization.</p>`,
            confirmLabel: 'Revoke'
          }
        })
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            const streams = teams.map(t =>
              this.teamService.deleteAdminForTeam(X.orgUuid, t.uuid, this.member.uuid).pipe(catchError(_ => of()))
            );
            forkJoin(streams).subscribe(
              _ => {
                this.toastr.success(`Revoked admin role on all teams.`);
              },
              error => {
                this.toastr.warning(error.message);
              }
            );
          } else {
            this.managePeopleFG.get('everyone').setValue(false);
          }
        });
    }
  }

  toggleManageVIP(e: MatSlideToggleChange, policy: PolicyDocument) {
    if (e.checked) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '500px',
          data: <ConfirmDialogInput>{
            title: `Grant manage VIP members permission`,
            message: `
            <p>Allow this user to manage VIP members.</p>
            `,
            confirmLabel: 'Grant'
          }
        })
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            const req = new PolicyDocument(policy);
            const iamIndex = req.policies.findIndex(
              p => p.isService(IAM_SERVICES.auth) && p.hasAction(IAM_AUTH_ACTIONS.view_title)
            );
            if (iamIndex > -1) {
              req.policies.splice(iamIndex, 1);
            }
            req.policies.push(
              new IAMGrantedPermission({
                service: IAM_SERVICES.auth,
                action: IAM_AUTH_ACTIONS.view_title,
                resources: [IAM_AUTH_RESOURCES.vip]
              })
            );
            this.orgMemberService.updatePolicyDocument(X.orgUuid, this.member.uuid, req).subscribe(
              _ => {
                this.toastr.success(`Granted permission successfully`);
              },
              error => {
                this.toastr.warning(error.message);
              }
            );
          } else {
            this.manageVipFG.get('allowManageAll').setValue(false);
          }
        });
    } else {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '500px',
          data: <ConfirmDialogInput>{
            title: `Revoke manage VIP members permission`,
            message: `
            <p>Revoke this user to manage manage VIP members.</p>
            `,
            confirmLabel: 'Revoke',
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            const req = new PolicyDocument(policy);
            const iamIndex = req.policies.findIndex(
              p => p.isService(IAM_SERVICES.auth) && p.hasAction(IAM_AUTH_ACTIONS.view_title)
            );
            if (iamIndex > -1) {
              req.policies.splice(iamIndex, 1);
            }

            this.orgMemberService.updatePolicyDocument(X.orgUuid, this.member.uuid, req).subscribe(
              _ => {
                this.toastr.success(`Revoked permission successfully`);
              },
              error => {
                this.toastr.warning(error.message);
              }
            );
          } else {
            this.manageVipFG.get('allowManageAll').setValue(true);
          }
        });
    }
  }

  private _initForm() {
    this.managePeopleFG = this.fb.group({
      everyone: this.fb.control(false)
    });
    this.manageVipFG = this.fb.group({
      allowManageAll: this.fb.control(false)
    });
  }
}
