import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { ReqIndividualMetting, ReqIntelligenceGateway, RespIntelligenceGateway } from './chatbot.model';

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {
  hasBot: boolean;

  constructor(private http: HttpClient) {}

  startChatbot(req: ReqIntelligenceGateway) {
    // return of(<RespIntelligenceGateway>{
    //   handledByBot: false
    // });
    return this.http
      .post<RespIntelligenceGateway>(`intelligence-gateway/connector/live-chat/public/v1/handle-inbound`, req)
      .pipe(
        tap(res => {
          this.hasBot = res.handledByBot;
        })
      );
  }

  startIndividualMeeting(req: ReqIndividualMetting) {
    return this.http.post<{ convo_id: string }>(
      `intelligence-gateway/connector/individual-meeting/public/v1/start`,
      req
    );
  }

  checkIndividualSkill(org_uuid: string, identity_uuid: string) {
    return this.http
      .post<{ booking_bot_enabled: boolean }>(`intelligence-gateway/connector/live-chat/public/v1/individual-skill`, {
        org_uuid,
        identity_uuid
      })
      .pipe(map(bot => bot.booking_bot_enabled));
  }
}
