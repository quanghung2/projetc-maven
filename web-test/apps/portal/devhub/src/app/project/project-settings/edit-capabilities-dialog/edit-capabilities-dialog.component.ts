import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateProjectReq, Project, ProjectService } from '@b3networks/api/flow';
import { LicenseFeatureCode, LicenseService } from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-edit-capabilities-dialog',
  templateUrl: './edit-capabilities-dialog.component.html',
  styleUrls: ['./edit-capabilities-dialog.component.scss']
})
export class EditCapabilitiesDialogComponent implements OnInit {
  updating: boolean;
  capabilitiesCtrl = new UntypedFormControl([], Validators.required);
  allowTypeMessage: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private project: Project,
    private dialogRef: MatDialogRef<EditCapabilitiesDialogComponent>,
    private projectService: ProjectService,
    private licenseService: LicenseService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.capabilitiesCtrl.setValue(this.project.capabilities);

    this.licenseService
      .getLicenseFilterByFeature(LicenseFeatureCode.developer, LicenseFeatureCode.license_sms_campaign)
      .subscribe(licenses => {
        this.allowTypeMessage = licenses.map(lc => lc.subscriptionUuid).includes(this.project.subscriptionUuid);
      });
  }

  update() {
    if (this.capabilitiesCtrl.valid) {
      this.updating = true;
      this.projectService
        .updateProject(this.project.uuid, <CreateProjectReq>{
          name: this.project.name,
          subUuid: this.project.subscriptionUuid,
          capabilities: this.capabilitiesCtrl.value
        })
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          _ => {
            this.toastService.success('Capabilities has been updated');
            this.dialogRef.close(true);
          },
          error => {
            this.toastService.error(error.message);
          }
        );
    }
  }
}
