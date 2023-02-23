import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChronosService, JobConfig } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-store-cronjob',
  templateUrl: './store-cronjob.component.html',
  styleUrls: ['./store-cronjob.component.scss']
})
export class StoreCronjobComponent implements OnInit {
  get category() {
    if (this.ele instanceof Object) {
      return this.ele.category;
    } else {
      return this.ele;
    }
  }

  get name() {
    return this.formJob.get('name');
  }

  // typeCtrl = new FormControl('standalone');
  checkedElementIsObject: boolean;
  checked = true;
  formJob: UntypedFormGroup;
  submitting: boolean;
  selected: string;

  constructor(
    private toastService: ToastService,
    private chronosService: ChronosService,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<StoreCronjobComponent>,
    @Inject(MAT_DIALOG_DATA) public ele
  ) {}

  ngOnInit(): void {
    this.checkedElementIsObject = this.ele instanceof Object;
    if (this.checkedElementIsObject) {
      this.formJob = this.fb.group({
        name: [this.ele.name, Validators.required],
        firstRun: [this.ele.firstRun, Validators.required],
        command: [this.ele.command, Validators.required],
        uris: this.ele.uris[0],
        params: this.ele.params,
        environmentVariables: this.fb.array([]),
        epsilon: [this.ele.epsilon, Validators.required],
        interval: [this.ele.duration.substring(0, this.ele.duration.length - 1), Validators.required],
        time: [this.ele.duration.slice(-1), Validators.required]
      });
      this.formJob.controls['environmentVariables']['controls'] = [];
      this.ele.environmentVariables.forEach(x => {
        const variableForm = this.fb.group({
          name: [x.name],
          value: [x.value]
        });
        this.formJob.controls['environmentVariables']['controls'].push(variableForm);
      });
    } else {
      this.formJob = this.fb.group({
        name: ['default_job_name', Validators.required],
        firstRun: ['', Validators.required],
        command: ['echo', Validators.required],
        uris: [''],
        params: 'hello cron job',
        environmentVariables: this.fb.array([]),
        epsilon: ['30m', Validators.required],
        interval: ['24', Validators.required],
        time: ['h', Validators.required]
      });
    }
  }

  addVariable() {
    const variableForm = this.fb.group({
      name: '',
      value: ''
    });
    (this.formJob.get('environmentVariables') as UntypedFormArray).push(variableForm);
  }

  get variables(): UntypedFormArray {
    return this.formJob.controls['environmentVariables'] as UntypedFormArray;
  }

  deleteVariable(index: number) {
    this.variables.removeAt(index);
  }

  editJobs() {
    if (this.formJob.valid) {
      this.submitting = true;
      const body = {
        name: this.name.value,
        environmentVariables: this.formJob.value.environmentVariables,
        epsilon: this.formJob.value.epsilon,
        firstRun: this.formJob.value.firstRun,
        params: this.formJob.value.params,
        command: this.formJob.value.command,
        duration: this.formJob.value.interval + this.formJob.value.time,
        uris: [this.formJob.value.uris],
        parents: []
      } as JobConfig;
      this.chronosService
        .createJob(this.category, this.name.value, body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe(
          res => {
            this.toastService.success('Save Job Success');
            this.dialogRef.close(res);
          },
          err => this.toastService.error(err.message)
        );
    }
  }

  updateJob() {
    if (this.formJob.valid) {
      this.submitting = true;
      const body = {
        name: this.name.value,
        uris: [this.formJob.value.uris],
        environmentVariables: this.formJob.value.environmentVariables,
        epsilon: this.formJob.value.epsilon,
        firstRun: this.formJob.value.firstRun,
        params: this.formJob.value.params,
        command: this.formJob.value.command,
        duration: this.formJob.value.interval + this.formJob.value.time,
        parents: []
      } as JobConfig;
      this.chronosService
        .setJob(this.category, this.name.value, body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe(
          res => {
            this.toastService.success('Save Job Success');
            this.dialogRef.close(res);
          },
          err => this.toastService.error(err.message)
        );
    }
  }

  changeValue() {
    this.checked = !this.checked;
  }

  submit() {
    if (this.checkedElementIsObject) {
      this.updateJob();
    } else {
      this.editJobs();
    }
  }

  convertSpace() {
    setTimeout(() => {
      const text = this.name.value?.trim();
      this.name.setValue(`${text}-`);
    });
  }
}
