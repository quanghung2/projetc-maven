import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DetectRoutingRes, RoutingService } from '@b3networks/api/call';
import { CpService } from '@b3networks/api/cp';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { RoutingPlanDialogComponent } from './routing-plan-dialog/routing-plan-dialog.component';

@Component({
  selector: 'b3n-view-route',
  templateUrl: './view-route.component.html',
  styleUrls: ['./view-route.component.scss']
})
export class ViewRouteComponent implements OnInit {
  formViewRoute: UntypedFormGroup;
  testing: boolean;
  responseDetect: DetectRoutingRes;
  sourceNumber: string;
  destNumber: string;

  get domain(): UntypedFormControl {
    return this.formViewRoute.get('domain') as UntypedFormControl;
  }
  getErrorDomain() {
    return this.domain.hasError('required') ? 'Domain is required' : '';
  }

  get orgUuid(): UntypedFormControl {
    return this.formViewRoute.get('orgUuid') as UntypedFormControl;
  }
  getErrorOrgUuid() {
    return this.orgUuid.hasError('required') ? 'Org UUID is required' : '';
  }

  get source(): UntypedFormControl {
    return this.formViewRoute.get('source') as UntypedFormControl;
  }
  getErrorSource() {
    if (this.source.hasError('required')) {
      return 'Source is required';
    } else if (this.source.hasError('pattern')) {
      return 'Source is invalid';
    }
    return '';
  }

  get dest(): UntypedFormControl {
    return this.formViewRoute.get('dest') as UntypedFormControl;
  }
  getErrorDest() {
    if (this.dest.hasError('required')) {
      return 'Destination is required';
    } else if (this.dest.hasError('pattern')) {
      return 'Destination is invalid';
    }
    return '';
  }

  get type(): UntypedFormControl {
    return this.formViewRoute.get('type') as UntypedFormControl;
  }
  getErrorType() {
    return this.type.hasError('required') ? 'Type is required' : '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private routingService: RoutingService,
    private cpService: CpService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formViewRoute = this.fb.group({
      domain: ['', Validators.required],
      orgUuid: [X.orgUuid, Validators.required],
      source: ['', Validators.compose([Validators.required, Validators.pattern(/^\+{0,1}[0-9]*$/)])],
      dest: ['', Validators.compose([Validators.required, Validators.pattern(/^\+{0,1}[0-9]*$/)])],
      type: ['', Validators.required]
    });
  }

  mockRouting() {
    if (this.formViewRoute.valid) {
      this.sourceNumber = this.source.value;
      this.destNumber = this.dest.value;
      this.responseDetect = null;
      this.testing = true;

      this.routingService
        .detectRouting(this.formViewRoute.value)
        .pipe(finalize(() => (this.testing = false)))
        .subscribe(
          res => {
            this.responseDetect = {
              routingPlan: res.routingPlan,
              supplier: 'Loading...',
              sku: res.sku,
              isdnInventory: res.isdnInventory
            };
            if (res.supplier) {
              this.cpService.getSeller(res.supplier).subscribe(
                seller => {
                  if (seller) {
                    this.responseDetect.supplier = seller.name;
                  } else {
                    this.responseDetect.supplier = res.supplier;
                    this.toastService.error('Can not get supplier name');
                  }
                },
                err => {
                  this.responseDetect.supplier = res.supplier;
                  this.toastService.error(err.message);
                }
              );
            } else {
              this.responseDetect.supplier = 'B3 Default Supplier';
            }
          },
          err => this.toastService.error(err.message)
        );
    }
  }

  viewRoutingPlan(plan: string) {
    this.cpService.getPlan(plan).subscribe(
      res => {
        const dest = this.destNumber.replace('+', '');
        const data = res.filter(i => i.destination.startsWith(dest) || dest.startsWith(i.destination));
        if (data.length > 0) {
          this.dialog.open(RoutingPlanDialogComponent, {
            width: '500px',
            disableClose: true,
            data: data
          });
        } else {
          this.toastService.warning('No data routing plan, please try again');
        }
      },
      err => this.toastService.error('Can not view routing plan')
    );
  }
}
