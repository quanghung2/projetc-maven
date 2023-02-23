import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Partner, PartnerService } from '@b3networks/api/partner';
import { Supplier, SupplierService } from '@b3networks/api/supplier';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { clone } from 'lodash';
import { Observable } from 'rxjs';
import { finalize, map, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'b3n-update-supplier',
  templateUrl: './update-supplier.component.html',
  styleUrls: ['./update-supplier.component.scss']
})
export class UpdateSupplierComponent implements OnInit {
  newSupplier = new Supplier();
  ctaActionName = 'Create';
  updating = false;

  partner: Partner;
  partnerNodes: Partner[];
  loadingNodes: boolean;
  searchSupplierCtrl = new UntypedFormControl();
  filteredSuppliers$: Observable<Partner[]>;

  stacks: HashMap<string>[];
  plans: string[];
  loadingPlan: boolean;
  searchPlanCtrl = new UntypedFormControl();
  filteredPlans$: Observable<string[]>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public supplier: Supplier,
    private dialogRef: MatDialogRef<UpdateSupplierComponent>,
    private supplierService: SupplierService,
    private partnerService: PartnerService,
    private toastService: ToastService
  ) {
    if (supplier) {
      this.newSupplier = clone(supplier);
      this.newSupplier.partnerUuid = supplier.uuid;
      this.ctaActionName = 'Update';
      this.getPlans();
    }
  }

  ngOnInit(): void {
    this.stacks = environment.stacks;

    this.loadingNodes = true;
    this.partnerService.getPartnerNodes().subscribe(nodes => {
      this.partnerNodes = nodes;
      this.loadingNodes = false;
      this.filteredSuppliers$ = this.searchSupplierCtrl.valueChanges.pipe(
        startWith(''),
        map(val => {
          return this.partnerNodes.filter(
            node =>
              node.partnerName.toLowerCase().indexOf(val.toLowerCase()) >= 0 ||
              node.partnerUuid.toLowerCase().indexOf(val.toLowerCase()) >= 0
          );
        })
      );
    });
  }

  getPlans() {
    this.loadingPlan = true;
    this.supplierService
      .getPlans(this.newSupplier.stack)
      .pipe(map(plans => plans.map(plan => plan.name)))
      .subscribe(plans => {
        this.plans = plans;
        this.loadingPlan = false;
        this.filteredPlans$ = this.searchPlanCtrl.valueChanges.pipe(
          startWith(''),
          map(val => {
            return this.plans.filter(plan => plan.toLowerCase().indexOf(val.toLowerCase()) >= 0);
          })
        );
      });
  }

  submit() {
    this.updating = true;
    if (this.ctaActionName == 'Create') {
      this.newSupplier.partnerUuid = this.partner.partnerUuid;
    }

    this.newSupplier.visibilityType = 'ALL';
    if (this.newSupplier.uuid) {
      this.supplierService
        .updateSuplier(this.newSupplier)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          res => {
            this.dialogRef.close(true);
            this.toastService.success(this.ctaActionName + ' successfully');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    } else {
      this.supplierService
        .createSuplier(this.newSupplier)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          res => {
            this.dialogRef.close(true);
            this.toastService.success(this.ctaActionName + ' successfully');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    }
  }
}
