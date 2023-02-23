import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { GetMembersReq, OrgMemberService } from '@b3networks/api/auth';
import { Extension, ExtensionBase, RingMode } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { Status } from '@b3networks/api/member';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, filter, finalize, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'b3n-settings-forwarding',
  templateUrl: './settings-forwarding.component.html',
  styleUrls: ['./settings-forwarding.component.scss']
})
export class SettingsForwardingComponent implements OnInit, OnDestroy {
  @ViewChild('extensionInput') extensionInput: ElementRef;

  readonly RingMode = RingMode;
  private _change$ = new BehaviorSubject<boolean>(true);
  private _complete$ = new BehaviorSubject<boolean>(true);
  private _destroy$ = new Subject<boolean>();

  extensions$: Observable<ExtensionBase[]>;
  extension: Extension;
  extensionSelected: string[] = [];
  defaultExtensionSelected: string[] = [];
  extensionCtrl = new UntypedFormControl();
  MAX_NUMBER_ADDED = 5;
  saving: boolean;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    private orgMemberService: OrgMemberService,
    public settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    combineLatest([this.extensionQuery.selectActive(), this._complete$])
      .pipe(
        takeUntil(this._destroy$),
        filter(([ext, _]) => !!ext),
        tap(([ext, _]) => {
          this.extension = cloneDeep(new Extension(ext));
          this.extensionSelected = this.extension.cfConfig.forwardList;
          this.defaultExtensionSelected = cloneDeep(this.extension.cfConfig.forwardList);

          if (this.extensionSelected.length < this.MAX_NUMBER_ADDED) {
            this.extensionCtrl.enable();
          } else {
            this.extensionCtrl.disable();
          }

          const req = <GetMembersReq>{
            orgUuid: X.orgUuid,
            sort: 'asc',
            filterExtension: true,
            status: Status.ACTIVE
          };

          this.extensions$ = combineLatest([this.extensionCtrl.valueChanges.pipe(startWith('')), this._change$])
            .pipe(debounceTime(500))
            .pipe(
              switchMap(([value, _]) => {
                if (!value) {
                  value = '';
                } else {
                  value = value.toLocaleLowerCase();
                }

                req.keyword = value;

                return this.orgMemberService.getDirectoryMembers(req).pipe(
                  map(res => {
                    const members = res.content;
                    const exts = members.map(
                      member =>
                        new ExtensionBase({
                          extKey: member.extensionKey,
                          extLabel: member.extensionLabel
                        })
                    );

                    return exts
                      .filter(ext => {
                        return !this.extensionSelected.includes(ext.extKey) && ext.extKey !== this.extension.extKey;
                      })
                      .sort((a, b) => a.displayText.localeCompare(b.displayText));
                  })
                );
              })
            );
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.complete();
  }

  displayFn(ext: Extension): string {
    return ext ? ext.displayText : '';
  }

  selected(value: string): void {
    const text = value?.trim();

    if (!text || isNaN(+text)) {
      return;
    }

    if (!this.defaultExtensionSelected.some(x => x === text)) {
      this.defaultExtensionSelected.push(text);
    }

    if (this.defaultExtensionSelected.length >= this.MAX_NUMBER_ADDED) {
      this.extensionCtrl.disable();
    }

    this._change$.next(true);
    this.extensionCtrl.setValue(null);
    this.extensionInput.nativeElement?.blur();
    this.save('Add successfully');
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.extensionSelected, event.previousIndex, event.currentIndex);
    this.defaultExtensionSelected = cloneDeep(this.extensionSelected);
    this.save('Change position successfully');
  }

  deleteCodeOption(codeOption: string) {
    if (!this.extension.cfConfig.forwardList) {
      return;
    }

    this.extensionSelected.splice(this.extensionSelected.indexOf(codeOption), 1);

    if (this.extensionSelected.length < this.MAX_NUMBER_ADDED) {
      this.extensionCtrl.enable();
    }

    this._change$.next(true);
    this.defaultExtensionSelected = cloneDeep(this.extensionSelected);
    this.save('Delete successfully');
  }

  save(msg) {
    this.saving = true;
    const ext: Partial<Extension> = {};

    ext.cfConfig = cloneDeep(this.extension.cfConfig);
    ext.cfConfig.version = 'v2';
    ext.cfConfig.forwardList = this.defaultExtensionSelected;

    this.extensionService
      .update(this.extension.extKey, ext)
      .pipe(
        finalize(() => {
          this.saving = false;
          this._complete$.next(true);
        })
      )
      .subscribe(
        _ => this.toastService.success(msg),
        error => {
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }
}
