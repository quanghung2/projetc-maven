import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrgConfig, OrgConfigService } from '@b3networks/api/callcenter';
import { MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-agent-configuration',
  templateUrl: './update-agent-configuration.component.html',
  styleUrls: ['./update-agent-configuration.component.scss']
})
export class UpdateAgentConfigurationComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  agentSLAThreshold = new UntypedFormControl('', Validators.required);
  saving: boolean;
  numbersSlaThreshold = [5, 10, 15, 20, 25, 30];

  constructor(
    @Inject(MAT_DIALOG_DATA) private orgConfig: OrgConfig,
    private dialogRef: MatDialogRef<UpdateAgentConfigurationComponent>,
    private orgConfigService: OrgConfigService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.agentSLAThreshold.setValue(this.orgConfig?.thresholdConfig?.agentSLAThreshold || this.numbersSlaThreshold[1]);
  }

  saveAgentConfiguration() {
    if (this.agentSLAThreshold.valid) {
      this.saving = true;

      const agentSLAThreshold = this.agentSLAThreshold.value;

      this.orgConfigService
        .updateConfig({ thresholdConfig: { agentSLAThreshold: agentSLAThreshold } })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe(
          _ => {
            this.toastr.success('Agent configuration has been updated');
            this.dialogRef.close();
          },
          err => {
            this.toastr.error(err.message);
          }
        );
    }
  }
}
