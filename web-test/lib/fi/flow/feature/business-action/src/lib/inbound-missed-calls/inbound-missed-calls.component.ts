import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  ActionBaUserReq,
  ActionBaUserState,
  ActionDef,
  ActionDefService,
  BaUser,
  BaUserService,
  Connector,
  InputBaUserReq,
  SaveBaUserReq
} from '@b3networks/api/flow';
import { BaUserGroupID } from '@b3networks/fi/flow/shared';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'b3n-ba-inbound-missed-calls',
  templateUrl: './inbound-missed-calls.component.html',
  styleUrls: ['./inbound-missed-calls.component.scss']
})
export class InboundMissedCallsComponent implements OnInit, AfterContentChecked {
  @Input() inputReq: InputBaUserReq;

  ActionBaUserState = ActionBaUserState;
  baUser: BaUser = <BaUser>{ actions: [] };
  actionCtrl = new FormControl<string>('hangup');
  actionDefs: ActionDef[] = [];
  saveReq: SaveBaUserReq;
  addActionReqInput: ActionDef[] = [];
  addActionReqOutput: ActionBaUserReq[] = [];
  invalidTriggerReq: boolean;
  invalidActionReq: boolean[] = [];
  saving: boolean;

  constructor(
    private cdr: ChangeDetectorRef,
    private baUserService: BaUserService,
    private actionDefService: ActionDefService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    let releaseGroupId = <string>BaUserGroupID.INBOUND_MISSED_CALLS;
    if (X.orgUuid === 'f17b4dd0-1d78-49c7-8e31-ca4b0ad1f9b9') {
      releaseGroupId = `${releaseGroupId}Test`;
    }

    this.saveReq = {
      trigger: null,
      actions: [],
      additionalKey: this.inputReq.additionalKey,
      extraAuditInfo: {
        auditData: {
          fromApp: releaseGroupId,
          target: this.inputReq.additionalKey
        }
      }
    };
    forkJoin([
      this.baUserService.getBaUser(releaseGroupId, this.inputReq.triggerDef.originalUuid, this.inputReq.additionalKey),
      this.actionDefService.getBusinessActionDefs({
        triggerDefUuid: this.inputReq.triggerDef.uuid,
        additionalKey: this.inputReq.additionalKey,
        excludeInUse: false,
        releaseGroupId: releaseGroupId
      })
    ]).subscribe(([baUser, actionDefs]) => {
      actionDefs.push(<ActionDef>{ uuid: 'hangup', presentName: 'Hang Up' });
      this.actionDefs = actionDefs;
      if (baUser) {
        this.setBaUser(baUser);
      } else {
        this.actionCtrl.setValue('hangup', { emitEvent: false });
      }
    });

    this.actionCtrl.valueChanges.subscribe(uuid => {
      this.baUser.actions.length = 0;
      this.saveReq.actions.length = 0;
      this.addActionReqInput.length = 0;
      const a = this.actionDefs.find(a => a.uuid === uuid);
      if (a.uuid !== 'hangup') {
        const connectors: Connector[] = [];
        a.businessActionRelatedConnectors.forEach(c => {
          connectors.push(new Connector(c));
        });
        this.addActionReqInput.push(a);
        this.invalidActionReq.push(false);
      }
    });
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  private setBaUser(baUser: BaUser) {
    this.baUser = baUser;
    this.saveReq.actions.length = 0;
    this.addActionReqInput.length = 0;
    this.addActionReqOutput.length = 0;
    if (this.baUser.actions.length > 0) {
      const curActionDef = this.actionDefs.find(a => a.originalUuid === this.baUser.actions[0].actionDef.originalUuid);
      if (curActionDef) {
        this.actionCtrl.setValue(curActionDef.uuid, { emitEvent: false });
      }
      this.baUser.actions.forEach(a => {
        a.showLatestActionDef = false;
        if (
          a.state === ActionBaUserState.NEW_BUSINESS_ACTION_AND_NEW_EVENT ||
          a.state === ActionBaUserState.NEW_EVENT
        ) {
          a.showLatestActionDef = true;
        }
        a.actionDef.hasParameter = a.actionDef.parameters.filter(p => !p.hidden).length > 0;
      });
      this.invalidActionReq = new Array(this.baUser.actions.length).fill(false);
    }
  }

  actionReqValid() {
    return this.invalidActionReq.every(i => i == false);
  }

  submit() {
    if (!this.invalidTriggerReq && this.actionReqValid()) {
      this.saving = true;
      const req: SaveBaUserReq = cloneDeep(this.saveReq);
      req.actions = req.actions.concat(this.addActionReqOutput);
      if (req.actions.length == 0) {
        this.baUserService
          .deactivateBaUser(this.inputReq.triggerDef.originalUuid, req)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe({
            next: () => {
              this.setBaUser({ actions: [], additionalKey: '', trigger: null });
              this.toastService.success('Apply successfully');
            },
            error: err => this.toastService.error(err.message)
          });
      } else {
        this.baUserService
          .saveBaUser(req)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe({
            next: baUser => {
              this.setBaUser(baUser);
              this.toastService.success('Apply successfully');
            },
            error: err => this.toastService.error(err.message)
          });
      }
    }
  }
}
