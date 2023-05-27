import { NgModule } from '@angular/core';
import { AuthenticationService } from './auth/authentication-service';
import { KeycloakInitializer } from './auth/keycloak-initializer';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

@NgModule({
  declarations: [],
  imports: [],
  providers: [AuthenticationService, KeycloakInitializer, KeycloakService, KeycloakAngularModule],
  exports: [], // Add all exported artifacts here
})
export class AuthenticationServiceModule {}
