//this needs to run and initialize before you can use AuthenticationService
import { KeycloakService } from 'keycloak-angular';
//import KeycloakAdminClient from 'keycloak-admin';

interface KeycloakInitOptions {
  onLoad?: string;
  checkLoginIframe?: boolean;
}

//don't need to worry about doing this because it's being initialized on startup in the module.ts file
export class KeycloakInitializer {
  config = {};
  environmentConfig = {};
  //adminConfig = {};
  serviceAuthorized = false; //check if keycloak admin service has been authorized.

  constructor(
    private keycloakService: KeycloakService,
    private url?: string,
    private realm?: string,
    private clientId?: string,
    private ssoCheckAbsolutePath?: string, // private adminClientId?: string, // private adminClientSecret?: string
    private initOptions?: KeycloakInitOptions
  ) {
    //when this helper is created, we require keycloak service.
    //url, realm, and clientId only need to be passed in if you need to run init (which happens when app starts up).
    if (this.url && this.realm && this.clientId) {
      if (!this.initOptions) {
        this.initOptions = { onLoad: 'check-sso' };
      }

      this.config = {
        config: {
          url: this.url,
          realm: this.realm,
          clientId: this.clientId,
        },
        initOptions: initOptions,
      };
    }

    if (this.ssoCheckAbsolutePath) {
      this.config['initOptions'].silentCheckSsoRedirectUri = window.location.origin + this.ssoCheckAbsolutePath;
    }
  }

  initialize(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.keycloakService
        .init(this.config)
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          reject();
        });
    });
  }
}

