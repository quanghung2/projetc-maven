import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  IAMMember,
  GetMembersReq,
  IAMGrantedPermission,
  IamQuery,
  Member,
  MemberRole,
  MemberStatus,
  OrgMemberService,
  PolicyDocument
} from '@b3networks/api/auth';
import * as _ from 'lodash';
import { Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent, FILE_EXPLORER, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { debounceTime, finalize, map, Observable, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { MatOption, MatOptionSelectionChange } from '@angular/material/core';

export interface PermissionInfo {
  groupUuid: string;
  groupName: string;
}

@Component({
  selector: 'b3n-permissions-assign',
  templateUrl: './permissions-assign.component.html',
  styleUrls: ['./permissions-assign.component.scss']
})
export class PermissionsAssignComponent extends DestroySubscriberComponent implements OnInit {
  formPermission: FormGroup;
  selectedMember: IAMMember;
  progressing: boolean;
  pageable: Pageable = {
    page: 0,
    perPage: 20
  };
  req: GetMembersReq = {
    keyword: '',
    status: MemberStatus.active,
    orgUuid: X.orgUuid,
    excludeIamGroupUuid: '',
    filterByRoles: [MemberRole.MEMBER]
  };
  version: string;
  isFileExplorer: boolean;

  permissions$: Observable<IAMGrantedPermission[]>;
  filteredMembers$: Observable<IAMMember[]>;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: PermissionInfo,
    private fb: FormBuilder,
    private iamQuery: IamQuery,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<PermissionsAssignComponent>
  ) {
    super();

    this.req.excludeIamGroupUuid = data.groupUuid;
    this.isFileExplorer = data.groupName === FILE_EXPLORER;
  }

  ngOnInit(): void {
    this.initForm();
    this.listenMemberChange();
    this.permissions$ = this.iamQuery.actions$.pipe(map(list => list.map(p => new IAMGrantedPermission(p))));
  }

  initForm() {
    this.formPermission = this.fb.group({
      member: [null, Validators.required],
      permissions: [[]]
    });
  }

  listenMemberChange() {
    this.filteredMembers$ = this.formPermission
      .get('member')
      .valueChanges.pipe(startWith(null))
      .pipe(
        debounceTime(350),
        takeUntil(this.destroySubscriber$),
        switchMap(value => {
          if (!(value instanceof Member)) {
            this.selectedMember = null;
            this.req.keyword = value;
          }
          return this.orgMemberService.getMembers(this.req, this.pageable).pipe(
            map(page => page.content),
            tap(members => {
              console.log(members);
            })
          );
        })
      );
  }

  onReset() {
    this.formPermission.get('member').setValue('');
    this.selectedMember = null;
  }

  onCheckFileExplorer(event: MatOptionSelectionChange, permission: IAMGrantedPermission, perSelect: MatSelect) {
    perSelect.options.forEach((item: MatOption) => {
      if (permission.action === 'Manage' && item.value === 'View') {
        if (event.source.selected) {
          item.disabled = true;
          item.setInactiveStyles();
        } else {
          item.disabled = false;
          item.setActiveStyles();
        }
        item.select();
      }
    });
  }

  selectMemberChanged(event: MatAutocompleteSelectedEvent) {
    const selected = event.option.value;
    if (!selected) {
      this.formPermission.get('member').setValue('');
    }
    this.selectedMember = selected;
  }

  onAssign() {
    console.log(this);
    const value = this.formPermission.value;
    this.progressing = true;
    this.permissions$
      .pipe(
        map(list =>
          list.map(p => {
            p.service.split(' ').join('_');
            p.resources = ['*'];
            return p;
          })
        ),
        switchMap(permissions => {
          const req = new PolicyDocument(this.selectedMember?.iamPolicy);
          const policies = permissions?.filter(p => {
            return value.permissions?.includes(p.action);
          });
          req.policies = _.uniqBy([...req.policies, ...policies], 'id');
          if (this.version) {
            req.version = this.version;
          }
          return this.orgMemberService.updatePolicyDocument(X.orgUuid, this.selectedMember.memberUuid, req);
        }),
        finalize(() => (this.progressing = false))
      )
      .subscribe(policyDocument => {
        this.version = policyDocument.version;
        this.toastService.success('Permissions have been updated successfully');
        this.dialogRef.close({ ok: true });
      });
  }

  displayFn(member: Member): string {
    return member?.displayName || '';
  }
}
