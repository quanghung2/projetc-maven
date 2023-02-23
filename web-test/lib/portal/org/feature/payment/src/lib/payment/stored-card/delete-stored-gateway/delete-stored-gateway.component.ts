import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '@b3networks/api/payment';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'pop-delete-stored-gateway',
  templateUrl: './delete-stored-gateway.component.html',
  styleUrls: ['./delete-stored-gateway.component.scss']
})
export class DeleteStoredGatewayComponent implements OnInit {
  isLasted: boolean;
  isDefault: boolean;
  gateWayName: string;
  error: string;
  isLoading: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<DeleteStoredGatewayComponent>,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.isLasted = this.data.isLasted;
    this.isDefault = this.data.defaultGatewayName === this.data.gateWaysName;
    this.gateWayName = this.data.gateWaysName;
  }

  close() {
    this.dialogRef.close();
  }

  onRemoveDefault() {
    this.isLoading = true;
    this.paymentService
      .removeCards(this.gateWayName)
      .pipe(
        catchError(error => {
          this.error =
            'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.';
          return error;
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(res => {
        this.dialogRef.close(this.gateWayName);
      });
  }
}
