import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  CallbackConfig,
  CallflowConfig,
  DialPlan,
  DialPlanAction,
  DialPlanMatcher,
  QueueConfig,
  QueueInfo,
  QueueService
} from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-dial-plans-configuration',
  templateUrl: './dial-plans-configuration.component.html',
  styleUrls: ['./dial-plans-configuration.component.scss']
})
export class DialPlansConfigurationComponent implements OnInit {
  readonly displayedColumns: string[] = ['matching', 'replacement', 'actions'];
  pageSizeOptions: number[] = [5, 10, 25, 100];

  startWiths: string;
  withLengths: string;
  appendPrefix: string;
  numOfDigitRemoved: number;

  queueConfig: QueueConfig;
  dialPlans: DialPlan[];
  dialPlanDataSource: MatTableDataSource<DialPlan>;

  canUpdate: boolean;
  progressing: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(NgForm) form: NgForm;

  constructor(
    @Inject(MAT_DIALOG_DATA) public queue: QueueInfo,
    private queueService: QueueService,
    private toastService: ToastService,
    private spinner: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<DialPlansConfigurationComponent>
  ) {}

  ngOnInit() {
    this.spinner.showSpinner();
    this.queueService
      .getQueueConfig(this.queue.uuid)
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        config => {
          this.queueConfig = config;
          if (this.queueConfig.callflowConfig && this.queueConfig.callflowConfig.callbackConfig) {
            this.dialPlans = this.queueConfig.callflowConfig.callbackConfig.dialPlanList || [];
          }

          if (this.dialPlans) {
            this.dialPlanDataSource = new MatTableDataSource();
            this.dialPlanDataSource.data = this.dialPlans;
            this.dialPlanDataSource.paginator = this.paginator;
          }
        },
        error => {
          this.toastService.error(error.message);
          this.dialogRef.close();
        }
      );
  }

  resetForm() {
    this.startWiths = null;
    this.withLengths = null;
    this.appendPrefix = null;
    this.numOfDigitRemoved = null;
    this.form.form.markAsPristine();
    this.form.form.markAsUntouched();
  }

  addDialPlan() {
    this.dialPlans = this.dialPlans || [];
    const dialPlan = new DialPlan();

    const startWiths = this.startWiths.split(',').map(t => t.trim());
    const withLengths = this.withLengths.split(',').map(t => +t.trim());

    dialPlan.action = DialPlanAction.buildFrom(this.appendPrefix, this.numOfDigitRemoved);
    dialPlan.matcher = DialPlanMatcher.buildFrom(startWiths, withLengths);
    this.dialPlans.unshift(dialPlan);
    this.dialPlanDataSource.data = this.dialPlans;
    this.resetForm();
    this.canUpdate = true;
  }

  removeDialPlan(dialPlan: DialPlan) {
    const index = this.dialPlans.indexOf(dialPlan);

    if (index >= 0) {
      this.dialPlans.splice(index, 1);
      this.dialPlanDataSource.data = this.dialPlans;
      this.canUpdate = true;
    }
  }

  update() {
    this.progressing = true;
    this.queueConfig.callflowConfig.callbackConfig.dialPlanList = this.dialPlans;
    const config = {
      callflowConfig: {
        callbackConfig: {
          dialPlanList: this.dialPlans
        } as CallbackConfig
      } as CallflowConfig
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.queue.uuid, config)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        config => {
          this.toastService.success(`Update dial plan successfully. This update will take effect after 5 minutes.`);
          this.dialogRef.close(config);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
