import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CpService } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-create-server-dialog',
  templateUrl: './create-server-dialog.component.html',
  styleUrls: ['./create-server-dialog.component.scss']
})
export class CreateServerDialogComponent implements OnInit {
  readonly patternIp =
    '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)((\\/([0-9]|[1-2][0-9]|[1-3][0-2]))|$)$';
  formCreate: UntypedFormGroup;
  showSupplier: boolean;
  creating: boolean;

  get domain(): UntypedFormControl {
    return this.formCreate.get('domain') as UntypedFormControl;
  }
  getErrorDomain() {
    return this.domain.hasError('required') ? 'Domain is required' : '';
  }

  get cluster(): UntypedFormControl {
    return this.formCreate.get('cluster') as UntypedFormControl;
  }
  getErrorCluster() {
    return this.cluster.hasError('required') ? 'Cluster is required' : '';
  }

  get version(): UntypedFormControl {
    return this.formCreate.get('version') as UntypedFormControl;
  }
  getErrorVersion() {
    return this.version.hasError('required') ? 'Version is required' : '';
  }

  get mgntIp(): UntypedFormControl {
    return this.formCreate.get('mgntIp') as UntypedFormControl;
  }
  getErrorMgntIp() {
    if (this.mgntIp.hasError('required')) {
      return 'Management IP is required';
    } else if (this.mgntIp.hasError('pattern')) {
      return 'Management IP is invalid';
    }
    return '';
  }

  get apiPort(): UntypedFormControl {
    return this.formCreate.get('apiPort') as UntypedFormControl;
  }
  getErrorApiPort() {
    return this.apiPort.hasError('required') ? 'Port is required' : '';
  }

  get apiProtocol(): UntypedFormControl {
    return this.formCreate.get('apiProtocol') as UntypedFormControl;
  }
  get apiSecure(): UntypedFormControl {
    return this.formCreate.get('apiSecure') as UntypedFormControl;
  }

  constructor(
    private dialogRef: MatDialogRef<CreateServerDialogComponent>,
    private fb: UntypedFormBuilder,
    private cpService: CpService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formCreate = this.fb.group({
      apiPort: [8443, Validators.required],
      apiProtocol: ['https'],
      apiSecure: [false],
      version: ['1.0', Validators.required],
      cluster: ['', Validators.required],
      domain: ['', Validators.required],
      mgntIp: ['', Validators.compose([Validators.required, Validators.pattern(this.patternIp)])],
      supplierUuid: [''],
      supplierDefaultRoute: [true]
    });

    this.apiProtocol.valueChanges.subscribe(val => {
      if (val == 'http') {
        this.apiSecure.disable();
        this.apiSecure.setValue(false);
      } else {
        this.apiSecure.enable();
      }
    });
  }

  create() {
    if (this.formCreate.valid) {
      this.cpService.createServer(this.formCreate.value).subscribe(
        res => {
          this.toastService.success('Server provisioned');
          this.dialogRef.close(true);
        },
        err => this.toastService.error(err.message)
      );
    }
  }
}
