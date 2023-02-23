import { Component, OnInit } from '@angular/core';
import { Agent, AgentStatus, SystemStatusCode } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';

export class AgentStatusStat {
  total = 0;
  available = 0;
  busy = 0;
  offline = 0;
  talking = 0;
  wrapup = 0;
}

@Component({
  selector: 'b3n-agent-statistic',
  templateUrl: './agent-statistic.component.html',
  styleUrls: ['./agent-statistic.component.scss']
})
export class AgentStatisticComponent implements OnInit {
  loading = false;
  statuses = new AgentStatusStat();

  constructor(public toastService: ToastService) {}

  ngOnInit() {}

  reload(stream: Observable<Agent[]>) {
    this.loading = true;

    stream.subscribe(
      response => {
        this.statuses = new AgentStatusStat();
        this.loading = false;
        this.statuses.total = response.length;

        for (let i = 0; i < response.length; i++) {
          if (response[i].systemStatus === SystemStatusCode.talking) {
            this.statuses.talking++;
          } else if (response[i].systemStatus === SystemStatusCode.acw) {
            this.statuses.wrapup++;
          } else if (response[i].status === AgentStatus.busy) {
            this.statuses.busy++;
          } else if (response[i].status === AgentStatus.offline) {
            this.statuses.offline++;
          } else {
            this.statuses.available++;
          }
        }
      },
      err => {
        this.loading = false;
        this.toastService.error(err.message);
      }
    );
  }
}
