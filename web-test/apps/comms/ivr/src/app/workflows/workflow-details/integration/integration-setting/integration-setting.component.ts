import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { Integration, IntegrationService, IntegrationType } from '@b3networks/api/ivr';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { ExampleComponent } from './example/example.component';

@Component({
  selector: 'b3n-integration-setting',
  templateUrl: './integration-setting.component.html',
  styleUrls: ['./integration-setting.component.scss']
})
export class IntegrationSettingComponent implements OnInit {
  IntegrationType = IntegrationType;
  readonly intergrationOptions: KeyValue<IntegrationType, string>[] = [
    { key: IntegrationType.freshdesk, value: 'Freshdesk' },
    { key: IntegrationType.agileCrm, value: 'AgileCRM' },
    { key: IntegrationType.zendesk, value: 'Zendesk' },
    { key: IntegrationType.genericTicketing, value: 'Generic Ticketing' },
    { key: IntegrationType.httpsNotification, value: 'HTTPS Notification' }
  ];
  selectedType: IntegrationType;

  workflowUuid: string;
  integration: Integration;
  backupData: Integration;
  saving: boolean;

  constructor(
    private route: ActivatedRoute,
    private integrationService: IntegrationService,
    private spinnerService: LoadingSpinnerSerivce,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.workflowUuid = this.route.snapshot.params['uuid'];
    this.fetchIntegration();
  }

  fetchIntegration() {
    this.spinnerService.hideSpinner();
    this.spinnerService.showSpinner();
    this.integrationService
      .getIntegrationSettings(this.workflowUuid)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        integration => {
          this.integration = integration;
          this.backupData = this.integration;
          this.selectedType = this.integration.type || IntegrationType.freshdesk;
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  saveIntegrationSettings() {
    this.spinnerService.showSpinner();
    this.saving = true;
    this.integration.type = this.selectedType;
    this.integration.extra['source'] = 3;
    this.integrationService
      .updateIntegrationSettings(this.workflowUuid, this.integration)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.spinnerService.hideSpinner();
        })
      )
      .subscribe(
        integration => {
          this.integration = integration;
          this.toastService.success('Saved successfully!');
          this.fetchIntegration();
        },
        error => this.toastService.error('Cannot save settings. Please try again later!')
      );
  }

  confirmSaveSettings() {
    if (this.integration.type == IntegrationType.freshdesk) {
    }
    if (this.selectedType != this.integration.type) {
      this.dialog
        .open(ConfirmDialogComponent, {
          data: <ConfirmDialogInput>{
            message:
              this.selectedType == IntegrationType.httpsNotification
                ? `Change integration to <strong>HTTPS NOTIFICATION?</strong>`
                : this.selectedType == IntegrationType.genericTicketing
                ? `Change integration to <strong>GENERIC TICKETING?</strong>`
                : `Change integration to <strong>${this.selectedType.toUpperCase()}?</strong>`,
            title: `Change integration settings`
          },
          width: '400px'
        })
        .afterClosed()
        .subscribe(result => {
          if (result) {
            this.saveIntegrationSettings();
          }
        });
    } else {
      this.saveIntegrationSettings();
    }
  }

  onchangeIntegrationType(event: MatSelectChange) {
    if (this.selectedType === this.backupData.type) {
      this.integration = new Integration(this.backupData);
    } else {
      this.integration = new Integration();
    }
    if (this.selectedType === IntegrationType.genericTicketing) {
      this.integrationService.getWebhookSettings(this.workflowUuid).subscribe(rs => console.log('load webhook'));
    }
  }

  deleteIntegrationSettings() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `Delete integration settings`,
          message: `Delete all settings?`
        }
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.spinnerService.showSpinner();
          this.integrationService
            .deleteIntegrationSettings(this.workflowUuid)
            .pipe(finalize(() => this.spinnerService.hideSpinner()))
            .subscribe(
              result => {
                this.toastService.success('Deleted settings successfully!');
                this.fetchIntegration();
              },
              err => this.toastService.error(err.message)
            );
        }
      });
  }

  openViewExamples() {
    this.dialog.open(ExampleComponent, {
      width: '850px',
      data: {
        freshDeskURL: `./assets/images/example-freshdesk.png`,
        zenDeskURL: `./assets/images/example-zendesk.png`,
        agileCrmURL2: `./assets/images/example-agilecrm-2.png`,
        agileCrmURL1: `./assets/images/example-agilecrm-1.png`,
        type: this.selectedType,
        httpsNotificationIncomingCall: {
          title: 'Incoming call data - method POST',
          data: `
          {
            "fromNumber" : "+65123456789",
            "accessNumber" : "+65987654321",
            "session" : "6526f509-4038-4bbe-a2f1-0331fa52a191",
            "incomingNumber" : "+65123456789",
            "txnRef" : "6526f509-4038-4bbe-a2f1-0331fa52a191",
            "text" : "\`\`\`[#6526f509] You have received a incoming call on 2019-10-16 10:06\\
                          nVirtual Line: My Virtual Line\\nIncoming number: +65123456789\\
                          nAccess number: +65987654321\\n\`\`\`", // for slack webhook integration
            "callInfo" : "[#6526f509] You have received a incoming call on 2019-10-16 10:06\\
                          nVirtual Line: My Virtual Line\\nIncoming number: +65123456789\\
                          nAccess number: +65987654321\\n",
            "toNumber" : "+65987654321",
            "callState" : "incoming"
          }
          `
        },
        httpsNotificationEndedCall: {
          title: 'Ended call data - method POST',
          data: `
          {
            "pressedDigits" : 0,
            "session" : "6526f509-4038-4bbe-a2f1-0331fa52a191",
            "txnRef" : "6526f509-4038-4bbe-a2f1-0331fa52a191",
            "finishTalkTimeLong" : "1571191678000",
            "dest" : "Ext Group 902 (Tesing group)",
            "startTalkTimeLong" : "1571191585000",
            "callType" : "Office hours",
            "duration" : "1m 33s",
            "finishTimeLong" : "1571191678000",
            "startTimeLong" : "1571191585000",
            "incomingNumber" : "+65123456789",
            "startTime" : "2019-10-16 10:06",
            "text" : "\`\`\`[#6526f509] Call has ended.\\nVirtual Line: My Virtual Line\\
                          nIncoming number: +65123456789\\nAccess number: +65987654321\\
                          nWorking hour type: Office hours\\nDate & time: 2019-10-16 10:06 (1m 33s)\\
                          nPressed digits: 0\\nEndpoint: Ext Group 902 (Tesing group)\\n\`\`\`",
            "callInfo" : "[#6526f509] Call has ended.\\nVirtual Line: My Virtual Line\\
                          nIncoming number: +65123456789\\nAccess number: +65987654321\\
                          nWorking hour type: Office hours\\nDate & time: 2019-10-16 10:06 (1m 33s)\\
                          nPressed digits: 0\\nEndpoint: Ext Group 902 (Tesing group)\\n",
            "finishTime" : "2019-10-16 10:07",
            "inputKeys" : 0,
            "callState" : "ended",
            "fromNumber" : "+65123456789",
            "extensions" : 0,
            "finishTalkTime" : "2019-10-16 10:07",
            "startTalkTime" : "2019-10-16 10:06",
            "accessNumber" : "+65987654321",
            "toNumber" : "+65987654321"
          }
          `
        }
      }
    });
  }
}
