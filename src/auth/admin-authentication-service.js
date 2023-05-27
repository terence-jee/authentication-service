import { __awaiter, __decorate } from "tslib";
import { Injectable } from '@angular/core';
//Implement Keycloak NodeJS Admin Client package
//https://github.com/keycloak/keycloak-nodejs-admin-client
//There's source code and documentation is there for the link above
//IMPORTANT: Currently using admin@gov.ab.ca as the service account which is using the "Service Account" realm role
//This will fail if the account does not exist or permissions revoked.
let AdminAuthenticationService = class AdminAuthenticationService {
    initialize(adminClient) {
        this.kcAdminClient = adminClient;
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            // List all users
            //await this.authorizeService();
            const users = yield this.kcAdminClient.users.find();
            return users;
        });
    }
    getUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.kcAdminClient.users.findOne({ id: userId });
            return user;
        });
    }
    //Role mapping stuff can be found here:
    //https://github.com/keycloak/keycloak-nodejs-admin-client/blob/master/test/users.spec.ts#L143
    addUserToRealmRole(userId, roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            let addedToRole = false;
            const role = yield this.kcAdminClient.roles.findOneByName({
                name: roleName,
            });
            if (!role) {
                throw new Error('ArgumentNullException: roles does not exist for this realm');
            }
            else {
                //need to check current user roles
                const userRoles = yield this.kcAdminClient.users.listRealmRoleMappings({
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
                    yield this.kcAdminClient.users.addRealmRoleMappings({
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
        });
    }
};
AdminAuthenticationService = __decorate([
    Injectable({
        providedIn: 'root',
    })
], AdminAuthenticationService);
export { AdminAuthenticationService };
//# sourceMappingURL=admin-authentication-service.js.map