import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SipAccountService {
  constructor(private http: HttpClient) {}

  updateCallerId(currentAccountUsername: string, strategy: string, callerId: string) {
    return this.http.put('/appsip/accounts/' + currentAccountUsername + '/outgoing', {
      action: 'updateCallerId',
      data: {
        strategy: strategy,
        defaultCli: callerId
      }
    });
  }

  updateIpPeer(currentAccountUsername: string, ipPeer: string, protocol: string) {
    return this.http.put('/appsip/accounts/' + currentAccountUsername, {
      action: 'updateIpPeer',
      data: {
        ip: ipPeer,
        protocol: protocol
      }
    });
  }

  changeCapacity(sipUserName: string, capacity: string) {
    return this.http.put(`appsip/accounts/${sipUserName}`, {
      data: {
        action: 'updateCapacity',
        capacity: capacity
      }
    });
  }

  getTLSKey(currentAccountUsername: string) {
    return this.http.get('/accounts/' + currentAccountUsername + '/tls-key');
  }

  updateDialPlan(currentAccountUsername: string, dialPlan) {
    return this.http.put('/appsip/accounts/' + currentAccountUsername + '/outgoing', {
      action: 'updateDialPlan',
      data: {
        dialPlanList: dialPlan
      }
    });
  }

  updateIncoming(currentAccountUsername: string, inboundRulePlan) {
    return this.http.put('/appsip/accounts/' + currentAccountUsername + '/incoming/inboundRulePlans', inboundRulePlan);
  }
}
