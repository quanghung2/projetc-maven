import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CacheService, EventStreamService } from '../../../shared';
import { SipAccountService } from '../../../shared/service/sip-account.service';

declare var X: any;
declare let $: any;
export interface PlanModel {
  startWith: string;
  numberLength: string;
  removePrefix: number;
  appendPrefix: string;
  doPrependPlus: boolean;
}
@Component({
  selector: 'app-create-plan',
  templateUrl: './create-plan.component.html',
  styleUrls: ['./create-plan.component.scss']
})
export class CreatePlanComponent implements OnInit {
  planModel: PlanModel = {
    startWith: '',
    numberLength: '',
    removePrefix: null,
    appendPrefix: '',
    doPrependPlus: false
  };
  isAddingPlan = false;
  currentAccount: any;

  constructor(
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private sipAccountService: SipAccountService
  ) {}

  ngOnInit(): void {
    this.eventStreamService.on('open-modal').subscribe(res => {
      const cur = this.cacheService.get('current-account');
      this.currentAccount = cur;
    });
  }

  addPlan() {
    this.isAddingPlan = true;

    const inboundRulePlan = this.currentAccount.incoming.inboundRulePlans.concat({
      startWith: this.planModel.startWith.split(','),
      numberLength: this.planModel.numberLength.split(','),
      removePrefix: this.planModel.removePrefix ? this.planModel.removePrefix : 0,
      appendPrefix: this.planModel.appendPrefix ? this.planModel.appendPrefix : '',
      doPrependPlus: this.planModel.doPrependPlus
    });

    this.update(inboundRulePlan);
  }

  update(inboundRulePlan) {
    this.sipAccountService
      .updateIncoming(this.currentAccount.account.username, inboundRulePlan)
      .pipe(
        finalize(() => {
          this.isAddingPlan = false;
        })
      )
      .subscribe(
        res => {
          this.eventStreamService.trigger('close-modal', 'create-plan-modal');
          this.eventStreamService.trigger('close-modal:create-plan-modal', res);
          this.cacheService.put('current-account', this.currentAccount);
          X.showSuccess('Your setting has been updated successfully.');
        },
        () => {
          X.showWarn('Cannot update your setting. Please check your input.');
        }
      );
  }
}
