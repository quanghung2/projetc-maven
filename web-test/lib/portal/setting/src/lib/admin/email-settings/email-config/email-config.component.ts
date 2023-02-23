import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CannedResponseService, EmailIntegrationService, ResponseLevel } from '@b3networks/api/workspace';
import { DestroySubscriberComponent, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MenuList {
  header: string;
  items: {
    key: string;
    value: string;
    level?: ResponseLevel;
  }[];
}
@Component({
  selector: 'b3n-email-configuration',
  templateUrl: './email-config.component.html',
  styleUrls: ['./email-config.component.scss']
})
export class EmailConfigurationComponent extends DestroySubscriberComponent implements OnInit {
  menuLists: MenuList[] = [
    {
      header: 'ME',
      items: [
        { key: 'signatures', value: 'My signatures' },
        { key: 'responses', value: 'My responses', level: ResponseLevel.PERSONAL },
        { key: 'inboxes', value: 'My inboxes', level: ResponseLevel.PERSONAL },
        { key: 'notifications', value: 'Notifications' }
      ]
    },
    {
      header: 'TEAM',
      items: [
        { key: 'team-rules', value: 'Team rules' },
        { key: 'responses', value: 'Team responses', level: ResponseLevel.ORGANIZATION },
        { key: 'inboxes', value: 'Team inboxes', level: ResponseLevel.ORGANIZATION },
        { key: 'team-tags', value: 'Tags' }
      ]
    }
  ];

  constructor(
    private cannedResponseService: CannedResponseService,
    private emailIntegrationService: EmailIntegrationService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit() {
    forkJoin([
      this.emailIntegrationService.getEmailSchedule(),
      this.emailIntegrationService.getInboxes(),
      this.emailIntegrationService.getExceptionInboxes(),
      this.emailIntegrationService.getAgentInbox(),
      this.emailIntegrationService.getSignatures(),
      this.emailIntegrationService.getTags(),
      this.emailIntegrationService.getAgentNotification(),
      this.emailIntegrationService.getRules(),
      this.cannedResponseService.getEmailCannedResponse()
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        () => {
          this.router.navigate(['signatures'], { relativeTo: this.route });
        },
        () => {
          this.toastService.error(MessageConstants.GENERAL_ERROR);
        }
      );
  }
}
