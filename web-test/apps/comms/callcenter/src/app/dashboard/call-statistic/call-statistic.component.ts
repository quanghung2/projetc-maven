import { Component, OnInit } from '@angular/core';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface CallStatisticModel {
  total: number;
  answered: number;
  abandoned: number;
  unansweredCallback: number;
  voicemail: number;
}

@Component({
  selector: 'b3n-call-statistic',
  templateUrl: './call-statistic.component.html',
  styleUrls: ['./call-statistic.component.scss']
})
export class CallStatisticComponent implements OnInit {
  loading: boolean;
  statistic = <CallStatisticModel>{
    total: 0,
    answered: 0,
    abandoned: 0,
    unansweredCallback: 0,
    voicemail: 0
  };

  constructor(public toastr: ToastService) {}

  ngOnInit() {}

  reload(inbound$: Observable<InboundDashboard[]>) {
    this.loading = true;
    inbound$.pipe(finalize(() => (this.loading = false))).subscribe(
      inbound => {
        this.statistic.total = inbound.reduce((pre, next) => pre + next.totalCalls || 0, 0); // will exclude inqueue callback
        this.statistic.answered = inbound.reduce((pre, next) => pre + next.answeredCalls || 0, 0);
        this.statistic.abandoned = inbound.reduce((pre, next) => pre + next.abandonedCalls || 0, 0);
        this.statistic.unansweredCallback = inbound.reduce((pre, next) => pre + next.unansweredCallbackCalls || 0, 0);
        this.statistic.voicemail = inbound.reduce((pre, next) => pre + next.voicemail || 0, 0);
      },
      err => {
        this.toastr.warning(err.message);
      }
    );
  }
}
