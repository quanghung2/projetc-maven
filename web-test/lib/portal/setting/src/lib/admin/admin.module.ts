import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ADMIN_LINK } from '../shared/contants';

const routes: Routes = [
  {
    path: ADMIN_LINK.microsoftTeams,
    loadChildren: () => import('./ms-teams/ms-teams.module').then(m => m.MsTeamsModule)
  },
  {
    path: ADMIN_LINK.callGroup,
    loadChildren: () => import('./ext-group/ext-group.module').then(m => m.ExtGroupModule)
  },
  {
    path: ADMIN_LINK.autoAttendant,
    loadChildren: () => import('./auto-attendant/auto-attendant.module').then(m => m.AutoAttendantModule)
  },
  {
    path: ADMIN_LINK.adminTools,
    loadChildren: () => import('./admin-tools/admin-tools.module').then(m => m.AdminToolsModule)
  },

  {
    path: ADMIN_LINK.queueManagement,
    loadChildren: () => import('./queue/queue.module').then(m => m.QueueModule)
  },
  {
    path: ADMIN_LINK.busyLampField,
    loadChildren: () => import('./busy-lamp-field/busy-lamp-field.module').then(m => m.BusyLampFieldModule)
  },
  {
    path: ADMIN_LINK.generalSettings,
    loadChildren: () => import('./system-settings/system-settings.module').then(m => m.SystemSettingsModule)
  },
  {
    path: ADMIN_LINK.bookingMeeting,
    loadChildren: () => import('./meeting/meeting.module').then(mod => mod.MeetingModule)
  },
  {
    path: ADMIN_LINK.emailConfig,
    loadChildren: () => import('./email-settings/email-settings.module').then(m => m.EmailSettingsModule)
  },
  {
    path: ADMIN_LINK.ipPhone,
    loadChildren: () => import('./ip-phone/ip-phone.module').then(m => m.IpPhoneModule)
  },
  {
    path: ADMIN_LINK.inboundCallRule,
    loadChildren: () => import('./inbound-rule/inbound-rule.module').then(m => m.InboundRuleModule)
  },
  {
    path: ADMIN_LINK.outboundCallRule,
    loadChildren: () => import('./outbound-rule/outbound-rule.module').then(m => m.OutboundRuleModule)
  },
  {
    path: ADMIN_LINK.surveyTemplate,
    loadChildren: () => import('./survey-template/survey-template.module').then(m => m.SurveyTemplateModule)
  },
  {
    path: ADMIN_LINK.inboxManagement,
    loadChildren: () => import('./inbox-management/inbox-management.module').then(m => m.InboxManagementModule)
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class PortalMemberSettingSharedAdminModule {}
