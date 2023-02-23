import { Component, OnInit } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { InboundDashboard } from '@b3networks/api/data';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

declare var _: any;

export interface SLA {
  queueLabel: string;
  slaThreshold: number;
  sla: number;
  answeredThreshold: number;
  shortAbandoned: number;
  unansweredCallback: number;
  voicemail: number;
  totalCall: number;
}

@Component({
  selector: 'b3n-sla',
  templateUrl: './sla.component.html',
  styleUrls: ['./sla.component.scss']
})
export class SlaComponent implements OnInit {
  loading: boolean;
  slas: SLA[];

  constructor(public toastr: ToastService) {}

  ngOnInit() {}

  reload(queues: QueueInfo[], inbound$: Observable<InboundDashboard[]>) {
    this.loading = true;
    inbound$.pipe(finalize(() => (this.loading = false))).subscribe(
      inbound => {
        this.slas = queues
          .map(queue => {
            const inboundQueue = inbound.find(x => x.queueUuid === queue.uuid);
            return <SLA>{
              queueLabel: queue.label,
              slaThreshold: queue.slaThreshold,
              sla:
                inboundQueue?.[`sla${queue.slaThreshold}s`] != null ? inboundQueue?.[`sla${queue.slaThreshold}s`] : -1,
              answeredThreshold: inboundQueue?.[`answeredInThreshold${queue.slaThreshold}s`],
              shortAbandoned: inboundQueue?.shortAbandoned,
              unansweredCallback: inboundQueue?.unansweredCallbackCalls,
              voicemail: inboundQueue?.voicemail,
              totalCall: inboundQueue?.totalCalls
            };
          })
          .sort((a, b) => a.queueLabel.localeCompare(b.queueLabel))
          .sort((a, b) => b.sla - a.sla);
      },
      err => {
        this.toastr.warning(err.message);
      }
    );
  }
}
