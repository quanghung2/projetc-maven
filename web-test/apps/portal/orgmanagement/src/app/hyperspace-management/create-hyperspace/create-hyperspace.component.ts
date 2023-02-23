import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HyperspaceService, ReqHyperspaceCreate } from '@b3networks/api/workspace';
import { UUID_V4_REGEX, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-create-hyperspace',
  templateUrl: './create-hyperspace.component.html',
  styleUrls: ['./create-hyperspace.component.scss']
})
export class CreateHyperspaceComponent implements OnInit {
  processing: boolean;
  matcher = new MyErrorStateMatcher();

  group: UntypedFormGroup = this.fb.group({
    uuid: ['', [Validators.required, this.checkFormatOrgUuid]]
    // name: ['', [Validators.required]],
    // description: ''
  });

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CreateHyperspaceComponent>,
    private hyperspaceService: HyperspaceService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  submit() {
    if (this.group.invalid) {
      return;
    }
    this.processing = true;
    this.hyperspaceService
      .createHyperspace(
        this.group.get('uuid').value,
        <ReqHyperspaceCreate>{
          // name: this.group.get('name').value,
          // description: this.group.get('description').value
        },
        X.orgUuid
      )
      .subscribe(
        _ => {
          this.dialogRef.close();
          this.toastService.success('Create hyperspace successfully!');
        },
        err => this.toastService.error(err?.message)
      );
  }

  private checkFormatOrgUuid(control: AbstractControl): { [key: string]: any } {
    const value = control.value?.trim() || '';
    if (!value || value === '') {
      return null;
    }
    const rs: RegExpMatchArray = value.match(UUID_V4_REGEX);
    if (!rs) {
      return { invalid: true };
    }
    return null;
  }
}
