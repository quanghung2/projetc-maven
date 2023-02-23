import { Component, Input, OnInit } from '@angular/core';
import { CreateTicketParams, Integration, WebhookExtraParams } from '@b3networks/api/ivr';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'generic-ticketing-integration',
  templateUrl: './webhook.component.html',
  styleUrls: ['./webhook.component.scss']
})
export class WebhookComponent implements OnInit {
  @Input() integration: Integration;
  name: string;
  value: string;
  nameUpdateParams: string;
  valueUpdateParams: string;

  constructor(private snackbar: MatSnackBar) {}

  ngOnInit() {
    const commonParams = (this.integration.commonParams as WebhookExtraParams) || <WebhookExtraParams>{};
    this.integration.commonParams = <WebhookExtraParams>{
      createTicketURL: commonParams.createTicketURL,
      username: commonParams.username,
      password: commonParams.password,
      createContactURL: commonParams.createContactURL,
      searchContactURL: commonParams.searchContactURL,
      updateTicketURL: commonParams.updateTicketURL
    };

    if (!this.integration.createTicketParams) {
      this.integration.createTicketParams = <CreateTicketParams>{};
    }
  }

  add(name, value) {
    if (!name || !value) {
      this.snackbar.open('Please enter name and value!', 'Close', { duration: 3000 });
      return;
    }

    if (name == 'status' && +value > 2 && +value < 7) {
      this.integration.createTicketParams[name] = +value;
    } else if (name == 'priority' && +value >= 1 && +value <= 4) {
      this.integration.createTicketParams[name] = +value;
    } else {
      this.integration.createTicketParams[name] = value;
    }
    this.name = '';
    this.value = '';
  }

  remove(cr) {
    delete this.integration.createTicketParams[cr.key];
  }

  addUpdateTicketParams(nameUpdateParams: string, valueUpdateParams: string) {
    if (!nameUpdateParams || !valueUpdateParams) {
      this.snackbar.open('Please enter name and value!', 'Close', { duration: 3000 });
      return;
    }
    this.integration.updateTicketParams[nameUpdateParams] = valueUpdateParams;
    this.nameUpdateParams = '';
    this.valueUpdateParams = '';
  }

  removeUpdateParam(cr) {
    delete this.integration.updateTicketParams[cr.key];
  }
}
