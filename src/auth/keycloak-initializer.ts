//this needs to run and initialize before you can use AuthenticationService
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
//import KeycloakAdminClient from 'keycloak-admin';

interface KeycloakInitOptions {
  onLoad?: string;
  checkLoginIframe?: boolean;
}

//don't need to worry about doing this because it's being initialized on startup in the module.ts file
@Injectable({
  providedIn: 'root',
})
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

    // if (this.adminClientId && this.adminClientSecret) {
    //   this.environmentConfig = {
    //     baseUrl: url,
    //     realmName: realm,
    //   };

    //   this.adminConfig = {
    //     grantType: 'client_credentials',
    //     clientId: adminClientId,
    //     clientSecret: adminClientSecret,
    //   };
    // }
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

  //this needs to be run before you can use any functions as it authorizes the service account.
  //also only needs to be run once on init or first time it's used

  // async authorizeAdminService() {
  //   this.keycloakAdminClient = new KeycloakAdminClient(this.environmentConfig);
  //   if (this.serviceAuthorized === false) {
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     const serviceAuth = this.keycloakAdminClient.auth(this.adminConfig as any);
  //     await serviceAuth
  //       .then(() => {
  //         //authorization successful
  //         this.serviceAuthorized = true;
  //       })
  //       .catch(() => {
  //         //authorization failed
  //         this.serviceAuthorized = false;
  //       });
  //   }
  //   return this.keycloakAdminClient;
  // }
}

//**We can remove this code if we no longer need it**/
//Code giving to us from Chris Coldwell
//Looks like it's out dated as it's using an old package, but just keeping it here for reference
//keycloak admin service can be found here: libs\common\ui\shared-components\src\lib\shared\services\authentication\admin-authentication-service.ts

//Implement Keycloak admin service with these helpers
//https://www.npmjs.com/package/keycloak-admin-client

