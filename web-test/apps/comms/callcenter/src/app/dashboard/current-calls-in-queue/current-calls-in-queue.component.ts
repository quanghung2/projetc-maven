import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-current-calls-in-queue',
  templateUrl: './current-calls-in-queue.component.html',
  styleUrls: ['./current-calls-in-queue.component.scss']
})
export class CurrentCallsInQueueComponent implements OnInit {
  loading = false;
  queues: KeyValue<String, Number>[];

  constructor(public toastr: ToastService) {}

  ngOnInit() {}

  reload(queueList: QueueInfo[], inbound$: Observable<InboundDashboard[]>) {
    this.loading = true;

    inbound$.subscribe(
      inbound => {
        this.loading = false;
        this.queues = queueList
          .map(q => {
            const inboundQueue = inbound.find(x => x.queueUuid === q.uuid);
            return {
              key: q.label,
              value: inboundQueue?.currentCallsInQueue != null ? inboundQueue?.currentCallsInQueue : 0
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

  getTotal() {
    return this.queues
      .map(q => q.value)
      .filter(v => v > 0)
      .reduce((acc, value) => +acc + +value, 0);
  }
}
