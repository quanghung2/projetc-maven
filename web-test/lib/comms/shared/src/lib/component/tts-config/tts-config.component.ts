import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Mp3Entry, SpeechEntry, Text2SpeechEntry } from '@b3networks/api/bizphone';
import { FileService, GeneralUploadRes, S3Service, Status } from '@b3networks/api/file';
import { TtsVendor2, TtsVendorQuery, TtsVendorService } from '@b3networks/api/ivr';
import { DestroySubscriberComponent, LOCATES, MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';

const MAX_FILE_SIZE = 5 * 1024 * 1000;

@Component({
  selector: 'cos-tts-config',
  templateUrl: './tts-config.component.html',
  styleUrls: ['./tts-config.component.scss']
})
export class TtsConfigComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() text2Speech: Text2SpeechEntry;
  @Input() typeEntrie = '';
  @Input() fg: UntypedFormGroup;
  @Input() isMobileApp: boolean;
  @Input() ttsOptions: 'both' | 'mp3' | 'speech' = 'both';

  @Output() changed = new EventEmitter<Text2SpeechEntry>();
  @Output() msgStatusChange = new EventEmitter<boolean>();

  ttsFormGroup: UntypedFormGroup = this.fb.group({
    type: this.fb.control('', [Validators.required]),
    mp3: this.fb.group({
      s3Key: this.fb.control(''),
      type: this.fb.control('', [Validators.required])
    }),
    speech: this.fb.group({
      type: this.fb.control('', [Validators.required]),
      language: this.fb.control('', [Validators.required]),
      gender: this.fb.control('', [Validators.required]),
      voiceCode: this.fb.control('', [Validators.required]),
      msg: this.fb.control('', [Validators.maxLength(200)]),
      pitch: this.fb.control('', [Validators.required]),
      rate: this.fb.control('', [Validators.required]),
      vendor: this.fb.control('', [Validators.required])
    })
  });
  matcher = new MyErrorStateMatcher();
  locates = LOCATES;
  isAdvanceConfig: boolean;
  ttsType: string;

  s3Key: string;
  playableUrl: string | null;
  uploading: boolean;
  uploadResp: GeneralUploadRes;

  ttsVendors$: Observable<TtsVendor2[]>;
  venders: TtsVendor2[];

  readonly radioOptions: KeyValue<string, string>[] = [
    { key: 'speech', value: `Text to speech` },
    { key: 'mp3', value: `MP3 File (5MB)` }
  ];

  OBJECT_KEYS = Object.keys;

  constructor(
    private ttsVendorQuery: TtsVendorQuery,
    private ttsVendorService: TtsVendorService,
    private s3Service: S3Service,
    private fileService: FileService,
    private toastService: ToastService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.ttsVendorService.get().subscribe();

    if (this.ttsOptions !== 'both') {
      this.ttsFormGroup.controls['type'].setValue(this.ttsOptions);
    }

    this.listenChange();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['text2Speech']) {
      this.initForm();
      this.listenChange();

      if (this.text2Speech.type === 'mp3') {
        this.text2Speech = this.text2Speech as Mp3Entry;
        if (this.text2Speech.s3Key) {
          this.fileService.downloadFileV3(this.text2Speech.s3Key).subscribe(resp => {
            const downloadFile = new Blob([resp.body], { type: `${resp.body.type}` });
            this.playableUrl = URL.createObjectURL(downloadFile);
          });
        } else {
          this.playableUrl = null;
        }
      }
    }
  }

  uploadFile(event) {
    this.uploadResp = <GeneralUploadRes>{ status: 'processing', percentage: 0 };
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        this.toastService.error(`Exceeded the maximum file size (5MB)`, 4000);
        return;
      }

      this.uploading = true;
      this.s3Service.generalUpload(file, 'communication/tts').subscribe(
        res => {
          this.uploadResp = res;
          if ([Status.COMPLETED, Status.CANCELED].includes(res.status)) {
            this.uploading = false;
          }
          if (res.status === Status.COMPLETED) {
            this.playableUrl = URL.createObjectURL(file);
            this.ttsFormGroup.get('mp3')?.patchValue({
              s3Key: res.keyForSignApi
            });
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
    }
  }

  trackByOptions(index: number, ttsType: KeyValue<string, string>) {
    return ttsType ? ttsType.key : null;
  }

  onErrorLoadFile() {
    this.toastService.error('Cannot load file');
  }

  private listenChange() {
    this.listenLanguageChange();
    this.listenVoiceCodeChange();
  }

  private initForm() {
    this.ttsType = this.text2Speech.type;
    this.ttsFormGroup = this.buildEntryForm(this.text2Speech);
    this.ttsChanged(this.ttsFormGroup.value);
    this.ttsFormGroup.setValidators(this.checkValidatorByType);

    this.ttsFormGroup.statusChanges.subscribe(valid => {
      if (valid === 'INVALID') {
        this.fg?.controls['msg'].setErrors({ ERROR_CHECK: true });
      } else {
        this.fg?.controls['msg'].setErrors(null);
      }
    });

    this.ttsFormGroup
      .get('type')
      .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroySubscriber$))
      .subscribe((type: string) => {
        this.ttsType = type;
        if (
          this.ttsType === 'mp3' &&
          !!this.uploadResp?.keyForSignApi &&
          !this.ttsFormGroup.get('mp3')?.get('s3Key')?.value
        ) {
          this.ttsFormGroup.get('mp3')?.get('s3Key')?.setValue(this.uploadResp.keyForSignApi);
        }
      });

    this.ttsFormGroup.valueChanges.pipe(debounceTime(300)).subscribe(values => {
      this.ttsChanged(values);
    });
  }

  listenLanguageChange() {
    this.ttsFormGroup
      .get('speech')
      .get('language')
      .valueChanges.pipe(
        takeUntil(this.destroySubscriber$),
        startWith(this.ttsFormGroup.value.speech?.language || 'en'),
        tap(lan => console.log(`lang changed`, lan))
      )
      .pipe(
        switchMap(lang => {
          return this.ttsVendorQuery.selectAllByLanguage(lang);
        })
      )
      .subscribe(venders => {
        if (!venders?.length) {
          return;
        }

        this.venders = venders;

        const vendor =
          venders.find(v => v.voiceCode === (this.text2Speech as SpeechEntry).voiceCode) ??
          venders.find(v => v.voiceCode === 'en-US-WaveNet-F');

        this.ttsFormGroup.get('speech').patchValue({
          gender: vendor.gender,
          voiceCode: vendor.voiceCode,
          vendor: vendor.vendor
        });
      });
  }

  listenVoiceCodeChange() {
    this.ttsFormGroup
      .get('speech')
      .get('voiceCode')
      .valueChanges.pipe(
        takeUntil(this.destroySubscriber$),
        tap(voiceCode => {
          this.ttsFormGroup.get('speech').patchValue(
            {
              gender: this.venders.find(v => v.voiceCode === voiceCode).gender,
              voiceCode: this.venders.find(v => v.voiceCode === voiceCode).voiceCode,
              vendor: this.venders.find(v => v.voiceCode === voiceCode).vendor
            },
            { emitEvent: false }
          );
        })
      )
      .subscribe();
  }

  private ttsChanged(values: any) {
    const tts = values.type === 'mp3' ? new Mp3Entry(values.mp3) : new SpeechEntry(values.speech);
    tts.type = values.type;
    this.changed.emit(tts);
  }

  private buildEntryForm(entry: Text2SpeechEntry) {
    const mp3Tts = entry.type === 'mp3' ? (entry as Mp3Entry) : new Mp3Entry();
    const speechTts = entry.type === 'speech' ? (entry as SpeechEntry) : new SpeechEntry();

    return this.fb.group({
      type: this.fb.control(entry.type, [Validators.required]),
      mp3: this.fb.group({
        s3Key: this.fb.control(mp3Tts.s3Key),
        type: this.fb.control(mp3Tts.type, [Validators.required])
      }),
      speech: this.fb.group({
        type: this.fb.control(speechTts.type, [Validators.required]),
        language: this.fb.control(speechTts.language, [Validators.required]),
        gender: this.fb.control(speechTts.gender, [Validators.required]),
        voiceCode: this.fb.control(speechTts.voiceCode, [Validators.required]),
        msg: this.fb.control(speechTts.msg, [Validators.maxLength(2000)]),
        pitch: this.fb.control(speechTts.pitch, [Validators.required]),
        rate: this.fb.control(speechTts.rate, [Validators.required]),
        vendor: this.fb.control(speechTts.vendor, [Validators.required])
      })
    });
  }

  private checkValidatorByType = (control: AbstractControl): { [key: string]: boolean } => {
    const value = control.value;

    if (!value) return null;
    const type = control.value?.type;
    const msg = value?.speech?.msg;
    const controlMsg = control?.get('speech')?.get('msg');
    const controlS3Key = control?.get('mp3')?.get('s3Key');
    if (type === 'speech' && !msg) controlMsg.setErrors({ messageEmpty: true });
    else if (type === 'speech' && msg.length > 2000) controlMsg.setErrors({ messageTooLong: true });
    else controlMsg.setErrors(null);

    type === 'mp3' && !control.value?.mp3?.s3Key
      ? controlS3Key.setErrors({ noFile: true })
      : controlS3Key.setErrors(null);
    return null;
  };
}
