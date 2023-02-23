import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateGroupBody, OrgLinkService } from '@b3networks/api/auth';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface OrgLinkInviteData {
  profileUuid: string;
  type: 'Create' | 'Invite';
  linkUuid: string;
}

@Component({
  selector: 'b3n-org-link-invite',
  templateUrl: './org-link-invite.component.html',
  styleUrls: ['./org-link-invite.component.scss']
})
export class OrgLinkInviteComponent extends DestroySubscriberComponent implements OnInit {
  form: UntypedFormGroup;
  addNew: boolean;

  constructor(
    public dialogRef: MatDialogRef<OrgLinkInviteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrgLinkInviteData,
    private fb: UntypedFormBuilder,
    private orgLinkService: OrgLinkService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      orgUuid: ['', Validators.required]
    });
  }

  invite() {
    this.addNew = true;
    const body: CreateGroupBody = {
      organizationUuid: this.orgUuid.value
    };

    if (this.data.linkUuid) {
      this.addNew = false;
      body.organizationGroupUuid = this.data.linkUuid;
    }

    this.orgLinkService.createGroup(this.data.profileUuid, body).subscribe(
      _ => {
        this.toastService.success('Invite successfully');
        this.dialogRef.close(this.addNew);
      },
      err => this.toastService.warning(err.message)
    );
  }

  get orgUuid() {
    return this.form.controls['orgUuid'];
  }
}
