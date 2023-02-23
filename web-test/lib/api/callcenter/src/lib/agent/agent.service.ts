import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Me } from '../me/me.model';
import { Agent, AgentConfig, AssignedQueue, PopupShowedOn } from './agent-config';
import { AgentStore } from './agent.store';
import { FindAgentsReq } from './find-agents-req.model';

export const AGENT_NOT_FOUND_ERROR_CODE = 'callcenter.agentNotFound';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  constructor(private agentStore: AgentStore, private http: HttpClient) {}

  findAgents(req: FindAgentsReq): Observable<Agent[]> {
    return this.http
      .get<Agent[]>(`callcenter/private/v2/agents`, {
        params: req ? req.toParams() : null
      })
      .pipe(
        map(list => list.map(agent => new Agent(agent))),
        tap(list => {
          this.agentStore.setLoading(true);
          this.agentStore.set(list);
        })
      );
  }

  getAgentByIdentityUuid(identityUuid: string): Observable<Me> {
    return this.http.get<Me>(`callcenter/private/v2/agents/${identityUuid}`).pipe(map(m => new Me(m)));
  }

  changeAgentStatus(agentUuid: string, action: 'login' | 'logout' | 'busy' | 'dnd', busyReason?: string): Observable<Me> {
    return this.http
      .put<Me>(`/callcenter/private/v2/agents/${agentUuid}/${action}`, {
        reason: busyReason
      })
      .pipe(
        map(agent => new Me(agent))
        // tap(me => {
        //   this.agentStore.update(me.identityUuid, me.info);
        // })
      );
  }

  findAgentConfigs(): Observable<AgentConfig[]> {
    return this.http
      .get<AgentConfig[]>(`callcenter/private/v1/agents/_config`)
      .pipe(map(list => list.map(c => new AgentConfig(c))));
  }

  finishCallbackAcw(body: any): Observable<any> {
    return this.http.post('callcenter/private/v1/callback/agent/finishAcw', body);
  }

  finishInboundAcw(body: any): Observable<any> {
    return this.http.post('callcenter/private/v1/inbound/agent/finishAcw', body);
  }

  adminChangeAgentPopupShowedOn(agentUuid: string, popup: PopupShowedOn) {
    return this.http.put(`/callcenter/private/v1/agents/${agentUuid}`, {
      popupShowedOn: popup
    });
  }

  changeAgentPopupShowedOn(popup: PopupShowedOn) {
    return this.http.put(`/callcenter/private/v1/agents/me`, {
      popupShowedOn: popup
    });
  }

  getAssignedQueues(agentUuid: string) {
    return this.http.get<AssignedQueue[]>(`/callcenter/private/v2/agents/${agentUuid}/queues`);
    // .pipe
    // tap(list => {
    //   this.agentStore.update(agentUuid, entity => (entity.assignedQueues = list));
    // })
    // ()
  }
}
