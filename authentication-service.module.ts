import { NgModule } from '@angular/core';
import { AuthenticationService } from './src/auth/authentication-service';
import { KeycloakInitializer } from './src/auth/keycloak-initializer';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

@NgModule({
  declarations: [],
  imports: [],
  providers: [AuthenticationService, KeycloakService, KeycloakAngularModule, KeycloakInitializer],
  exports: [], // Add all exported artifacts here
})
export class AuthenticationServiceModule {}
