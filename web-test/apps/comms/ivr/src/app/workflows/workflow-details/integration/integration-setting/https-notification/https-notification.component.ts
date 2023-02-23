import { Component, Input, OnInit } from '@angular/core';
import { Integration, IntegrationService } from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-https-notification',
  templateUrl: './https-notification.component.html',
  styleUrls: ['./https-notification.component.scss']
})
export class HttpsNotificationComponent implements OnInit {
  @Input() integration: Integration;
  @Input() workflowUuid: string;
  nameHeader: string;
  valueHeader: string;
  nameParameters: string;
  valueParameters: string;

  constructor(private integrationService: IntegrationService, private toastService: ToastService) {}

  ngOnInit() {
    this.integrationService.getHtppsNotificationSettings(this.workflowUuid).subscribe(
      workflow => {},
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  addHeaders(nameHeader: string, valueHeader: string) {
    if (nameHeader == '' || valueHeader == '') {
      this.toastService.warning('Please enter name and value');
      return;
    }
    this.integration.command.method = 'POST';
    if (!this.integration.command.headers || this.integration.command.headers == null) {
      this.integration.command.headers = {};
    }
    this.integration.command.headers[nameHeader] = valueHeader;
    this.nameHeader = '';
    this.valueHeader = '';
  }

  addParameters(nameParameters: string, valueParameters: string) {
    if (nameParameters == '' || valueParameters == '') {
      this.toastService.warning('Please enter name and value');
      return;
    }
    this.integration.command.method = 'POST';
    if (!this.integration.command.parameters || this.integration.command.parameters == null) {
      this.integration.command.parameters = {};
    }
    this.integration.command.parameters[nameParameters] = valueParameters;
    this.nameParameters = '';
    this.valueParameters = '';
  }

  removeHeaders(header) {
    delete this.integration.command.headers[header.key];
  }

  removeParameters(param) {
    delete this.integration.command.parameters[param.key];
  }
}
