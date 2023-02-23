import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  IAMMember,
  GetMembersReq,
  IAM_GROUP_UUIDS,
  IAMGrantedPermission,
  IamQuery,
  Member,
  MemberRole,
  MemberStatus,
  OrgMemberService,
  PolicyDocument
} from '@b3networks/api/auth';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { DirectoryMemberService } from '@b3networks/api/directory';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDialogRef } from '@angular/material/dialog';
import { Pageable } from '@b3networks/api/common';

@Component({
  selector: 'b3n-add-permission-dialog',
  templateUrl: './add-permission-dialog.component.html',
  styleUrls: ['./add-permission-dialog.component.scss']
})
export class AddPermissionDialogComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  memberCtrl = new FormControl();
  filteredMembers$: Observable<IAMMember[]>;
  members: IAMMember[] = [];
  selectedMember: IAMMember;
  pageable: Pageable = {
    page: 0,
    perPage: 20
  };
  req: GetMembersReq = {
    keyword: '',
    status: MemberStatus.active,
    orgUuid: X.orgUuid,
    excludeIamGroupUuid: IAM_GROUP_UUIDS.businessHub,
    filterByRoles: [MemberRole.MEMBER]
  };
  permissions$: Observable<IAMGrantedPermission[]>;
  addPermissionForm: FormGroup;
  version: string;
  progressing: boolean;

  constructor(
    private memberService: DirectoryMemberService,
    private iamQuery: IamQuery,
    private fb: FormBuilder,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<AddPermissionDialogComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.listenMemberChange();
    this.permissions$ = this.iamQuery.actions$.pipe(map(list => list.map(p => new IAMGrantedPermission(p))));
  }

  initForm() {
    this.addPermissionForm = this.fb.group({
      member: [null, Validators.required],
      permissions: [[]]
    });
  }

  listenMemberChange() {
    this.filteredMembers$ = this.addPermissionForm
      .get('member')
      .valueChanges.pipe(startWith(null))
      .pipe(debounceTime(350), takeUntil(this.destroySubscriber$))
      .pipe(
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

  reset() {
    this.addPermissionForm.get('member').setValue('');
    this.selectedMember = null;
  }

  displayFn(member: Member): string {
    return member?.displayName || '';
  }

  selectMemberChanged(event: MatAutocompleteSelectedEvent) {
    const selected = event.option.value;
    if (!selected) {
      this.addPermissionForm.get('member').setValue('');
    }
    this.selectedMember = selected;
  }

  add() {
    const value = this.addPermissionForm.value;
    this.progressing = true;
    this.permissions$
      .pipe(
        map(list =>
          list.map(p => {
            p.resources = ['*'];
            return p;
          })
        ),
        switchMap(permissions => {
          const body = new PolicyDocument(this.selectedMember?.iamPolicy);
          const policies = permissions?.filter(p => {
            return value.permissions?.includes(p.action);
          });
          body.policies = policies;
          if (this.version) {
            body.version = this.version;
          }
          return this.orgMemberService.updatePolicyDocument(X.orgUuid, this.selectedMember.memberUuid, body);
        }),
        finalize(() => (this.progressing = false))
      )
      .subscribe(policyDocument => {
        this.version = policyDocument.version;
        this.toastService.success('Permission have been updated successfully');
        this.dialogRef.close({ ok: true });
      });
  }
}
