import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-average-call-duration',
  templateUrl: './average-call-duration.component.html',
  styleUrls: ['./average-call-duration.component.scss']
})
export class AverageCallDurationComponent implements OnInit {
  loading = false;
  queuesCall: KeyValue<String, number>[];

  constructor(public toastr: ToastService) {}

  ngOnInit() {}

  reload(queues: QueueInfo[], inbound$: Observable<InboundDashboard[]>) {
    this.loading = true;

    inbound$.pipe(finalize(() => (this.loading = false))).subscribe(
      inbound => {
        this.queuesCall = queues
          .map(queue => {
            const inboundQueue = inbound.find(x => x.queueUuid === queue.uuid);

            return {
              key: queue.label,
              value: inboundQueue?.avgTalkDuration != null ? inboundQueue?.avgTalkDuration / 1000 : -1
            };
          })
          .sort((a, b) => b.value - a.value);
      },
      err => {
        this.loading = false;
        this.toastr.warning(err.message);
      }
    );
  }
}
