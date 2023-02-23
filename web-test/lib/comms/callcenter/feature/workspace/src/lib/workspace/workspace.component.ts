import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Me, MeQuery, MeService, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent extends DestroySubscriberComponent implements OnInit {
  navLinks: KeyValue<string, string>[] = [];
  me$: Observable<Me>;
  isShowFeedback = false;
  navigatePrefix: string;

  constructor(
    private meService: MeService,
    private meQuery: MeQuery,
    private router: Router,
    private queueService: QueueService
  ) {
    super();
    router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          const prefix = event.url.match(/\w+(?=\/workspace)/);

          if (prefix) {
            this.navigatePrefix = '/' + prefix[0];
          }
        }
      });
  }

  ngOnInit() {
    this.queueService.loadQueueList().subscribe((res: QueueInfo[]) => {
      for (let i = 0; i < res.length; i++) {
        if (!!res[i].postCallConfig.message || !!res[i].postCallConfig.senderNumber) {
          this.isShowFeedback = true;
          break;
        }
      }

      this.meService.get().subscribe();
      this.me$ = this.meQuery.me$.pipe(
        takeUntil(this.destroySubscriber$),
        filter(me => me != null),
        tap(me => {
          this.buildLinks(me.isSupervisor);
        })
      );
    });
  }

  private buildLinks(isSupervisor: boolean) {
    this.navigatePrefix = this.navigatePrefix ?? '';

    this.navLinks = [
      {
        key: `${this.navigatePrefix}/workspace/answered-calls`,
        value: 'Answered Calls'
      },
      {
        key: `${this.navigatePrefix}/workspace/unanswered-calls`,
        value: 'Unanswered Calls'
      }
    ];
    if (isSupervisor) {
      this.navLinks.unshift(
        {
          key: `${this.navigatePrefix}/workspace/agent-list`,
          value: 'Agent List'
        },
        {
          key: `${this.navigatePrefix}/workspace/active-calls`,
          value: 'Active Calls'
        }
      );
      if (!this.navigatePrefix && this.isShowFeedback) {
        this.navLinks.push({
          key: `${this.navigatePrefix}/workspace/feedback`,
          value: 'Feedback'
        });
      }
    }

    this.router.navigate([this.navLinks[0].key]);
  }
}
