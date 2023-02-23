import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApprovalWorkspaceService, SubmitFormRequest } from '@b3networks/api/approval';
import { GeneralUploadFolder, S3Service, Status } from '@b3networks/api/file';
import { IMessComponent, IMessElementType, IMessType } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { finalize, forkJoin, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { OutputProcessMessage } from '../../../../core/model/output-message.model';
import { InfoShowMention } from '../../../../core/state/app-state.model';

@Component({
  selector: 'csh-interactive-detail',
  templateUrl: './interactive-detail.component.html',
  styleUrls: ['./interactive-detail.component.scss']
})
export class InteractiveDetailComponent implements OnChanges {
  @Input() messageId: string;
  @Input() component: IMessComponent;
  @Input() isDialog: boolean;
  @Input() groupParent: FormGroup;
  @Input() uploadPercentage: number;
  @Input() uploadStatusMap: HashMap<boolean>; // id file -> boolean;
  @Input() isSubmiting: boolean;

  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();
  @Output() closeDialog = new EventEmitter<boolean>();

  errorText: string;
  builtTextMessage: OutputProcessMessage = <OutputProcessMessage>{
    text: '',
    isTriggerDirective: false
  };
  groupRoot: FormGroup;
  isProgressing: boolean;
  uploadPercentageMap: HashMap<number> = {}; // id file -> number;
  uploadStatusMapRoot: HashMap<boolean> = {}; // id file -> boolean;

  private _hasErrorUpload: boolean;

  readonly IMessType = IMessType;

  constructor(
    private fb: FormBuilder,
    private approvalWorkspaceService: ApprovalWorkspaceService,
    private toastService: ToastService,
    private s3Service: S3Service
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      if (this.component.type === IMessType.form) {
        this.uploadStatusMapRoot = {};
        this.uploadPercentageMap = {};
        this.groupRoot = this.fb.group({});
        this.setControls(this.component.components, this.groupRoot);
        console.log('this.groupRoot: ', this.groupRoot);
      }
    }
  }

  submit(component: IMessComponent) {
    this.isProgressing = true;
    const files$ = this.getUploadFile$();

    (files$.length > 0 ? forkJoin(files$) : of([]))
      .pipe(
        switchMap(() => {
          if (this._hasErrorUpload) {
            return throwError(() => new Error('Upload failed. Try again!'));
          }
          const body = <SubmitFormRequest>{
            payload: this.groupRoot.value || {},
            mid: this.messageId
          };
          Object.keys(body.payload).forEach(key => {
            if (body.payload?.[key] === '') {
              delete body.payload[key];
            }
          });
          return this.approvalWorkspaceService.submitFormComponent(component.action_url, body);
        })
      )
      .pipe(finalize(() => (this.isProgressing = false)))
      .subscribe({
        next: res => {
          this.closeDialog.emit(true);
        },
        error: err => {
          console.log('err: ', err);
          this.toastService.error(err.message);
        }
      });
  }

  private getUploadFile$() {
    this._hasErrorUpload = false;
    const files = this.component.components.filter(
      file =>
        file.type === IMessType.input &&
        file.element.type === IMessElementType.file &&
        this.groupRoot.get(file.element.id)?.value instanceof File
    );
    return files.map(file =>
      this.s3Service
        .generalUpload(this.groupRoot.get(file.element.id).value, <GeneralUploadFolder>file.element.folder)
        .pipe(
          tap(res => {
            if (res.status === Status.PROCESSING) {
              this.uploadPercentageMap[file.element.id] = res.percentage;
            }
            if (res.status === Status.COMPLETED) {
              this.uploadPercentageMap[file.element.id] = 0;
              this.uploadStatusMapRoot = {
                ...this.uploadStatusMapRoot,
                [file.element.id]: true
              };

              const keyForSignApi = res.keyForSignApi;
              this.groupRoot.get(file.element.id).setValue(keyForSignApi);
            }
            if (res.status === Status.CANCELED) {
              this._hasErrorUpload = true;
              this.uploadPercentageMap = {};
              this.uploadStatusMapRoot = {
                ...this.uploadStatusMapRoot,
                [file.element.id]: false
              };
            }
          }),
          catchError(err => {
            this._hasErrorUpload = true;
            this.uploadPercentageMap = {};
            this.uploadStatusMapRoot = {
              ...this.uploadStatusMapRoot,
              [file.element.id]: false
            };
            return throwError(() => new Error(`${file?.label?.text} upload failed. Try again!`));
          })
        )
    );
  }

  private setControls(components: IMessComponent[], groupRoot: FormGroup) {
    components
      .filter(x => x.type === IMessType.input || x.type === IMessType.section)
      .forEach(item => {
        if (item.type === IMessType.input) {
          this.groupRoot = this.fb.group({
            ...this.groupRoot.controls,
            [item.element.id]: ['']
          });
        } else if (item.type === IMessType.section && item.components?.length > 0) {
          this.setControls(item.components, groupRoot);
        }
      });
  }
}
