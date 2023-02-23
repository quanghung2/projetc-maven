import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent, MatChipList } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CpService, MonitorSetting, SettingHealthCheck } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-setting-dialog',
  templateUrl: './setting-dialog.component.html',
  styleUrls: ['./setting-dialog.component.scss']
})
export class SettingDialogComponent implements OnInit {
  @ViewChild('chipTagList') chipTagList: MatChipList;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  // readonly typeMonitor = ['marathon', 'elastalert'];

  typeCtrl = new FormControl('marathon');
  formSetting: FormGroup;
  submitting: boolean;

  get name() {
    return this.formSetting.get('name');
  }
  getErrorName = () => (this.formSetting.get('name').hasError('required') ? 'Name is required' : '');

  get tags() {
    return this.formSetting.get('metadata.tags');
  }

  get monitor(): FormArray {
    return this.formSetting.get('monitor') as FormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SettingHealthCheck,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SettingDialogComponent>,
    private cpService: CpService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.formSetting = this.fb.group({
        id: [this.data.id],
        metadata: this.fb.group({
          tags: [this.data.metadata.tags, Validators.required]
        }),
        monitor: this.formEditMonitor(this.data.monitor),
        name: [this.data.name, Validators.required]
      });
    } else {
      this.formSetting = this.fb.group({
        id: [''],
        metadata: this.fb.group({
          tags: [[], Validators.required]
        }),
        monitor: this.fb.array([], Validators.required),
        name: ['', Validators.required]
      });
    }

    this.tags.statusChanges.subscribe(status => (this.chipTagList.errorState = status === 'INVALID'));
  }

  addTag(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.tags.value.push(value);
    }

    if (input) {
      input.value = '';
    }
  }

  removeTag(tag: string) {
    const index = this.tags.value.indexOf(tag);
    if (index >= 0) {
      this.tags.value.splice(index, 1);
    }
  }

  addMonitor(type: 'marathon' | 'elastalert') {
    this.monitor.push(this.createFormMonitor(type));
  }

  removeMonitor(index: number) {
    this.monitor.removeAt(index);
  }

  private createFormMonitor(type: 'marathon' | 'elastalert'): FormGroup {
    switch (type) {
      case 'marathon':
        return this.fb.group({
          name: ['', Validators.required],
          object: this.fb.group({
            id: ['', Validators.required]
          }),
          rule: this.fb.group({
            interval: ['', Validators.required],
            retries: ['', Validators.required],
            timeout: ['', Validators.required]
          }),
          type: ['marathon']
        });
      case 'elastalert':
        return this.fb.group({
          name: ['', Validators.required],
          object: this.fb.group({
            indice_pattern: [[], Validators.required],
            query: ['', Validators.required],
            timeframe: ['', Validators.required]
          }),
          rule: this.fb.group({
            interval: ['', Validators.required],
            num_events: ['', Validators.required]
          }),
          type: ['elastalert']
        });
    }
  }

  private formEditMonitor(settings: MonitorSetting[]): FormArray {
    const formArray = this.fb.array([], Validators.required);
    settings.forEach(setting => {
      switch (setting.type) {
        case 'marathon':
          formArray.push(
            this.fb.group({
              name: [setting.name, Validators.required],
              object: this.fb.group({
                id: [setting.object.id, Validators.required]
              }),
              rule: this.fb.group({
                interval: [setting.rule.interval, Validators.required],
                retries: [setting.rule.retries, Validators.required],
                timeout: [setting.rule.timeout, Validators.required]
              }),
              type: [setting.type]
            })
          );
          break;
        case 'elastalert':
          formArray.push(
            this.fb.group({
              name: [setting.name, Validators.required],
              object: this.fb.group({
                indice_pattern: [setting.object.indice_pattern, Validators.required],
                query: [setting.object.query, Validators.required],
                timeframe: [setting.object.timeframe, Validators.required]
              }),
              rule: this.fb.group({
                interval: [setting.rule.interval, Validators.required],
                num_events: [setting.rule.num_events, Validators.required]
              }),
              type: [setting.type]
            })
          );
          break;
      }
    });
    return formArray;
  }

  addPattern(form: FormGroup, event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      form.get('object.indice_pattern').value.push(value);
    }

    if (input) {
      input.value = '';
    }
  }

  removePattern(form: FormGroup, pattern: string) {
    const index = form.get('object.indice_pattern').value.indexOf(pattern);
    if (index >= 0) {
      form.get('object.indice_pattern').value.splice(index, 1);
    }
  }

  submit() {
    if (this.formSetting.valid) {
      this.submitting = true;
      this.cpService
        .setSetting(this.formSetting.value)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe(
          res => {
            this.toastService.success('Save setting success');
            this.dialogRef.close(res);
          },
          err => this.toastService.error(err.message)
        );
    }
  }
}
