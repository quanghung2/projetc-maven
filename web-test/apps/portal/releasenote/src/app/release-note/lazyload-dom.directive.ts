import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { FileService } from '@b3networks/api/file';
import { ToastService } from '@b3networks/shared/ui/toast';
import Viewer from 'viewerjs';

@Directive({
  selector: '[lazyload]'
})
export class LazyLoadDirective implements AfterViewInit {
  constructor(private el: ElementRef, private fileService: FileService, private toastService: ToastService) {}

  async ngAfterViewInit() {
    this.el.nativeElement.querySelectorAll('img').forEach(async child => {
      child.classList.add('image-container');
      if (child?.src?.includes('s3Key')) {
        try {
          const url = new URL(child.src);
          const urlSearch = new URLSearchParams(url.search);
          const key = urlSearch.get('s3Key');
          if (key) {
            await this.fileService
              .getDownloadFileUrl(key)
              .toPromise()
              .then(fileUrl => {
                child.src = fileUrl.url;
                child.setAttribute('data-s3Key', key);
                child.addEventListener('click', $event => {
                  this.zoomImg(child);
                });
              });
          }
        } catch (error) {
          console.log('error: ', error);
        }
      }
    });

    this.el.nativeElement.querySelectorAll('div').forEach(child => {
      child.classList.add('div-container');
    });

    this.el.nativeElement.querySelectorAll('a').forEach(async child => {
      if (child?.href?.includes('case_key')) {
        try {
          const url = new URL(child.href);
          const urlSearch = new URLSearchParams(url.search);
          const key = urlSearch.get('case_key');
          const ownerOrg = urlSearch.get('ownerOrgUuid');
          if (key) {
            child.innerHTML =
              `<mat-icon class="material-icons icon-mail attach_file-icon" >attach_file</mat-icon> ` + child.innerHTML;
            child.addEventListener('click', $event => {
              $event.preventDefault();
              if (key) {
                this.fileService.downloadFileV3(key, { sharingOrgUuid: ownerOrg }).subscribe(
                  res => {
                    const file = new Blob([res.body], { type: `${res.body.type}` });
                    const downloadUrl = URL.createObjectURL(file);
                    const fieldName = res.url.split('/')[res.url.split('/').length - 1].split('?')[0];
                    this.donwloadFromUrl(downloadUrl, fieldName, () => {
                      URL.revokeObjectURL(downloadUrl);
                    });
                  },
                  err => this.toastService.error(err.message)
                );
              }
            });
          }
        } catch (error) {
          console.log('error: ', error);
        }
      }
    });
  }

  private zoomImg(child) {
    const src = new URL(child.src);
    const key = src.pathname.substring(1);
    this.fileService
      .getDownloadFileUrl(key)
      .toPromise()
      .then(fileUrl => {
        if (!fileUrl.url) {
          return;
        }
        const image = new Image();
        image.src = fileUrl.url;
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
      });
  }

  private donwloadFromUrl(url: string, filename: string, done?: () => void) {
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.target = '_blank';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    done();
  }
}
