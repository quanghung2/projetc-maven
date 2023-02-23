import { Component, OnInit } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface AbandonedRate {
  queueLabel: string;
  rate: number;
  longAbandoned: number;
  shortAbandoned: number;
  unansweredCallback: number;
  voicemail: number;
  totalCall: number;
}

@Component({
  selector: 'b3n-abandoned-rate',
  templateUrl: './abandoned-rate.component.html',
  styleUrls: ['./abandoned-rate.component.scss']
})
export class AbandonedRateComponent implements OnInit {
  loading: boolean;
  abds: AbandonedRate[];

  constructor(private toastr: ToastService) {}

  ngOnInit() {}

  reload(queues: QueueInfo[], inbound$: Observable<InboundDashboard[]>) {
    inbound$.pipe(finalize(() => (this.loading = false))).subscribe(
      inbound => {
        this.abds = queues
          .map(queue => {
            const inboundQueue = inbound.find(x => x.queueUuid === queue.uuid);

            return <AbandonedRate>{
              queueLabel: queue.label,
              rate: inboundQueue?.abandonedRate != null ? inboundQueue?.abandonedRate : -1,
              longAbandoned: inboundQueue?.longAbandoned || 0,
              shortAbandoned: inboundQueue?.shortAbandoned || 0,
              unansweredCallback: inboundQueue?.unansweredCallbackCalls || 0,
              voicemail: inboundQueue?.voicemail || 0,
              totalCall: inboundQueue?.totalCalls || 0
            };
          })
          .sort((a, b) => b.rate - a.rate);
      },
      err => {
        this.toastr.error(err.message);
      }
    );
  }
}
