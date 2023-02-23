import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CacheService, EventStreamService } from '../../shared';
import { SipAccountService } from '../../shared/service/sip-account.service';

declare var X: any;

@Component({
  selector: 'b3n-incoming-rule-plan',
  templateUrl: './incoming-rule-plan.component.html',
  styleUrls: ['./incoming-rule-plan.component.scss']
})
export class IncomingRulePlanComponent implements OnInit {
  perPage = 10;
  page = 1;
  isRemovingPlan = false;
  loading = true;
  currentAccount: any = {};

  constructor(
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private sipAccountService: SipAccountService
  ) {}
  ngOnInit() {
    let cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });

    this.eventStreamService.on('close-modal:create-plan-modal').subscribe(data => {
      this.currentAccount.incoming.inboundRulePlans = data.inboundRulePlans;
    });
  }

  loadInfo(curAcc) {
    if (curAcc?.incoming?.inboundRulePlans === null) {
      curAcc.incoming.inboundRulePlans = {};
    }
    this.currentAccount = curAcc;
    this.loading = false;
  }

  add() {
    this.eventStreamService.trigger('open-modal', 'create-plan-modal');
  }

  removePlan(index) {
    this.isRemovingPlan = true;
    let inboundRulePlan = this.currentAccount.incoming.inboundRulePlans.slice();
    inboundRulePlan = inboundRulePlan.slice(0, index).concat(inboundRulePlan.slice(index + 1, inboundRulePlan.length));
    this.update(inboundRulePlan);
  }

  update(inboundRulePlan) {
    this.sipAccountService
      .updateIncoming(this.currentAccount.account.username, inboundRulePlan)
      .pipe(
        finalize(() => {
          this.isRemovingPlan = false;
        })
      )
      .subscribe(
        res => {
          this.currentAccount.incoming = res;
          this.cacheService.put('current-account', this.currentAccount);
          X.showSuccess('Your setting has been updated successfully.');
        },
        () => {
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
