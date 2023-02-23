import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProfileOrg } from '@b3networks/api/auth';
import { BodyRequestTestCallFlow, RuleType, Workflow, WorkflowService } from '@b3networks/api/ivr';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-test-call-before-deploy-to-production',
  templateUrl: './test-call-before-deploy-to-production.component.html',
  styleUrls: ['./test-call-before-deploy-to-production.component.scss']
})
export class TestCallBeforeDeployToProductionComponent implements OnInit {
  readonly officeHourTypes: KeyValue<RuleType, string>[] = [
    { key: RuleType.officeHour, value: `Office hours` },
    { key: RuleType.afterOfficeHour, value: `After office hours` },
    { key: RuleType.publicHoliday, value: `Public holiday` }
  ];
  selectedType: RuleType = RuleType.officeHour;
  workflow: Workflow;
  number: string;
  user: ProfileOrg;
  progressing: boolean;
  numbers: string[] = [];
  selectedNumber: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private workflowService: WorkflowService,
    private spinner: LoadingSpinnerSerivce,
    private dialogRef: MatDialogRef<TestCallBeforeDeployToProductionComponent>,
    private toastService: ToastService
  ) {
    this.workflow = data.workflow;
    this.user = data.user;
    this.numbers = data.numbers;
  }

  ngOnInit() {
    this.selectedNumber = this.numbers[0];
  }

  assignNumberToTestCall() {
    this.spinner.showSpinner();
    this.progressing = true;
    const bodyRequest = new BodyRequestTestCallFlow();
    bodyRequest.callerId = this.selectedNumber;
    bodyRequest.dialingNumber = this.number;
    bodyRequest.domain = this.user.domain;
    bodyRequest.orgUuid = this.user.orgUuid;
    this.workflowService
      .testCall(this.workflow.uuid, this.selectedType, bodyRequest)
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
          this.progressing = true;
        })
      )
      .subscribe(
        result => {
          this.dialogRef.close();
          this.toastService.success(`Called to ${this.number} succcessfully!`);
        },
        error1 => this.toastService.error(error1.message || `Cannot call to ${this.number}. Please try again later!`)
      );
  }
}
