import { HttpParams } from '@angular/common/http';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OrgMemberQuery } from '@b3networks/api/auth';
import { FileService, S3Service, Status, UploadModel } from '@b3networks/api/file';
import { AllowedExtension } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import * as customBuild from '../../../../assets/js/ckeditor';
import { MyUploadAdapter } from './addapter/myUploadAdapter';

let seft: CkeditorRenderComponent;

@Component({
  selector: 'b3n-ckeditor-render',
  templateUrl: './ckeditor-render.component.html',
  styleUrls: ['./ckeditor-render.component.scss']
})
export class CkeditorRenderComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() isFromGitlab: boolean;
  @Input() isComment: boolean;
  @Input() content: string;
  @Input() idComment: string | number;
  @Input() id: string | number;
  @Input() accessControlId: string;
  @Input() isEdit: boolean;
  @Input() isReturnData: boolean;
  @Input() noHaveEdit: boolean;
  @Input() isCreateCase: boolean;
  @Input() updatedSuccess: boolean;
  @Input() ownerOrg: string;
  @Output() isEmpty = new EventEmitter<boolean>();
  @Output() returnCkediorData = new EventEmitter<{}>();
  @Output() returnCancel = new EventEmitter<boolean>();
  @Output() returnCkediorDataWithEdit = new EventEmitter<{}>();
  @ViewChild('editor') myEditor: any;
  @ViewChild('htmlEditor') el: ElementRef;

  Editor = customBuild;
  editorConfig: any;
  ckContent: any;
  isEmptyCkeditor: boolean;
  attractments = [];
  isLoadingUpdate = false;

  readonly allowedExtension = AllowedExtension;

  constructor(
    private orgMemberQuery: OrgMemberQuery,
    private fb: FormBuilder,
    private s3Service: S3Service,
    private fileService: FileService
  ) {
    super();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.isReturnData) {
      this.returnData();
    }
    if (!this.isEdit) {
      this.isLoadingUpdate = false;
    }
    if (this.updatedSuccess) {
      this.isLoadingUpdate = false;
      this.isEdit = false;
    }
    if (changes['isEdit']?.currentValue) {
      this.onEdit();
    }

    if (changes['isFromGitlab']?.currentValue && changes['isComment']?.currentValue) {
      this.content = this.content.replace(this.content.split(':')[0] + ':', '<p>');
    }
  }
  ngOnInit(): void {
    this.registerMention();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    seft = this;
  }

  onchange(event) {
    this.isEmptyCkeditor = event.editor?.getData() ? true : false;
    this.isEmpty.emit(this.isEmptyCkeditor);
  }

  onEdit() {
    this.isEdit = true;
    this.initCkeditorData();
    this.ckContent = this.el?.nativeElement.innerHTML;
  }

  initCkeditorData() {
    this.el?.nativeElement.querySelectorAll('pre').forEach(child => {
      child.setAttribute('data-language', 'Plain text');
      child.innerHTML = `<code class="language-plaintext">${child.innerHTML}</code>`;
    });
    this.el?.nativeElement.querySelectorAll('.mention').forEach(child => {
      const id = child.getAttribute('data-id');
      child.setAttribute('data-user-id', id);
    });

    this.el?.nativeElement.querySelectorAll('a.isAttachment').forEach(child => {
      child.innerHTML = child.innerText;
    });
  }

  update() {
    this.isLoadingUpdate = true;
    this.returnData();
  }

  async returnData() {
    await this.uploadImage();
    await this.uploadFile();
    const contentHTML = this.myEditor.elementRef.nativeElement.querySelector(`.ck-content`).innerHTML;
    const contentText = this.myEditor.elementRef.nativeElement.querySelector(`.ck-content`).innerText;
    const mentions = this.getListMentions();

    this.returnCkediorData.emit({ html: contentHTML, text: contentText, mentions: mentions, id: this.idComment });
    this.myEditor.editorInstance.setData('');
    this.attractments = [];
  }

  getListMentions() {
    const mentions = [];
    this.myEditor.elementRef.nativeElement.querySelectorAll('.mention').forEach(child => {
      const id = child.dataset.userId;
      const foundIndex = mentions.findIndex(m => m == id);
      if (foundIndex === -1) {
        mentions.push(id);
      }
    });
    return mentions;
  }

  onReady(editor) {
    if (this.ckContent) {
      editor.setData(this.ckContent);
    }
    editor.plugins.get('FileRepository').createUploadAdapter = loader => {
      return new MyUploadAdapter(loader);
    };

    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        key: 'data-mention',
        classes: 'mention',
        attributes: {
          href: true,
          'data-user-id': true
        }
      },
      model: {
        key: 'mention',
        value: viewItem => editor.plugins.get('Mention').toMentionAttribute(viewItem)
      },
      converterPriority: 'high'
    });

    editor.conversion.for('downcast').attributeToElement({
      model: 'mention',
      view: (modelAttributeValue, { writer }) => {
        if (!modelAttributeValue) {
          return;
        }

        return writer.createAttributeElement(
          'span',
          {
            class: 'mention',
            'data-user-id': modelAttributeValue.userId
          },
          {
            priority: 20,
            id: modelAttributeValue.uid
          }
        );
      },
      converterPriority: 'high'
    });

    // editor.editing.view.document.on('clipboardInput', (evt, data) => {
    //   const dataTransfer = data.dataTransfer;

    //   if (dataTransfer['files']?.length > 0 && data.dataTransfer['files'][0]?.type === 'image/png') {
    //     const file = data.dataTransfer.files[0];
    //     const reader = new FileReader();
    //     reader.readAsDataURL(file);
    //     reader.onload = function () {
    //       // data.setData(reader.result);
    //     };
    //     reader.onerror = function (error) {
    //       console.log('Error: ', error);
    //     };
    //   }

    //   this.myEditor.editorInstance.model.change(writer => {
    //     const linkedText = writer.createText(`${'test'}`, {
    //       linkHref: `1`
    //     });
    //     this.myEditor.editorInstance.model.insertContent(
    //       linkedText,
    //       this.myEditor.editorInstance.model.document.selection
    //     );
    //   });
    // });

    if (this.ckContent) {
      setTimeout(() => {
        this.myEditor.elementRef.nativeElement.querySelectorAll('a').forEach(child => {
          child.querySelectorAll('img').forEach(img => {
            img.classList.add('attach_file-icon');
          });
        });
      }, 500);
    }
  }

  registerMention() {
    this.editorConfig = {
      mention: {
        feeds: [
          {
            marker: '@',
            feed: this.renderMembers,
            itemRenderer: this.customItemRenderer
          }
        ]
      }
    };
  }

  cancel() {
    this.isEdit = false;
    this.returnCancel.emit(true);
  }

  ////////////////////////////////////////

  async uploadImage() {
    const imgArray = this.myEditor.elementRef.nativeElement.querySelectorAll('img');
    if (imgArray.length) {
      for (let i = 0; i < imgArray.length; i++) {
        const img = imgArray[i].src;
        await fetch(img)
          .then(r => r.blob())
          .then(async blob => {
            const nameFile = blob.type.split('/')[1];
            const file = new File([blob], `Pasted_image_${new Date().getTime()}.${nameFile}`, { type: blob.type });

            const parmas = new HttpParams().set('accessControlUuid', this.accessControlId);
            await this.s3Service
              .generalUpload(file, 'support-center', this.accessControlId + '/', parmas)
              .toPromise()
              .then(async res => {
                if (res.status === Status.CANCELED) {
                  console.log('Upload image canceled');
                }

                if (res.status === Status.COMPLETED) {
                  await this.fileService
                    .downloadFileV3(res['keyForSignApi'])
                    .toPromise()
                    .then(fileUrl => {
                      imgArray[i].src = fileUrl.url;
                    })
                    .catch(_ => {
                      console.log('Your URL image has been blocked by CORS policy!');
                    });

                  console.log('Upload image successfully');
                }
              });
          })
          .catch(_ => {
            console.log('Your URL image has been blocked by CORS policy!');
          });
      }
    }
  }

  customItemRenderer(item) {
    const itemElement = document.createElement('span');

    itemElement.classList.add('custom-item');
    itemElement.id = `mention-list-item-id-${item.userId}`;

    const usernameElement = document.createElement('span');
    usernameElement.innerHTML = `
    <div class='item-inner'>
      <svg style=" height: 24px; width: 24px; display: initial;">
        <g>
          <image
            x="0"
            y="0"
            height="100%"
            width="100%"
            xlink:href="${item.photoUrlOrDefault}"
            style="clip-path: circle(12px at center); height: 24px; width: 24px;"
          ></image>
          
        </g>
      </svg>
      <span style=" margin-left: 0.5rem;" class='ql-name'>${item.name}</span>              
    </div>
  `;
    itemElement.appendChild(usernameElement);
    return itemElement;
  }

  renderMembers(searchTerm: string) {
    return new Promise(resolve => {
      const itemsToDisplay = seft.orgMemberQuery.getAllMemberSearch(searchTerm);
      const items = itemsToDisplay.map(
        item =>
          new InfoMention({
            id: `@${item.displayName}`,
            name: item.displayName,
            userId: item.uuid,
            photoUrl: item.photoUrl
          })
      );
      resolve(items);
    });
  }

  /////////////////Uplodad file////////////////////////////
  upload(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.uploadMultipleFiles(files);
  }

  private async uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    const models: UploadModel[] = [];
    let index = 0;
    for (const file of files) {
      const fileType = file.name.split('.')[file.name.split('.').length - 1];
      if (this.allowedExtension.includes(fileType.toLocaleLowerCase())) {
        const model = new UploadModel();
        model.file = file;
        model.fileName = file.name;
        model.fileSize = file.size;
        model.lastModified = file.lastModified;
        model.isImage = file['type'].includes('image');
        model.index = index;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = _event => {
          model.filePath = reader.result as string;

          if (model.isImage) {
            const image = new Image();
            image.src = _event.target.result.toString();

            image.onload = function () {
              model.width = image.width;
              model.height = image.height;
            };
          }
        };
        this.attractments.push(model);

        console.log(this.attractments);
        this.myEditor.editorInstance.model.change(writer => {
          const linkedText = writer.createText(`${model.fileName}`, {
            linkHref: `${model.lastModified}`
          });
          this.myEditor.editorInstance.model.insertContent(
            linkedText,
            this.myEditor.editorInstance.model.document.selection
          );
        });
        index++;
      }
    }
  }

  async uploadFile() {
    const attractmentArray = this.myEditor.elementRef.nativeElement.querySelectorAll('a');
    if (attractmentArray.length && attractmentArray.length > 0) {
      for (let i = 0; i < attractmentArray.length; i++) {
        const path = new URL(attractmentArray[i].href);
        const lastModified = path.pathname.split('/')[path.pathname.split('/').length - 1];
        const findFile = this.attractments.find(a => a.lastModified == lastModified);
        if (findFile) {
          const parmas = new HttpParams().set('accessControlUuid', this.accessControlId);
          await this.s3Service
            .generalUpload(findFile, 'support-center', this.accessControlId + '/', parmas)

            .toPromise()
            .then(async res => {
              // if (res.status === Status.PROCESSING) {
              //   this.uploadPercentage = res.percentage;
              // }
              if (res.status === Status.CANCELED) {
                console.log('Upload image canceled');
              }

              if (res.status === Status.COMPLETED) {
                await this.fileService
                  .downloadFileV3(res.keyForSignApi, { sharingOrgUuid: this.ownerOrg })
                  .toPromise()
                  .then(fileUrl => {
                    attractmentArray[i].href = `${fileUrl.url}`; //TODO wrong value. response.url is xhr url but not reponse result
                  })
                  .catch(_ => {
                    console.log('Your URL image has been blocked by CORS policy!');
                    attractmentArray[i].href = '';
                  });

                console.log('Upload image successfully');
              }
            });
        }
      }
    }
  }
}

class InfoMention {
  id: string;
  userId: string;
  name: string;
  photoUrl: string;

  constructor(obj?: Partial<InfoMention>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get hasPhoto() {
    return !!this.photoUrl && this.photoUrl.indexOf('http') > -1;
  }

  get photoUrlOrDefault() {
    return this.photoUrl ? this.photoUrl : 'https://ui.b3networks.com/external/logo/default_org_icon.png';
  }
}
