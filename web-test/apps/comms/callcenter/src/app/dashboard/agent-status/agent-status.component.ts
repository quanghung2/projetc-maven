import { Component, OnInit } from '@angular/core';
import { Agent, AgentStatus, SystemStatusCode } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';

declare var _: any;

@Component({
  selector: 'b3n-agent-status',
  templateUrl: './agent-status.component.html',
  styleUrls: ['./agent-status.component.scss']
})
export class AgentStatusComponent implements OnInit {
  loading = false;
  agents: Agent[];

  readonly SystemStatusCode = SystemStatusCode;
  readonly AgentStatus = AgentStatus;

  constructor(private toastr: ToastService) {}

  ngOnInit() {}

  reload(stream: Observable<Agent[]>) {
    this.loading = true;

    stream.subscribe(
      response => {
        this.agents = [];
        this.loading = false;
        this.agents = response.filter(
          agent => agent.status.toString() !== AgentStatus.enabled && agent.status.toString() !== AgentStatus.disabled
        );
        this.agents = this.agents.sort((a, b) => {
          const result = a.status.localeCompare(b.status);
          return result === 0 ? a.displayText.localeCompare(b.displayText) : result;
        });
      },
      err => {
        this.loading = false;
        this.toastr.warning(err.message);
      }
    );
  }
}
