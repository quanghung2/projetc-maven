import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SkuMapping, SkuMappingService } from '@b3networks/api/supplier';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-delete-sku-mapping',
  templateUrl: './delete-sku-mapping.component.html',
  styleUrls: ['./delete-sku-mapping.component.scss']
})
export class DeleteSkuMappingComponent implements OnInit {
  skuMapping: SkuMapping;
  deleting = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SkuMapping,
    private skuMappingService: SkuMappingService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<DeleteSkuMappingComponent>,
    private toastService: ToastService
  ) {
    this.skuMapping = data;
  }

  ngOnInit(): void {}

  deleteSkuMapping() {
    this.deleting = true;
    this.skuMappingService
      .deleteSkuMapping(this.skuMapping.id)
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
