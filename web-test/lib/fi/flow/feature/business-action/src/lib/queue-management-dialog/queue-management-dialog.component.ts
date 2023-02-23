import { AfterContentChecked, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ActionBaUserReq,
  ActionBaUserState,
  ActionDef,
  ActionDefService,
  BaCreatorMutex,
  BaCreatorService,
  BaUser,
  BaUserService,
  Connector,
  InputBaUserReq,
  SaveBaUserReq
} from '@b3networks/api/flow';
import { BaUserGroupID } from '@b3networks/fi/flow/shared';
import { X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'b3n-queue-management-dialog',
  templateUrl: './queue-management-dialog.component.html',
  styleUrls: ['./queue-management-dialog.component.scss']
})
export class QueueManagementDialogComponent implements OnInit, AfterContentChecked {
  ActionBaUserState = ActionBaUserState;
  baUser: BaUser = <BaUser>{ actions: [] };
  sourceActionDefs: ActionDef[] = [];
  actionDefs: ActionDef[] = [];
  baRelationship: BaCreatorMutex[];
  saveReq: SaveBaUserReq;
  addActionReqInput: ActionDef[] = [];
  addActionReqOutput: ActionBaUserReq[] = [];
  invalidTriggerReq: boolean;
  invalidActionReq: boolean[] = [];
  alreadyExpanded: boolean[] = [];
  saving: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputReq: InputBaUserReq,
    private dialogRef: MatDialogRef<QueueManagementDialogComponent>,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private baUserService: BaUserService,
    private actionDefService: ActionDefService,
    private baCreatorService: BaCreatorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    let releaseGroupId = <string>BaUserGroupID.QUEUE_MANAGEMENT;
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
      this.baCreatorService.getAllBaMutex(),
      this.baUserService.getBaUser(releaseGroupId, this.inputReq.triggerDef.originalUuid, this.inputReq.additionalKey),
      this.actionDefService.getBusinessActionDefs({
        triggerDefUuid: this.inputReq.triggerDef.uuid,
        additionalKey: this.inputReq.additionalKey,
        excludeInUse: false,
        releaseGroupId: releaseGroupId
      })
    ]).subscribe(([baRelationship, baUser, actionDefs]) => {
      if (baUser) {
        this.baUser = baUser;
        this.baUser.actions.forEach(a => {
          a.showLatestActionDef = false;
          if (
            a.state === ActionBaUserState.NEW_BUSINESS_ACTION_AND_NEW_EVENT ||
            a.state === ActionBaUserState.NEW_EVENT
          ) {
            a.showLatestActionDef = true;
          }
        });
        this.invalidActionReq = new Array(this.baUser.actions.length).fill(false);
        this.alreadyExpanded = new Array(this.baUser.actions.length).fill(true);
      }
      this.baRelationship = baRelationship;
      this.sourceActionDefs = actionDefs;
      this.filterActionDefs();
    });
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  selectActionDef(a: ActionDef) {
    const connectors: Connector[] = [];
    a.businessActionRelatedConnectors.forEach(c => {
      connectors.push(new Connector(c));
    });
    this.addActionReqInput.push(a);
    this.invalidActionReq.push(false);
    this.alreadyExpanded.push(false);
    this.filterActionDefs();
    setTimeout(() => {
      const element = document.getElementById(`add_${this.addActionReqInput.length - 1}`);
      element.scrollIntoView();
    }, 300);
  }

  private filterActionDefs() {
    const blackActionDefUuids: string[] = [];
    this.baUser.actions.forEach(a => {
      this.baRelationship.forEach(r => {
        const group = r.group.find(uuid => a.actionDef.originalUuid === uuid);
        if (group) {
          blackActionDefUuids.push(...r.group);
        }
      });
      blackActionDefUuids.push(a.actionDef.originalUuid);
    });

    this.addActionReqInput.forEach(a => {
      this.baRelationship.forEach(r => {
        const group = r.group.find(uuid => a.originalUuid === uuid);
        if (group) {
          blackActionDefUuids.push(...r.group);
        }
      });
      blackActionDefUuids.push(a.originalUuid);
    });

    this.actionDefs = this.sourceActionDefs.filter(s => !blackActionDefUuids.find(uuid => s.originalUuid === uuid));
  }

  removeAction(index: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Remove action',
          message: `Are you sure to remove this action?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.baUser.actions.splice(index, 1);
          this.saveReq.actions.splice(index, 1);
          this.invalidActionReq.splice(index, 1);
          this.alreadyExpanded.splice(index, 1);
          this.filterActionDefs();
        }
      });
  }

  removeNewAction(index: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Remove action',
          message: `Are you sure to remove this action?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.addActionReqInput.splice(index, 1);
          this.addActionReqOutput.splice(index, 1);
          const i = index + this.baUser.actions.length;
          this.invalidActionReq.splice(i, 1);
          this.alreadyExpanded.splice(i, 1);
          this.filterActionDefs();
        }
      });
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
              if (this.baUser.trigger) {
                this.toastService.success('Save successfully');
              } else {
                this.toastService.success('Nothing to save: no action configured');
              }
              this.dialogRef.close();
            },
            error: err => this.toastService.error(err.message)
          });
      } else {
        this.baUserService
          .saveBaUser(req)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe({
            next: () => {
              this.toastService.success('Save successfully');
              this.dialogRef.close();
            },
            error: err => this.toastService.error(err.message)
          });
      }
    }
  }
}
