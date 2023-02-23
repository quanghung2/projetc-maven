import { Component, OnInit } from '@angular/core';
import { EmailMessageGeneral, EmailSchedule } from '@b3networks/api/workspace';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, finalize } from 'rxjs/operators';
import { ComposeEmailDialogData, ComposeEmailMessageComponent } from '../../compose/compose.component';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-mail-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent extends EmailConversationListAbstractComponent implements OnInit {
  displayMessages: EmailSchedule[] = [];
  scheduleLoading = true;

  getConversations() {
    this.emailIntegrationQuery.schedules$
      .pipe(
        untilDestroyed(this),
        filter(schedules => !!schedules)
      )
      .subscribe(schedules => {
        this.displayMessages = [];
        if (schedules.length) {
          this.scheduleLoading = true;
          schedules.forEach((schedule, index) => {
            this.conversationGroupService
              .getEmailContentByS3URL(schedule.s3Url)
              .pipe(
                finalize(() => {
                  if (index === schedules.length - 1) {
                    this.scheduleLoading = false;
                  }
                })
              )
              .subscribe(content => {
                schedule.data = content;
                schedule.ts = new Date(schedule.updatedAt).getTime();
                this.displayMessages.push(schedule);
              });
          });
        } else {
          this.scheduleLoading = false;
        }
      });
  }

  removeSchedule($events: Event, scheduleId: number) {
    $events.stopPropagation();

    this.emailIntegrationService
      .deleteEmailSchedule(scheduleId)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.emailIntegrationService.updateStore({
          schedules: this.displayMessages.filter(item => item.id !== scheduleId)
        });
        this.removeActiveConversationGroup();
      });
  }

  override onSelectMessage(convoId: string, emailSchedule: EmailSchedule) {
    super.onSelectMessage(convoId, emailSchedule);
    this.openComposeDialog(emailSchedule.data, emailSchedule.id);
  }

  protected openComposeDialog(msg: EmailMessageGeneral, scheduleId: number) {
    const dialogRef = this.dialog.open(ComposeEmailMessageComponent, {
      width: '1000px',
      data: <ComposeEmailDialogData>{
        msg: msg,
        conversationGroup: this.selectedConversationGroup,
        isSchedule: true
      },
      disableClose: true,
      panelClass: 'position-relative'
    });

    dialogRef.afterClosed().subscribe(({ isReload }) => {
      this.removeActiveConversationGroup();
      if (isReload) {
        this.emailIntegrationService.updateStore({
          schedules: this.displayMessages.filter(item => item.id !== scheduleId)
        });
      }
    });
  }

  refresh() {
    this.emailIntegrationService.getEmailSchedule().subscribe();
  }
}
