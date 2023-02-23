export interface ExternalOAuth {
  app: App;
  email: string;
}

export interface App {
  displayName: string;
  clientId: string;
}

//--- Google --//

export interface AuthenticationGoogle {
  clientId: string;
  credential: string;
}

export interface ProfileGoogle {
  authenticated: boolean;
  domain: string;
  email: string;
  family_name: string;
  given_name: string;
  locale: string;
  name: string;
  picture: string;
  userId: string;
}

export interface RespAuthenGoogle {
  profile: ProfileGoogle;
  token: string;
}

export const ZOOM_CLIENT_ID = 'OKTpQea7R7aLBd6vDm014w';
export const MS_TEAM_CLIENT_ID = 'a146d307-0c74-491c-a347-3911289b47a5';
export const GOOGLE_CLIENT_ID = '597857113059-pmb446e3pne4uh4n70nmoqn0e5hgk6li.apps.googleusercontent.com';
