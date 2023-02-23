import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  IdentityStatus,
  Member,
  MemberPin,
  MemberStatus,
  MemberTitle,
  MemberUpdateRequest,
  OrganizationPolicyQuery,
  OrgMemberQuery,
  OrgMemberService,
  ProfileOrg
} from '@b3networks/api/auth';
import { MemberRole } from '@b3networks/api/member';
import { X } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { ChangeMemberRoleDialogComponent } from './change-member-role-dialog/change-member-role-dialog.component';
import { ChangeUsernameDialogComponent } from './change-username-dialog/change-username-dialog.component';
import { CreateCredentialComponent } from './create-credential/create-credential.component';
import { SetPasswordDialogComponent } from './set-password-dialog/set-password-dialog.component';
import { TransferOwnerDialogComponent } from './transfer-owner-dialog/transfer-owner-dialog.component';

@Component({
  selector: 'pom-member-account-info',
  templateUrl: './member-account-info.component.html',
  styleUrls: ['./member-account-info.component.scss']
})
export class MemberAccountInfoComponent implements OnInit, OnChanges {
  private _member: Member;

  readonly MemberRole = MemberRole;
  readonly MemberStatus = MemberStatus;

  isReadOnly: boolean;
  allowChange: boolean;

  pins: MemberPin[];
  fetchingPin: boolean;
  creatingPin: boolean;
  showSectionUsername: boolean;
  vipMemberCtrl = new UntypedFormControl();

  @Input() set member(mem: Member) {
    this._member = mem;
  }
  @Input() profileOrg: ProfileOrg;
  @Input() allowMemberImport: boolean;
  @Output() memberDetailChanged = new EventEmitter<boolean>();

  get member() {
    return this._member;
  }

