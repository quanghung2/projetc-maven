import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { Extension, ExtensionBLFQuery, ExtensionBLFService } from '@b3networks/api/bizphone';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-ext-blf',
  templateUrl: './update-ext-blf-dialog.component.html',
  styleUrls: ['./update-ext-blf-dialog.component.scss']
})
export class UpdateExtBLFDialogComponent extends DestroySubscriberComponent implements OnInit {
  monitorExtKey: string;
  extensions$: Observable<Extension[]>;
  searchCtrl = new UntypedFormControl();
  selection = new SelectionModel<string>(true, []);
  saving: boolean;

  constructor(
    private dialogRef: MatDialogRef<UpdateExtBLFDialogComponent>,
    private extensionBLFQuery: ExtensionBLFQuery,
    private extensionBLFService: ExtensionBLFService,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.extensionBLFQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(extBLF => {
          this.monitorExtKey = extBLF.monitorExtKey;
          this.selection.select(...extBLF.moniteesExtKeys);
          if (this.selection.selected.length >= 20) {
            this.searchCtrl.disable();
          }
        })
      )
      .subscribe();

    this.extensions$ = <Observable<Extension[]>>this.searchCtrl.valueChanges.pipe(startWith('')).pipe(
      switchMap(value => {
        return this.extensionBLFService
          .getAvailableExts({ keyword: value }, { page: 0, perPage: 20 })
          .pipe(map(res => res.filter(e => !this.selection.selected.includes(e.extKey))));
      })
    );
  }

  update() {
    this.saving = true;
    this.extensionBLFService
      .updateExtBLF(this.monitorExtKey, { extKeyMonitees: this.selection.selected })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        _ => {
          this.toastr.success(`Extension BLF has been updated`);
          this.dialogRef.close(true);
        },
        error => this.toastr.error(error.message)
      );
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const text = event.option.value?.trim();
    if (!text) {
      return;
    }
    this.selection.selected.push(text);
    if (this.selection.selected.length >= 20) {
      this.searchCtrl.disable();
    }

    this.searchCtrl.setValue(null);
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selection.selected, event.previousIndex, event.currentIndex);
  }

  deleteExt(extkey: string) {
    this.selection.selected.splice(this.selection.selected.indexOf(extkey), 1);
    if (this.selection.selected.length < 20) {
      this.searchCtrl.enable();
    }
  }
}
