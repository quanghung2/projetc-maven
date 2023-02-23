import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrgConfig, OrgConfigService } from '@b3networks/api/callcenter';
import { MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-pickup-prefix',
  templateUrl: './update-pickup-prefix.component.html',
  styleUrls: ['./update-pickup-prefix.component.scss']
})
export class UpdatePickupPrefixComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  pickupPrefixCtrl = new UntypedFormControl('', [Validators.required, Validators.maxLength(2)]);
  saving: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private orgConfig: OrgConfig,
    private dialogRef: MatDialogRef<UpdatePickupPrefixComponent>,
    private orgConfigService: OrgConfigService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.pickupPrefixCtrl.setValue(this.orgConfig.pickupPrefix.substring(1));
  }

  savePrefix() {
    if (this.pickupPrefixCtrl.valid) {
      this.saving = true;

      const pickupPrefix = '*' + this.pickupPrefixCtrl.value;

      this.orgConfigService
        .updateConfig({ pickupPrefix })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe(
          _ => {
            this.toastr.success('Pickup prefix has been updated');
            this.dialogRef.close(pickupPrefix);
          },
          err => {
            this.toastr.error(err.message);
          }
        );
    }
  }
}
