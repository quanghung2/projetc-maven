import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ChannelUI } from '@b3networks/api/workspace';
import { X } from '@b3networks/shared/common';
import { enableAkitaProdMode, persistState } from '@datorama/akita';
import { debounceTime } from 'rxjs/operators';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  enableAkitaProdMode();
}

X.init();

const channelUIStorage = persistState({
  include: ['UI/chat_channel'],
  key: `uw_chat_channel_ui_v1_${X.orgUuid}`,
  preStorageUpdate(storeName, state) {
    if (storeName === 'UI/chat_channel') {
      const entites = {};
      Object.keys(state.entities)
        .filter(id => !!state.entities[id]?.draftMsg || !!state.entities[id]?.replyingMessage)
        .forEach(id => {
          entites[id] = <ChannelUI>{
            id: id,
            draftMsg: state.entities[id]?.draftMsg,
            replyingMessage: state.entities[id]?.replyingMessage
          };
        });
      return {
        ...state,
        entities: entites
      };
    }

    return state;
  },
  preStorageUpdateOperator: () => debounceTime(2000),
  persistOnDestroy: true
});

const providers = [{ provide: 'persistStorage', useValue: channelUIStorage, multi: true }];

platformBrowserDynamic(providers)
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
