import { Component, Inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User, UserService, WorkflowService, WorkflowVersion } from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import isAfter from 'date-fns/isAfter';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-deploy-schedule',
  templateUrl: './deploy-schedule.component.html',
  styleUrls: ['./deploy-schedule.component.scss']
})
export class DeployScheduleComponent implements OnInit {
  checked: boolean;
  deploymentTime: string;
  backupData: string;
  user: User;
  workflowVersion: WorkflowVersion;
  progressing: boolean;
  scheduledAt: Date;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DeployScheduleComponent>,
    private userService: UserService,
    private workflowService: WorkflowService,
    private toastService: ToastService
  ) {
    this.workflowVersion = data.workflowVersion;
  }

  ngOnInit() {
    this.userService.fetchUser().subscribe(user => {
      this.user = user;

      if (isAfter(new Date(this.workflowVersion.scheduledAt), new Date())) {
        this.scheduledAt = new Date(utcToZonedTime(new Date(this.workflowVersion.scheduledAt), this.user.utcOffset));
      } else {
        this.scheduledAt = null;
      }
    });
  }

  filterDate = (d: any): boolean => {
    return d > new Date();
  };

  checkboxChange($event: MatCheckboxChange) {
    this.checked = $event.checked;
    if (this.checked) {
      this.deploymentTime = format(utcToZonedTime(new Date(), this.user.timezone), "yyyy-MM-dd'T'HH:mm:ssxxx");
    } else {
      this.deploymentTime = this.backupData ? this.backupData : undefined;
    }
  }

  dataChange(event) {
    this.deploymentTime = format(
      zonedTimeToUtc(new Date(event.value), this.user.utcOffset),
      "yyyy-MM-dd'T'HH:mm:ssxxx"
    );
    this.backupData = this.deploymentTime;
  }

  scheduleWorkflowVersion() {
    this.progressing = true;
    const deployTime = Number(new Date(this.deploymentTime));
    this.workflowService
      .approveScheduleVersion(
        { ...this.data.workflowVersion, scheduleAt: this.scheduledAt },
        this.workflowVersion.releaseNote,
        this.checked ? undefined : deployTime
      )
      .pipe(
        finalize(() => {
          this.progressing = false;
        })
      )
      .subscribe(
        workflowVersion => {
          if (workflowVersion && workflowVersion instanceof WorkflowVersion) {
            this.toastService.success(this.checked ? `Published successfully!` : `Scheduled successfully!`);
            this.dialogRef.close(workflowVersion);
          }
        },
        error1 => this.toastService.error(error1.message)
      );
  }
}
