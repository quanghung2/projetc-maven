import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrganizationService } from '@b3networks/api/auth';
import { CallInQueue, Lastest5Calls, QueryService } from '@b3networks/api/data';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-view-call',
  templateUrl: './view-call.component.html',
  styleUrls: ['./view-call.component.scss']
})
export class ViewCallComponent implements OnInit {
  call: CallInQueue;
  lastest5Calls: Lastest5Calls[];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: CallInQueue,
    private orgService: OrganizationService,
    private queryService: QueryService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce
  ) {
    this.call = data;
  }

  ngOnInit() {
    this.fetchCallLog();
  }

  fetchCallLog() {
    this.lastest5Calls = [];
    this.spinnerService.showSpinner();
    this.queryService
      .fetchLastest5Calls(this.call.callerId)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        response => {
          this.lastest5Calls = response;
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
