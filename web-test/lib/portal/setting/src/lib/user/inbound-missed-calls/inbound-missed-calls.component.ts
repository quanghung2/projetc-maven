import { Component, OnInit } from '@angular/core';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { BaUserService, InputBaUserReq } from '@b3networks/api/flow';
import { BaUserGroupID } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, distinctUntilKeyChanged, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'b3n-inbound-missed-calls',
  templateUrl: './inbound-missed-calls.component.html',
  styleUrls: ['./inbound-missed-calls.component.scss']
})
export class InboundMissedCallsComponent extends DestroySubscriberComponent implements OnInit {
  inputBaUserReq: InputBaUserReq[];
  loading: boolean;

  constructor(private baUserService: BaUserService, private extensionQuery: ExtensionQuery) {
    super();
  }

  ngOnInit(): void {
    let releaseGroupId = <string>BaUserGroupID.INBOUND_MISSED_CALLS;
    if (X.orgUuid === 'f17b4dd0-1d78-49c7-8e31-ca4b0ad1f9b9') {
      releaseGroupId = `${releaseGroupId}Test`;
    }

    this.loading = true;
    combineLatest([
      this.baUserService.getTriggerDefs(releaseGroupId, false),
      this.extensionQuery.selectActive().pipe(
        takeUntil(this.destroySubscriber$),
        distinctUntilKeyChanged('extKey'),
        filter(ext => ext != null)
      )
    ]).subscribe(([triggerDefs, ext]) => {
      this.loading = true;
      if (this.inputBaUserReq) {
        this.inputBaUserReq.length = 0;
      }
      const extkey = ext.extKey;
      const inputBaUserReq: InputBaUserReq[] = [];
      triggerDefs
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(triggerDef => {
          inputBaUserReq.push(new InputBaUserReq({ triggerDef, defaultParam: { extkey }, hideDefaultParam: true }));
        });
      this.inputBaUserReq = inputBaUserReq;
      this.loading = false;
    });
  }
}
