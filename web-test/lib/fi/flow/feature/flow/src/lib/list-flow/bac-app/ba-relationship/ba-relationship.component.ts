import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BaCreatorActionDef, BaCreatorMutex, BaCreatorService } from '@b3networks/api/flow';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RelationshipDialogComponent } from './relationship-dialog/relationship-dialog.component';

@Component({
  selector: 'b3n-ba-relationship',
  templateUrl: './ba-relationship.component.html',
  styleUrls: ['./ba-relationship.component.scss']
})
export class BaRelationshipComponent implements OnInit {
  loading: boolean;
  baActionDefs: BaCreatorActionDef[];
  baMutexs: BaCreatorMutex[];
  displayedColumns: string[] = ['id', 'actions', 'lastUpdatedAt', 'action'];

  constructor(private dialog: MatDialog, private baCreatorService: BaCreatorService, private toast: ToastService) {}

  ngOnInit(): void {
    this.getBaMutex();
  }

  private getBaMutex() {
    this.loading = true;
    forkJoin([this.baCreatorService.getBaActionDef(), this.baCreatorService.getAllBaMutex()])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(([baActionDefs, baMutexs]) => {
        baMutexs.map(b => {
          b.actions = [];
          b.group.forEach(g => {
            const action = baActionDefs.find(bad => bad.uuid === g);
            if (action) {
              b.actions.push(action);
            }
          });
        });
        this.baActionDefs = baActionDefs;
        this.baMutexs = baMutexs;
      });
  }

  createMutex() {
    this.dialog
      .open(RelationshipDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'fif-dialog'
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getBaMutex();
        }
      });
  }

  updateMutex(mutex: BaCreatorMutex) {
    this.dialog
      .open(RelationshipDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'fif-dialog',
        data: mutex
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getBaMutex();
        }
      });
  }

  deleteMutex(id: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Delete relationship',
          message: 'Are you sure you want to delete this relationship?',
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.baCreatorService.deleteBaMutex(id).subscribe({
            next: () => {
              this.toast.success(`Relationship has been deleted`);
              this.getBaMutex();
            },
            error: () => this.toast.error(`Delete relationship failed`)
          });
        }
      });
  }
}
