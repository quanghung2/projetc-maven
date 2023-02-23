import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CaseDetail,
  CaseMetaData,
  CaseQuery,
  CaseService,
  CaseStatus,
  SCMetaDataQuery,
  UpdateCaseReq,
  User,
  UserService
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { lastValueFrom, Observable, Subject } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { EditorComponent } from '../shared/component/editor/editor.component';

@Component({
  selector: 'b3n-case-detail',
  templateUrl: './case-detail.component.html',
  styleUrls: ['./case-detail.component.scss']
})
export class CaseDetailComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  private _mobileQueryListener: () => void;
  private _case: CaseDetail;

  private _htmlRef: ElementRef;
  private _descriptionEditor: EditorComponent;

  mobileQuery: MediaQueryList;
  scrolled = 0;

  _textChanedDebouncer: Subject<string> = new Subject<string>();

  case$: Observable<CaseDetail>;
  parsedDescription: string;

  me: User;
  caseMetaData: CaseMetaData;

  editingFG: FormGroup = this.fb.group({
    title: this.fb.control('', Validators.required)
  });

  editingMode = false;

  isLoading = false;
  updating: boolean;

  @ViewChild('viewport') viewport: ElementRef;
  @ViewChild('caseDescription') set htmlElf(htmlElf: ElementRef) {
    if (htmlElf) {
      this._htmlRef = htmlElf;
    }
  }
  @ViewChild(EditorComponent) set descriptionEditor(editor: EditorComponent) {
    if (editor) {
      this._descriptionEditor = editor;
    }
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private caseQuery: CaseQuery,
    private caseService: CaseService,
    private userService: UserService,
    private sCMetaDataQuery: SCMetaDataQuery,
    private toastr: ToastService,
    private fb: FormBuilder,
    media: MediaMatcher,
    changeDetectorRef: ChangeDetectorRef
  ) {
    super();
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  async ngOnInit() {
    this._initData();

    this.route.paramMap.subscribe(async params => {
      const sid = params.get('id');
      const orgUuid = params.get('orgUuid') || X.orgUuid;

      if (sid && Number(sid)) {
        this.isLoading = true;

        try {
          const result = await lastValueFrom(this.caseService.getCase(orgUuid, Number(sid)));
          this.caseService.setActive(result.id);
        } catch (e) {
          console.error(e);
        }

        this.isLoading = false;
      }
    });
  }

  override ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  async editCase() {
    if (this._case) {
      const { title } = this._case;
      this.editingFG.setValue({
        title: title
      });
    }

    this.parsedDescription = this._htmlRef.nativeElement.innerHTML;

    this.editingMode = true;
  }

  async updateCase() {
    this.updating = true;
    const req = this.editingFG.value as Partial<UpdateCaseReq>;

    const result = await this._descriptionEditor.getContent();

    req.description = result.html;
    req.rawDescription = result.text;

    await this._performUpdateCase(req);
    this.updating = false;
    this.editingMode = false;
    this.toastr.success('Updated case');
  }

  private _initData() {
    this.userService
      .getMe()
      .pipe(
        filter(m => m != null),
        take(1)
      )
      .subscribe(me => {
        this.me = me;
      });

    this.sCMetaDataQuery.scMetaData$
      .pipe(
        filter(i => i != null),
        take(1)
      )
      .subscribe(metaData => {
        this.caseMetaData = metaData;
      });

    //TODO need to validate why after update case it become to normal obj
    this.case$ = this.caseQuery.selectActive<CaseDetail>().pipe(
      // filter(c => c instanceof CaseDetail),
      // tap(l => console.log(l)),
      map(c => c as CaseDetail),
      tap(c => (this._case = c))
    );
  }

  confirmCloseCase() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Close Case',
          message: `Are you want to close this case?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(async confirm => {
        if (confirm) {
          await this._performUpdateCase(<UpdateCaseReq>{ status: CaseStatus.closed });
          this.toastr.success('Close case successfully');
        }
      });
  }

  confirmOpenCase() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Reopen Case',
          message: `Are you want to reopen this case?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'primary'
        }
      })
      .afterClosed()
      .subscribe(async confirm => {
        if (confirm) {
          await this._performUpdateCase(<UpdateCaseReq>{ status: CaseStatus.open });
          this.toastr.success('Reopen case successfully');
        }
      });
  }

  onScroll() {
    const scrollTop = this.viewport['elementRef'].nativeElement.scrollTop;
    if (scrollTop && scrollTop > 130) {
      this.scrolled = 1;
    } else {
      this.scrolled = 0;
    }
  }

  goToHome() {
    this.router.navigate(['cases']);
  }

  private async _performUpdateCase(req: Partial<UpdateCaseReq>) {
    return await lastValueFrom(
      this.caseService.updateCase(
        { id: this._case.id, sid: this._case.sid, ownerOrgUuid: this._case.ownerOrgUuid },
        req
      )
    ).catch(e => {
      this.toastr.error(e.message);
    });
  }
}
