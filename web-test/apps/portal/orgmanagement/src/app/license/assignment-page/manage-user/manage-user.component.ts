import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GetMembersReq, Member, OrgMemberQuery, OrgMemberService } from '@b3networks/api/auth';
import { GetStaffReq, StaffQuery, StaffService } from '@b3networks/api/bizphone';
import { ExtensionService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { License, LicenseService } from '@b3networks/api/license';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, finalize, map, mergeMap } from 'rxjs/operators';

export interface ManageUserInput {
  license: License;
  teamUuid: string;
}
@Component({
  selector: 'b3n-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit {
  license: License;
  members$: Observable<Member[]>;
  searchMemberCtrl = new UntypedFormControl();
  getMemberPageable: Pageable = { page: 0, perPage: 10 };
  selectedMember: Member;
  assigning: boolean;
  unassigning: boolean;

  @ViewChild('searchMemberInpt') searchMemberInpt: ElementRef<HTMLInputElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ManageUserInput,
    private dialogRef: MatDialogRef<ManageUserComponent>,
    private licenseService: LicenseService,
    private memberQuery: OrgMemberQuery,
    private memberService: OrgMemberService,
    private staffQuery: StaffQuery,
    private staffService: StaffService,
    private extensionService: ExtensionService,
    private toastr: ToastService
  ) {
    this.license = data.license;
  }

  ngOnInit(): void {
    this.members$ = of(this.data.license.isExtension).pipe(
      mergeMap(value => {
        let staffStream = of([]);
        if (value) {
          staffStream = this.staffQuery.staffs$;
        }
        return combineLatest([this.memberQuery.members$, staffStream]);
      }),
      map(([members, staffs]) => {
        return members.filter(m => {
          return staffs.findIndex(s => s.uuid === m.uuid) === -1;
        });
      })
    );

    if (!!this.data.license.identityUuid) {
      const member = this.memberQuery.getMember(this.data.license.identityUuid);
      if (member) {
        setTimeout(() => {
          this.searchMemberInpt.nativeElement.value = this.memberDisplayFn(member);
        });
      }
    } else {
      this.getMembers();
    }

    this.searchMemberCtrl.valueChanges.pipe(debounceTime(200)).subscribe(value => {
      if (!value) {
        this.selectedMember = null;
      }
      if (value instanceof Member) {
        this.selectedMember = value;
      } else {
        this.getMembers(value);
      }
    });
  }

  assign() {
    if (this.selectedMember) {
      if (!!this.data.license.identityUuid) {
        this.assigning = true;
        this.licenseService.unassignUser(this.data.license.id).subscribe(
          _ => {
            this.doTranfer();
          },
          error => {
            this.toastr.warning(error.message);
            this.assigning = false;
          }
        );
      } else {
        this.doTranfer();
      }
    }
  }

  unassign() {
    this.unassigning = true;
    this.licenseService
      .unassignUser(this.data.license.id)
      .pipe(finalize(() => (this.unassigning = false)))
      .subscribe(
        _ => {
          if (this.license.isExtension) {
            this.extensionService.getDetails(this.license.resourceKey).subscribe();
          }

          this.toastr.success('Unassign license successful');
          this.dialogRef.close(true);
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }

  private doTranfer() {
    this.assigning = true;
    this.licenseService
      .assignUser(this.data.license.id, this.selectedMember.uuid)
      .pipe(finalize(() => (this.assigning = false)))
      .subscribe(
        _ => {
          if (this.license.isExtension) {
            // to resync directory name
            this.extensionService.getDetails(this.license.resourceKey).subscribe();
          }
          this.toastr.success(`${!!this.data.license.identityUuid ? 'Reassign' : 'Assign'} license successful`);
          this.dialogRef.close(true);
        },
        error => {
          this.toastr.error(error.message);
        }
      );
  }

  memberDisplayFn(member: Member): string {
    return member ? member.displayName : '';
  }

  private getMembers(searchString?: string) {
    this.memberService
      .getMembers(
        <GetMembersReq>{ orgUuid: X.orgUuid, keyword: searchString, filterByTeamUuid: this.data.teamUuid },
        this.getMemberPageable
      )
      .pipe(
        mergeMap(members => {
          const memberUuids = members.content.map(m => m.uuid);
          return this.data.license.isExtension
            ? this.staffService.get(<GetStaffReq>{ identityUuids: memberUuids })
            : of([]);
        })
      )
      .subscribe();
  }
}
