import { SelectionModel } from '@angular/cdk/collections';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ParamForMapping, SkuMapping, SupplierService } from '@b3networks/api/supplier';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, startWith } from 'rxjs/operators';

@Component({
  selector: 'b3n-mapping-reference',
  templateUrl: './mapping-reference.component.html',
  styleUrls: ['./mapping-reference.component.scss']
})
export class MappingReferenceComponent implements OnInit {
  @Input() supplierUuid: string;
  @Input() param: ParamForMapping;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  filterCtrl: UntypedFormControl;
  filteredItems: MatTableDataSource<SkuMapping>;
  selection: SelectionModel<SkuMapping>;

  updating: boolean;
  addSkus: string[] = [];
  removeSkus: string[] = [];
  displayColumns = ['select', 'sku', 'name', 'isReference'];
  haveChanged: boolean;

  constructor(private supplierService: SupplierService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.filterCtrl = new UntypedFormControl();
    this.filterCtrl.valueChanges.pipe(startWith('')).subscribe(val => {
      this.filteredItems = new MatTableDataSource(
        this.param.items.filter(i => i.name.toLowerCase().indexOf(val) >= 0 || i.sku.toLowerCase().indexOf(val) >= 0)
      );
      setTimeout(() => {
        this.filteredItems.paginator = this.paginator;
      });
    });
    this.selection = new SelectionModel<SkuMapping>(
      true,
      this.param.items.filter(i => i.isReference)
    );
    this.selection.changed.subscribe(_ => {
      this.addSkus = this.selection.selected.filter(i => i.isReference == false).map(s => s.sku);
      this.removeSkus = this.param.items
        .filter(i => i.isReference == true && !this.selection.selected.map(s => s.sku).includes(i.sku))
        .map(s => s.sku);

      if (this.addSkus.length == 0 && this.removeSkus.length == 0) {
        this.haveChanged = false;
      } else {
        this.haveChanged = true;
      }
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredItems.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.filteredItems.data.forEach(row => this.selection.select(row));
  }

  submit() {
    this.updating = true;
    this.supplierService
      .updateMappingReference({
        supplierUuid: this.supplierUuid,
        addSkus: this.addSkus,
        removeSkus: this.removeSkus
      })
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.addSkus.forEach(sku => {
            const item = this.param.items.find(i => i.sku == sku);
            item.isReference = true;
          });
          this.removeSkus.forEach(sku => {
            const item = this.param.items.find(i => i.sku == sku);
            item.isReference = false;
          });
          this.addSkus.length = 0;
          this.removeSkus.length = 0;
          this.haveChanged = false;
          this.toastService.success('Update successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
