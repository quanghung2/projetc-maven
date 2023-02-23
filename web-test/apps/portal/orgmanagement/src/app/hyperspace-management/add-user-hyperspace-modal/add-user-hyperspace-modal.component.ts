import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Pageable } from '@b3networks/api/common';
import { HyperspaceService, ReqHyperspaceManagement, User, UserQuery } from '@b3networks/api/workspace';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize, startWith, switchMap } from 'rxjs/operators';

export interface AddUserHyperspaceModalInput {
  hyperId: string;
  users: string[]; // chatUuid
}

@Component({
  selector: 'b3n-add-user-hyperspace-modal',
  templateUrl: './add-user-hyperspace-modal.component.html',
  styleUrls: ['./add-user-hyperspace-modal.component.scss']
})
export class AddUserHyperspaceModalComponent extends DestroySubscriberComponent implements OnInit {
  isSave: boolean;
  searchMember = new UntypedFormControl('');
  members$: Observable<User[]>;
  pageable = new Pageable(0, 10);
  usersSelected: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddUserHyperspaceModalInput,
    private dialogRef: MatDialogRef<AddUserHyperspaceModalComponent>,
    private toastService: ToastService,
    private userQuery: UserQuery,
    private hyperspaceService: HyperspaceService
  ) {
    super();
    this.usersSelected = [...this.data.users];
  }

  ngOnInit(): void {
    this.members$ = this.searchMember.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((queryString: string) => this.userQuery.selectUserByName(queryString, 30, [...this.data.users]))
    );
  }

  onSelectedMember(member: User) {
    const index = this.usersSelected.indexOf(member.userUuid);
    if (index === -1) {
      this.usersSelected.push(member.userUuid);
    } else {
      this.usersSelected.splice(index, 1);
    }
  }

  onSave() {
    if (!this.usersSelected.length || this.isSave) {
      return;
    }
    this.isSave = true;
    const adds = this.usersSelected.filter(u => !this.data.users.includes(u));

    this.hyperspaceService
      .addOrRemoveMemberToHyperspace(
        this.data.hyperId,
        <ReqHyperspaceManagement>{
          add: adds
        },
        X.orgUuid
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
}
