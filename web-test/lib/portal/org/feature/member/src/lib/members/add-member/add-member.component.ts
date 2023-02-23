import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AddMemberRequest,
  GetMembersReq,
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  IdentityProfileQuery,
  OrganizationPolicyQuery,
  OrgMemberService,
  ProfileOrg,
  Team,
  TeamQuery
} from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { MemberFilterQuery, MemberRole } from '@b3networks/api/member';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, switchMap } from 'rxjs/operators';

export function emailRequireValidator(portalAccess: boolean): ValidatorFn {
  return (control: AbstractControl): { required: boolean } | null => {
    const isRequired = portalAccess && !control.value;
    return isRequired ? { required: isRequired } : null;
  };
}

export enum TypeLogin {
  EMAIL = 'EMAIL',
  USERNAME = 'USERNAME'
}

@Component({
  selector: 'pom-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss']
})
export class AddMemberComponent extends DestroySubscriberComponent implements OnInit {
  roles = [MemberRole.MEMBER, MemberRole.ADMIN];
  TypeLogin = TypeLogin;
  typesLogin = [TypeLogin.EMAIL, TypeLogin.USERNAME];
  typeLoginCtrl = new UntypedFormControl(TypeLogin.EMAIL);
  loading = false;

  memberForm = this.fb.group({
    name: new UntypedFormControl('', [Validators.required]),
    portalAccess: new UntypedFormControl(true, [Validators.required]),
    role: new UntypedFormControl(MemberRole.MEMBER),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    username: new UntypedFormControl(''),
    teamUuid: this.fb.control('')
  });

  profileOrg: ProfileOrg;
  isManagedTeam: boolean; // when admin assigned to manage a team
  teams: Team[] = [];

  get name(): AbstractControl {
    return this.memberForm.get('name');
  }

  get email(): AbstractControl {
    return this.memberForm.get('email');
  }

  get username(): AbstractControl {
    return this.memberForm.get('username');
  }

  getErrorUsername() {
    if (this.username.hasError('required')) {
      return 'Please enter your member username';
    } else if (this.username.hasError('minlength') || this.username.hasError('maxlength')) {
      return 'Username must be from 4 to 15 characters';
    } else if (this.username.hasError('pattern')) {
      return 'Username is invalid';
    }
    return '';
  }

  get portalAccess(): AbstractControl {
    return this.memberForm.get('portalAccess');
  }

  constructor(
    private dialogRef: MatDialogRef<AddMemberComponent>,
    private profileQuery: IdentityProfileQuery,
    private orgMemberService: OrgMemberService,
    private organizationPolicyQuery: OrganizationPolicyQuery,
    private memberFilterQuery: MemberFilterQuery,
    private teamQuery: TeamQuery,
    private toastr: ToastService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.profileOrg = this.profileQuery.currentOrg;
    if (!this.profileOrg.isOwner) {
      this.memberForm.get('role').disable();
    }

    this.teams = this.teamQuery.getAll();
    const managedTeams = this.teams.filter(t => t.admins?.includes(this.profileQuery.getProfile().uuid));
    if (this.profileOrg.isAdmin && managedTeams.length) {
      this.isManagedTeam = true;
      this.teams = managedTeams;
      this.memberForm.get('teamUuid').setValue(this.teams[0].uuid);
    }

    this.portalAccess.valueChanges.subscribe(isAccess => {
      this.setValidate(isAccess, this.typeLoginCtrl.value);
    });

    this.typeLoginCtrl.valueChanges.subscribe(val => {
      this.setValidate(this.portalAccess.value, val);
    });

    if (
      !this.organizationPolicyQuery.hasGrantedResource(
        X.orgUuid,
        IAM_SERVICES.ui,
        IAM_UI_ACTIONS.enable_interface,
        IAM_UI_RESOURCES.credential_username
      )
    ) {
      this.typeLoginCtrl.disable();
    }
  }

  private setValidate(isAccess: boolean, loginBy: TypeLogin) {
    if (loginBy === TypeLogin.EMAIL) {
      this.email.setValidators([emailRequireValidator(isAccess)]);
      this.username.setValidators(null);
    } else {
      this.email.setValidators(null);
      this.username.setValidators([
        emailRequireValidator(isAccess),
        Validators.minLength(4),
        Validators.maxLength(15),
        Validators.pattern('^[a-zA-Z0-9_]+$')
      ]);
    }
    this.email.updateValueAndValidity();
    this.username.updateValueAndValidity();
  }

  submit(event: Event) {
    event.stopPropagation();
    this.loading = true;
    const req = this.memberForm.getRawValue() as AddMemberRequest;
    req.teamUuids = this.memberForm.value.teamUuid ? [this.memberForm.value.teamUuid] : null;
    delete req['teamUuid'];

    this.orgMemberService
      .addMember(X.orgUuid, req)
      .pipe(
        switchMap(() =>
          this.orgMemberService.getMembers(
            <GetMembersReq>{
              orgUuid: X.orgUuid,
              status: this.memberFilterQuery.getValue().status,
              sort: 'identity.givenName,asc'
            },
            new Pageable(0, 10)
          )
        ),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        () => {
          this.toastr.success('Created successfully');
          this.dialogRef.close({ success: true });
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }
}
