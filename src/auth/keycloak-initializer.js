//don't need to worry about doing this because it's being initialized on startup in the module.ts file
export class KeycloakInitializer {
    constructor(keycloakService, url, realm, clientId, ssoCheckAbsolutePath, // private adminClientId?: string, // private adminClientSecret?: string
    initOptions) {
        this.keycloakService = keycloakService;
        this.url = url;
        this.realm = realm;
        this.clientId = clientId;
        this.ssoCheckAbsolutePath = ssoCheckAbsolutePath;
        this.initOptions = initOptions;
        this.config = {};
        this.environmentConfig = {};
        //adminConfig = {};
        this.serviceAuthorized = false; //check if keycloak admin service has been authorized.
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
    initialize() {
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
//# sourceMappingURL=keycloak-initializer.js.map