import { Component, OnInit } from '@angular/core';
import { S3Service } from '@b3networks/api/file';
import { EMPTY, forkJoin, of } from 'rxjs';
import { catchError, filter, finalize, switchMap, tap } from 'rxjs/operators';
import { PortalConfig } from '../core/models/portal-config.model';
import { LegacyS3Service, PartnerService, UpdateDomainRequest } from '../core/services';

declare const X;

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent implements OnInit {
  isLoading = true;
  isUpdating = false;

  domain: string;

  portalConfig: PortalConfig;
  faviconUrl: string | ArrayBuffer;
  logoUrl: string | ArrayBuffer;

  initialSettings = {
    portalConfig: null,
    faviconUrl: null,
    logoUrl: null
  };
  isFaviconUploading = false;
  isLogoUploading = false;

  private faviconFile: File;
  private logoFile: File;

  constructor(
    private partnerService: PartnerService,
    private s3Service: S3Service,
    private legacyS3Service: LegacyS3Service
  ) {}

  ngOnInit() {
    forkJoin([this.partnerService.getDomain(), this.partnerService.getPortalConfig()])
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.setInitialSettings();
        })
      )
      .subscribe(
        ([partner, config]) => {
          this.domain = partner.domain;
          this.logoUrl = partner.logoUrl;
          this.faviconUrl = partner.faviconUrl;
          this.portalConfig = config;
        },
        err => {
          X.showWarn('Could not load settings!');
          console.log(err);
        }
      );
  }

  reset() {
    this.portalConfig = new PortalConfig(this.initialSettings.portalConfig);
    this.logoUrl = this.initialSettings.logoUrl;
    this.faviconUrl = this.initialSettings.faviconUrl;
  }

  hasChanges() {
    for (const i in this.portalConfig) {
      if (this.portalConfig[i] !== this.initialSettings.portalConfig[i]) {
        return true;
      }
    }
    return this.logoFile != null || this.faviconFile != null;
  }

  onFaviconFileChange(event) {
    const file: File = event.target.files[0];
    if (file == null) {
      return;
    }
    this.faviconFile = file;
    this.isFaviconUploading = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.faviconUrl = reader.result;
      this.isFaviconUploading = false;
      console.log(this.faviconUrl);
    };
  }

  onLogoFileChange(event) {
    const file: File = event.target.files[0];
    if (file == null) {
      return;
    }
    this.logoFile = file;
    this.isLogoUploading = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.logoUrl = reader.result;
      this.isLogoUploading = false;
    };
  }

  save() {
    this.isUpdating = true;
    const tasks = [];
    let updateDomainRequest: UpdateDomainRequest;

    of([this.logoFile, this.faviconFile])
      .pipe(
        switchMap(([logo, favico]) => {
          const stream = [];
          logo != null ? stream.push(this.upload(logo, 'logo')) : stream.push(of(null));
          favico != null ? stream.push(this.upload(favico, 'favicon')) : stream.push(of(null));
          return forkJoin(stream);
        })
      )
      .subscribe(_ => {
        updateDomainRequest = Object.assign(updateDomainRequest ? updateDomainRequest : {}, {
          logoUrl: this.logoUrl
        });

        updateDomainRequest = Object.assign(updateDomainRequest ? updateDomainRequest : {}, {
          faviconUrl: this.faviconUrl
        });
        if (updateDomainRequest) {
          tasks.push(this.partnerService.updateDomain(updateDomainRequest));
        }

        tasks.push(this.partnerService.updatePortalConfig(this.portalConfig));

        if (this.logoFile) {
          tasks.push(
            this.partnerService.getBucket().pipe(
              switchMap(
                bucket => this.legacyS3Service.upload(this.logoFile, bucket, 'assets/logo_white.png').publisher
              ),
              filter(event => event.status === 'completed'),
              catchError(() => EMPTY)
            )
          );
        }

        if (this.faviconFile) {
          tasks.push(
            this.partnerService.getBucket().pipe(
              switchMap(
                bucket => this.legacyS3Service.upload(this.faviconFile, bucket, 'assets/favicon.ico').publisher
              ),
              filter(event => event.status === 'completed'),
              catchError(() => EMPTY)
            )
          );
        }

        forkJoin(tasks)
          .pipe(finalize(() => (this.isUpdating = false)))
          .subscribe(
            () => {
              X.showSuccess('Saved successfully! Changes will take effect within 1 hour.');
              this.setInitialSettings();
            },
            err => {
              X.showWarn('Could not save changes!');
              console.log(err);
            }
          );
      });
  }

  private upload(file, type: 'favicon' | 'logo') {
    return this.s3Service
      .directUploadPublicAsset(file, type)
      .pipe(
        finalize(() => {
          type === 'favicon' ? (this.isFaviconUploading = false) : (this.isLogoUploading = false);
        })
      )
      .pipe(
        tap(res => {
          if (!!res.publicUrl && res.status === 'completed') {
            type === 'favicon' ? (this.faviconUrl = res.publicUrl) : (this.logoUrl = res.publicUrl);
          }
        })
      );
  }

  private setInitialSettings() {
    this.initialSettings.portalConfig = new PortalConfig(this.portalConfig);
    this.initialSettings.faviconUrl = this.faviconUrl;
    this.initialSettings.logoUrl = this.logoUrl;

    this.logoFile = null;
    this.faviconFile = null;
  }
}
