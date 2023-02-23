import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Order } from '@b3networks/api/license';

export declare type ApproveOrderType = 'approve' | 'reject';

export interface ApproveOrderInput {
  order: Order;
  type: ApproveOrderType;
}

@Component({
  selector: 'b3n-approve-order',
  templateUrl: './approve-order.component.html',
  styleUrls: ['./approve-order.component.scss']
})
export class ApproveOrderComponent implements OnInit {
  order: Order;
  type: ApproveOrderType;

  ctaTitle: string;
  ctaButton: string;

  remark = new UntypedFormControl('');

  constructor(
    @Inject(MAT_DIALOG_DATA) data: ApproveOrderInput,
    private dialogRef: MatDialogRef<ApproveOrderComponent>
  ) {
    this.order = data.order;
    this.type = data.type;
    if (this.type === 'approve') {
      this.ctaTitle = 'Approve order';
      this.ctaButton = 'Approve';
    } else {
      this.ctaTitle = 'Reject order';
      this.ctaButton = 'Reject';
    }
  }

  ngOnInit(): void {}

  confirm() {
    this.dialogRef.close({ remark: this.remark.value });
  }
}
