import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Plan, SupplierService } from '@b3networks/api/supplier';
import { DISTRIBUTION_DOMAINS, DomainUtilsService } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { debounceTime, finalize, startWith } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CreatePlanDialogComponent } from './create-plan-dialog/create-plan-dialog.component';

@Component({
  selector: 'b3n-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  stacks: HashMap<string>[];
  plans: Plan[];
  filteredPlans: Plan[];
  stackCtrl = new UntypedFormControl();
  searchCtrl = new UntypedFormControl();
  dataSource = new MatTableDataSource<Plan>();
  displayColumns = ['name', 'action', 'load', 'primary', 'secondary'];
  isDomainB3: boolean;
  loading: boolean;

  constructor(
    private dialog: MatDialog,
    private domainUtilSerivce: DomainUtilsService,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.stacks = environment.stacks;

    this.stackCtrl.valueChanges.subscribe(_ => {
      this.getPlans();
    });

    this.isDomainB3 = DISTRIBUTION_DOMAINS.includes(this.domainUtilSerivce.getPortalDomain());
    if (this.isDomainB3) {
      this.stackCtrl.setValue(this.stacks[0]['value']);
    }
  }

  getPlans() {
    this.loading = true;
    this.supplierService
      .getPlans(this.stackCtrl.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(plans => {
        this.plans = plans;
        this.searchCtrl.valueChanges.pipe(startWith(''), debounceTime(200)).subscribe(val => {
          this.filteredPlans = this.plans.filter(plan => plan.name.toLowerCase().indexOf(val.toLowerCase()) >= 0);
          this.dataSource = new MatTableDataSource<Plan>(this.filteredPlans);
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
          });
        });
      });
  }

  onShowCreatePlan() {
    this.dialog
      .open(CreatePlanDialogComponent, {
        width: '400px',
        disableClose: true,
        autoFocus: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getPlans();
        }
      });
  }
}
