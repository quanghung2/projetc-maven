import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PublicAccessService } from '@b3networks/api/dashboard';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

interface PinPromtInput {
  ref: string;
  pin: string;
}

@Component({
  selector: 'b3n-pin-promt',
  templateUrl: './pin-promt.component.html',
  styleUrls: ['./pin-promt.component.scss']
})
export class PinPromtComponent implements OnInit {
  ref: string;
  password: string;

  progressing: boolean;

  constructor(
    private dialogRef: MatDialogRef<PinPromtComponent>,
    private publicAccessService: PublicAccessService,
    @Inject(MAT_DIALOG_DATA) data: PinPromtInput,
    private toastr: ToastService
  ) {
    this.ref = data.ref;
    this.password = data.pin;

    if (!!this.password) {
      this.progress();
    }
  }

  ngOnInit() {}

  progress() {
    this.progressing = true;
    console.log(`progressing`);

    this.publicAccessService
      .authenticate(this.ref, this.password)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        data => {
          this.dialogRef.close(data);
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }
}
