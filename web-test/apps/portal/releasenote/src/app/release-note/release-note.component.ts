import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReleaseNote, ReleaseNoteService } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { isSameDay } from 'date-fns';
import { DeltaStatic } from 'quill';

import * as Q from 'quill';
const Quill: any = Q;

interface MSG {
  action: 'logout' | 'switchOrg' | 'loaded' | 'close';
  status: 'success' | 'fail';
  fromOrg?: string;
  toOrg?: string;
}

declare let CrossPlatformMobile: any;
declare let Android: any;
declare let webkit: any;

@Component({
  selector: 'b3n-release-note',
  templateUrl: './release-note.component.html',
  styleUrls: ['./release-note.component.scss']
})
export class ReleaseNoteComponent extends DestroySubscriberComponent implements OnInit {
  releases: ReleaseNote[];
  releasesFiltered: ReleaseNoteMapping[];
  menus: Date[] = [];
  selectedIndex: number;
  releaseSelected: Date;

  constructor(private releaseNoteService: ReleaseNoteService, private domSanitizer: DomSanitizer) {
    super();
  }

  ngOnInit() {
    this.releaseNoteService.fetchReleases().subscribe(releases => {
      this.releases = releases;
      this.initMenu();
      this.fireMsgOut({
        action: 'loaded',
        status: 'success'
      });
    });
  }

  initMenu() {
    const publishedAts = this.releases.map(r => new Date(r.publishedAt * 1000));
    publishedAts.forEach(c => {
      const found = this.menus.find(m => isSameDay(m, c));
      if (!found) {
        this.menus.push(c);
      }
    });
    this.releaseSelected = this.menus[0];
    this.filterReleases(this.menus[0], 0);
  }

  filterReleases(date: Date, index?: number) {
    this.selectedIndex = index;
    const dom = document.createElement('div');
    const quillInstance = new Quill(dom);
    this.releasesFiltered = this.releases
      .filter(r => isSameDay(date, new Date(r.publishedAt * 1000)))
      ?.map(x => {
        let data: DeltaStatic, isQuill: boolean, html: string;
        try {
          data = JSON.parse(x.content);
          isQuill = !!data?.['ops'];
          if (isQuill) {
            quillInstance?.setContents(data);
            html = quillInstance.root?.innerHTML;
          }
        } catch (error) {}
        return new ReleaseNoteMapping({ ...x, isQuill: isQuill, quillData: data, quillHTML: html });
      });
  }

  fireMsgOut(msg: MSG) {
    // for IOS
    try {
      if (typeof webkit !== 'undefined' && webkit !== null) {
        webkit.messageHandlers.callbackHandler.postMessage(msg);
      }
    } catch (err) {}

    try {
      if (typeof CrossPlatformMobile !== 'undefined' && CrossPlatformMobile !== null) {
        CrossPlatformMobile.postMessage(JSON.stringify(msg));
      }
    } catch (err) {}

    // for android
    try {
      if (typeof Android !== 'undefined' && Android !== null) {
        Android.closeWebView(msg);
      }
    } catch (err) {}
  }
}

export class ReleaseNoteMapping implements ReleaseNote {
  id: number;
  content: string;
  title: string;
  modifiedAt: number;
  createdAt: number;
  publishedAt: number;
  isQuill: boolean;
  quillData: DeltaStatic;
  quillHTML: string;

  constructor(obj?: Partial<ReleaseNoteMapping>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
