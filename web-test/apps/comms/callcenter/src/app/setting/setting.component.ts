import { Component, OnInit } from '@angular/core';
import { FillterSkillCatalog, SkillCatalogQuery, SkillCatalogService } from '@b3networks/api/intelligence';
import { FindSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'b3n-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent extends DestroySubscriberComponent implements OnInit {
  hasOutbound = false;
  constructor(
    private skillCatalogService: SkillCatalogService,
    private skillCatalogQuery: SkillCatalogQuery,
    private subscriptionService: SubscriptionService
  ) {
    super();
  }

  ngOnInit() {
    const filter: FillterSkillCatalog = this.skillCatalogQuery.getValue().ui;
    this.skillCatalogService.getSkills(filter).subscribe();
    this.subscriptionService
      .findSubscriptions(
        new FindSubscriptionReq({
          productIds: [environment.appId],
          embed: ['features']
        })
      )
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(subscriptionPage => {
        subscriptionPage.data[0].items.forEach(item => {
          if (item.features.find(feature => feature.featureCode === environment.outboundFeatureCode)) {
            this.hasOutbound = true;
          }
        });
      });
  }
}
