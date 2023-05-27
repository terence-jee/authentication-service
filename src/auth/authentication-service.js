import { __awaiter, __decorate, __metadata } from "tslib";
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Router } from '@angular/router';
import { AlbertaCaAccountTypes, AlbertaCaGenderTypes } from '../entities/idp-data-albertaca';
import { replaceAll } from '../utils/utils';
import * as dayjs from 'dayjs';
import * as utcPlugin from 'dayjs/plugin/utc';
import * as timezonePlugin from 'dayjs/plugin/timezone';
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
//for more documentation: https://github.com/keycloak/keycloak-documentation/blob/main/securing_apps/topics/oidc/javascript-adapter.adoc
//contains information such as KeycloakLoginOptions and additional stuff you can configure
let AuthenticationService = class AuthenticationService {
    constructor(keycloakService, router) {
        this.keycloakService = keycloakService;
        this.router = router;
    }
    getUserProfile(attributes) {
        //need to check if user is authenticated first be seeing if they have a token, otherwise loadUserInfo will fail.
        const keycloakInstance = this.keycloakService.getKeycloakInstance();
        if (!(keycloakInstance === null || keycloakInstance === void 0 ? void 0 : keycloakInstance.authenticated)) {
            return null;
        }
        //get user information that we need
        return keycloakInstance.loadUserInfo().then((data) => {
            var _a, _b;
            const profileData = {
                email: data['email'],
                firstName: data['given_name'],
                lastName: data['family_name'],
                username: data['preferred_username'],
                userid: data['userid'],
                location: data['groups'] != undefined ? (_a = data['groups'][0]) === null || _a === void 0 ? void 0 : _a.replace('/', '') : '',
                title: (_b = data['title']) !== null && _b !== void 0 ? _b : '',
                attributes: {},
                roles: [],
                _rawProfile: data,
            };
            const customAttributes = {};
            if (attributes && attributes.length > 0) {
                attributes.forEach((attribute) => {
                    let attributeValue = null;
                    if (data[attribute]) {
                        attributeValue = data[attribute];
                    }
                    customAttributes[attribute] = attributeValue;
                });
            }
            profileData.attributes = customAttributes;
            return profileData;
        });
    }
    getUserRoles(availableRoles) {
        //get roles that the current user belongs to
        const allUserRoles = this.keycloakService.getUserRoles().sort();
        let userRoles = allUserRoles;
        if (availableRoles && availableRoles.length > 0) {
            //keycloak will return ALL roles and we may only want roles of an existing subset
            //only return roles that exist in this list.
            userRoles = allUserRoles.filter((i) => {
                return availableRoles.includes(i);
            });
        }
        return userRoles;
    }
    getUserProfileWithRoles(attributes, availableRoles) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield this.getUserProfile(attributes);
            if (profile) {
                profile.roles = this.getUserRoles(availableRoles);
            }
            return profile;
        });
    }
    isLoggedIn() {
        return __awaiter(this, void 0, void 0, function* () {
            const ili = yield this.keycloakService.isLoggedIn();
            return ili;
        });
    }
    signOut(returnUrl) {
        var _a;
        if (!returnUrl) {
            const originUrl = (_a = window.location) === null || _a === void 0 ? void 0 : _a.origin;
            if (originUrl) {
                returnUrl = originUrl;
            }
        }
        this.keycloakService.logout(returnUrl);
    }
    signIn(originalReturnUrl) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const returnUrl = this.getFullReturnUrl(originalReturnUrl);
            if (this.router && ((_a = this.router) === null || _a === void 0 ? void 0 : _a.url)) {
                this.router.navigateByUrl(this.router.url + '#signIn'); //this will ensure if user hits back on keycloak, that it goes to the correct page.
            }
            return this.keycloakService.login({
                redirectUri: returnUrl,
            });
        });
    }
    createAccount(originalReturnUrl) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const returnUrl = this.getFullReturnUrl(originalReturnUrl);
            if (this.router && ((_a = this.router) === null || _a === void 0 ? void 0 : _a.url)) {
                this.router.navigateByUrl(this.router.url + '#createAccount'); //this will ensure if user hits back on keycloak, that it goes to the correct page.
            }
            return this.keycloakService.register({
                redirectUri: returnUrl,
            });
        });
    }
    changePassword() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.router && ((_a = this.router) === null || _a === void 0 ? void 0 : _a.url)) {
                this.router.navigateByUrl(this.router.url + '#changePassword'); //this will ensure if user hits back on keycloak, that it goes to the correct page.
            }
            return this.keycloakService.login({
                action: 'UPDATE_PASSWORD',
            });
        });
    }
    isAuthenticated(refreshToken = true) {
        var _a;
        //a synchronous method to check if a user is logged in based on token exists.
        let isAuthenticated = false;
        const keycloakInstance = this.keycloakService.getKeycloakInstance();
        if (keycloakInstance) {
            isAuthenticated = (_a = keycloakInstance.authenticated) !== null && _a !== void 0 ? _a : false;
            //isLoggedIn() calls this as well to refresh token if it expires within 20 seconds.
            if (isAuthenticated && refreshToken) {
                this.keycloakService.updateToken(20);
            }
        }
        return isAuthenticated;
    }
    getKeycloakInstance() {
        const keycloakInstance = this.keycloakService.getKeycloakInstance();
        return keycloakInstance;
    }
    refreshToken(minValidity) {
        return __awaiter(this, void 0, void 0, function* () {
            const keycloakInstance = this.keycloakService.getKeycloakInstance();
            const tokenRefreshed = yield keycloakInstance
                .updateToken(minValidity)
                .then((refreshed) => {
                //token refreshed. set reset keycloak instance
                return refreshed;
            })
                .catch(function () {
                return null;
            });
            return tokenRefreshed;
        });
    }
    //this method will return a full url (with domain) if relative is passed in
    getFullReturnUrl(originalReturnUrl) {
        var _a;
        let returnUrl = originalReturnUrl;
        const originUrl = (_a = window.location) === null || _a === void 0 ? void 0 : _a.origin;
        if (!returnUrl) {
            returnUrl = window.location.href;
        }
        else {
            if (returnUrl.startsWith('/')) {
                returnUrl = originUrl + returnUrl;
            }
            else if (!returnUrl.startsWith('http')) {
                returnUrl = originUrl + '/' + returnUrl;
            }
        }
        return returnUrl;
    }
    //this is used to real time validate token. helps to detect token status if multiple tabs open
    validateToken(keycloakInstance) {
        return new Promise((resolve) => {
            keycloakInstance
                .loadUserInfo()
                .then((data) => {
                resolve(data);
            })
                .catch((err) => {
                console.log((err === null || err === void 0 ? void 0 : err.message) + (err === null || err === void 0 ? void 0 : err.statusText));
                resolve(null);
            });
        });
    }
    getIdpDataAlbertaCa() {
        return __awaiter(this, void 0, void 0, function* () {
            const keycloakInstance = this.getKeycloakInstance();
            const tokenParsed = keycloakInstance === null || keycloakInstance === void 0 ? void 0 : keycloakInstance.tokenParsed;
            if (tokenParsed['identity_provider'] === 'keycloak-madi') {
                const idpProfile = {};
                const loadProfile = yield keycloakInstance.loadUserProfile();
                //these values already exist in the token and are overridden in keycloak by the IDP
                idpProfile.firstName = tokenParsed['given_name'];
                idpProfile.lastName = tokenParsed['family_name'];
                idpProfile.email = tokenParsed['email'];
                //custom mapped attributes
                const profileAttributes = loadProfile['attributes'];
                if (loadProfile && profileAttributes) {
                    //map account type (verified/basic)
                    idpProfile.accountType = AlbertaCaAccountTypes.Basic;
                    const identityLoaValue = this.getIdpPropertyValue(profileAttributes, 'identityLOA');
                    if (identityLoaValue === null || identityLoaValue === void 0 ? void 0 : identityLoaValue.endsWith('/loa3')) {
                        idpProfile.accountType = AlbertaCaAccountTypes.Verified;
                    }
                    else if (identityLoaValue === null || identityLoaValue === void 0 ? void 0 : identityLoaValue.endsWith('/loa2')) {
                        idpProfile.accountType = AlbertaCaAccountTypes.PendingVerified;
                    }
                    //map gender
                    const genderValue = this.getIdpPropertyValue(profileAttributes, 'gender');
                    if (genderValue) {
                        const genderLookup = Object.values(AlbertaCaGenderTypes).find((genderType) => genderType.code === genderValue);
                        idpProfile.gender = genderLookup !== null && genderLookup !== void 0 ? genderLookup : AlbertaCaGenderTypes.Undefined;
                    }
                    idpProfile.middleName = this.getIdpPropertyValue(profileAttributes, 'middlename');
                    //format date of birth to be correct in MST time zone.
                    const dobValue = this.getIdpPropertyValue(profileAttributes, 'dateofbirth');
                    if (dobValue) {
                        const dateOfBirth = dayjs(dobValue).tz('MST');
                        idpProfile.dateOfBirth = new Date(dateOfBirth.format());
                    }
                    //phone
                    const mobilePhoneValue = this.getIdpPropertyValue(profileAttributes, 'mobilephone');
                    const homePhoneValue = this.getIdpPropertyValue(profileAttributes, 'homephone');
                    idpProfile.mobilePhone = mobilePhoneValue;
                    idpProfile.homePhone = homePhoneValue;
                    idpProfile.mobilePhone = replaceAll(idpProfile.mobilePhone, ' ', '');
                    idpProfile.mobilePhone = replaceAll(idpProfile.mobilePhone, '-', '');
                    idpProfile.mobilePhone = replaceAll(idpProfile.mobilePhone, '.', '');
                    idpProfile.mobilePhone = replaceAll(idpProfile.mobilePhone, '(', '');
                    idpProfile.mobilePhone = replaceAll(idpProfile.mobilePhone, ')', '');
                    idpProfile.homePhone = replaceAll(idpProfile.homePhone, ' ', '');
                    idpProfile.homePhone = replaceAll(idpProfile.homePhone, '-', '');
                    idpProfile.homePhone = replaceAll(idpProfile.homePhone, '.', '');
                    idpProfile.homePhone = replaceAll(idpProfile.homePhone, '(', '');
                    idpProfile.homePhone = replaceAll(idpProfile.homePhone, ')', '');
                    //address/prov/country/postal
                    idpProfile.country = this.getIdpPropertyValue(profileAttributes, 'country');
                    idpProfile.provState = this.getIdpPropertyValue(profileAttributes, 'stateorprovince');
                    idpProfile.city = this.getIdpPropertyValue(profileAttributes, 'city');
                    idpProfile.postalZipCode = this.getIdpPropertyValue(profileAttributes, 'postalcode');
                    idpProfile.streetAddress1 = this.getIdpPropertyValue(profileAttributes, 'streetaddress1');
                    idpProfile.streetAddress2 = this.getIdpPropertyValue(profileAttributes, 'streetaddress2');
                    idpProfile.provState = replaceAll(idpProfile.provState, 'CA-', '');
                    idpProfile.provState = replaceAll(idpProfile.provState, 'US-', '');
                    idpProfile.postalZipCode = replaceAll(idpProfile.postalZipCode, ' ', '');
                    //get ivs status
                    /**
                    http://identity.alberta.ca/ivsStatus/unverified
                    http://identity.alberta.ca/ivsStatus/verified
                    http://identity.alberta.ca/ivsStatus/pending
                    http://identity.alberta.ca/ivsStatus/expired
                    **/
                    const ivsStatusValue = this.getIdpPropertyValue(profileAttributes, 'ivsstatus'); //"http://identity.alberta.ca/ivsStatus/unverified";
                    const segments = ivsStatusValue.split('/');
                    const status = segments.length > 0 ? segments[segments.length - 1] : null;
                    idpProfile.status = status !== null && status !== void 0 ? status : null;
                    idpProfile.verified = idpProfile.status === 'verified';
                    return idpProfile;
                }
            }
            return null;
        });
    }
    //IDP values are always returning array
    getIdpPropertyValue(object, attributeName) {
        if (object && object[attributeName]) {
            const value = object[attributeName];
            let propertyValue = '';
            if (Array.isArray(value)) {
                propertyValue = value[0];
            }
            else {
                propertyValue = value;
            }
            return propertyValue;
        }
        return null;
    }
};
AuthenticationService = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __metadata("design:paramtypes", [KeycloakService, Router])
], AuthenticationService);
export { AuthenticationService };
//# sourceMappingURL=authentication-service.js.map