// ‘use strict’;
// const adminClient = require(‘keycloak-admin-client’);
// const getToken = require(‘keycloak-request-token’);
// const request = require(‘request-promise-native’);
// class AdminClient {
//     constructor(config) {
//         this.config = AdminClient.createAdminClientConfig(config);
//         this.request = new KeyCloakAdminRequest(this.config);
//     }
//     static createAdminClientConfig(config) {
//         const authServerUrl = `${config.serverUrl}/auth`;
//         return {
//             realm: config.realm,
//             baseUrl: authServerUrl,
//             resource: config.resource,
//             username: config.adminLogin,
//             password: config.adminPassword,
//             grant_type: ‘password’,
//             client_id: config.adminClienId || ‘admin-cli’
//         };
//     }
//     realmsList() {
//         return adminClient(this.config).then(client => client.realms.find());
//     }
//     usersList() {
//         return adminClient(this.config).then(client => client.users.find(this.config.realm));
//     }
//     createTestUser() {
//         return adminClient(this.config)
//             .then(
//                 client => createTestUser(client, this.config.realm)
//                     .then(
//                         newUser => resetUserPassword(client, this.config.realm, newUser)
//                             .then(
//                                 () => newUser
//                             )
//                     )
//             );
//     }
//     updateTestUser() {
//         return adminClient(this.config)
//             .then(
//                 client => this.findTestUser()
//                     .then(
//                         user => {
//                             user.firstName = ‘user first name updated’;
//                             return client.users.update(this.config.realm, user)
//                                 .then(
//                                     () => ‘user updated’
//                                 );
//                         }
//                     )
//             );
//     }
//     findTestUser() {
//         return adminClient(this.config)
//             .then(
//                 client => client.users.find(this.config.realm, {
//                     username: ‘test_user’
//                 })
//             )
//             .then(
//                 users => {
//                     let user = users && users[0];
//                     return user && user.id ? Promise.resolve(user) : Promise.reject(‘user not found’);
//                 }
//             );
//     }
//     setTestUserCustomerId() {
//         return adminClient(this.config)
//             .then(
//                 client => this.findTestUser()
//                     .then(
//                         user => {
//                             user.attributes = user.attributes || {};
//                             user.attributes.customerId = 123;
//                             return client.users.update(this.config.realm, user)
//                                 .then(
//                                     () => ‘customerId added’
//                                 );
//                         }
//                     )
//             );
//     }
//     removeTestUserCustomerId() {
//         return adminClient(this.config)
//             .then(
//                 client => this.findTestUser()
//                     .then(
//                         user => {
//                             user.attributes = user.attributes || {};
//                             user.attributes.customerId = undefined;
//                             return client.users.update(this.config.realm, user)
//                                 .then(() => ‘customerId removed’);
//                         }
//                     )
//             );
//     }
//     // this is an example how to get user by id
//     getUserById() {
//         return adminClient(this.config)
//             .then(
//                 client => this.findTestUser()
//                     .then(
//                         user => client.users.find(this.config.realm, {
//                             userId: user.id
//                         })
//                     )
//             );
//     }
//     deleteTestUser() {
//         return adminClient(this.config)
//             .then(
//                 client => this.findTestUser()
//             )
//             .then(
//                 user => this.deleteUserById(user.id)
//             );
//     }
//     deleteUserById(userId) {
//         return adminClient(this.config)
//             .then(
//                 client => client.users.remove(this.config.realm, userId)
//             ).then(
//                 () => ‘user deleted’
//             );
//     }
//     // admin client doesn’t have these methods
//     createRole() {
//         return this.authenticate()
//             .then(
//                 token => this.request.createRole(‘TEST_ROLE’, token)
//             )
//             .then(
//                 () => ‘role created’
//             );
//     }
//     deleteRole() {
//         return this.authenticate()
//             .then(
//                 token => this.request.deleteRole(‘TEST_ROLE’, token)
//             )
//             .then(
//                 () => ‘TEST_ROLE role is deleted’
//             );
//     }
//     addTestRoleToTestUser() {
//         return this.findTestUser()
//             .then(
//                 user => this.authenticate()
//                     .then(
//                         token => this.getRoleByName(‘TEST_ROLE’)
//                             .then(
//                                 role => this.request.addRole(user.id, role, token)
//                             )
//                     ).then(
//                         () => ‘TEST_ROLE role is added to the user login=test_user’
//                     )
//             );
//     }
//     removeTestRoleFromTestUser() {
//         return this.findTestUser()
//             .then(
//                 user => this.authenticate()
//                     .then(
//                         token => this.getRoleByName(‘TEST_ROLE’)
//                             .then(
//                                 role => this.request.removeRoleFromUser(user.id, role, token)
//                             )
//                     )
//                     .then(
//                         () => ‘TEST_ROLE role is removed from user’
//                     )
//             );
//     }
//     getRoleByName(roleName) {
//         return this.authenticate()
//             .then(
//                 token => this.request.getRole(roleName, token)
//             )
//             .then(
//                 role => role ? Promise.resolve(role) : Promise.reject(‘role not found’)
//             );
//     }
//     authenticate() {
//         return getToken(this.config.baseUrl, this.config);
//     }
// }
// function createTestUser(client, realm) {
//     return client.users.create(realm, {
//         username: ‘test_user’,
//         firstName: ‘user first name’,
//         enabled: true
//     });
// }
// function resetUserPassword(client, realm, user) {
//     // set password ‘test_user’ for a user
//     return client.users.resetPassword(realm, user.id, {
//         type: ‘password’,
//         value: ‘test_user’
//     });
// }
// class KeyCloakAdminRequest {
//     constructor(config) {
//         this.config = config;
//     }
//     addRole(userId, role, token) {
//         return this.doRequest(‘POST’,
//             `/admin/realms/${this.config.realm}/users/${userId}/role-mappings/realm`, token, [role]);
//     }
//     createRole(roleName, token) {
//         return this.doRequest(‘POST’,
//             `/admin/realms/${this.config.realm}/roles`, token, {
//                 name: roleName
//             });
//     }
//     deleteRole(roleName, token) {
//         return this.doRequest(‘DELETE’,
//             `/admin/realms/${this.config.realm}/roles/${roleName}`, token);
//     }
//     getRole(roleName, token) {
//         return this.doRequest(‘GET’,
//             `/admin/realms/${this.config.realm}/roles/${roleName}`, token, null);
//     }
//     removeRoleFromUser(userId, role, token) {
//         return this.doRequest(‘DELETE’,
//             `/admin/realms/${this.config.realm}/users/${userId}/role-mappings/realm`, token, [role]);
//     }
//     doRequest(method, url, accessToken, jsonBody) {
//         let options = {
//             url: this.config.baseUrl + url,
//             auth: {
//                 bearer: accessToken
//             },
//             method: method,
//             json: true
//         };
//         if (jsonBody !== null) {
//             options.body = jsonBody;
//         }
//         return request(options).catch(error => Promise.reject(error.message ? error.message : error));
//     }
// }
// module.exports = AdminClient;
