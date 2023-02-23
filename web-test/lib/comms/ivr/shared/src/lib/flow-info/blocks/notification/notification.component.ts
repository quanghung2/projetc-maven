import { KeyValue } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { EmailType, NotifyBlock, SmsType, User, UserService, WebhookCommand, Workflow } from '@b3networks/api/ivr';
import { LicenseFeatureCode, LicenseService } from '@b3networks/api/license';
import { X } from '@b3networks/shared/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'b3n-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  // encapsulation: ViewEncapsulation.None,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class NotificationComponent implements OnInit, OnChanges {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  emailTypeOptions: KeyValue<EmailType, string>[] = [
    { key: EmailType.none, value: 'None' },
    { key: EmailType.custom, value: 'Custom' }
  ];
  smsTypeOptions: KeyValue<SmsType, string>[] = [
    { key: SmsType.none, value: 'None' },
    { key: SmsType.caller, value: 'Caller' },
    { key: SmsType.last_input_number, value: 'Last Input Number' },
    { key: SmsType.custom, value: 'Custom' }
  ];

  EmailType = EmailType;
  SmsType = SmsType;

  @Input() block: NotifyBlock = new NotifyBlock();
  @Input() workflow: Workflow;

  licenseEnabledOrg: boolean;
  hasSMSLicense: boolean;
  user: User = new User();
  emailAddresses: string;
  senderNumbers: string[] = [];
  query: string;
  enableWebHook = false;

  backupWebhookCommand: WebhookCommand;
  addOnBlur = true;

  constructor(
    private infraService: CallerIdService,
    private userService: UserService,
    private identityProfileQuery: IdentityProfileQuery,
    private licenseService: LicenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    forkJoin([this.userService.fetchUser(), this.infraService.findSenders(X.orgUuid)]).subscribe(data => {
      this.user = data[0];
      this.senderNumbers = [].concat(...data[1].map(d => d.sender)).sort((a, b) => a.localeCompare(b));
    });

    this.licenseEnabledOrg = this.identityProfileQuery?.currentOrg?.licenseEnabled;
    if (this.licenseEnabledOrg) {
      this.licenseService
        .getLicenseFilterByFeature(LicenseFeatureCode.auto_attendant, LicenseFeatureCode.license_sms_campaign)
        .pipe(catchError(__ => of([])))
        .subscribe(licenses => {
          this.hasSMSLicense =
            licenses?.filter(licenses =>
              licenses?.mappings?.some(x => x.subscriptionUuid === this.workflow?.subscriptionUuid)
            )?.length > 0;
        });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.emailAddresses = this.block.email.emailAddresses.join(',');
    this.enableWebHook =
      !!this.block.webHookCommand && !!this.block.webHookCommand.url && !!this.block.webHookCommand.method;
    if (!this.enableWebHook) {
      this.block.webHookCommand = undefined;
    }
  }

  onEnableWebhookChange(status: boolean) {
    this.enableWebHook = status;
    if (this.enableWebHook) {
      this.block.webHookCommand = this.backupWebhookCommand ? this.backupWebhookCommand : new WebhookCommand();
    } else {
      this.backupWebhookCommand = this.block.webHookCommand;
      this.block.webHookCommand = undefined;
    }
  }

  addEmail(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && !this.block.email.emailAddresses.includes(value)) {
      this.block.email.emailAddresses.push(value);
    }
    if (this.block.email.emailAddresses.length) {
      this.block.emailType = EmailType.custom;
    }
    this.cdr.detectChanges();

    event.chipInput!.clear();
  }

  removeEmail(email: string): void {
    const index = this.block.email.emailAddresses.indexOf(email);

    if (index >= 0) {
      this.block.email.emailAddresses.splice(index, 1);
    }

    if (!this.block.email.emailAddresses.length) {
      this.block.emailType = EmailType.none;
    }
  }
}
