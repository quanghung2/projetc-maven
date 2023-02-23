import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlacklistService } from 'libs/api/ivr/src/lib/blacklist/blacklist.service';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-add-block-number',
  templateUrl: './add-block-number.component.html',
  styleUrls: ['./add-block-number.component.scss']
})
export class AddBlockNumberComponent implements OnInit {
  blockNumber: string;
  progressing: boolean;
  blockAnonymous: boolean = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private blacklistService: BlacklistService,
    private dialogRef: MatDialogRef<AddBlockNumberComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  add() {
    if (this.blockAnonymous) {
      this.blockNumber = 'anonymous';
    }
    this.progressing = true;
    const flowUuid = this.data.uuid;
    this.blacklistService
      .addBlockNumber(flowUuid, this.blockNumber)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        result => {
          if (result) {
            this.toastService.success('Added number successfully!');
            this.dialogRef.close(result);
          } else {
            this.toastService.error('Invalid number. Please try again with the valid number.');
          }
        },
        err => this.toastService.error('Cannot add number. Please try again later!')
      );
  }
}
