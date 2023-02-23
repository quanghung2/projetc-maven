import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Pageable } from '@b3networks/api/common';
import {
  ActiveIframeService,
  CaseService,
  NotificationContent,
  User,
  WindownActiveService
} from '@b3networks/api/workspace';
import { B3_ORG_UUID, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  @ViewChild('viewport') viewport: ElementRef;

  me: User;
  pageable = <Pageable>{ page: 0, perPage: 20 };
  notis = [];
  notifications: any;
  subscription: any;
  conuntError = 0;
  isB3Org: boolean;
  totalNotis: number;
  isLast = false;
  unread: number;

  notificationContent = NotificationContent;
  constructor(
    private caseService: CaseService,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService,
    private router: Router
  ) {
    super();
  }
  ngOnInit(): void {
    this.isB3Org = X.orgUuid === B3_ORG_UUID;
    this.getNotification();

    this.subscription = timer(0, 10000)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe)
      )
      .subscribe(_ => {
        //TODO review later
        // this.checkPolling();
      });
  }

  override ngOnDestroy(): void {
    this.pageable.page = 0;
    this.subscription.unsubscribe();
  }

  checkPolling() {
    this.caseService.notificationUnread().subscribe(
      res => {
        this.conuntError = 0;
        this.unread = res;
      },
      () => {
        this.conuntError++;

        if (this.conuntError > 2) {
          this.subscription.unsubscribe();
        }
      }
    );
  }

  getNotification() {
    this.caseService.getNotificationsCase(this.pageable).subscribe(notifications => {
      this.totalNotis = notifications.count;
      this.unread = notifications.unread;

      notifications.notifications.forEach(noti => {
        noti.triggeredByPhotoUrl = noti.triggeredByPhotoUrl ? `url(${noti.triggeredByPhotoUrl})` : null;
      });
      this.notis = notifications.notifications;
      this.notifications = notifications;
    });
  }

  public onScroll(event) {
    if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight) {
      if (!this.isLast) {
        this.loadMore();
      }
    }
  }

  readAll() {
    this.caseService.notificationRead(this.notifications.lastUpdated, true).subscribe(read => {
      this.getNotification();
    });
  }

  loadMore() {
    if (this.totalNotis > (this.pageable.page + 1) * this.pageable.perPage) {
      this.pageable.page++;
      this.caseService.getNotificationsCase(this.pageable).subscribe(async notifications => {
        const notisCloneV2 = cloneDeep(notifications.notifications);
        notisCloneV2.forEach(casesClone => {
          this.notis.push(casesClone);
        });
      });
    } else {
      this.isLast = true;
      this.pageable.page = 0;
    }
  }

  goHome() {
    this.router.navigate(['cases']);
  }

  updateNoti() {
    this.caseService.notificationRead(Number(new Date()), false).subscribe(read => {
      this.getNotification();
    });
  }

  clickNoti(notification) {
    this.caseService.notificationClicked(false, [notification.id], Number(new Date())).subscribe(read => {
      this.getNotification();
    });

    this.router.navigate(['cases', notification?.caseOwnerUuid, notification.caseSid]);
  }
}
