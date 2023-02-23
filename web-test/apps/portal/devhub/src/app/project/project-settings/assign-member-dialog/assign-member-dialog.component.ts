import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GetMembersReq, Member, MemberRole, MemberStatus, OrgMemberService } from '@b3networks/api/auth';
import { MemberOfProject, Project, ProjectService, UserQuery } from '@b3networks/api/flow';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-assign-member-dialog',
  templateUrl: './assign-member-dialog.component.html',
  styleUrls: ['./assign-member-dialog.component.scss']
})
export class AssignMemberDialogComponent implements OnInit {
  maxMember: number;
  members$: Observable<Member[]>;
  searchCtrl = new UntypedFormControl();
  selection = new SelectionModel<MemberOfProject>(true, []);
  saving: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private project: Project,
    private dialogRef: MatDialogRef<AssignMemberDialogComponent>,
    private orgMemberService: OrgMemberService,
    private projectService: ProjectService,
    private userQuery: UserQuery,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.maxMember = this.userQuery.getValue().membersPerProjectLimit;

    this.selection.select(...this.project.assignedMembers);
    if (this.selection.selected.length === this.maxMember) {
      this.searchCtrl.disable();
    }

    this.members$ = <Observable<Member[]>>this.searchCtrl.valueChanges.pipe(startWith(''), debounceTime(200)).pipe(
      switchMap(value => {
        return this.orgMemberService
          .getDirectoryMembers(
            <GetMembersReq>{
              orgUuid: X.orgUuid,
              keyword: value,
              sort: 'asc',
              status: MemberStatus.active,
              roles: [MemberRole.MEMBER]
            },
            { page: 0, perPage: 10 }
          )
          .pipe(map(res => res.content.filter(m => !this.selection.selected.find(s => s.memberUuid === m.memberUuid))));
      })
    );
  }

  selectMember(event: MatAutocompleteSelectedEvent) {
    const member: Member = event.option.value;
    if (member) {
      this.selection.selected.push({ memberUuid: member.memberUuid, memberName: member.displayName });
      this.searchCtrl.setValue(null);
      if (this.selection.selected.length === this.maxMember) {
        this.searchCtrl.disable();
      }
    }
  }

  removeMember(member: MemberOfProject) {
    this.selection.selected.splice(this.selection.selected.indexOf(member), 1);
    if (this.selection.selected.length < this.maxMember) {
      this.searchCtrl.enable();
    }
  }

  assign() {
    const removeUuids = this.project.assignedMembers
      .filter(m => !this.selection.selected.find(sm => sm.memberUuid === m.memberUuid))
      .map(m => m.memberUuid);
    const newUuids = this.selection.selected.filter(
      sm => !this.project.assignedMembers.find(m => sm.memberUuid === m.memberUuid)
    );

    this.saving = true;
    forkJoin([
      this.projectService.removeMemberToProject(this.project.uuid, removeUuids),
      this.projectService.assignMemberToProject(
        this.project.uuid,
        newUuids.map(member => member.memberUuid)
      )
    ])
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.toastService.success(`Assign members successfully`);
          this.projectService.updateMemberProject(this.project.subscriptionUuid, this.selection.selected);
          this.dialogRef.close(true);
        },
        error: () => this.toastService.error(`Assign members failed`)
      });
  }
}
