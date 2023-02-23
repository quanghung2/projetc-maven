import { HttpParams } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { S3Service, Status } from '@b3networks/api/file';
import { UserQuery } from '@b3networks/api/workspace';
import { getFileBase64, isFileImage } from '@b3networks/shared/common';
import { CKEditor5, CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import * as ClassicEditor from '../../../../assets/js/ckeditor';

export interface EditorContentOutput {
  html: string;
  text: string;
  mentions: string[];
}

let USER_QUERY: UserQuery;

@Component({
  selector: 'b3n-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {
  readonly Editor = ClassicEditor;
  readonly domParser = new DOMParser();

  editorConfig: CKEditor5.Config;

  @Input() content = '';
  @Input() accessControlId: string;
  @Input() ownerOrgUuid: string;

  @Output() accessControlIdRequiredChange = new EventEmitter<boolean>();

  @ViewChild(CKEditorComponent) editor: CKEditorComponent;
  @ViewChild('fileUpload') uploadFileInput: ElementRef;

  constructor(private s3Service: S3Service, private userQuery: UserQuery) {
    USER_QUERY = this.userQuery;
  }

  ngOnInit(): void {
    this._buildEditorConfig();
  }

  getContent(): EditorContentOutput {
    const result = <EditorContentOutput>{ mentions: [] };

    const contentHtml = this.domParser.parseFromString(this.editor.editorInstance.getData(), 'text/html');

    const mentionTags: HTMLCollection = contentHtml.getElementsByClassName('mention');
    for (let i = 0; i < mentionTags.length; i++) {
      const mention = mentionTags[i];
      result.mentions.push(mention.getAttribute('data-user-id'));
    }

    const imgEles = contentHtml.getElementsByTagName('img');
    for (let i = 0; i < imgEles.length; i++) {
      if (imgEles[i].src.includes('base64,')) {
        imgEles[i].removeAttribute('src');
      }
    }

    result.html = contentHtml.body.innerHTML;
    result.text = contentHtml.body.innerText;

    if (!result.text && imgEles.length) {
      result.text = `${imgEles.length} images uploaded`; // backend need raw text to update
    }

    return result;
  }

  uploadFile() {
    if (!this.accessControlId) {
      this.accessControlIdRequiredChange.emit(true);
      return;
    }

    this.uploadFileInput.nativeElement.click();
  }

  resetData() {
    this.content = '';
    this.editor.editorInstance.setData(this.content);
  }

  async onUploadFile(event) {
    if (!this.accessControlId) {
      this.accessControlIdRequiredChange.emit(true);
      return;
    }
    if (event.target.files.length > 0) {
      for (let index = 0; index < event.target.files.length; index++) {
        const file = event.target.files[index];
        await this._uploadFile(file);
      }
    }
  }

  onEditorReady(e: CKEditor5.Editor) {
    this._addMentionConversion(e);
    this._addImageConversion(e);

    if (this.content) {
      e.setData(this.content);
    }

    console.log(
      // Disable the plugin so that no toolbars are visible.
      `enabled: 
    - text transform: ${e.plugins.get('TextTransformation').isEnabled}, 
    - image: ${e.plugins.get('Image').isEnabled}
    - image block: ${e.plugins.get('ImageBlock').isEnabled},
    - image inline: ${e.plugins.get('ImageInline').isEnabled}`
    );

    console.log(e.model.schema);
  }

  private _addMentionConversion(e: CKEditor5.Editor) {
    e.conversion.for('upcast').elementToAttribute({
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
        value: viewItem => e.plugins.get('Mention').toMentionAttribute(viewItem)
      },
      converterPriority: 'high'
    });

    e.conversion.for('downcast').attributeToElement({
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
  }

  private _addImageConversion(e: CKEditor5.Editor) {
    e.model.schema.extend('imageBlock', { allowAttributes: 'dataStorageKey' });
    e.model.schema.extend('imageInline', { allowAttributes: 'dataStorageKey' });
    e.model.schema.extend('$text', { allowAttributes: 'dataStorageKey' });

    e.conversion.for('upcast').attributeToAttribute({
      view: 'data-storage-key',
      model: {
        key: 'dataStorageKey',
        value: viewElement => {
          console.log(viewElement);

          return viewElement.getAttribute('data-storage-key');
        }
      },
      converterPriority: 'high'
    });

    e.conversion.for('downcast').add(dispatcher => {
      dispatcher.on(
        'attribute:dataStorageKey',
        (evt, data, conversionApi) => {
          if (!conversionApi.consumable.consume(data.item, evt.name)) {
            return;
          }

          const viewWriter = conversionApi.writer;

          const figure = conversionApi.mapper.toViewElement(data.item);
          // if (figure.getChild(0)) {
          //   figure = figure.getChild(0);
          // }

          if (data.attributeNewValue !== null) {
            console.log(figure);
            console.log(data);

            viewWriter.setAttribute('data-storage-key', data.attributeNewValue, figure);
          } else {
            viewWriter.setAttribute('data-storage-key', 'no-data', figure);
          }
        },
        { priority: 'high' }
      );
    });
  }

  private async _uploadFile(file: File) {
    const parmas = new HttpParams().set('accessControlUuid', this.accessControlId).set('ownerUuid', this.ownerOrgUuid);
    await this.s3Service
      .generalUpload(file, 'support-center', `${this.accessControlId}/`, parmas)
      .subscribe(async res => {
        if (res.status === Status.CANCELED) {
          console.log('Upload image canceled');
        }

        if (res.status === Status.COMPLETED) {
          console.log(`uploaded file ${file.name}`);

          const storageLink = `storage://${res.fileKey}`;
          if (isFileImage(file)) {
            const base64 = await getFileBase64(file);

            const imageUtils = this.editor.editorInstance.plugins.get('ImageUtils');
            imageUtils.insertImage({
              src: base64,
              'data-storage-key': res.fileKey,
              dataStorageKey: res.fileKey,
              alt: storageLink // hack for data-* first. cannot work for now. will migrate later
            });
          } else {
            this.content += `<a href="storage://${res.fileKey}" data-storage-key="${res.fileKey}">${file.name}</a>`;
          }
        }
      });
  }

  private _buildEditorConfig() {
    this.editorConfig = {
      mention: {
        feeds: [
          {
            marker: '@',
            feed: this._buildMentionList,
            itemRenderer: this._customItemRenderer
          }
        ]
      },
      link: {
        decorators: {
          addTargetToExternalLinks: true
        }
      },
      imageBlock: {}
    };
  }

  private _buildMentionList(searchTerm: string) {
    return new Promise(resolve => {
      const result = USER_QUERY.getAllUsersContains(searchTerm).map(
        u =>
          <MentionUser>{
            id: `@${u.displayName}`,
            userId: u.uuid,
            name: u.displayName,
            photoUrl: u.photoUrlOrDefault
          }
      );

      resolve(result);
    });
  }

  private _customItemRenderer(item: MentionUser) {
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
            xlink:href="${item.photoUrl}"
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
}

export interface MentionUser {
  id: string;
  userId: string;
  name: string;
  photoUrl: string;
}
