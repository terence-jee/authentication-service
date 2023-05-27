import { KeycloakService } from 'keycloak-angular';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthUserProfile } from '../entities/auth-user-profile.interface';
import { IdpDataAlbertaCa, AlbertaCaAccountTypes, AlbertaCaGenderTypes } from '../entities/idp-data-albertaca';
import { KeycloakInstance } from 'keycloak-js';
import { replaceAll } from '../utils/utils';
import * as dayjs from 'dayjs';
import * as utcPlugin from 'dayjs/plugin/utc';
import * as timezonePlugin from 'dayjs/plugin/timezone';
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

//for more documentation: https://github.com/keycloak/keycloak-documentation/blob/main/securing_apps/topics/oidc/javascript-adapter.adoc
//contains information such as KeycloakLoginOptions and additional stuff you can configure
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  id;
  constructor(private keycloakService: KeycloakService, private router?: Router) {}

  getUserProfile(attributes?: Array<string>) {
    //need to check if user is authenticated first be seeing if they have a token, otherwise loadUserInfo will fail.
    const keycloakInstance = this.keycloakService.getKeycloakInstance();
    if (!keycloakInstance?.authenticated) {
      return null;
    }

    //get user information that we need
    return keycloakInstance.loadUserInfo().then((data) => {
      const profileData = {
        email: data['email'],
        firstName: data['given_name'],
        lastName: data['family_name'],
        username: data['preferred_username'],
        userid: data['userid'],
        location: data['groups'] != undefined ? data['groups'][0]?.replace('/', '') : '',
        title: data['title'] ?? '',
        attributes: {},
        roles: [],
        _rawProfile: data,
      } as AuthUserProfile;

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

  getUserRoles(availableRoles?: Array<string>) {
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

  async getUserProfileWithRoles(attributes?: Array<string>, availableRoles?: Array<string>) {
    const profile = await this.getUserProfile(attributes);
    if (profile) {
      profile.roles = this.getUserRoles(availableRoles);
    }
    return profile;
  }

  async isLoggedIn() {
    const ili = await this.keycloakService.isLoggedIn();

    return ili;
  }

  signOut(returnUrl?: string): void {
    if (!returnUrl) {
      const originUrl = window.location?.origin;
      if (originUrl) {
        returnUrl = originUrl;
      }
    }
    this.keycloakService.logout(returnUrl);
  }

  async signIn(originalReturnUrl?: string) {
    const returnUrl = this.getFullReturnUrl(originalReturnUrl);
    if (this.router && this.router?.url) {
      this.router.navigateByUrl(this.router.url + '#signIn'); //this will ensure if user hits back on keycloak, that it goes to the correct page.
    }
    return this.keycloakService.login({
      redirectUri: returnUrl,
    });
  }

  async createAccount(originalReturnUrl?: string) {
    const returnUrl = this.getFullReturnUrl(originalReturnUrl);
    if (this.router && this.router?.url) {
      this.router.navigateByUrl(this.router.url + '#createAccount'); //this will ensure if user hits back on keycloak, that it goes to the correct page.
    }
    return this.keycloakService.register({
      redirectUri: returnUrl,
    });
  }

  async changePassword() {
    if (this.router && this.router?.url) {
      this.router.navigateByUrl(this.router.url + '#changePassword'); //this will ensure if user hits back on keycloak, that it goes to the correct page.
    }
    return this.keycloakService.login({
      action: 'UPDATE_PASSWORD',
    });
  }

  isAuthenticated(refreshToken = true) {
    //a synchronous method to check if a user is logged in based on token exists.
    let isAuthenticated = false;
    const keycloakInstance = this.keycloakService.getKeycloakInstance();
    if (keycloakInstance) {
      isAuthenticated = keycloakInstance.authenticated ?? false;
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

  async refreshToken(minValidity: number) {
    const keycloakInstance = this.keycloakService.getKeycloakInstance();
    const tokenRefreshed = await keycloakInstance
      .updateToken(minValidity)
      .then((refreshed) => {
        //token refreshed. set reset keycloak instance
        return refreshed;
      })
      .catch(function () {
        return null;
      });
    return tokenRefreshed;
  }

  //this method will return a full url (with domain) if relative is passed in
  private getFullReturnUrl(originalReturnUrl?: string) {
    let returnUrl = originalReturnUrl;
    const originUrl = window.location?.origin;
    if (!returnUrl) {
      returnUrl = window.location.href;
    } else {
      if (returnUrl.startsWith('/')) {
        returnUrl = originUrl + returnUrl;
      } else if (!returnUrl.startsWith('http')) {
        returnUrl = originUrl + '/' + returnUrl;
      }
    }
    return returnUrl;
  }

  //this is used to real time validate token. helps to detect token status if multiple tabs open
  validateToken(keycloakInstance: KeycloakInstance) {
    return new Promise<any>((resolve) => {
      keycloakInstance
        .loadUserInfo()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          console.log(err?.message + err?.statusText);
          resolve(null);
        });
    });
  }

  // async getContextUserProfile() {
  //   const profile = await this.getUserProfileWithRoles();
  //   const user = {
  //     _id: profile.userid,
  //     name: `${profile.firstName} ${profile.lastName}`,
  //     roles: profile.roles,
  //     primaryRole: getPrimaryRole(profile.roles)?.displayValue ?? null,
  //     title: profile.title,
  //     location: profile.location ?? 'Alberta',
  //     email: profile.email,
  //     office: this.getOfficeInfo(profile._rawProfile),
  //     phone: profile._rawProfile?.phone ?? null,
  //     agency: profile._rawProfile?.agency ?? null,
  //     district: profile._rawProfile?.district ?? null,
  //   } as User;
  //   return user;
  // }

  // private getOfficeInfo(data): Office {
  //   if (!data.address && !data.officeAddress) return null;
  //   return {
  //     streetAddress: data.address?.street_address ?? data.officeAddress ?? null,
  //     city: data.address?.locality ?? data.officeCity ?? null,
  //     province: 'Alberta',
  //     postalCode: data.address?.postal_code ?? data.officePostalCode ?? null,
  //     phone: data.phone ?? data.officePhone ?? null,
  //     fax: data.fax ?? data.officeFax ?? null,
  //   };
  // }

  async getIdpDataAlbertaCa(): Promise<IdpDataAlbertaCa> {
    const keycloakInstance = this.getKeycloakInstance();
    const tokenParsed = keycloakInstance?.tokenParsed;
    if (tokenParsed['identity_provider'] === 'keycloak-madi') {
      const idpProfile = {} as IdpDataAlbertaCa;
      const loadProfile = await keycloakInstance.loadUserProfile();

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
        if (identityLoaValue?.endsWith('/loa3')) {
          idpProfile.accountType = AlbertaCaAccountTypes.Verified;
        } else if (identityLoaValue?.endsWith('/loa2')) {
          idpProfile.accountType = AlbertaCaAccountTypes.PendingVerified;
        }

        //map gender
        const genderValue = this.getIdpPropertyValue(profileAttributes, 'gender');
        if (genderValue) {
          const genderLookup = Object.values(AlbertaCaGenderTypes).find(
            (genderType) => genderType.code === genderValue
          );
          idpProfile.gender = genderLookup ?? AlbertaCaGenderTypes.Undefined;
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
        idpProfile.status = status ?? null;

        idpProfile.verified = idpProfile.status === 'verified';

        return idpProfile;
      }
    }
    return null;
  }

  //IDP values are always returning array
  private getIdpPropertyValue(object: unknown, attributeName: string) {
    if (object && object[attributeName]) {
      const value = object[attributeName];
      let propertyValue = '';
      if (Array.isArray(value)) {
        propertyValue = value[0];
      } else {
        propertyValue = value;
      }
      return propertyValue;
    }
    return null;
  }
}
