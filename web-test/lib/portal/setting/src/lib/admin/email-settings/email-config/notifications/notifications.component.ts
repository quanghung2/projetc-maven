import { Component, OnInit } from '@angular/core';
import { AgentNotification, EmailIntegrationQuery, EmailIntegrationService, Status } from '@b3networks/api/workspace';
import { filter, takeUntil } from 'rxjs/operators';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent extends DestroySubscriberComponent implements OnInit {
  agentNotification: AgentNotification;

  constructor(
    private emailService: EmailIntegrationService,
    private emailQuery: EmailIntegrationQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.emailQuery.agentNotification$
      .pipe(
        filter(notification => !!notification),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(notification => {
        this.agentNotification = notification;
      });
  }

  updateNotification() {
    if (this.agentNotification.incommingEmailNotification === Status.active) {
      this.agentNotification = { ...this.agentNotification, incommingEmailNotification: Status.disabled };
    } else if (this.agentNotification.incommingEmailNotification === Status.disabled) {
      this.agentNotification = { ...this.agentNotification, incommingEmailNotification: Status.active };
    }

    this.emailService.updateAgentNotification(this.agentNotification).subscribe(
      () => {},
      error => {
        this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT);
      }
    );
  }
}
