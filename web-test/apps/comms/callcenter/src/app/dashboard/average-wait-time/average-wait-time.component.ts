import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-average-wait-time',
  templateUrl: './average-wait-time.component.html',
  styleUrls: ['./average-wait-time.component.scss']
})
export class AverageWaitTimeComponent implements OnInit {
  loading: boolean;
  queues: KeyValue<String, number>[];

  constructor(public toastr: ToastService) {}

  ngOnInit() {}

  reload(queues: QueueInfo[], inbound$: Observable<InboundDashboard[]>) {
    this.loading = true;

    inbound$.pipe(finalize(() => (this.loading = false))).subscribe(
      inbound => {
        this.queues = queues
          .map(queue => {
            const inboundQueue = inbound.find(x => x.queueUuid === queue.uuid);
            return {
              key: queue.label,
              value: inboundQueue?.avgQueueDuration != null ? inboundQueue?.avgQueueDuration / 1000 : -1
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