  constructor(
    private organizationPolicyQuery: OrganizationPolicyQuery,
    private orgMemberQuery: OrgMemberQuery,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.member && this.profileOrg) {
      this.isReadOnly = this.member.role === MemberRole.OWNER || !this.profileOrg.isUpperAdmin;
      this.allowChange = !this.isReadOnly;
      this.showSectionUsername =
        this.member.username &&
        this.organizationPolicyQuery.hasGrantedResource(
          X.orgUuid,
          IAM_SERVICES.ui,
          IAM_UI_ACTIONS.enable_interface,
          IAM_UI_RESOURCES.credential_username
        );
      this.vipMemberCtrl.setValue(this.member.title === MemberTitle.vip);
    }
  }

  disableMember() {
    this.dialog
      .open(ConfirmDialogComponent, {
        autoFocus: false,
        data: {
          title: 'Disable member',
          message: `Are you sure you want to disable member ${this.member.displayName}?`,
          confirmLabel: `Yes, I'm sure`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(
        confirmed => {
          if (confirmed) {
            const req = new MemberUpdateRequest();
            req.status = MemberStatus.disabled;
            this.orgMemberService.updateMember(X.orgUuid, this.member.uuid, req).subscribe(resp => {
              this.toastService.success('Disabled member successfully.');

              this.memberDetailChanged.emit(true);
            });
          }
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  createCredential() {
    this.dialog
      .open(CreateCredentialComponent, {
        data: this.member.uuid,
        width: '500px'
      })
      .afterClosed()
      .subscribe(created => {
        if (created) {
          this.memberDetailChanged.emit(true);
        }
      });
  }

  changeUsername() {
    this.dialog
      .open(ChangeUsernameDialogComponent, {
        data: this.member,
        width: '500px'
      })
      .afterClosed()
      .subscribe(updated => {
        if (updated) {
          this.orgMemberQuery.selectActive().subscribe(member => (this.member = member));
          this.memberDetailChanged.emit(true);
        }
      });
  }

  setPassword() {
    this.dialog
      .open(SetPasswordDialogComponent, {
        data: this.member,
        width: '500px'
      })
      .afterClosed()
      .subscribe(updated => {
        if (updated) {
          this.memberDetailChanged.emit(true);
        }
      });
  }

  enableMember() {
    this.dialog
      .open(ConfirmDialogComponent, {
        autoFocus: false,
        data: {
          title: 'Enable member',
          message: `Are you sure you want to enable member ${this.member.displayName}?`,
          confirmLabel: `Yes, I'm sure`,
          color: 'primary'
        }
      })
      .afterClosed()
      .subscribe(
        confirmed => {
          if (confirmed) {
            const req = new MemberUpdateRequest();
            req.status = MemberStatus.active;
            this.orgMemberService.updateMember(X.orgUuid, this.member.uuid, req).subscribe(resp => {
              this.toastService.success('Enabled member successfully.');

              this.memberDetailChanged.emit(true);
            });
          }
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  openChangeRoleDialog() {
    this.dialog
      .open(ChangeMemberRoleDialogComponent, {
        data: this.member,
        width: '500px',
        autoFocus: false
      })
      .afterClosed()
      .subscribe(changedRole => {
        if (changedRole) {
          this.orgMemberQuery.selectActive().subscribe(member => (this.member = member));
          this.memberDetailChanged.emit(true);
        }
      });
  }

  transferOwner() {
    this.dialog
      .open(TransferOwnerDialogComponent, {
        width: '400px'
      })
      .afterClosed()
      .subscribe(resp => {
        if (resp && resp.transfered) {
          this.memberDetailChanged.emit(true);
        }
      });
  }

  activeIdentity() {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Re-activate Account',
          message: `Are you sure you want to re-activate ${this.member.displayName}?`,
          confirmLabel: `Yes, I'm sure`,
          color: 'primary'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          const req = new MemberUpdateRequest();
          req.status = this.member.memberStatus;
          req.identityStatus = IdentityStatus.active;

          this.orgMemberService.updateMember(X.orgUuid, this.member.uuid, req).subscribe(
            _ => {
              this.toastService.success(`Account ${this.member.displayName} has been re-actived.`);

              this.memberDetailChanged.emit(true);
            },
            error => {
              this.toastService.error(error.message);
            }
          );
        }
      });
  }

  getPins() {
    this.fetchingPin = true;
    this.orgMemberService
      .fetchMemberPins(X.orgUuid, this.member.uuid)
      .pipe(finalize(() => (this.fetchingPin = false)))
      .subscribe(
        resp => {
          this.pins = resp;
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  createNewPin() {
    this.creatingPin = true;
    this.orgMemberService
      .createMemberPin(X.orgUuid, this.member.uuid)
      .pipe(finalize(() => (this.creatingPin = false)))
      .subscribe(
        _ => {
          this.getPins();
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  toggleVipMember(e: MatSlideToggleChange) {
    const message = e.checked
      ? `Are you sure you want to make ${this.member.displayName} a VIP member?`
      : `Are you sure you want to cancel VIP member with ${this.member.displayName}?`;
    const color = e.checked ? 'primary' : 'warn';
    this.dialog
      .open(ConfirmDialogComponent, {
        autoFocus: false,
        data: {
          title: 'VIP member',
          message: message,
          confirmLabel: `Yes, I'm sure`,
          color: color
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.orgMemberService
            .updateVIPMemberForLicenseOrg(this.member.uuid, { title: e.checked ? MemberTitle.vip : null })
            .subscribe(_ => {
              const message = e.checked ? 'Set VIP member successfully.' : 'Cancel VIP member successfully.';
              this.toastService.success(message);
              this.orgMemberQuery.selectActive().subscribe(member => (this.member = member));
              this.memberDetailChanged.emit(true);
            });
        } else {
          this.vipMemberCtrl.setValue(e.checked ? false : true);
        }
      });
  }

  reactivateMember() {
    this.dialog
      .open(ConfirmDialogComponent, {
        autoFocus: false,
        data: {
          title: 'Reactivate member',
          message: `Are you sure you want to reactivate member ${this.member.displayName}?`,
          confirmLabel: `Yes, I'm sure`,
          color: 'primary'
        }
      })
      .afterClosed()
      .subscribe(
        confirmed => {
          if (confirmed) {
            const req = new MemberUpdateRequest();
            req.identityStatus = IdentityStatus.active;
            this.orgMemberService.updateMember(X.orgUuid, this.member.uuid, req).subscribe(_ => {
              this.toastService.success('Reactivate member successfully.');

              this.memberDetailChanged.emit(true);
            });
          }
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
