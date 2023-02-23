import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Contact, ContactQuery } from '@b3networks/api/contact';
import { AppService, SidebarTabs } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, LocalStorageUtil, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-histories',
  templateUrl: './histories.component.html',
  styleUrls: ['./histories.component.scss']
})
export class HistoriesComponent extends DestroySubscriberComponent implements OnInit {
  contact$: Observable<Contact>;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private contactQuery: ContactQuery,
    private appService: AppService
  ) {
    super();
  }

  ngOnInit(): void {
    this.appService.update({ sidebarTabActive: SidebarTabs.inbox });
    this.activeRoute?.parent?.parent?.params.pipe(takeUntil(this.destroySubscriber$)).subscribe(params => {
      const contact = params['contactUuid'];
      if (contact) {
        LocalStorageUtil.setItem(`lastestView_v1_${X.orgUuid}`, encodeURIComponent(this.router.url));
        this.contact$ = this.contactQuery.selectEntity(contact).pipe(filter(x => x != null));
      }
    });
  }
}
