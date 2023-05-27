//import { AppConfigService } from '../config/config.service';
import KeycloakAdminClient from 'keycloak-admin';
import { Injectable } from '@angular/core';

//Implement Keycloak NodeJS Admin Client package
//https://github.com/keycloak/keycloak-nodejs-admin-client
//There's source code and documentation is there for the link above
//IMPORTANT: Currently using admin@gov.ab.ca as the service account which is using the "Service Account" realm role
//This will fail if the account does not exist or permissions revoked.

@Injectable({
  providedIn: 'root',
})
export class AdminAuthenticationService {
  // constructor() {}

  kcAdminClient: KeycloakAdminClient;

  initialize(adminClient: KeycloakAdminClient) {
    this.kcAdminClient = adminClient;
  }

  async getAllUsers() {
    // List all users
    //await this.authorizeService();
    const users = await this.kcAdminClient.users.find();
    return users;
  }

  async getUser(userId: string) {
    const user = await this.kcAdminClient.users.findOne({ id: userId });
    return user;
  }

  //Role mapping stuff can be found here:
  //https://github.com/keycloak/keycloak-nodejs-admin-client/blob/master/test/users.spec.ts#L143
  async addUserToRealmRole(userId: string, roleName: string) {
    let addedToRole = false;
    const role = await this.kcAdminClient.roles.findOneByName({
      name: roleName,
    });
    if (!role) {
      throw new Error('ArgumentNullException: roles does not exist for this realm');
    } else {
      //need to check current user roles
      const userRoles = await this.kcAdminClient.users.listRealmRoleMappings({
        id: userId,
      });
      let userAlreadyInRole = false;
      const findRole = userRoles.find((r) => r.id === role.id);
      if (findRole) {
        userAlreadyInRole = true;
      }

      //this will list all role mappings (client and realm)
      // const res = await this.kcAdminClient.users.listRoleMappings({
      //   id: userId,
      // });
      // console.log(res);
      //return false;

      if (!userAlreadyInRole) {
        await this.kcAdminClient.users.addRealmRoleMappings({
          id: userId,
          roles: [
            {
              id: role.id,
              name: role.name,
            },
          ],
        });
        addedToRole = true;
      }
    }
    return addedToRole;
  }
}
