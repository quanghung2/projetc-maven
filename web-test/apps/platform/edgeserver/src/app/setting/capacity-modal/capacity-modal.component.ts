import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PreConfig, SecurityProfile, SecurityService } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface CapacityModalInput {
  isEdit: boolean;
  security: SecurityProfile;
  securitys: SecurityProfile[];
  preConfig: PreConfig;
  cluster: string;
}

@Component({
  selector: 'b3n-capacity-modal',
  templateUrl: './capacity-modal.component.html',
  styleUrls: ['./capacity-modal.component.scss']
})
export class CapacityModalComponent implements OnInit {
  formGroup: UntypedFormGroup;
  isLoading: boolean;

  capacityModalInput: CapacityModalInput;

  get name() {
    return this.formGroup.get('name');
  }

  get cps() {
    return this.formGroup.get('cps');
  }

  get concurrentCall() {
    return this.formGroup.get('concurrentCall');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CapacityModalInput,
    private fb: UntypedFormBuilder,
    private securityService: SecurityService,
    private dialogRef: MatDialogRef<CapacityModalComponent>
  ) {
    this.capacityModalInput = this.data;
    this.initForm();
  }

  ngOnInit(): void {}

  onSave() {
    if (this.formGroup.invalid) {
      return;
    }

    const request: SecurityProfile = {
      name: this.name.value,
      cps: this.cps.value,
      capacity: this.concurrentCall.value
    };

    if (this.capacityModalInput?.isEdit) {
      this.updateSecurityProfile(request);
      return;
    }
    this.createSecurityProfile(request);
  }

  createSecurityProfile(request: SecurityProfile) {
    this.isLoading = true;
    this.securityService
      .createSecurityProfile(request, this.capacityModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  updateSecurityProfile(request: SecurityProfile) {
    this.isLoading = true;
    this.securityService
      .updateSecurityProfile(request, this.capacityModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  private initForm() {
    const { isEdit, security, preConfig } = this.capacityModalInput;
    if (isEdit) {
      this.formGroup = this.fb.group({
        name: [
          { value: security?.name, disabled: true },
          [
            Validators.required,
            Validators.pattern(preConfig?.pattern?.name),
            this.checkExistsSecurityValidator.bind(this)
          ]
        ],
        cps: [
          security?.cps,
          [
            Validators.required,
            Validators.min(preConfig?.limitation?.cps?.min),
            Validators.max(preConfig?.limitation?.cps?.max)
          ]
        ],
        concurrentCall: [
          security?.capacity,
          [
            Validators.required,
            Validators.min(preConfig?.limitation?.capacity?.min),
            Validators.max(preConfig?.limitation?.capacity?.max)
          ]
        ]
      });
      return;
    }
    this.formGroup = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(preConfig?.pattern?.name),
          this.checkExistsSecurityValidator.bind(this)
        ]
      ],
      cps: [
        '50',
        [
          Validators.required,
          Validators.min(preConfig?.limitation?.cps?.min),
          Validators.max(preConfig?.limitation?.cps?.max)
        ]
      ],
      concurrentCall: [
        '1000',
        [
          Validators.required,
          Validators.min(preConfig?.limitation?.capacity?.min),
          Validators.max(preConfig?.limitation?.capacity?.max)
        ]
      ]
    });
  }

  private checkExistsSecurityValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const { securitys } = this.capacityModalInput;

    let namesCodec = [];
    if (securitys?.length) {
      namesCodec = securitys.map(security => security.name);
    }

    if (namesCodec.indexOf(control.value?.toString()) > -1) {
      return { isExistsSecurity: true };
    }
    return null;
  }
}
