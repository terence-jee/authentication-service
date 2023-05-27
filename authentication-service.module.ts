import { NgModule } from '@angular/core';
import { AuthenticationService } from './src/auth/authentication-service';
import { KeycloakInitializer } from './src/auth/keycloak-initializer';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

@NgModule({
  declarations: [],
  imports: [],
  providers: [AuthenticationService, KeycloakService, KeycloakAngularModule],
  exports: [], // Add all exported artifacts here
})
export class AuthenticationServiceModule {
  constructor(keycloakService: KeycloakService) {
    // Create an instance of KeycloakInitializer and initialize it
    const initializer = new KeycloakInitializer(keycloakService, /* constructor arguments */);
    initializer.initialize().then(() => {
      // Keycloak initialized successfully
    }).catch(() => {
      // Failed to initialize Keycloak
    });
  }
}
