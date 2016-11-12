'use strict'
/* Directive tells jshint that it, describe are globals defined by jasmine */
/* global it */
/* global describe */

describe('E2ETests', function () {
    var appRootUrl, username, password, appSetupUrl, unassignedUsername, unassignedPassword, index, mainWindow, EC;
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
    appRootUrl = 'https://adaljsangulartestapp.azurewebsites.net/'; //'https://adaljsnonangularapp.azurewebsites.net/'; //'http://localhost:44332/';
    appSetupUrl = appRootUrl + 'setup.html';
    username = "victor@tushartest.onmicrosoft.com";
    password = "user@1992";
    unassignedUsername = "pandu@tushartest2.onmicrosoft.com";
    unassignedPassword = "user@1992";
    mainWindow = null;
    EC = protractor.ExpectedConditions;
    var clientID = '58867de9-036e-48e9-8071-42f14c67949a';

    var log = function (message) {
        console.log(message);
    }

    var loadSetupPage = function () {
        log("loading setup page");
        browser.ignoreSynchronization = true;
        browser.get(appSetupUrl);
        browser.wait(EC.titleContains('Angular'), 3000, 'setup page not loaded');
    }

    var loginMethod = function (valUserName, valPassword, otherUser, processResult, isPopup) {
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
                sendLoginRequest(valPassword, processResult).then(function () {
                    log("login method completed");
                    loginPromise.fulfill();
                },
                function () {
                    log("login method failed");
                    loginPromise.reject();
                });
            }
            else if (otherUser) {
                element(by.id('use_another_account_link')).click().then(function () {
                    element(by.id('cred_userid_inputtext')).sendKeys(valUserName);
                    sendLoginRequest(valPassword, processResult).then(function () {
                        log("login method completed");
                        loginPromise.fulfill();
                    },
                    function () {
                        log("login method failed");
                        loginPromise.reject();
                    });
                });
            }
            else {
                element(by.id('victor_tushartest_onmicrosoft_com_link')).click().then(function () {
                    sendLoginRequest(valPassword, processResult).then(function () {
                        log("login method completed");
                        loginPromise.fulfill();
                    },
                    function () {
                        log("login method failed");
                        loginPromise.reject();
                    });
                });
            }
        });

        return loginPromise.promise;
    };

    var sendLoginRequest = function (valPassword, processResult) {
        log("send login request method called");

        var loginRequestPromise = protractor.promise.defer();

        element(by.id('cred_password_inputtext')).sendKeys(valPassword);
        var signInButton = element(by.id('cred_sign_in_button'));
        browser.wait(EC.elementToBeClickable(signInButton), 1000, 'signin button is not clickable').then(function () {
            signInButton.click().then(function () {
                if (mainWindow !== null) {
                    browser.switchTo().window(mainWindow);
                    mainWindow = null;
                }
                browser.sleep(500);
                processResult().then(function () {
                    log("send login request method completed");
                    loginRequestPromise.fulfill();
                });
            });
        });

        return loginRequestPromise.promise;
    };

    var logoutMethod = function (expectedUrl) {
        log("logout method called");
        var logoutPromise = protractor.promise.defer();
        if (expectedUrl == null) {
            expectedUrl = appRootUrl;
        }
        element(by.id('logoutButton')).isDisplayed().then(function (isDisplayed) {
            if (isDisplayed) {
                element(by.id('logoutButton')).click().then(function () {
                    browser.wait(EC.urlContains(expectedUrl), 3000, 'expected url not loaded after logout');

                    //close any pop window if opened
                    browser.getAllWindowHandles().then(function (handles) {
                        if (handles.length == 2) {
                            browser.switchTo().window(handles[1]);
                            browser.close();
                            browser.switchTo().window(handles[0]);
                        }
                        log("logout method completed");
                        logoutPromise.fulfill();
                    });
                });
            }
            else {
                log("logout button is not visible");
                logoutPromise.fulfill();
            }
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
    var count = 0;

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
    })

    afterEach(function () {
        browser.getAllWindowHandles().then(function (handles) {
            expect(handles.length).toBe(1);
        });

        browser.manage().logs().get('browser').then(function (browserLogs) {
            browserLogs.forEach(function (log) {
                if (log.message.indexOf('1.0.13') !== -1 || log.message.indexOf('index.html')) {
                    //console.log(log.message);
                }
            });
        });

        browser.restart();
    });

    for (index = 0; index < 16; index++) {
        (function (elementId) {

            var isPopUp = elementId.indexOf('-popup-') > -1 ? true : false,
                isHtml5 = elementId.indexOf('-html5-') > -1 ? true : false,
                isOtherwise = elementId.indexOf('-otherwise') > -1 ? true : false,
                isNgRoute = elementId.indexOf('ngroute') > -1 ? true : false;

            it(elementId + ': tests login button', function () {

                element(by.id(elementId)).click().then(function () {
                    var startPageUrl;
                    browser.executeScript('return window.location.href').then(function (url) {
                        startPageUrl = url;
                    });

                    browser.sleep('500');

                    var homePageInputTextElementPresent = false;
                    if (isPopUp && elementId.indexOf('-otherwise') > -1) {
                        expect(element(by.id('homeInputText')).isPresent()).toBe(true);
                        homePageInputTextElementPresent = true;
                        element(by.id('homeInputText')).sendKeys('test input');
                    }

                    element(by.id('loginButton')).click().then(function () {
                        var expectedResult = function () {
                            expect(browser.getCurrentUrl()).toBe(startPageUrl);
                            expect(browser.executeScript(function () {
                                return window.sessionStorage.getItem('adal.idtoken');
                            })).not.toBe('');

                            if (isPopUp && homePageInputTextElementPresent) {
                                expect(element(by.id('homeInputText')).getAttribute('value')).toBe('test input');
                            }
                            browser.sleep('1000');
                            browser.setLocation('UserData');
                            browser.sleep('500');
                            element(by.exactBinding('userInfo.userName')).getText().then(function (text) {
                                expect(text.toLowerCase()).toBe(username);
                            });
                            expect(element(by.exactBinding('userInfo.isAuthenticated')).getText()).toBe('true');
                            return protractor.promise.fulfilled();
                        }
                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                            browser.wait(logoutMethod(), 5000, 'logout promise not completed');
                        });
                    });
                });
            });

            it(elementId + ': tests that navigating to protected route triggers login', function () {
                element(by.id(elementId)).click().then(function () {
                    var expectedUrl;
                    if (isPopUp || isNgRoute) {
                        expectedUrl = elementId.indexOf('-html5-') > -1 ? appRootUrl + 'TodoList' : appRootUrl + '#/TodoList';
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
                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                            if (isHtml5 && !isPopUp)
                                browser.wait(logoutMethod('https://login.microsoftonline.com'), 5000, 'logout promise not completed');
                            else
                                browser.wait(logoutMethod(), 5000, 'logout promise not completed');
                        });
                    });
                });
            });

            it(elementId + ': tests login with an unassigned user', function () {
                element(by.id(elementId)).click().then(function () {
                    var startPageUrl;
                    browser.executeScript('return window.location.href').then(function (url) {
                        startPageUrl = url;
                    });
                    element(by.id('loginButton')).click().then(function () {
                        var expectedResult = function () {
                            var deferred = protractor.promise.defer();
                            browser.getCurrentUrl().then(function (url) {
                                expect(url).toBe(startPageUrl);
                                expect(element(by.id('logoutButton')).isDisplayed()).toBe(false);
                                browser.executeScript(function () {
                                    return {
                                        'error': window.sessionStorage.getItem('adal.error'),
                                        'idtoken': window.sessionStorage.getItem('adal.idtoken')
                                    };
                                }).then(function (storage) {
                                    expect(storage.error).toBe('access_denied');
                                    expect(storage.idtoken).toBe(null);
                                    deferred.fulfill();
                                });
                            });
                            return deferred.promise;
                        }
                        loginMethod(unassignedUsername, unassignedPassword, true, expectedResult, isPopUp).then(function () {
                            browser.wait(logoutMethod(), 5000, 'logout promise not completed');
                        });
                    });
                });
            });

            it(elementId + ': tests that the url query parameters are not dropped after login', function () {

                element(by.id(elementId)).click().then(function () {
                    browser.wait(EC.titleContains('Todo List'), 2000, 'todo list page not loaded');

                    var navigateToUrl = isHtml5 ? appRootUrl + 'TodoList?q1=p1&q2=p2' : appRootUrl + '#/TodoList?q1=p1&q2=p2';
                    browser.get(navigateToUrl);

                    var expectedResult = function () {
                        expect(browser.getCurrentUrl()).toBe(navigateToUrl);
                        expect(browser.executeScript(function () {
                            return window.sessionStorage.getItem('adal.idtoken');
                        })).not.toBe('');
                        return protractor.promise.fulfilled();
                    }
                    loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                        if (isHtml5 && !isPopUp)
                            browser.wait(logoutMethod('https://login.microsoftonline.com'), 5000, 'logout promise not completed');
                        else
                            browser.wait(logoutMethod(), 5000, 'logout promise not completed');
                    });
                });
            });

            it(elementId + 'should navigate to TodoList Page and check if items are populated', function () {
                element(by.id(elementId)).click().then(function () {
                    var expectedUrl = elementId.indexOf('-html5-') > -1 ? appRootUrl + 'TodoList' : appRootUrl + '#/TodoList';
                    element(by.id('loginButton')).click().then(function () {
                        var expectedResult = function () {
                            var deferred = protractor.promise.defer();
                            element(by.id('todoListOption')).click().then(function () {
                                browser.wait(EC.urlIs(expectedUrl), 1000, 'url did not change to expected url: ' + expectedUrl);
                                browser.wait(EC.visibilityOf(element(by.css('tbody tr'))), 5000, 'todo list table not loaded').then(function () {
                                    var rows = element.all(by.css("tbody tr"));
                                    var data = rows.map(function (row) {
                                        var cells = row.all(by.tagName('td'));
                                        return {
                                            cell1: cells.get(0).getText(),
                                            cell2: cells.get(1).getText(),
                                        }
                                    });
                                    expect(data).toEqual([{ cell1: "TodoList1", cell2: "Edit | Delete" }, { cell1: "TodoList2", cell2: "Edit | Delete" }]);
                                    return deferred.fulfill();
                                });
                            });
                            return deferred.promise;
                        }

                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                            browser.wait(logoutMethod(), 5000, 'logout promise not completed');
                        });
                    });
                });
            });

            it(elementId + ': should renew token for app backend using iframe if token is not present in the cache', function () {
                element(by.id(elementId)).click().then(function () {
                    element(by.id('loginButton')).click().then(function () {
                        var expectedResult = function () {
                            var deferred = protractor.promise.defer();
                            removeValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID).then(function () {
                                expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID)).toEqual(null);
                                element(by.id('todoListOption')).click().then(function () {
                                    return browser.wait(sessionStorageChanged(Storage.ACCESS_TOKEN_KEY + clientID, null), 5000, 'sesion storage not updated').then(function () {
                                        expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID)).not.toEqual('');
                                        expect(getValueSessionStorage(Storage.RENEW_STATUS + clientID)).toEqual("Completed");
                                    }).then(function () {
                                        browser.findElements(by.tagName("iframe")).then(function (elements) {
                                            expect(elements.length).toEqual(1);
                                            expect(elements[0].getAttribute('id')).toEqual('adalIdTokenFrame');
                                            deferred.fulfill();
                                        });
                                    });
                                });
                            });
                            return deferred.promise;
                        };
                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                            logoutMethod().then(function () {
                                log('logout promise completed');
                            });
                        });
                    });
                });
            });

            it(elementId + ': should renew token for app backend using iframe if token is not present in the cache', function () {
                element(by.id(elementId)).click().then(function () {
                    element(by.id('loginButton')).click().then(function () {
                        var expectedResult = function () {
                            var deferred = protractor.promise.defer();
                            setValueSessionStorage(Storage.EXPIRATION_KEY + clientID, '0').then(function () {
                                expect(getValueSessionStorage(Storage.EXPIRATION_KEY + clientID)).toEqual('0');
                                element(by.id('todoListOption')).click().then(function () {
                                    return browser.findElements(by.tagName("iframe"));
                                }).then(function (elements) {
                                    expect(elements.length).toEqual(1);
                                    expect(elements[0].getAttribute('id')).toEqual('adalIdTokenFrame');
                                    return browser.wait(sessionStorageChanged(Storage.EXPIRATION_KEY + clientID, '0'), 5000, 'sesion storage not updated');
                                }).then(function () {
                                    expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID)).not.toEqual('');
                                    expect(getValueSessionStorage(Storage.EXPIRATION_KEY + clientID)).not.toEqual('0');
                                    expect(getValueSessionStorage(Storage.RENEW_STATUS + clientID)).toEqual("Completed");
                                    deferred.fulfill();
                                });
                            });
                            return deferred.promise;
                        };
                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                        });
                    });
                });
            });

            it('Sets the redirectUri to a custom path, tests that iframe loads this custom path when receives a 302 from AAD instead of loading the app.', function () {
                element(by.id(elementId)).click().then(function () {
                    element(by.id('loginButton')).click().then(function () {
                        var customRedirectUri = appRootUrl + 'App/Views/frameRedirect.html';
                        var expectedResult = function () {
                            var deferred = protractor.promise.defer();

                            setValueSessionStorage('redirecturi', customRedirectUri).then(function () {
                                browser.refresh();
                                expect(getValueSessionStorage('redirecturi')).toEqual(customRedirectUri);
                                return setValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID, '');
                            }).then(function () {
                                element(by.id('todoListOption')).click().then(function () {
                                    return browser.findElements(by.tagName("iframe"));
                                }).then(function (elements) {
                                    expect(elements.length).toEqual(1);
                                    return browser.wait(sessionStorageChanged(Storage.ACCESS_TOKEN_KEY + clientID, ''), 5000, 'sesion storage not updated');
                                }).then(function () {
                                    expect(getValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID)).not.toEqual('');
                                    expect(getValueSessionStorage(Storage.EXPIRATION_KEY + clientID)).not.toEqual('0');
                                    expect(getValueSessionStorage(Storage.RENEW_STATUS + clientID)).toEqual("Completed");
                                    browser.switchTo().frame('adalIdTokenFrame');
                                    expect(element(by.id('frameDivElement')).isPresent()).toBe(true);
                                    deferred.fulfill();
                                });
                            });
                            return deferred.promise;
                        };
                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                        });
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
                                return setValueSessionStorage(Storage.ACCESS_TOKEN_KEY + clientID, '');
                            }).then(function () {
                                element(by.id('todoListOption')).click().then(function () {
                                    return browser.findElements(by.tagName("iframe"));
                                }).then(function (elements) {
                                    expect(elements.length).toEqual(1);
                                    expect(elements[0].getAttribute('id')).toEqual('adalIdTokenFrame');
                                    browser.switchTo().frame('adalIdTokenFrame');
                                    var errorElement = element(by.id('service_exception_message'));
                                    browser.wait(function () {
                                        return browser.isElementPresent(errorElement)
                                    }, 4000, 'AAD did not return error html').then(function () {
                                        expect(errorElement.getInnerHtml()).toContain("AADSTS50011: The reply address '" + invalidRedirectUri + "'");
                                        deferred.fulfill();
                                    });
                                });
                            });
                            return deferred.promise;
                        };
                        loginMethod(username, password, false, expectedResult, isPopUp).then(function () {
                        });
                    });
                });
            });
        })(elementsArray[index])
    }
});