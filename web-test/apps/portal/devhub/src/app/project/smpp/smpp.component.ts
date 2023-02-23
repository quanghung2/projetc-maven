import { Component, OnInit } from '@angular/core';
import { ProjectQuery } from '@b3networks/api/flow';
import { Smpp, SmppService } from '@b3networks/api/smpp';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { filter, finalize, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-smpp',
  templateUrl: './smpp.component.html',
  styleUrls: ['./smpp.component.scss']
})
export class SmppComponent extends DestroySubscriberComponent implements OnInit {
  password: string;
  smpp: Smpp;
  smppTest: Smpp;
  subscriptionUuid: string;
  showPasswordProduction = false;
  showPasswordTest = false;

  isLoading: boolean;

  constructor(
    private projectQuery: ProjectQuery,
    private smppService: SmppService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.projectQuery
      .selectActive(prj => prj.subscriptionUuid)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(prjUuid => !!prjUuid),
        take(1)
      )
      .subscribe(subscriptionUuid => {
        this.subscriptionUuid = subscriptionUuid;
        forkJoin([
          this.smppService.createSMPPAccounts(subscriptionUuid),
          this.smppService.createSMPPTestAccounts(subscriptionUuid)
        ])
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe(([smpAccount, smpTestAccount]) => {
            this.smpp = smpAccount;
            this.smppTest = smpTestAccount;
          });
      });
  }

  copied() {
    this.toastService.success('Copied to clipboard!');
  }

  toggleViewPasswordProduction() {
    this.showPasswordProduction = !this.showPasswordProduction;
  }

  toggleViewPasswordTest() {
    this.showPasswordTest = !this.showPasswordTest;
  }
}
