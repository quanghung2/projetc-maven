import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { BaCreatorActionDef, BaCreatorMutex, BaCreatorService } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-relationship-dialog',
  templateUrl: './relationship-dialog.component.html',
  styleUrls: ['./relationship-dialog.component.scss']
})
export class RelationshipDialogComponent implements OnInit {
  @ViewChild('expand') expand: MatExpansionPanel;

  submitting: boolean;
  baActionDefs: BaCreatorActionDef[] = [];
  actions: BaCreatorActionDef[] = [];
  actionsNotUse: BaCreatorActionDef[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public mutex: BaCreatorMutex,
    private dialogRef: MatDialogRef<RelationshipDialogComponent>,
    private baCreatorService: BaCreatorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.baCreatorService.getBaActionDef().subscribe(baActionDefs => {
      this.baActionDefs = baActionDefs;
      this.actionsNotUse = baActionDefs;
      if (this.mutex) {
        this.actions = baActionDefs.filter(bad => this.mutex.actions.find(a => bad.uuid === a.uuid));
        this.actionsNotUse = baActionDefs.filter(bad => !this.mutex.actions.find(a => bad.uuid === a.uuid));
      }
    });
  }

  add(action: BaCreatorActionDef) {
    this.actions.push(action);
    this.actionsNotUse = this.baActionDefs.filter(bad => !this.actions.find(a => bad.uuid === a.uuid));
  }

  delete(action: BaCreatorActionDef) {
    this.actions = this.actions.filter(a => a.uuid !== action.uuid);
    this.actionsNotUse = this.baActionDefs.filter(bad => !this.actions.find(a => bad.uuid === a.uuid));
    if (this.expand.closed && this.actions.length == 0) {
      this.expand.open();
    }
  }

  save() {
    if (this.actions.length > 0) {
      this.submitting = true;
      const uuids = this.actions.map(a => a.uuid);
      if (this.mutex) {
        this.baCreatorService.updateBaMutex(this.mutex.id, uuids).subscribe({
          next: () => {
            this.toastService.success('Relationship has been updated');
            this.dialogRef.close(true);
          },
          error: () => this.toastService.error('Update relationship failed')
        });
      } else {
        this.baCreatorService.createBaMutex(uuids).subscribe({
          next: () => {
            this.toastService.success('Relationship has been created');
            this.dialogRef.close(true);
          },
          error: () => this.toastService.error('Create relationship failed')
        });
      }
    }
  }
}
