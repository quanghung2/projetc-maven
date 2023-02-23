import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATCHING, Peer, Record, RoutingService, Table } from '@b3networks/api/edgeserver';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface ProprietaryModalInput {
  recordData: Record;
  cluster: string;
  peers: Peer[];
  tables: Table[];
  tableName: string;
}

@Component({
  selector: 'b3n-proprietary-modal',
  templateUrl: './proprietary-modal.component.html',
  styleUrls: ['./proprietary-modal.component.scss']
})
export class ProprietaryModalComponent implements OnInit {
  readonly matchings: KeyValue<MATCHING, string>[] = [
    { key: MATCHING.lpm, value: 'Longest prefix matching' },
    { key: MATCHING.em, value: 'Exactly matching' },
    { key: MATCHING.eq, value: 'Equal' },
    { key: MATCHING.ne, value: 'Not equal' },
    { key: MATCHING.gt, value: 'Greater than' },
    { key: MATCHING.lt, value: 'Less than' },
    { key: MATCHING.ge, value: 'Greater than or equal' },
    { key: MATCHING.le, value: 'Less than or equal' }
  ];

  formRecord: UntypedFormGroup;
  submitting: boolean;

  get value(): UntypedFormControl {
    return this.formRecord.get('value') as UntypedFormControl;
  }

  get matching(): UntypedFormControl {
    return this.formRecord.get('matching') as UntypedFormControl;
  }

  get action(): UntypedFormControl {
    return this.formRecord.get('action') as UntypedFormControl;
  }

  get primary(): UntypedFormControl {
    return this.formRecord.get('routes.primary') as UntypedFormControl;
  }

  get secondary(): UntypedFormControl {
    return this.formRecord.get('routes.secondary') as UntypedFormControl;
  }

  get load(): UntypedFormControl {
    return this.formRecord.get('routes.load') as UntypedFormControl;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputData: ProprietaryModalInput,
    private dialogRef: MatDialogRef<ProprietaryModalComponent>,
    private fb: UntypedFormBuilder,
    private routingService: RoutingService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formRecord = this.fb.group({
      matching: ['lpm'],
      value: ['DEFAULT_ROUTE_ENTRY', Validators.required],
      action: ['route'],
      routes: this.fb.group({
        primary: ['', Validators.required],
        secondary: ['', Validators.required],
        load: [null, Validators.compose([Validators.required, Validators.min(0), Validators.max(100)])]
      })
    });

    if (this.inputData.recordData) {
      const data = this.inputData.recordData;
      this.formRecord.patchValue({
        matching: data.matching,
        value: data.value,
        action: data.action
      });
      this.value.disable();
      this.matching.disable();
      this.changeAction(data.action);
    }

    this.action.valueChanges.subscribe(val => {
      this.changeAction(val);
    });
  }

  private changeAction(action: 'route' | 'refer' | 'block') {
    if (action === 'block') {
      this.formRecord.removeControl('routes');
    } else {
      this.formRecord.addControl(
        'routes',
        this.fb.group({
          primary: ['', Validators.required],
          secondary: ['', Validators.required],
          load: [null, Validators.compose([Validators.required, Validators.min(0), Validators.max(100)])]
        })
      );
    }
  }

  onSave() {
    if (this.formRecord.valid) {
      if (this.inputData.recordData) {
        this.submitting = true;
        this.routingService
          .updateRecordRouting(this.inputData.cluster, this.inputData.tableName, this.formRecord.getRawValue())
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe(
            res => {
              this.toastService.success('Update record successfully');
              this.dialogRef.close(true);
            },
            err => this.toastService.error('Update record failed')
          );
      } else {
        this.submitting = true;
        this.routingService
          .createRecordRouting(this.inputData.cluster, this.inputData.tableName, this.formRecord.value)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe(
            res => {
              this.toastService.success('Create record successfully');
              this.dialogRef.close(true);
            },
            err => this.toastService.error('Create record failed')
          );
      }
    }
  }
}
