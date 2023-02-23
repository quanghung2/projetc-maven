import { Directive, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import {
  ChannelHyperspaceQuery,
  ChannelQuery,
  ChannelService,
  ConversationGroupQuery,
  ConversationGroupService,
  HyperspaceQuery,
  MeQuery,
  User,
  UserQuery,
  UserService
} from '@b3networks/api/workspace';
import { isLocalhost } from '@b3networks/shared/common';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { ChatType } from '../constant/common.const';
import { MatchType } from '../model/match.model';
import { InfoShowMention } from '../state/app-state.model';
import { InfoFileMarkdown } from './../../components/chat-message/chat-message.component';

@Directive({
  selector: '[lazyloadUnknown]'
})
export class LazyLoadUnknownDirective implements OnChanges, OnDestroy {
  @Input() text: string;

  @Output() showProfile = new EventEmitter<InfoShowMention>();
  @Output() downloadFileWithFileKey = new EventEmitter<InfoFileMarkdown>();

  private subcription$ = new Subject();

  constructor(
    private el: ElementRef,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private userQuery: UserQuery,
    private userService: UserService,
    private hyperspaceQuery: HyperspaceQuery,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private conversationGroupQuery: ConversationGroupQuery,
    private conversationGroupService: ConversationGroupService,
    private meQuery: MeQuery,
    private router: Router
  ) {}

  ngOnDestroy() {
    this.onDestroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      this.subcription$.next(true);
      try {
        this.renderText();
      } catch (error) {
        console.log('🚀 ~ error', error);
      }
    }
  }

  private renderText() {
    this.el.nativeElement.querySelectorAll('.cannotRender')?.forEach(child => {
      const type = child?.dataset?.cannotRender; // attr = data-cannot-render
      if (type === MatchType.CHANNEL.toString()) {
        const channelString = child.getAttribute('data-channel');

        const hyperId = child.getAttribute('data-hyper-id');
        if (hyperId) {
          const find = this.channelHyperspaceQuery.getEntity(channelString);
          if (find) {
            child.href = `./#/hyperspace/${hyperId}/${channelString}`;
            child.innerHTML = `#${find.name}`;
            child.classList.remove('cannotRender');
          } else {
            this.channelHyperspaceQuery
              .selectEntity(channelString)
              .pipe(
                filter(x => x != null),
                take(1),
                takeUntil(this.subcription$)
              )
              .subscribe(() => this.renderText());
          }
        } else {
          if (this.channelService.convoNotFound.indexOf(channelString) > -1) {
            child.classList.remove('cannotRender');
            return;
          }
          const find = this.channelQuery.getEntity(channelString);
          if (find) {
            if (isLocalhost()) {
              return;
            }
            const href = window.parent.location.href.split('?')[0];
            const path = encodeURIComponent(`/conversations/${channelString}`);
            child.href = `${href}?path=${path}`;
            child.innerHTML = `#${find.name}`;
            child.classList.remove('cannotRender');

            const span = document.createElement('span');
            span.innerHTML = child.outerHTML;
            child.parentNode.replaceChild(span, child);
            this.navigateWithPath(span, path);
          } else {
            if (this.channelQuery.storeLoaded()) {
              this.onDestroy();
              this.channelService.getDetails(channelString, this.meQuery.getMe().userUuid).subscribe(channel => {
                if (channel) {
                  const href = window.parent.location.href.split('?')[0];
                  const path = encodeURIComponent(`/conversations/${channelString}`);
                  child.href = `${href}?path=${path}`;
                  child.innerHTML = `#${channel.name}`;
                  child.classList.remove('canotRender');

                  const span = document.createElement('span');
                  span.innerHTML = child.outerHTML;
                  child.parentNode.replaceChild(span, child);
                  this.navigateWithPath(span, path);
                }
              });
            } else {
              this.channelQuery.loaded$
                .pipe(
                  filter(x => x),
                  take(1),
                  takeUntil(this.subcription$)
                )
                .subscribe(() => this.renderText());
            }
          }
        }
      } else if (type === MatchType.MENTION.toString()) {
        const mentionString = child.getAttribute('data-user-chatUuid');

        const hyperId = child.getAttribute('data-hyper-id');
        if (hyperId) {
          const hyper = this.hyperspaceQuery.getHyperByHyperspaceId(hyperId);
          if (hyper) {
            const find = hyper.allMembers.find(x => x.userUuid === mentionString);
            if (find) {
              child.innerHTML = `@${find.displayName}`;
              child.setAttribute('data-user-uuid', find.identityUuid);
              child.classList.remove('cannotRender');
              this.trackingClickShowMention(child, find);
            }
          } else {
            this.hyperspaceQuery
              .selectEntity(hyperId)
              .pipe(
                filter(x => x != null),
                take(1),
                takeUntil(this.subcription$)
              )
              .subscribe(() => this.renderText());
          }
        } else {
          if (this.userService.notFoundUsers.indexOf(mentionString) > -1) {
            child.classList.remove('cannotRender');
            return;
          }
          const find = this.userQuery.getUserByChatUuid(mentionString);
          if (find) {
            child.innerHTML = `@${find.displayName}`;
            child.setAttribute('data-user-uuid', find.identityUuid);
            child.classList.remove('cannotRender');
            this.trackingClickShowMention(child, find);
          } else {
            if (this.userQuery.storeLoaded()) {
              this.onDestroy();
              this.userService.findByUuidAndUserType([mentionString], 'chatId').subscribe(users => {
                if (users.length > 0) {
                  child.innerHTML = `@${(users[0] as User).displayName}`;
                  child.setAttribute('data-user-uuid', (users[0] as User).identityUuid);
                  child.classList.remove('cannotRender');
                  this.trackingClickShowMention(child, find);
                }
              });
            } else {
              // wait getallUser api done
              this.userQuery
                .selectStoreLoaded()
                .pipe(
                  filter(x => x),
                  take(1),
                  takeUntil(this.subcription$)
                )
                .subscribe(() => this.renderText());
            }
          }
        }
      } else if (type === MatchType.LINK.toString()) {
        if (isLocalhost()) {
          return;
        }

        try {
          const typeConvo = child.getAttribute('data-convo-type');
          const query = child.getAttribute('data-query');
          const path = child.getAttribute('data-path');
          const urlSearchParams = new URLSearchParams(query);

          if (typeConvo === ChatType.email) {
            // email
            const convoChildId = urlSearchParams.get('convoChildId');
            if (!convoChildId || this.conversationGroupService.convoNotFound.indexOf(convoChildId) > -1) {
              child.classList.remove('canotRender');
              return;
            }

            const find = this.conversationGroupQuery.getConvosByChildId(convoChildId)[0];
            if (find) {
              child.innerHTML = `<span>${find.description}</span>`;
              child.style.paddingLeft = '15px';
              child.classList.remove('canotRender');

              const span = document.createElement('span');
              span.style.position = 'relative';
              span.innerHTML = `<mat-icon class="material-icons icon-mail" >mail</mat-icon> ` + child.outerHTML;
              child.parentNode.replaceChild(span, child);
              child.setAttribute('target', '_parent');
              this.navigateWithPath(span, path, {
                convoChildId: convoChildId
              });
            } else {
              this.conversationGroupService
                .getConversationDetail(convoChildId, this.meQuery.getMe().userUuid, true)
                .subscribe(c => {
                  if (c) {
                    child.innerHTML = `<span>${c.description}</span>`;
                    child.style.paddingLeft = '15px';
                    child.classList.remove('canotRender');

                    const span = document.createElement('span');
                    span.style.position = 'relative';
                    span.innerHTML = `<mat-icon class="material-icons icon-mail" >mail</mat-icon> ` + child.outerHTML;
                    child.parentNode.replaceChild(span, child);
                    child.setAttribute('target', '_parent');
                    this.navigateWithPath(span, path, {
                      convoChildId: convoChildId
                    });
                  }
                });
            }
          } else if (typeConvo === ChatType.channel) {
            // channel
            const arr = path.split('/');
            const channelString = arr[arr.length - 1];
            if (this.channelService.convoNotFound.indexOf(channelString) > -1) {
              child.classList.remove('canotRender');
              return;
            }

            const find = this.channelQuery.getEntity(channelString);
            if (find) {
              child.innerHTML = `#${find.name}`;
              child.classList.remove('cannotRender');
              child.setAttribute('target', '_parent');
              this.navigateWithPath(child, path);
            } else {
              if (this.channelQuery.storeLoaded()) {
                this.onDestroy();
                this.channelService.getDetails(channelString, this.meQuery.getMe().userUuid).subscribe(channel => {
                  if (channel) {
                    child.innerHTML = `#${channel.name}`;
                    child.classList.remove('canotRender');
                    child.setAttribute('target', '_parent');
                    this.navigateWithPath(child, path);
                  }
                });
              } else {
                this.channelQuery.loaded$
                  .pipe(
                    filter(x => x),
                    take(1),
                    takeUntil(this.subcription$)
                  )
                  .subscribe(() => this.renderText());
              }
            }
          }
        } catch (error) {
          console.log(error);
          child.classList.remove('canotRender');
        }
      } else if (type === MatchType.HIGHLIGHT_LINK.toString()) {
        try {
          const path = child.getAttribute('data-path');
          if (path?.startsWith('storage://')) {
            child.style.cursor = 'pointer';
            const fileKey = path.replace('storage://', '');
            this.trackingClickLinkFile(child, <InfoFileMarkdown>{
              fileKey: fileKey,
              fileName: child.innerText
            });
          }
        } catch (error) {
          console.log(error);
          child.classList.remove('canotRender');
        }
      }
    });
  }

  private onDestroy() {
    this.subcription$?.next(true);
    this.subcription$?.complete();
    this.subcription$ = null;
  }

  private navigateWithPath(child: HTMLElement, path: string, query = {}) {
    child.addEventListener('click', $event => {
      $event.preventDefault();
      path = decodeURIComponent(path);
      if (path.includes(';')) {
        path = path.split(';')[0];
      }

      if (path.includes('?')) {
        path = path.split('?')[0];
      }

      this.router.navigate([path], { queryParams: query, queryParamsHandling: 'merge' });
    });
  }

  private trackingClickShowMention(child: HTMLElement, user: User) {
    child.addEventListener('click', event => {
      event.stopPropagation();
      this.showProfile.emit(<InfoShowMention>{
        xPosition: event.x,
        yPosition: event.y,
        member: user
      });
    });
  }

  private trackingClickLinkFile(child: HTMLElement, info: InfoFileMarkdown) {
    child.addEventListener('click', event => {
      event.stopPropagation();
      this.downloadFileWithFileKey.emit(info);
    });
  }
}
