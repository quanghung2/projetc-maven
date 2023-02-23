import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Extension, Rule, RuleAction } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { filter, finalize, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../shared/contants';
import { AddEditDialogComponent } from './add-edit-dialog/add-edit-dialog.component';

enum RuleType {
  internal = 'internal',
  anonymous = 'anonymous'
}

enum ActionType {
  edit = 'Edit',
  delete = 'Delete'
}

@Component({
  selector: 'b3n-inbound-call-filter',
  templateUrl: './inbound-call-filter.component.html',
  styleUrls: ['./inbound-call-filter.component.scss']
})
export class InboundCallFilterComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns: string[] = ['index', 'matchingPattern', 'action', 'function'];
  extension: Extension;
  internalChecked: boolean;
  anonymousChecked: boolean;
  customRules: Rule[];
  loading: boolean;
  pagingCustomRules: Rule[];
  pageSize = 5;
  pageStart = 0;
  actionMap = {
    block: 'Block Call',
    delegate: 'Ring Delegates',
    forward: 'Forward Call',
    ringDevices: 'Ring Devices'
  };

  readonly RuleType = RuleType;
  readonly ActionType = ActionType;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.extensionQuery
      .selectActive()
      .pipe(
        filter(ext => ext != null),
        takeUntil(this.destroySubscriber$),
        tap(async ext => {
          if (ext instanceof Extension) {
            this.extension = new Extension(cloneDeep(ext));
          } else {
            await this.extensionService.getDetails(ext.extKey).toPromise();
            this.extension = new Extension(cloneDeep(this.extensionQuery.getExtensionByKey(ext.extKey)));
          }

          const { internal, anonymous, customRules } = this.extension.incomingFilterRule;

          this.internalChecked = internal === RuleAction.ringDevices ? true : false;
          this.anonymousChecked = anonymous === RuleAction.block ? true : false;
          this.customRules = [...customRules];

          if (this.pageStart && this.pageStart === this.customRules.length) {
            this.pageStart -= this.pageSize;
            this.paginator.pageIndex = this.paginator.pageIndex - 1;
          }

          this.pagingCustomRules = this.customRules.slice(this.pageStart, this.pageStart + this.pageSize);
        })
      )
      .subscribe();
  }

  toggleChange(change: MatSlideToggleChange, type: RuleType) {
    switch (type) {
      case RuleType.internal:
        this.extension.incomingFilterRule.internal = change.checked ? RuleAction.ringDevices : RuleAction.gothrough;
        break;
      case RuleType.anonymous:
        this.extension.incomingFilterRule.anonymous = change.checked ? RuleAction.block : RuleAction.gothrough;
        break;
      default:
        break;
    }

    this.updateExtension(this.extension);
  }

  updateExtension(extension: Partial<Extension>) {
    this.loading = true;
    this.extensionService
      .update(this.extension.extKey, extension)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        _ => {
          this.toastService.success('Apply successfully!');
        },
        error => {
          this.toastService.error(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }

  displayMatchPattern(rule: Rule): string {
    return rule.type === 'startWith' ? `Starts with ${rule.startWith}` : `${rule.exactMatch}`;
  }

  editOrDel(type: ActionType, index: number) {
    if (type === ActionType.edit) {
      this.openDialog(type, index);
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete rule',
          message: 'Are you sure to delete this rule?',
          confirmLabel: 'Confirm',
          color: 'warn'
        },
        width: '500px'
      })
      .afterClosed()
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(confirmed => {
          if (confirmed) {
            const extension: Partial<Extension> = {
              incomingFilterRule: {
                ...this.extension.incomingFilterRule,
                customRules: [...this.extension.incomingFilterRule.customRules]
              }
            };

            extension.incomingFilterRule.customRules.splice(index, 1);

            this.updateExtension(extension);
          }
        })
      )
      .subscribe();
  }

  openDialog(title: string, index: number = -1) {
    const dialogRef = this.dialog.open(AddEditDialogComponent, {
      disableClose: true,
      data: {
        title,
        extKey: this.extension.extKey,
        incomingFilterRule: this.extension.incomingFilterRule,
        index
      }
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter((isAdd: any) => typeof isAdd === 'boolean' && isAdd),
        tap(_ => this.paginator.lastPage())
      )
      .subscribe();
  }

  page(e: PageEvent) {
    const condition = e.pageIndex * e.pageSize;

    if (this.pageStart === condition) {
      this.paginator.previousPage();
      return;
    }

    this.pageStart = condition;
    this.pagingCustomRules =
      this.pageStart - 1 < 0
        ? this.customRules.slice(0, this.pageSize)
        : this.customRules.slice(this.pageStart, this.pageStart + this.pageSize);
  }
}
