import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationType, Connector } from '@b3networks/api/flow';
import { ConnectorConfigComponent } from '../../connector-config/connector-config.component';

export interface SetConnectorConfigDialogInput {
  connector: Connector;
  isEdit: boolean;
}

@Component({
  selector: 'b3n-set-connector-config-dialog',
  templateUrl: './set-connector-config-dialog.component.html',
  styleUrls: ['./set-connector-config-dialog.component.scss']
})
export class SetConnectorConfigDialogComponent {
  @ViewChild('config') config: ConnectorConfigComponent;

  AuthenticationType = AuthenticationType;
  configInvalid: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputDialog: SetConnectorConfigDialogInput,
    public dialogRef: MatDialogRef<SetConnectorConfigDialogComponent>
  ) {}

  setConfig() {
    if (!this.configInvalid) {
      this.config.setConfig(value => {
        if (value) {
          this.dialogRef.close(true);
        }
      });
    }
  }
}
