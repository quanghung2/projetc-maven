import { Directive, ElementRef, Input, OnChanges } from '@angular/core';
import { FileService } from '@b3networks/api/file';
import { donwloadFromUrl, getFileBase64, getFilenameFromHeader } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { lastValueFrom } from 'rxjs';

@Directive({
  selector: '[lazyload]'
})
export class LazyLoadDirective implements OnChanges {
  @Input() text: string;
  @Input() ownerOrg: string;

  private _parse: DOMParser = new DOMParser();

  constructor(private el: ElementRef, private toastService: ToastService, private fileService: FileService) {}

  async ngOnChanges() {
    if (this.text && this.ownerOrg) {
      let html = this._parse.parseFromString(this.text, 'text/html').body;

      html = this._cleanupStyles(html);

      // fallback mention
      html.querySelectorAll('.mention').forEach(child => {
        const dataId = child.getAttribute('data-id');
        if (dataId) {
          const dataValue = child.getAttribute('data-value');
          child.setAttribute('data-user-id', dataId);
          child.innerHTML = ` @${dataValue}`;
        }
      });

      this.el.nativeElement.innerHTML = html.innerHTML;

      await this._handleImages();
      await this._handleInternalLinks();
    }
  }

  private _cleanupStyles(html: HTMLElement) {
    html.querySelectorAll('br').forEach(child => {
      if (child.parentNode['tagName'] !== 'CODE' && child.hasAttribute('data-cke-filler')) {
        child.remove();
      }
    });
    html.querySelectorAll('.ck-widget__type-around__button').forEach(child => {
      child.remove();
    });

    html.querySelectorAll('table').forEach(child => {
      if (child.parentNode.children[1]) {
        child.parentNode.removeChild(child.parentNode.children[0]);
        child.parentNode.removeChild(child.parentNode.children[1]);
      }
      child.querySelectorAll('td , th').forEach(child => {
        child.removeAttribute('contenteditable');
      });
    });

    html.querySelectorAll('.ck-widget__resizer').forEach(child => {
      child.remove();
    });
    html.querySelectorAll('div').forEach(child => {
      if (!child.classList.contains('ql-editor')) {
        child.classList.add('div-container');
      }
    });

    html.querySelectorAll('ul').forEach(child => {
      child.classList.add('ul-container');
    });

    html.querySelectorAll('ol').forEach(child => {
      child.classList.add('ol-container');
    });

    html.querySelectorAll('.ck-fake-selection-container').forEach(child => {
      child.remove();
    });

    return html;
  }

  private async _handleImages() {
    const images = this.el.nativeElement.querySelectorAll('img');

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      let s3key = image.getAttribute('data-storage-key');
      if (!s3key && image.alt?.includes('storage://support-center')) {
        s3key = image.alt.substring('storage://'.length);
      }

      if (!s3key && image.src && !image.src.includes('base64')) {
        // fallback for legacy image
        const path = image.src as string;
        const validIndex = path.indexOf('support-center/');
        if (validIndex > 0) {
          s3key = path.substring(validIndex);
          image.setAttribute('data-storage-key', s3key);
        }
      }

      if (s3key) {
        // TODO should cache these images files
        const data = await lastValueFrom(this.fileService.downloadFileV3(s3key, { sharingOrgUuid: this.ownerOrg }));

        const imageData = await getFileBase64(data.body);
        image.setAttribute('src', imageData as string);

        image.classList.add('image-container');
        image.addEventListener('click', () => {
          this._zoomImage(image);
        });
      }
    }
  }

  private _handleInternalLinks() {
    this.el.nativeElement.querySelectorAll('a').forEach(async linkTag => {
      // linkTag.setAttribute('target', '_blank');
      let s3key = linkTag.getAttribute('data-storage-key');

      if (!s3key) {
        if (linkTag.href.startsWith('storage://')) {
          s3key = linkTag.href.substring('storage://'.length);
        } else if (linkTag.href.includes('support-center/')) {
          s3key = linkTag.href.substring(linkTag.href.indexOf('support-center/'));
          if (s3key.includes('?')) {
            s3key = s3key.split('?')[0];
          }
        }

        if (s3key) {
          linkTag.setAttribute('data-storage-key', s3key);
        }
      }

      if (s3key) {
        linkTag.addEventListener('click', $event => {
          this._downloadFile(s3key);

          $event.preventDefault();
        });
      } else {
        // external link. should open new tab
        linkTag.setAttribute('target', 'blank');
      }
    });
  }

  private _zoomImage(child) {
    if (!child.src) {
      return;
    }
    const image = new Image();
    image.src = child.src;
    const viewer = new Viewer(image, {
      hidden: () => {
        viewer.destroy();
      },
      toolbar: {
        zoomIn: 4,
        zoomOut: 4,
        oneToOne: 4,
        reset: 4,
        rotateLeft: 4,
        rotateRight: 4,
        flipHorizontal: 4,
        flipVertical: 4
      }
    });
    viewer.show();
  }

  private _downloadFile(s3key: string) {
    this.fileService.downloadFileV3(s3key, { sharingOrgUuid: this.ownerOrg }).subscribe({
      next: res => {
        const file = new Blob([res.body], { type: `${res.body.type}` });
        const downloadUrl = URL.createObjectURL(file);

        const filename = getFilenameFromHeader(res.headers);

        donwloadFromUrl(downloadUrl, filename, () => {
          URL.revokeObjectURL(downloadUrl);
        });
      },
      error: err => this.toastService.error(err.message)
    });
  }
}
