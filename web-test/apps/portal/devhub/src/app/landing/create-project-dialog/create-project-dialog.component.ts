import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ProjectService, SimpleAppFlowService, SubscriptionForProject } from '@b3networks/api/flow';
import { License, LicenseFeatureCode, LicenseService } from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-project-dialog',
  templateUrl: './create-project-dialog.component.html',
  styleUrls: ['./create-project-dialog.component.scss']
})
export class CreateProjectDialogComponent implements OnInit {
  formCreateProject: UntypedFormGroup;
  creating: boolean;
  subscriptions: SubscriptionForProject[];
  licenses: License[];
  allowTypeMessage: boolean;

  constructor(
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    private fb: UntypedFormBuilder,
    private projectService: ProjectService,
    private simpleAppFlowService: SimpleAppFlowService,
    private licenseService: LicenseService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.simpleAppFlowService.getSubscriptions().subscribe(subs => {
      this.subscriptions = subs;
    });

    this.licenseService
      .getLicenseFilterByFeature(LicenseFeatureCode.developer, LicenseFeatureCode.license_sms_campaign)
      .subscribe(data => {
        this.licenses = data;
      });

    this.formCreateProject = this.fb.group({
      name: ['', Validators.required],
      capabilities: ['', Validators.required],
      subUuid: ['', Validators.required]
    });

    this.formCreateProject.get('subUuid').valueChanges.subscribe(subUuid => {
      if (subUuid) {
        this.allowTypeMessage = this.licenses.map(lc => lc.subscriptionUuid).includes(subUuid);
      }
    });
  }

  create() {
    if (this.formCreateProject.valid) {
      this.creating = true;
      this.projectService
        .createProject(this.formCreateProject.value)
        .pipe(finalize(() => (this.creating = false)))
        .subscribe(
          project => {
            this.toastService.success(`Project has been created`);
            this.dialogRef.close(project);
          },
          error => {
            this.toastService.error(`${error.message}`);
          }
        );
    }
  }
}
