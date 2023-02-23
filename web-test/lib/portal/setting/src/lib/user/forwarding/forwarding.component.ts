import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { EnumTransferCallerIdOption, Extension, ExtensionBase, RingMode } from '@b3networks/api/bizphone';
import { ExtensionGroup, ExtensionGroupService, ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, finalize, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../shared/contants';

export enum EXT_TYPE {
  extension = 'extension',
  call_group = 'callGroup',
  phone_number = 'phoneNumber'
}
@Component({
  selector: 'b3n-forwarding',
  templateUrl: './forwarding.component.html',
  styleUrls: ['./forwarding.component.scss']
})
export class ForwardingComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  extension: Extension;

  extensions$: Observable<ExtensionBase[]>;
  extensionGroups$: Observable<ExtensionGroup[]>;
  extensionCtrl = new UntypedFormControl();
  progressing: boolean;
  MAX_NUMBER_ADDED = 5;
  forwardList: KeyValue<string, string>[] = [];
  callGroups: ExtensionGroup[] = [];

  readonly RingMode = RingMode;
  readonly optRingTime: KeyValue<number, string>[] = [
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' },
    { key: 90, value: '90' }
  ];
  readonly EXT_TYPE = EXT_TYPE;

  private _change$ = new BehaviorSubject<boolean>(true);

  readonly EnumTransferCallerIdOption = EnumTransferCallerIdOption;

  @ViewChild('extensionInput') extensionInput: ElementRef;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastr: ToastService,
    private extensionGroupService: ExtensionGroupService
  ) {
    super();
  }

  ngOnInit() {
    this.extensionQuery
      .selectActive()
      .pipe(
        filter(ext => ext != null && ext instanceof Extension),
        takeUntil(this.destroySubscriber$),
        tap(ext => {
          this.extension = new Extension(cloneDeep(ext));

          this.extensionGroupService
            .getListExtensionGroup({ keyword: '' }, new Pageable(0, 1000))
            .subscribe(callGroups => {
              this.callGroups = callGroups.data;
              this.forwardList = this.extension.cfConfig.forwardList.map(p => {
                if (p?.length <= 5) {
                  if (this.callGroups.some(c => c.extKey === p)) {
                    return {
                      key: EXT_TYPE.call_group,
                      value: p
                    };
                  }
                  return {
                    key: EXT_TYPE.extension,
                    value: p
                  };
                }
                return {
                  key: EXT_TYPE.phone_number,
                  value: p
                };
              });

              if (this.forwardList.length < this.MAX_NUMBER_ADDED) {
                this.extensionCtrl.enable();
              } else {
                this.extensionCtrl.disable();
              }
            });
        })
      )
      .subscribe();

    this.extensions$ = combineLatest([this.extensionCtrl.valueChanges.pipe(startWith('')), this._change$])
      .pipe(debounceTime(100), takeUntil(this.destroySubscriber$))
      .pipe(
        switchMap(([value, _]) => {
          value = value?.toLocaleLowerCase();
          if (!value) {
            return this.extensionQuery.selectAll({
              filterBy: e => !this.forwardList.some(p => p.key === EXT_TYPE.extension && p.value === e.extKey)
            });
          }
          return this.extensionQuery.selectAll({
            filterBy: e =>
              (e.extKey?.toLocaleLowerCase().includes(value) || e.extLabel?.toLocaleLowerCase().includes(value)) &&
              !this.forwardList.some(p => p.key === EXT_TYPE.extension && p.value === e.extKey)
          });
        })
      );

    this.extensionGroups$ = combineLatest([this.extensionCtrl.valueChanges.pipe(startWith('')), this._change$])
      .pipe(debounceTime(300))
      .pipe(
        switchMap(([value, _]) => {
          value = value?.toLocaleLowerCase();
          return this.extensionGroupService
            .getListExtensionGroup({ keyword: value }, new Pageable(0, 50))
            .pipe(
              map(p =>
                p.data.filter(e => !this.forwardList.some(p => p.key === EXT_TYPE.call_group && p.value === e.extKey))
              )
            );
        })
      );
  }

  override ngOnDestroy() {
    this._change$.next(true);
    this._change$.complete();
  }

  displayFn(ext: Extension): string {
    return ext ? ext.displayText : '';
  }

  selected(value: string): void {
    const text = value?.trim();
    if (!text) {
      return;
    }

    if (value.length <= 5) {
      if (!this.forwardList.some(x => x.value === text)) {
        if (this.callGroups.some(p => p.extKey === text)) {
          this.forwardList.push({ key: EXT_TYPE.call_group, value: text });
        } else {
          this.forwardList.push({ key: EXT_TYPE.extension, value: text });
        }
      }
    } else {
      this.forwardList.push({ key: EXT_TYPE.phone_number, value: text });
    }

    if (this.forwardList.length >= this.MAX_NUMBER_ADDED) {
      this.extensionCtrl.disable();
    }
    this._change$.next(true);
    this.extensionCtrl.setValue(null);
    this.extensionInput.nativeElement?.blur();
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.forwardList, event.previousIndex, event.currentIndex);
  }

  deleteCodeOption(codeOption: string) {
    if (!this.forwardList) {
      return;
    }

    if (codeOption.length <= 5) {
      if (this.callGroups.some(p => p.extKey === codeOption)) {
        this.forwardList.splice(
          this.forwardList.findIndex(e => e.key === EXT_TYPE.call_group && e.value === codeOption),
          1
        );
      } else {
        this.forwardList.splice(
          this.forwardList.findIndex(e => e.key === EXT_TYPE.extension && e.value === codeOption),
          1
        );
      }
    } else {
      this.forwardList.splice(
        this.forwardList.findIndex(e => e.key === EXT_TYPE.phone_number && e.value === codeOption),
        1
      );
    }

    if (this.forwardList.length < this.MAX_NUMBER_ADDED) {
      this.extensionCtrl.enable();
    }
    this._change$.next(true);
  }

  onSave() {
    this.extension.cfConfig.forwardList = this.forwardList.map(p => p.value);
    this.progressing = true;

    this.extensionService
      .update(this.extension.extKey, {
        cfConfig: { ...this.extension.cfConfig, version: 'v2' }, // always set version: v2 for updating
        transferCallerIdConfig: this.extension.transferCallerIdConfig,
        mailBox: this.extension.mailBox
      })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastr.success('Apply successfully!');
        },
        error => {
          this.toastr.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }
}
