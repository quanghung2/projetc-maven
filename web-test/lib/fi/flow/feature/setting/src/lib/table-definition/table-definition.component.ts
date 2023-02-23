import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AuthorActionDef, AuthorDataSource, AuthorService, AuthorTriggerDef, GroupType } from '@b3networks/api/flow';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import {
  EditDefGeneralDialogComponent,
  EditDefGeneralDialogInput
} from './edit-def-general-dialog/edit-def-general-dialog.component';
import {
  TriggerLinkDialogComponent,
  TriggerLinkDialogInput
} from './trigger-link-dialog/trigger-link-dialog.component';

@Component({
  selector: 'b3n-table-definition',
  templateUrl: './table-definition.component.html',
  styleUrls: ['./table-definition.component.scss']
})
export class TableDefinitionComponent implements OnChanges {
  @Input() defs: (AuthorTriggerDef | AuthorActionDef | AuthorDataSource)[];
  @Input() displayedColumns: string[];
  @Input() connectorUuid: string;
  @Input() isShowVisibility: boolean;
  @Output() editTriggerDef = new EventEmitter<AuthorTriggerDef>();
  @Output() editActionDef = new EventEmitter<AuthorActionDef>();
  @Output() editDataSource = new EventEmitter<AuthorDataSource>();
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onReload = new EventEmitter();

  dataSource: MatTableDataSource<AuthorTriggerDef | AuthorActionDef | AuthorDataSource>;
  GroupType = GroupType;

  constructor(private toastr: ToastService, private authorService: AuthorService, private dialog: MatDialog) {}

  ngOnChanges(): void {
    this.dataSource = new MatTableDataSource<AuthorTriggerDef | AuthorActionDef | AuthorDataSource>(this.defs);
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  editDef(def: AuthorTriggerDef | AuthorActionDef | AuthorDataSource) {
    switch (def.groupType) {
      case GroupType.EVENT:
        this.editTriggerDef.emit(def as AuthorTriggerDef);
        break;
      case GroupType.ACTION:
        this.editActionDef.emit(def as AuthorActionDef);
        break;
      case GroupType.DATASOURCE:
        this.editDataSource.emit(def as AuthorDataSource);
        break;
    }
  }

  linkTrigger(def: AuthorActionDef) {
    this.dialog.open(TriggerLinkDialogComponent, {
      width: '500px',
      panelClass: 'fif-dialog',
      disableClose: true,
      autoFocus: false,
      data: <TriggerLinkDialogInput>{
        connectorUuid: this.connectorUuid,
        actionDefUuid: def.uuid
      }
    });
  }

  onDeprecatedAction(def: AuthorTriggerDef | AuthorActionDef) {
    if (def.groupType === GroupType.ACTION) {
      this.authorService.postDefAction(this.connectorUuid, def.uuid).subscribe({
        next: () => {
          this.toastr.success('Deprecate action definition successfully');
          this.onReload.emit();
        },
        error: err => this.toastr.error(err.message)
      });
    }
    if (def.groupType === GroupType.EVENT) {
      this.authorService.postDefTrigger(this.connectorUuid, def.uuid).subscribe({
        next: () => {
          this.toastr.success('Deprecate event definition successfully');
          this.onReload.emit();
        },
        error: err => this.toastr.error(err.message)
      });
    }
  }

  confirmDeprecated(def: AuthorTriggerDef | AuthorActionDef) {
    const type = def.groupType?.toLowerCase();
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        panelClass: 'fif-dialog',
        data: <ConfirmDialogInput>{
          title: `Deprecate ${type} definition`,
          message: `Are you sure want to deprecate this ${type} definition`,
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.onDeprecatedAction(def);
        }
      });
  }

  showEditDefinition(def: AuthorTriggerDef | AuthorActionDef) {
    if (def.groupType === GroupType.DATASOURCE) {
      return;
    }
    this.dialog
      .open(EditDefGeneralDialogComponent, {
        width: '400px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <EditDefGeneralDialogInput>{
          type: def.groupType,
          def: def,
          connectorUuid: this.connectorUuid,
          isShowVisibility: this.isShowVisibility
        }
      })
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this.onReload.emit();
        }
      });
  }
}
