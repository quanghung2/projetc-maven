import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';

declare var _: any;

@Component({
  selector: 'b3n-longest-wait-time',
  templateUrl: './longest-wait-time.component.html',
  styleUrls: ['./longest-wait-time.component.scss']
})
export class LongestWaitTimeComponent implements OnInit {
  loading = false;
  queues: KeyValue<String, number>[];

  constructor(private toastr: ToastService) {}

  ngOnInit() {}

  reload(queues: QueueInfo[], inbound$: Observable<InboundDashboard[]>) {
    this.loading = true;

    inbound$.subscribe(
      inbound => {
        this.queues = [];
        this.loading = false;
        this.queues = queues
          .map(queue => {
            const inboundQueue = inbound.find(x => x.queueUuid === queue.uuid);
            return {
              key: queue.label,
              value: inboundQueue?.longestQueueDuration != null ? inboundQueue?.longestQueueDuration / 1000 : -1
            };
          })
          .sort((a, b) => b.value - a.value);
      },
      err => {
        this.loading = false;
        this.toastr.error(err.message);
      }
    );
  }
}
