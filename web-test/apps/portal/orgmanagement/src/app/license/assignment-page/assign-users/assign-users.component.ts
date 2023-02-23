import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GetMembersReq, Member, MemberStatus, OrgMemberQuery, OrgMemberService } from '@b3networks/api/auth';
import { GetStaffReq, StaffQuery, StaffService } from '@b3networks/api/bizphone';
import { GetLicenseReq, License, LicenseService, LicenseStatistic } from '@b3networks/api/license';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, debounceTime, finalize, map, mergeMap, startWith } from 'rxjs/operators';

export interface AssignUsersInput {
  licenseStatis: LicenseStatistic;
  teamUuid?: string;
}

@Component({
  selector: 'b3n-assign-users',
  templateUrl: './assign-users.component.html',
  styleUrls: ['./assign-users.component.scss']
})
export class AssignUsersComponent implements OnInit {
  licenses: License[] = [];

  selectedMembers: Member[] = [];
  filteredMembers$: Observable<Member[]>;
  memberCtrl: UntypedFormControl = new UntypedFormControl();

  selectedMemberChanged = new BehaviorSubject(true);
  progressing: boolean;

  assignExtensionFG: UntypedFormGroup;

  @ViewChild('memberInput') memberInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AssignUsersInput,
    private licenseService: LicenseService,
    private memberQuery: OrgMemberQuery,
    private memberService: OrgMemberService,
    private staffQuery: StaffQuery,
    private staffService: StaffService,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<AssignUsersComponent>,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.filteredMembers$ = of(this.data.licenseStatis.isExtension).pipe(
      mergeMap(value => {
        let staffStream = of([]);
        if (value) {
          staffStream = this.staffQuery.staffs$;
        }
        return combineLatest([this.memberQuery.members$, staffStream, this.selectedMemberChanged]);
      }),
      map(([members, staffs]) => {
        const selectedUuids = this.selectedMembers.map(m => m.uuid);
        return members
          .filter(m => !selectedUuids.includes(m.uuid))
          .filter(m => {
            return staffs.findIndex(s => s.uuid === m.uuid) === -1;
          });
      })
    );

    this.memberCtrl.valueChanges
      .pipe(startWith(''), debounceTime(200))
      .subscribe(async (value: string | Member | null) => {
        if (this.data.licenseStatis.isExtension) {
          if (!value) {
            this.selectedMembers = [];
          }
          if (value instanceof Member) {
            this.selectedMembers.push(value);
          }
        }

        this.memberService
          .getDirectoryMembers(<GetMembersReq>{
            orgUuid: X.orgUuid,
            keyword: value,
            sort: 'asc',
            team: this.data.teamUuid,
            status: `${MemberStatus.active},${MemberStatus.pending}`
          })
          .pipe(
            mergeMap(members => {
              const memberUuids = members.content.map(m => m.uuid);
              return this.data.licenseStatis.isExtension
                ? this.staffService.get(<GetStaffReq>{ identityUuids: memberUuids })
                : of([]);
            })
          )
          .subscribe();
      });

    this.licenseService
      .getLicenses(
        <GetLicenseReq>{
          skus: [this.data.licenseStatis.sku],
          hasUser: false,
          hasResource: this.data.licenseStatis.isExtension ? true : null
        },
        {
          page: 0,
          perPage: this.data.licenseStatis.statsByUser.available
        }
      )
      .subscribe(p => {
        this.licenses = p.content.sort((a, b) => +a.resourceKey - +b.resourceKey);
      });

    if (this.data.licenseStatis.isExtension) {
      this.assignExtensionFG = this.fb.group({
        licenseId: [null, [Validators.required]]
      });
    }
  }

  remove(member: Member) {
    const index = this.selectedMembers.findIndex(m => m.uuid === member.uuid);
    if (index >= 0) {
      this.selectedMembers.splice(index, 1);
    }
    this.selectedMemberChanged.next(true);
    if (this.selectedMembers.length === this.data.licenseStatis.statsByUser.available) {
      this.memberCtrl.enable();
    }
  }

  selected(event: MatAutocompleteSelectedEvent) {
    this.selectedMembers.push(event.option.value);
    this.memberInput.nativeElement.value = '';
    this.memberCtrl.setValue(null);
    if (this.selectedMembers.length === this.data.licenseStatis.statsByUser.available) {
      this.memberCtrl.disable();
    }
    this.selectedMemberChanged.next(true);
  }

  memberDisplayFn(member: Member): string {
    return member ? member.displayName : '';
  }

  assign() {
    this.progressing = true;

    const streams = [];
    if (this.data.licenseStatis.isDeveloper) {
      const maxLength =
        this.licenses.length > this.selectedMembers.length ? this.selectedMembers.length : this.licenses.length;

      for (let i = 0; i < maxLength; i++) {
        streams.push(
          this.licenseService.assignUser(this.licenses[i].id, this.selectedMembers[i].uuid).pipe(
            catchError(error => {
              return of(`Cannot assign user ${this.selectedMembers[i].displayName} due to ${error.message}`);
            })
          )
        );
      }
    } else if (this.data.licenseStatis.isExtension) {
      const licenseId = this.assignExtensionFG.get('licenseId').value;
      if (!licenseId) {
        this.toastr.warning('Please select a extension to assign');
        return;
      }
      streams.push(
        this.licenseService.assignUser(licenseId, this.selectedMembers[0].uuid).pipe(
          catchError(error => {
            return of(`Cannot assign user ${this.selectedMembers[0].displayName} due to ${error.message}`);
          })
        )
      );
    }

    if (!streams.length) {
      return;
    }

    forkJoin(streams)
      .pipe(
        finalize(() => {
          this.progressing = false;
          this.dialogRef.close(true);
        })
      )
      .subscribe(
        results => {
          const errors = results.filter(s => !!s).join('\n');
          !!errors ? this.toastr.warning(errors) : this.toastr.success(`Assign licenses successfully`);
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }
}
