import { Component, Inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddProductReq, Product, ProductService } from '@b3networks/api/store';
import { finalize } from 'rxjs/operators';

export interface AddProductInput {
  domain: string;
  products: Product[];
}

@Component({
  selector: 'b3n-add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss']
})
export class AddProductModalComponent implements OnInit {
  products: Product[] = [];
  domain: string;
  appChecked: boolean;
  selectedProduct: string[] = [];
  isLoading: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AddProductInput,
    private dialogRef: MatDialogRef<AddProductModalComponent>,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.products = this.data?.products;
    this.domain = this.data?.domain;
  }

  onChangeAppChecked(event: MatCheckboxChange, productId: string) {
    if (event.checked && !this.selectedProduct.includes(productId)) {
      this.selectedProduct.push(productId);
      return;
    }
    this.selectedProduct = this.selectedProduct.filter(item => item !== productId);
  }

  onAddApp() {
    const request: AddProductReq = {
      channelDomain: this.domain,
      productIds: this.selectedProduct
    };
    this.isLoading = true;
    this.productService
      .addProducts(request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        err => {
          this.dialogRef.close({ success: false });
        }
      );
  }
}
