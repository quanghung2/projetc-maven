import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SellerRoutingService } from '@b3networks/api/supplier';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { SellerRouting } from 'libs/api/supplier/src/lib/seller-routing/seller-routing.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-delete-seller-routing',
  templateUrl: './delete-seller-routing.component.html',
  styleUrls: ['./delete-seller-routing.component.scss']
})
export class DeleteSellerRoutingComponent implements OnInit {
  sellerRouting: SellerRouting;
  deleting = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SellerRouting,
    private sellerRoutingService: SellerRoutingService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<DeleteSellerRoutingComponent>,
    private toastService: ToastService
  ) {
    this.sellerRouting = data;
  }

  ngOnInit(): void {}

  deleteSellerRouting() {
    this.deleting = true;
    this.sellerRoutingService
      .deleteSellerRouting(this.sellerRouting)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe(
        res => {
          this.dialogRef.close(true);
          this.toastService.success(' Delete successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
