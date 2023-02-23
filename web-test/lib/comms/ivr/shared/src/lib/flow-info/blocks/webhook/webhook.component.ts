import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ContextParameter, WebhookBlock } from '@b3networks/api/ivr';
import * as _ from 'lodash';
import { PlaceholderComponent } from '../../placeholder/placeholder.component';

@Component({
  selector: 'b3n-webhook',
  templateUrl: './webhook.component.html',
  styleUrls: ['./webhook.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class WebhookComponent implements OnInit, OnChanges {
  @Input() block: WebhookBlock = new WebhookBlock();

  headerName: string;
  headerValue: string;

  addedHeaders: KeyValue<string, string>[] = [];

  parameterName: string;
  parameterValue: string;

  addedParameters: KeyValue<string, string>[] = [];
  contextValue: string;
  scriptValue: string;
  asKeyValue: string;
  workflowUuid: string;

  contentType = 'application/json';

  constructor(private dialog: MatDialog, private route: ActivatedRoute) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    this.updateHeaderList();
    this.updateParameterList();

    if (this.block.webHookCommand.headers['Content-Type']) {
      this.contentType = this.block.webHookCommand.headers['Content-Type'];
    }
  }

  addHeader() {
    if (this.headerName && this.headerValue) {
      this.block.webHookCommand.headers[this.headerName] = this.headerValue;
      this.updateHeaderList();
      this.headerName = '';
      this.headerValue = '';
    }
  }

  deleteHeader(headerName: string) {
    if (headerName.toLowerCase() == 'all') {
      const headerKeys: string[] = Object.keys(this.block.webHookCommand.headers);
      _.forEach(headerKeys, key => {
        delete this.block.webHookCommand.headers[key];
      });

      this.updateHeaderList();
      return;
    }

    delete this.block.webHookCommand.headers[headerName];
    this.updateHeaderList();
  }

  updateHeaderList() {
    let headerKeys: string[] = Object.keys(this.block.webHookCommand.headers);
    headerKeys = _.filter(headerKeys, key => {
      return key !== 'Content-Type';
    });

    this.addedHeaders = _.map(headerKeys, key => {
      return { key: key, value: this.block.webHookCommand.headers[key] };
    });
  }

  addParameter() {
    if (this.parameterName && this.parameterValue) {
      this.block.webHookCommand.parameters[this.parameterName] = this.parameterValue;
      this.updateParameterList();
      this.parameterName = '';
      this.parameterValue = '';
    }
  }

  deleteParameter(parameterName: string) {
    if (parameterName.toLowerCase() == 'all') {
      const parameterKeys: string[] = Object.keys(this.block.webHookCommand.parameters);
      _.forEach(parameterKeys, key => {
        delete this.block.webHookCommand.parameters[key];
      });

      this.updateParameterList();
      return;
    }

    delete this.block.webHookCommand.parameters[parameterName];
    this.updateParameterList();
  }

  updateParameterList() {
    const parameterKeys: string[] = Object.keys(this.block.webHookCommand.parameters);
    this.addedParameters = _.map(parameterKeys, key => {
      return { key: key, value: this.block.webHookCommand.parameters[key] };
    });
  }

  selectContentType(value) {
    this.contentType = value;
    this.block.webHookCommand.headers['Content-Type'] = value;
  }

  addContextParameter() {
    if (this.contextValue && this.asKeyValue && this.scriptValue) {
      const existed = _.find(this.block.webHookCommand.contextParameters, (entry: ContextParameter) => {
        if (entry.asKey == this.asKeyValue) {
          entry.context = this.contextValue;
          entry.script = this.scriptValue;
          return true;
        }

        return false;
      });

      if (!existed) {
        this.block.webHookCommand.contextParameters.push(
          new ContextParameter(this.contextValue, this.asKeyValue, this.scriptValue)
        );
      }

      this.contextValue = '';
      this.asKeyValue = '';
      this.scriptValue = '';
    }
  }

  deleteContextParameter(contextParameterName: string) {
    if (contextParameterName.toLowerCase() == 'all') {
      this.block.webHookCommand.contextParameters = [];
      return;
    }

    this.block.webHookCommand.contextParameters = _.filter(
      this.block.webHookCommand.contextParameters,
      (entry: ContextParameter) => {
        return entry.asKey !== contextParameterName;
      }
    );
  }

  openPlaceholderDialog() {
    this.route.parent.params.subscribe(params => (this.workflowUuid = params[`uuid`]));
    this.dialog.open(PlaceholderComponent, {
      width: `500px`,
      minHeight: `420px`,
      hasBackdrop: false,
      disableClose: true,
      data: { workflowUuid: this.workflowUuid }
    });
  }
}
