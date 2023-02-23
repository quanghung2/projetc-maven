import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { OrganizationService } from '@b3networks/api/auth';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-toggle-demo-dialog',
  templateUrl: './toggle-demo-dialog.component.html',
  styleUrls: ['./toggle-demo-dialog.component.scss']
})
export class ToggleDemoDialogComponent implements OnInit {
  orgUuidCtrl = new UntypedFormControl('', Validators.required);
  demoCtrl = new UntypedFormControl(true);
  setting: boolean;

  constructor(
    private dialogRef: MatDialogRef<ToggleDemoDialogComponent>,
    private organizationService: OrganizationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  setDemo() {
    if (this.orgUuidCtrl.valid) {
      this.setting = true;
      this.organizationService
        .setDemoTag(this.orgUuidCtrl.value, { demo: this.demoCtrl.value })
        .pipe(finalize(() => (this.setting = false)))
        .subscribe(
          _ => {
            this.toastService.success('Set demo successfully');
            this.dialogRef.close();
          },
          err => this.toastService.error(err)
        );
    }
  }
}
