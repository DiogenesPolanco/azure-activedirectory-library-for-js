'use strict'
/* Directive tells jshint that it, describe are globals defined by jasmine */
/* global it */
/* global describe */

describe('E2ETests', function () {
    var unassignedUsername, unassignedPassword, index, mainWindow, EC, testCount, configuration;
    var elementsArray = [
        'uirouter-nopopup-nohtml5-otherwise',
        'uirouter-nopopup-html5-otherwise',
        'uirouter-nopopup-nohtml5-nootherwise',
        'uirouter-nopopup-html5-nootherwise',
        'ngroute-nopopup-nohtml5-otherwise',
        'ngroute-nopopup-nohtml5-nootherwise',
        'ngroute-nopopup-html5-otherwise',
        'ngroute-nopopup-html5-nootherwise',
        'ngroute-popup-nohtml5-otherwise',
        'ngroute-popup-nohtml5-nootherwise',
        'ngroute-popup-html5-otherwise',
        'ngroute-popup-html5-nootherwise',
        'uirouter-popup-nohtml5-otherwise',
        'uirouter-popup-nohtml5-nootherwise',
        'uirouter-popup-html5-otherwise',
        'uirouter-popup-html5-nootherwise',
    ];
    unassignedUsername = "pandu@tushartest2.onmicrosoft.com";
    unassignedPassword = "";
    mainWindow = null;
    EC = protractor.ExpectedConditions;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
    testCount = 0;
    configuration = {
        appRootUrl: 'https://adaljsangulartestapp.azurewebsites.net/',
        managedNonMFAUsername: "manNonMFA1@msidlab5.onmicrosoft.com",
        clientID: 'c9484205-7a31-404f-9e0b-3227094d62f7',
        resourceID: 'c22b3114-88ce-48fc-b728-3591a2e420a6'
    };

    configuration.appSetupUrl = configuration.appRootUrl + 'setup.html';

    // getting keys from keyvault
    var v1_v2_kv_name = 'MSIDLAB5-manNonMFA1';
    var keyVault = require('./keyVaultTest');
    keyVault.getSecret(v1_v2_kv_name, function (result) {
        configuration.managedNonMFAPassword = result.value;
    });

    /*
    0: error
    1: warning
    2: info
    3: verbose
    */
    var logLevel = 3;
    var log = function (message, level) {
        if (level == null) level = 3;
        if (level <= logLevel) {
            console.log(message);
        }
    }

    var loadSetupPage = function () {
        log("loading setup page");
        browser.ignoreSynchronization = true;
        browser.get(configuration.appSetupUrl);
        browser.wait(EC.titleContains('Angular'), 3000, 'setup page not loaded');
    }

    var loginMethod = function (valUserName, valPassword, processResult, isPopup) {
        log("login method called");

        var loginPromise = protractor.promise.defer();

        if (isPopup) {
            browser.getAllWindowHandles().then(function (handles) {
                mainWindow = handles[0];
                browser.switchTo().window(handles[1]);
                browser.executeScript('window.focus();');
            });
        }

        browser.wait(EC.presenceOf(element(by.id('cred_userid_inputtext'))), 3000, 'login page not loaded');
        element(by.id('cred_userid_inputtext')).isDisplayed().then(function (isDisplayed) {
            if (isDisplayed) {
                element(by.id('cred_userid_inputtext')).sendKeys(valUserName);
                return sendLoginRequest(valPassword, processResult);
            }
            else {
                element(by.id('use_another_account_link')).click().then(function () {
                    element(by.id('cred_userid_inputtext')).sendKeys(valUserName);
                    return sendLoginRequest(valPassword, processResult);
                });
            }
        }).then(function () {
            log("login method completed");
            loginPromise.fulfill();
        });

        return loginPromise.promise;
    };

    var sendLoginRequest = function (valPassword, processResult) {
        log("send login request method called");

        var loginRequestPromise = protractor.promise.defer();

        element(by.id('cred_password_inputtext')).sendKeys(valPassword);
        var signInButton = element(by.id('cred_sign_in_button'));
        browser.wait(EC.elementToBeClickable(signInButton), 2000, 'signin button is not clickable').then(function () {
            return signInButton.click();
        }).then(function () {
            if (mainWindow !== null) {
                return browser.switchTo().window(mainWindow);
            }
            return protractor.promise.fulfilled();
        }).then(function () {
            mainWindow = null;
            browser.ignoreSynchronization = false;
            processResult();
            log("send login request method completed");
            loginRequestPromise.fulfill();
        });
        return loginRequestPromise.promise;
    };

    var logoutMethod = function (expectedUrl) {
        log("logout method called");
        var logoutPromise = protractor.promise.defer();
        if (expectedUrl == null) {
            expectedUrl = configuration.appRootUrl;
        }
        element(by.id('logoutButton')).click().then(function () {
            //browser.wait(EC.urlContains(expectedUrl), 3000, 'expected url not loaded after logout');
            //close any pop window if opened
            browser.getAllWindowHandles().then(function (handles) {
                if (handles.length == 2) {
                    browser.switchTo().window(handles[1]);
                    browser.close();
                    browser.switchTo().window(handles[0]);
                    console.log('failing here');
                    fail('pop up window is not closed');
                }
                log("logout method completed");
                logoutPromise.fulfill();
            });
        });

        return logoutPromise.promise;
    }

    var getValueSessionStorage = function (key) {
        return browser.executeScript("return window.sessionStorage.getItem('" + key + "');");
    };

    var setValueSessionStorage = function (key, value) {
        return browser.executeScript("return window.sessionStorage.setItem('" + key + "','" + value + "');");
    };

    var removeValueSessionStorage = function (key) {
        return browser.executeScript("return window.sessionStorage.removeItem('" + key + "');");
    };

    var sessionStorageChanged = function (key, oldValue) {
        return function () {
            return browser.executeScript("return window.sessionStorage.getItem('" + key + "');").then(function (newValue) {
                return oldValue !== newValue;
            });
        }
    };

    var Storage = {
        TOKEN_KEYS: 'adal.token.keys',
        ACCESS_TOKEN_KEY: 'adal.access.token.key',
        EXPIRATION_KEY: 'adal.expiration.key',
        STATE_LOGIN: 'adal.state.login',
        STATE_RENEW: 'adal.state.renew',
        NONCE_IDTOKEN: 'adal.nonce.idtoken',
        SESSION_STATE: 'adal.session.state',
        USERNAME: 'adal.username',
        IDTOKEN: 'adal.idtoken',
        ERROR: 'adal.error',
        ERROR_DESCRIPTION: 'adal.error.description',
        LOGIN_REQUEST: 'adal.login.request',
        LOGIN_ERROR: 'adal.login.error',
        RENEW_STATUS: 'adal.token.renew.status'
    };

    beforeEach(function () {
        loadSetupPage();
        testCount++;
    })

    afterEach(function () {
        logoutMethod();
    });

    for (index = 0; index < 1; index++) {
        (function (elementId) {

            var isPopUp = elementId.indexOf('-popup-') > -1 ? true : false,
                isHtml5 = elementId.indexOf('-html5-') > -1 ? true : false,
                isOtherwise = elementId.indexOf('-otherwise') > -1 ? true : false,
                isNgRoute = elementId.indexOf('ngroute') > -1 ? true : false;

            log('Running test: ' + testCount + ' for ' + elementId, 0);

            it(elementId + ': tests login button', function () {
                element(by.id(elementId)).click().then(function () {

                    browser.ignoreSynchronization = false;
                    var startPageUrl;
                    browser.executeScript('return window.location.href').then(function (url) {
                        startPageUrl = url;
                    });
                    var homePageInputTextElementPresent = false;
                    if (isPopUp && isOtherwise) {
                        expect(element(by.id('homeInputText')).isPresent()).toBe(true);
                        homePageInputTextElementPresent = true;
                        element(by.id('homeInputText')).sendKeys('test input');
                    }
                    browser.ignoreSynchronization = true;

                    element(by.id('loginButton')).click().then(function () {
                        var expectedResult = function () {
                            browser.wait(EC.urlIs(startPageUrl), 3000, 'url is not changed back to start page url: ' + startPageUrl);
                            expect(browser.executeScript('return window.sessionStorage.getItem(\'adal.idtoken\')')).not.toBe('');

                            if (homePageInputTextElementPresent) {
                                expect(element(by.id('homeInputText')).getAttribute('value')).toBe('test input');
                            }
                            browser.setLocation('UserData');
                            element(by.exactBinding('userInfo.userName')).getText().then(function (text) {
                                expect(text.toLowerCase()).toBe(configuration.managedNonMFAUsername.toLowerCase());
                            });
                            expect(element(by.exactBinding('userInfo.isAuthenticated')).getText()).toBe('true');
                            //return protractor.promise.fulfilled();
                        }
                        loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                    });
                });
            });
            
            it(elementId + ': tests that navigating to protected route triggers login', function () {
                element(by.id(elementId)).click().then(function () {
                    var expectedUrl;
                    if (isPopUp || isNgRoute) {
                        expectedUrl = isHtml5 ? configuration.appRootUrl + 'TodoList' : configuration.appRootUrl + '#/TodoList';
                    }
                    else {
                        browser.executeScript('return window.location.href').then(function (url) {
                            expectedUrl = url;
                        });
                    }
                    element(by.id('todoListOption')).click().then(function () {
                        var expectedResult = function () {
                            expect(browser.getCurrentUrl()).toBe(expectedUrl);
                            expect(browser.executeScript(function () {
                                return window.sessionStorage.getItem('adal.idtoken');
                            })).not.toBe('');
                            return protractor.promise.fulfilled();
                        }
                        loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                    });
                });
            });

            //it(elementId + ': tests login with an unassigned user', function () {
            //    element(by.id(elementId)).click().then(function () {
            //        var startPageUrl;
            //        browser.executeScript('return window.location.href').then(function (url) {
            //            startPageUrl = url;
            //        });
            //        element(by.id('loginButton')).click().then(function () {
            //            var expectedResult = function () {
            //                var deferred = protractor.promise.defer();
            //                browser.getCurrentUrl().then(function (url) {
            //                    expect(url).toBe(startPageUrl);
            //                    browser.executeScript(function () {
            //                        return {
            //                            'error': window.sessionStorage.getItem('adal.error'),
            //                            'idtoken': window.sessionStorage.getItem('adal.idtoken')
            //                        };
            //                    }).then(function (storage) {
            //                        expect(storage.error).toBe('access_denied');
            //                        expect(storage.idtoken).toBe(null);
            //                        deferred.fulfill();
            //                    });
            //                });
            //                return deferred.promise;
            //            }
            //            loginMethod(unassignedUsername, unassignedPassword, expectedResult, isPopUp).then(function () {
            //                browser.wait(logoutMethod(), 5000, 'logout promise not completed');
            //            });
            //        });
            //    });
            //});

            it(elementId + ': tests that the url query parameters are not dropped after login', function () {

                element(by.id(elementId)).click().then(function () {
                    browser.wait(EC.titleContains('Todo List'), 2000, 'todo list page not loaded');

                    var navigateToUrl = isHtml5 ? configuration.appRootUrl + 'TodoList?q1=p1&q2=p2' : configuration.appRootUrl + '#/TodoList?q1=p1&q2=p2';
                    browser.get(navigateToUrl);

                    var expectedResult = function () {
                        expect(browser.getCurrentUrl()).toBe(navigateToUrl);
                        expect(browser.executeScript(function () {
                            return window.sessionStorage.getItem('adal.idtoken');
                        })).not.toBe('');
                        return protractor.promise.fulfilled();
                    }
                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                });
            });
            
                        it(elementId + 'should navigate to TodoList Page and check if items are populated', function () {
                            element(by.id(elementId)).click().then(function () {
                                var expectedUrl = isHtml5 ? configuration.appRootUrl + 'TodoList' : configuration.appRootUrl + '#/TodoList';
                                element(by.id('loginButton')).click().then(function () {
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
                                        element(by.id('todoListOption')).click().then(function () {
                                            return browser.wait(EC.presenceOf(element(by.id('Item1'))), 3000, 'todo list item is not present');
                                        }).then(function () {
                                            return deferred.fulfill();
                                        });
                                        return deferred.promise;
                                    }
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
            
                        it(elementId + ': should renew token for app backend using iframe if token is not present in the cache', function () {
                            element(by.id(elementId)).click().then(function () {
                                element(by.id('loginButton')).click().then(function () {
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
                                        removeValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.clientID).then(function () {
                                            expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.clientID)).toEqual(null);
                                            element(by.id('todoListOption')).click().then(function () {
                                                return browser.wait(sessionStorageChanged(Storage.ACCESS_TOKEN_KEY + configuration.clientID, null), 5000, 'sesion storage not updated');
                                            }).then(function () {
                                                expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.clientID)).not.toEqual(null);
                                                expect(getValueSessionStorage(Storage.RENEW_STATUS + configuration.clientID)).toEqual("Completed");
                                                return browser.findElements(by.tagName("iframe"));
                                            }).then(function (elements) {
                                                expect(elements.length).toEqual(1);
                                                expect(elements[0].getAttribute('id')).toEqual('adalIdTokenFrame');
                                                deferred.fulfill();
                                            });
                                        });
                                        return deferred.promise;
                                    };
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
            
                        it(elementId + ': should renew token for app backend using iframe if token is expired', function () {
                            element(by.id(elementId)).click().then(function () {
                                element(by.id('loginButton')).click().then(function () {
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
                                        setValueSessionStorage(Storage.EXPIRATION_KEY + configuration.clientID, '0').then(function () {
                                            expect(getValueSessionStorage(Storage.EXPIRATION_KEY + configuration.clientID)).toEqual('0');
                                            element(by.id('todoListOption')).click().then(function () {
                                                return browser.findElements(by.tagName("iframe"));
                                            }).then(function (elements) {
                                                expect(elements.length).toEqual(1);
                                                expect(elements[0].getAttribute('id')).toEqual('adalIdTokenFrame');
                                                return browser.wait(sessionStorageChanged(Storage.EXPIRATION_KEY + configuration.clientID, '0'), 5000, 'sesion storage not updated');
                                            }).then(function () {
                                                expect(getValueSessionStorage(Storage.EXPIRATION_KEY + configuration.clientID)).not.toEqual('0');
                                                expect(getValueSessionStorage(Storage.RENEW_STATUS + configuration.clientID)).toEqual("Completed");
                                                deferred.fulfill();
                                            });
                                        });
                                        return deferred.promise;
                                    };
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
            
                        it(elementId + ': should renew token for external api using iframe if token is not present in the cache', function () {
                            element(by.id(elementId)).click().then(function () {
                                element(by.id('loginButton')).click().then(function () {
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
                                        removeValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.resourceID).then(function () {
                                            expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.resourceID)).toEqual(null);
                                            element(by.id('togoListOption')).click().then(function () {
                                                return browser.wait(sessionStorageChanged(Storage.ACCESS_TOKEN_KEY + configuration.resourceID, null), 5000, 'sesion storage not updated').then(function () {
                                                    expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.resourceID)).not.toEqual('');
                                                    expect(getValueSessionStorage(Storage.RENEW_STATUS + configuration.resourceID)).toEqual("Completed");
                                                }).then(function () {
                                                    browser.findElements(by.tagName("iframe")).then(function (elements) {
                                                        expect(elements.length).toEqual(1);
                                                        expect(elements[0].getAttribute('id')).toEqual('adalRenewFrame' + configuration.resourceID);
                                                        deferred.fulfill();
                                                    });
                                                });
                                            });
                                        });
                                        return deferred.promise;
                                    };
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
            
                        it(elementId + ': should renew token for external api using iframe if token is expired', function () {
                            element(by.id(elementId)).click().then(function () {
                                element(by.id('loginButton')).click().then(function () {
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
                                        setValueSessionStorage(Storage.EXPIRATION_KEY + configuration.resourceID, '0').then(function () {
                                            expect(getValueSessionStorage(Storage.EXPIRATION_KEY + configuration.resourceID)).toEqual('0');
                                            element(by.id('togoListOption')).click().then(function () {
                                                return browser.findElements(by.tagName("iframe"));
                                            }).then(function (elements) {
                                                expect(elements.length).toEqual(1);
                                                expect(elements[0].getAttribute('id')).toEqual('adalRenewFrame' + configuration.resourceID);
                                                return browser.wait(sessionStorageChanged(Storage.EXPIRATION_KEY + configuration.resourceID, '0'), 5000, 'sesion storage not updated');
                                            }).then(function () {
                                                expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.resourceID)).not.toEqual('');
                                                expect(getValueSessionStorage(Storage.EXPIRATION_KEY + configuration.resourceID)).not.toEqual('0');
                                                expect(getValueSessionStorage(Storage.RENEW_STATUS + configuration.resourceID)).toEqual("Completed");
                                                deferred.fulfill();
                                            });
                                        });
                                        return deferred.promise;
                                    };
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
            
                        it(elementId + ': Sets the redirectUri to a custom path, tests that iframe loads this custom path when receives a 302 from AAD instead of loading the app.', function () {
                            element(by.id(elementId)).click().then(function () {
                                element(by.id('loginButton')).click().then(function () {
                                    var customRedirectUri = configuration.appRootUrl + 'App/Views/frameRedirect.html';
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
            
                                        setValueSessionStorage('redirecturi', customRedirectUri).then(function () {
                                            browser.refresh();
                                            expect(getValueSessionStorage('redirecturi')).toEqual(customRedirectUri);
                                            return setValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.clientID, '');
                                        }).then(function () {
                                            element(by.id('todoListOption')).click().then(function () {
                                                return browser.findElements(by.tagName("iframe"));
                                            }).then(function (elements) {
                                                expect(elements.length).toEqual(1);
                                                return browser.wait(sessionStorageChanged(Storage.ACCESS_TOKEN_KEY + configuration.clientID, ''), 5000, 'sesion storage not updated');
                                            }).then(function () {
                                                expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.clientID)).not.toEqual('');
                                                expect(getValueSessionStorage(Storage.EXPIRATION_KEY + configuration.clientID)).not.toEqual('0');
                                                expect(getValueSessionStorage(Storage.RENEW_STATUS + configuration.clientID)).toEqual("Completed");
                                                return browser.switchTo().frame('adalIdTokenFrame');
                                            }).then(function () {
                                                expect(element(by.id('frameDivElement')).isPresent()).toBe(true);
                                                return browser.switchTo().defaultContent();
                                            }).then(function () {
                                                deferred.fulfill();
                                            });
                                        });
                                        return deferred.promise;
                                    };
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
            
                        it(elementId + ': navigates to a route that makes calls to app backend with invalid redirect uri value, Azure AD returns error response in html instead of url. The request will time out after 6 seconds', function () {
                            element(by.id(elementId)).click().then(function () {
                                element(by.id('loginButton')).click().then(function () {
                                    var invalidRedirectUri = 'https://invalidredirectUri';
                                    var expectedResult = function () {
                                        var deferred = protractor.promise.defer();
            
                                        setValueSessionStorage('redirecturi', invalidRedirectUri).then(function () {
                                            browser.refresh();
                                            expect(getValueSessionStorage('redirecturi')).toEqual(invalidRedirectUri);
                                            return setValueSessionStorage(Storage.ACCESS_TOKEN_KEY + configuration.clientID, '');
                                        }).then(function () {
                                            element(by.id('todoListOption')).click().then(function () {
                                                return browser.findElements(by.tagName("iframe"));
                                            }).then(function (elements) {
                                                expect(elements.length).toEqual(1);
                                                expect(elements[0].getAttribute('id')).toEqual('adalIdTokenFrame');
                                                return browser.switchTo().frame('adalIdTokenFrame');
                                            }).then(function () {
                                                var errorElement = element(by.id('service_exception_message'));
                                                return browser.wait(EC.presenceOf(errorElement), 4000, 'AAD did not return error html');
                                            }).then(function () {
                                                expect(errorElement.getInnerHtml()).toContain("AADSTS50011: The reply address '" + invalidRedirectUri + "'");
                                                return browser.switchTo().defaultContent();
                                            }).then(function() {
                                                deferred.fulfill();
                                            });
                                        });
                                        return deferred.promise;
                                    };
                                    loginMethod(configuration.managedNonMFAUsername, configuration.managedNonMFAPassword, expectedResult, isPopUp);
                                });
                            });
                        });
        })(elementsArray[index])
    }
});