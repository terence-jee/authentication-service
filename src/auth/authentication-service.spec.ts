/* eslint-disable @typescript-eslint/naming-convention */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthUserProfile } from '../entities/auth-user-profile.interface';
import { KeycloakService } from 'keycloak-angular';
import { AuthenticationService } from './authentication-service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let keycloakService: KeycloakService;
  let router;

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    url: jest.fn().mockImplementation(() => {
      return '/profile';
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const mockCustomAttributes = {
    agency: 'GOA',
    phone: '780-000-0000',
  };
  const mockUserData = {
    email: 'test.user@gov.ab.ca',
    given_name: 'test',
    family_name: 'user',
    preferred_username: 'test.user',
    userid: '12345',
    agency: mockCustomAttributes.agency,
    phone: mockCustomAttributes.phone,
  };
  const mockAuthenticated = true;
  const mockTokenRefreshed = true;

  //this is used to mock the output of keycloak-service calls
  function mockKeycloakService() {
    const loadUserInfo = {
      loadUserInfo: jest.fn().mockReturnValue(new Promise((resolve) => resolve(mockUserData))),
      updateToken: jest.fn().mockImplementation(() => {
        return new Promise((resolve) => resolve(mockTokenRefreshed));
      }),
      authenticated: mockAuthenticated,
    };
    const keycloakMockService = {
      getUserRoles: jest.fn().mockReturnValue(['public', 'admin', 'partner']),
      getKeycloakInstance: jest.fn().mockImplementation(() => {
        return loadUserInfo;
      }),
      logout: jest.fn().mockImplementation(() => {
        return true;
      }),
      login: jest.fn().mockImplementation(() => {
        return true;
      }),
      isLoggedIn: jest.fn().mockImplementation(() => {
        return true;
      }),
      register: jest.fn().mockImplementation(() => {
        return true;
      }),
      init: jest.fn().mockImplementation(() => {
        return new Promise((resolve) => resolve(true));
      }),
      updateToken: jest.fn().mockImplementation(() => {
        return new Promise((resolve) => resolve(mockTokenRefreshed));
      }),
      validateToken: jest.fn().mockImplementation(() => {
        return new Promise((resolve) => resolve(mockUserData));
      }),
    };

    return keycloakMockService;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        AuthenticationService,
        { provide: KeycloakService, useValue: mockKeycloakService() },
        { provide: Router, useValue: mockRouter },
      ],
    });
    service = TestBed.inject(AuthenticationService);
    keycloakService = TestBed.inject(KeycloakService);
    router = TestBed.inject(Router);
  });

  it('should create an instance', () => {
    expect(service).toBeTruthy();
  });

  // it('should call init', () => {
  //   expect(keycloakService.init).not.toBeCalled();
  //   const keycloakInit = new KeycloakInitializer(keycloakService, 'url', 'realm', 'clientId');
  //   keycloakInit.initialize();

  //   expect(keycloakService.init).toBeCalled();
  //   //expect(keycloakUtils).toBeTruthy();
  // });

  it('should get logged in user profile', async () => {
    const profile = (await service.getUserProfile()) as AuthUserProfile;
    expect(profile.email).toEqual('test.user@gov.ab.ca');
  });

  it('should get logged in status of current user', async () => {
    service.isLoggedIn();
    expect(keycloakService.isLoggedIn).toBeCalled();
  });

  it('should get logged in user roles', () => {
    let roles = service.getUserRoles();
    //console.log(roles);
    expect(roles).toContain('public');
    expect(roles).toContain('admin');
    expect(roles).toContain('partner');

    //test that it only returns available roles specified in parameters
    roles = service.getUserRoles(['public', 'partner']);
    expect(roles).toContain('public');
    expect(roles).not.toContain('admin');
    expect(roles).toContain('partner');
  });

  it('should include roles in user profile', async () => {
    const profile = (await service.getUserProfileWithRoles()) as AuthUserProfile;
    expect(profile.roles).toContain('public');
    expect(profile.roles).toContain('admin');
    expect(profile.roles).toContain('partner');
  });

  it('should include custom attributes', async () => {
    const profile = (await service.getUserProfile(['agency', 'phone'])) as AuthUserProfile;
    expect(profile.attributes['agency']).toEqual(mockCustomAttributes.agency);
    expect(profile.attributes['phone']).toEqual(mockCustomAttributes.phone);
  });

  it('should call logout when signOut has been called', () => {
    expect(keycloakService.logout).not.toBeCalled();
    service.signOut();
    expect(keycloakService.logout).toBeCalled();
  });

  it('should sign in with the correct redirect url', async () => {
    let redirectUrl = '/profile';
    const originUrl = window.location?.origin;
    const fullUrl = originUrl + redirectUrl;
    await service.signIn(redirectUrl);
    expect(keycloakService.login).toHaveBeenCalledWith({ redirectUri: fullUrl });
    expect(router.navigateByUrl).toBeCalledWith(router.url + '#signIn');

    //should redirect correctly without leading slash
    redirectUrl = 'profile';
    await service.signIn(redirectUrl);
    expect(keycloakService.login).toHaveBeenCalledWith({ redirectUri: fullUrl });

    //should return current url if no redirect url is passed in.
    redirectUrl = null;
    await service.signIn(redirectUrl);
    expect(keycloakService.login).toHaveBeenCalledWith({ redirectUri: window.location.href });
  });

  it('should register with the correct redirect url', async () => {
    let redirectUrl = '/profile';
    const originUrl = window.location?.origin;
    const fullUrl = originUrl + redirectUrl;
    await service.createAccount(redirectUrl);
    expect(keycloakService.register).toHaveBeenCalledWith({ redirectUri: fullUrl });
    expect(router.navigateByUrl).toBeCalledWith(router.url + '#createAccount');

    //should redirect correctly without leading slash
    redirectUrl = 'profile';
    await service.createAccount(redirectUrl);
    expect(keycloakService.register).toHaveBeenCalledWith({ redirectUri: fullUrl });

    //should return current url if no redirect url is passed in.
    redirectUrl = null;
    await service.createAccount(redirectUrl);
    expect(keycloakService.register).toHaveBeenCalledWith({ redirectUri: window.location.href });
  });

  it('should determine if user is authenticated based on token', () => {
    let isAuthenticated = false;
    isAuthenticated = service.isAuthenticated();
    expect(isAuthenticated).toEqual(true);
  });

  it('getKeycloakInstance() should return aa keycloakInstance', async () => {
    jest.spyOn(keycloakService, 'getKeycloakInstance');
    const keycloakInstance = service.getKeycloakInstance();
    expect(keycloakService.getKeycloakInstance).toHaveBeenCalled();
    expect(keycloakInstance.authenticated).toEqual(mockAuthenticated);
  });

  it('refreshToken() should attempt to return a refresh token', async () => {
    jest.spyOn(keycloakService, 'getKeycloakInstance');
    const refreshToken = await service.refreshToken(0);
    expect(keycloakService.getKeycloakInstance).toHaveBeenCalled();
    expect(refreshToken).toEqual(mockTokenRefreshed);
  });

  it('should call changePassword()', () => {
    service.changePassword();
    expect(keycloakService.login).toHaveBeenCalledWith({
      action: 'UPDATE_PASSWORD',
    });
  });

  it('should return full url from partial', () => {
    const redirectUrl = '/profile';
    const originUrl = window.location?.origin;
    const fullUrl = originUrl + redirectUrl;
    const result = service['getFullReturnUrl'](redirectUrl);
    expect(result).not.toEqual(redirectUrl);
    expect(result).toEqual(fullUrl);
  });

  // it('should return user profile context with agency and phone', async () => {
  //   const profile = await service.getContextUserProfile();
  //   expect(profile.agency).toEqual(mockCustomAttributes.agency);
  //   expect(profile.phone).toEqual(mockCustomAttributes.phone);
  // });
});
