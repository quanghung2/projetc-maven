import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GenieService, OpenDialogFillParamsReq, Param } from '@b3networks/api/infra';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-fill-params-dialog',
  templateUrl: './fill-params-dialog.component.html',
  styleUrls: ['./fill-params-dialog.component.scss']
})
export class FillParamsDialogComponent implements OnInit {
  formParams: UntypedFormGroup;
  calling: boolean;
  filterInput: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: OpenDialogFillParamsReq,
    private dialogRef: MatDialogRef<FillParamsDialogComponent>,
    private genieService: GenieService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formParams = new UntypedFormGroup({});
    this.filterInput = new Array(this.data.params.length);
    this.data.params.forEach(p => {
      if (p.type === 'select') {
        p.filteredOptions = p.options.slice();
      }
      this.formParams.addControl(p.name, new UntypedFormControl('', Validators.required));
    });
  }

  execute() {
    if (this.formParams.valid) {
      this.calling = true;
      this.genieService
        .execute({ flow: this.data.flow, category: this.data.category, input: this.formParams.value })
        .pipe(finalize(() => (this.calling = false)))
        .subscribe(
          res => {
            if (res.md) {
              this.dialogRef.close(res);
            } else {
              this.toastService.success('Execute success');
            }
          },
          err => {
            if (err.code && err.params) {
              err.params.forEach(p => {
                if (p.type === 'select') {
                  p.filteredOptions = p.options.slice();
                }
                this.formParams.addControl(p.name, new UntypedFormControl('', Validators.required));
              });
              this.data.params = this.data.params.concat(err.params);
            } else {
              this.toastService.error(err);
            }
          }
        );
    }
  }

  filterOptions(e, p: Param) {
    p.filteredOptions = p.options.filter(f => f.toLowerCase().indexOf(e.toLowerCase()) >= 0);
  }
}
