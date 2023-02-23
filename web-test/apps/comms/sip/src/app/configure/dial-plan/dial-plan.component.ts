import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../../shared';
import { SipAccountService } from '../../shared/service/sip-account.service';
import { finalize } from 'rxjs/operators';

declare var X: any;

@Component({
  selector: 'dial-plan',
  templateUrl: './dial-plan.component.html',
  styleUrls: ['./dial-plan.component.scss']
})
export class DialPlanComponent {
  loading = true;
  isAddingPlan = false;
  isRemovingPlan = false;
  isSwappingPlan = false;
  currentAccount: any = {};
  planModel: any = {};

  constructor(
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private sipAccountService: SipAccountService
  ) {
    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  loadInfo(curAcc) {
    if (curAcc?.outgoing?.dialPlanConfig === null) {
      curAcc.outgoing.dialPlanConfig = {};
    }
    if (curAcc?.outgoing?.dialPlanConfig?.dialPlanList === null) {
      curAcc.outgoing.dialPlanConfig.dialPlanList = [];
    }
    this.currentAccount = curAcc;
    this.loading = false;
  }

  addPlan() {
    this.isAddingPlan = true;
    const lens = [];
    this.planModel.withLengths.split(',').forEach(l => {
      if (l.indexOf('-') !== -1) {
        for (let i = parseInt(l.split('-')[0], 10); i <= parseInt(l.split('-')[1], 10); i++) {
          lens.push(i);
        }
      } else {
        lens.push(parseInt(l, 10));
      }
    });

    const dialPlan = this.currentAccount.outgoing.dialPlanConfig.dialPlanList.concat({
      matcher: {
        startWiths: this.planModel.startWiths.split(','),
        withLengths: lens
      },
      action: {
        numOfDigitRemoved: this.planModel.numOfDigitRemoved ? this.planModel.numOfDigitRemoved : 0,
        appendPrefix: this.planModel.appendPrefix
      }
    });

    this.requestUpdateDialPlan(dialPlan);
  }

  removePlan(index) {
    this.isRemovingPlan = true;
    let dialPlan = this.currentAccount.outgoing.dialPlanConfig.dialPlanList.slice();
    dialPlan = dialPlan.slice(0, index).concat(dialPlan.slice(index + 1, dialPlan.length));

    this.requestUpdateDialPlan(dialPlan);
  }

  swapPlan(from, to) {
    this.isSwappingPlan = true;
    const planFrom = this.currentAccount.outgoing.dialPlanConfig.dialPlanList[from];
    let dialPlan = this.currentAccount.outgoing.dialPlanConfig.dialPlanList.slice();
    dialPlan = dialPlan.slice(0, from).concat(dialPlan.slice(from + 1, dialPlan.length));
    dialPlan.splice(to, 0, planFrom);

    this.requestUpdateDialPlan(dialPlan);
  }

  private requestUpdateDialPlan(dialPlan) {
    this.sipAccountService
      .updateDialPlan(this.currentAccount.account.username, dialPlan)
      .pipe(
        finalize(() => {
          this.isAddingPlan = false;
          this.isSwappingPlan = false;
          this.isRemovingPlan = false;
        })
      )
      .subscribe(
        res => {
          this.currentAccount.outgoing = res;
          this.cacheService.put('current-account', this.currentAccount);
          X.showSuccess('Your setting has been updated successfully.');
        },
        () => {
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
