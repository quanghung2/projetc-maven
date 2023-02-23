import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SkuSalemodelService } from '@b3networks/api/salemodel';
import { CreateProductSku, SkuService } from '@b3networks/api/store';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface CreateProductSkuInput {
  productId: string;
  skuUuid: string;
}
@Component({
  selector: 'b3n-create-sku',
  templateUrl: './create-sku.component.html',
  styleUrls: ['./create-sku.component.scss']
})
export class CreateProductSkuComponent extends DestroySubscriberComponent implements OnInit {
  newSku: CreateProductSku;
  loading = false;
  skuName: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public sku: CreateProductSkuInput,
    public dialogRef: MatDialogRef<CreateProductSkuComponent>,
    private skuService: SkuService,
    private skuSalemodelService: SkuSalemodelService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {}

  createSku() {
    this.loading = true;
    this.newSku = {
      name: this.skuName,
      sku: this.sku.skuUuid,
      isPrimary: true,
      status: 'PUBLISHED',
      order: 1
    };
    this.skuService.createProductSku(this.newSku, this.sku.productId).subscribe(
      res => {
        this.createSkuSaleModel();
      },
      err => {
        this.loading = false;
        this.toastService.error(err.error);
      }
    );
  }

  createSkuSaleModel() {
    this.skuSalemodelService
      .createProductSkuSaleModel(this.sku.productId, this.newSku.sku)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        res => {
          this.dialogRef.close(true);
        },
        err => {
          this.toastService.error(err.error);
        }
      );
  }
}
