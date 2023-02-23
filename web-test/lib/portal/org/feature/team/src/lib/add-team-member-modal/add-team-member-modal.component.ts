import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  GetMembersReq,
  IdentityProfileQuery,
  Member,
  MemberStatus,
  OrgMemberService,
  TeamService
} from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { BehaviorSubject, of } from 'rxjs';
import { debounceTime, finalize, map, switchMap, takeUntil } from 'rxjs/operators';

export interface AddTeamMemberModalInput {
  uuid: string;
}

@Component({
  selector: 'b3networks-add-team-member-modal',
  templateUrl: './add-team-member-modal.component.html',
  styleUrls: ['./add-team-member-modal.component.scss']
})
export class AddTeamMemberModalComponent extends DestroySubscriberComponent implements OnInit {
  isLoading = true;
  isSave: boolean;
  searchMember = new UntypedFormControl('');

  members$ = new BehaviorSubject<string>('');
  membersDefault: Member[] = [];
  members: Member[] = [];
  pageable = new Pageable(0, 10);

  membersSelected: string[] = [];
  selectedMembers: Member[] = [];

  addTeamMemberModalInput: AddTeamMemberModalInput;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AddTeamMemberModalInput,
    private orgMemberService: OrgMemberService,
    private teamService: TeamService,
    private dialogRef: MatDialogRef<AddTeamMemberModalComponent>,
    private toastService: ToastService,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
    this.addTeamMemberModalInput = data;
  }

  ngOnInit(): void {
    this.getMember();
    this.searchMember.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe((val: string) => {
      this.members$.next(val);
    });
  }

  isSelectedMember(uuid: string): boolean {
    return this.selectedMembers.some(m => m.uuid === uuid);
  }

  onSelectedMember(member: Member) {
    const index = this.selectedMembers.findIndex(m => m.uuid === member.uuid);
    if (index === -1) {
      this.selectedMembers.push(member);
    } else {
      this.selectedMembers.splice(index, 1);
    }
  }

  onSave() {
    if (!this.selectedMembers.length || this.isSave) {
      return;
    }
    const { uuid } = this.addTeamMemberModalInput;
    this.isSave = true;
    this.teamService
      .addMembers(
        X.orgUuid,
        uuid,
        this.selectedMembers.map(m => m.uuid)
      )
      .pipe(finalize(() => (this.isSave = false)))
      .subscribe(
        res => {
          this.toastService.success('Add member successfully!');
          this.dialogRef.close(true);
        },
        error => {
          this.toastService.error(error.message || 'Add member failed!');
          this.dialogRef.close(false);
        }
      );
  }

  private getMember() {
    const isLicenseOrg = this.profileQuery.currentOrg.licenseEnabled;
    const status = isLicenseOrg ? `${MemberStatus.active},${MemberStatus.pending}` : MemberStatus.active;
    this.members$
      .asObservable()
      .pipe(
        debounceTime(300),
        switchMap((queryString: string) => {
          if (this.membersDefault.length && !queryString?.trim()) {
            return of(this.membersDefault);
          }
          const request: GetMembersReq = {
            orgUuid: X.orgUuid,
            excludeTeamUuid: this.addTeamMemberModalInput.uuid,
            keyword: queryString,
            status: status
          };

          this.isLoading = true;
          return (
            isLicenseOrg
              ? this.orgMemberService.getDirectoryMembers(request, this.pageable)
              : this.orgMemberService.getMembers(request, this.pageable)
          ).pipe(
            finalize(() => (this.isLoading = false)),
            map(res => {
              if (!queryString?.trim()) {
                this.membersDefault = [...res?.content];
              }
              return res?.content;
            })
          );
        }),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(data => {
        this.members = [...data];
      });
  }
}
