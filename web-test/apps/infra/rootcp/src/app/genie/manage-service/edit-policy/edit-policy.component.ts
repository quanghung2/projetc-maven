import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SecurityPolicyDetail, SecurityService } from '@b3networks/api/auth';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs';

export interface EditPolicyInput {
  securityPolicyDetail: SecurityPolicyDetail;
}

@Component({
  selector: 'b3n-edit-policy',
  templateUrl: './edit-policy.component.html',
  styleUrls: ['./edit-policy.component.scss']
})
export class EditPolicyComponent implements OnInit {
  processing: boolean;
  manageServiceCrtl = new UntypedFormControl();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditPolicyInput,
    private dialogRef: MatDialogRef<EditPolicyComponent>,
    private securityService: SecurityService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.manageServiceCrtl.setValue(this.data.securityPolicyDetail.securityPolicy.enabledManagedService);
  }

  save() {
    this.processing = true;
    this.data.securityPolicyDetail.securityPolicy.enabledManagedService = this.manageServiceCrtl.value;
    this.securityService
      .updateSecurityPolicy(this.data.securityPolicyDetail.securityPolicy, this.data.securityPolicyDetail.key)
      .pipe(finalize(() => (this.processing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Updated successfully');
          this.dialogRef.close();
        },
        err => this.toastService.error(err)
      );
  }
}
