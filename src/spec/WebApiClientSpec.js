describe("WebApiClient", function() {
    var fakeUrl = "http://unit-test.local";
    var account;
    var contact;
    var xhr;
    var successMock = {
        result: "Success"
    };
    
    var errorJson = "{\r\n  \"error\":{\r\n    \"code\":\"\",\"message\":\"The function parameter 'EntityMoniker' cannot be found.\\r\\nParameter name: parameterName\",\"innererror\":{\r\n      \"message\":\"The function parameter 'EntityMoniker' cannot be found.\\r\\nParameter name: parameterName\",\"type\":\"System.ArgumentException\",\"stacktrace\":\"   at System.Web.OData.Routing.UnboundFunctionPathSegment.GetParameterValue(String parameterName)\\r\\n   at Microsoft.Crm.Extensibility.OData.CrmODataRouteDataProvider.FillUnboundFunctionData(UnboundFunctionPathSegment unboundFunctionPathSegment, HttpControllerContext controllerContext)\\r\\n   at Microsoft.Crm.Extensibility.OData.CrmODataRoutingConvention.SelectAction(ODataPath odataPath, HttpControllerContext controllerContext, ILookup`2 actionMap)\\r\\n   at System.Web.OData.Routing.ODataActionSelector.SelectAction(HttpControllerContext controllerContext)\\r\\n   at System.Web.Http.ApiController.ExecuteAsync(HttpControllerContext controllerContext, CancellationToken cancellationToken)\\r\\n   at System.Web.Http.Dispatcher.HttpControllerDispatcher.<SendAsync>d__1.MoveNext()\"\r\n    }\r\n  }\r\n}";
    
    Xrm = {};
    Xrm.Page = {};
    Xrm.Page.context = {};
    Xrm.Page.context.getClientUrl = function() {
        return fakeUrl;
    }
    
    RegExp.escape= function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}   ;
    
    beforeEach(function() {
        account = { 
            Name: "Adventure Works"
        };
        
        contact = {
            FirstName: "Joe"
        };

        xhr = sinon.fakeServer.create();
        xhr.autoRespond = true;
        
        // Respond to Create Request for account with No-Content response and created entity url in header
        var createAccountUrl = new RegExp(RegExp.escape(fakeUrl + "/api/data/v8.0/accounts", "g"));
        xhr.respondWith("POST", createAccountUrl,
            [204, { "Content-Type": "application/json", "OData-EntityId": "Fake-Account-Url" }, JSON.stringify(successMock)]
        );
        
        // Respond to Retrieve by id Request for account 
        var retrieveAccountByIdUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts(00000000-0000-0000-0000-000000000001)");
        xhr.respondWith("GET", new RegExp(retrieveAccountByIdUrl, "g"),
            [200, { "Content-Type": "application/json" }, JSON.stringify(account)]
        );

        // Respond to Retrieve by fetchXml Request for account 
        var accountFetch = "%3Cfetch%20mapping%3D%27logical%27%3E%3Centity%20name%3D%27account%27%3E%3Cattribute%20name%3D%27accountid%27/%3E%3Cattribute%20name%3D%27name%27/%3E%3C/entity%3E%3C/fetch%3E";
        var retrieveAccountByFetchUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts?fetchXml=" + accountFetch);
        xhr.respondWith("GET", new RegExp(retrieveAccountByFetchUrl, "g"),
            [200, { "Content-Type": "application/json" }, JSON.stringify(account)]
        );
        
        // Respond to Retrieve by id Request for account 
        var retrieveAccountUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts?$select=name,revenue,&$orderby=revenue asc,name desc&$filter=revenue ne null");
        xhr.respondWith("GET", new RegExp(retrieveAccountUrl, "g"),
            [200, { "Content-Type": "application/json" }, JSON.stringify([account])]
        );
        
        // Respond to Retrieve with only first page 
        var retrieveAccountUrlFirstPage = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts?$select=pagingtestfirst");
        xhr.respondWith("GET", new RegExp(retrieveAccountUrlFirstPage, "g"),
            [200, { "Content-Type": "application/json" }, JSON.stringify({ 
                value: [ { Name: "Adventure Works1" } ],
                "@odata.nextLink": fakeUrl + "/api/data/v8.0/accounts?$select=pagingtestsecond"
            })]
        );
        
        // Second page for retrieve
        var retrieveAccountUrlSecondPage = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts?$select=pagingtestsecond");
        xhr.respondWith("GET", new RegExp(retrieveAccountUrlSecondPage, "g"),
            [200, { "Content-Type": "application/json" }, JSON.stringify({ 
                value: [ { Name: "Adventure Works2" } ]
            })]
        );
        
        // Respond to Retrieve Request for contact with alternate key 
        var retrieveByAlternateKeyUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/contacts(firstname='Joe',emailaddress1='abc@example.com')");
        xhr.respondWith("GET", new RegExp(retrieveByAlternateKeyUrl, "g"),
            [200, { "Content-Type": "application/json" }, JSON.stringify(contact)]
        );
        
        // Respond to update Request for account 
        var updateAccountUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts(00000000-0000-0000-0000-000000000001)");
        xhr.respondWith("PATCH", new RegExp(updateAccountUrl, "g"),
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond to Delete Request for account 
        var deleteAccountUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts(00000000-0000-0000-0000-000000000001)");
        xhr.respondWith("DELETE", new RegExp(deleteAccountUrl, "g"),
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond to Associate Request for account 
        var associateAccountUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts(00000000-0000-0000-0000-000000000002)/opportunity_customer_accounts/$ref");
        xhr.respondWith("POST", new RegExp(associateAccountUrl, "g"),
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond to Delete Request for account 
        var disassociateAccountUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/accounts(00000000-0000-0000-0000-000000000002)/opportunity_customer_accounts(00000000-0000-0000-0000-000000000001)/$ref");
        xhr.respondWith("DELETE", new RegExp(disassociateAccountUrl, "g"),
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond to overridden set name requests
        var boundOverriddenSetUrl = fakeUrl + "/api/data/v8.0/contactleadscollection(00000000-0000-0000-0000-000000000003)";
        var unboundOverriddenSetUrl = fakeUrl + "/api/data/v8.0/contactleadscollection";
        
        xhr.respondWith("GET", boundOverriddenSetUrl,
            [200, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        xhr.respondWith("POST", boundOverriddenSetUrl,
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        xhr.respondWith("POST", unboundOverriddenSetUrl,
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        xhr.respondWith("PATCH", boundOverriddenSetUrl,
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        xhr.respondWith("DELETE", boundOverriddenSetUrl,
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond to Associate Request for account 
        var associateOverriddenUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/contactleadscollection(00000000-0000-0000-0000-000000000003)/opportunity_customer_accounts/$ref");
        xhr.respondWith("POST", new RegExp(associateOverriddenUrl, "g"),
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond to Delete Request for account 
        var disassociateOverriddenUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/contactleadscollection(00000000-0000-0000-0000-000000000003)/opportunity_customer_accounts(00000000-0000-0000-0000-000000000003)/$ref");
        xhr.respondWith("DELETE", new RegExp(disassociateOverriddenUrl, "g"),
            [204, { "Content-Type": "application/json" }, JSON.stringify(successMock)]
        );
        
        // Respond with error 
        var errorUrl = RegExp.escape(fakeUrl + "/api/data/v8.0/errors");
        xhr.respondWith("GET", new RegExp(errorUrl, "g"),
            [500, { "Content-Type": "application/json" }, errorJson]
        );
    });
    
    afterEach(function() {
       xhr.restore(); 
    });
    
    describe("Operations", function() {
        it("should know the create operation", function() {
            expect(WebApiClient.Create).toBeDefined();
        }); 
      
        it("should know the retrieve operation", function() {
            expect(WebApiClient.Retrieve).toBeDefined();
        });
        
        it("should know the update operation", function() {
            expect(WebApiClient.Update).toBeDefined();
        });
        
        it("should know the delete operation", function() {
            expect(WebApiClient.Delete).toBeDefined();
        });
        
        it("should know the associate operation", function() {
            expect(WebApiClient.Associate).toBeDefined();
        });
        
        it("should know the disassociate operation", function() {
            expect(WebApiClient.Disassociate).toBeDefined();
        });
    });
    
    describe("SetNames", function() {
        it("should append s if no special ending", function() {
            var accountSet = WebApiClient.GetSetName("account");
            expect(accountSet).toEqual("accounts");
        }); 
        
        it("should append ies if ends in y", function() {
            var citySet = WebApiClient.GetSetName("city");
            expect(citySet).toEqual("cities");
        });
        
        it("should append es if ends in s", function() {
            // I know that this is grammatically incorrect, WebApi does this however
            var settingsSet = WebApiClient.GetSetName("settings");
            expect(settingsSet).toEqual("settingses");
        });
        
        it("should allow to override set names for all requests", function(done) {
            var requests = [];
            
            var createRequest = {
                overriddenSetName: "contactleadscollection",
                entity: {name: "Contoso"}
            };
            requests.push(WebApiClient.Create(createRequest));
            
            var retrieveRequest = {
                overriddenSetName: "contactleadscollection",
                entityId: "00000000-0000-0000-0000-000000000003"
            };
            requests.push(WebApiClient.Retrieve(retrieveRequest));
            
            var updateRequest = {
                overriddenSetName: "contactleadscollection",
                entityId: "00000000-0000-0000-0000-000000000003",
                entity: {name: "Contoso"}
            };
            requests.push(WebApiClient.Update(updateRequest));
            
            var deleteRequest = {
                overriddenSetName: "contactleadscollection",
                entityId: "00000000-0000-0000-0000-000000000003"
            };
            requests.push(WebApiClient.Delete(deleteRequest));
            
            var associateRequest = {
                relationShip: "opportunity_customer_accounts",
                source: 
                    {
                        overriddenSetName: "contactleadscollection",
                        entityId: "00000000-0000-0000-0000-000000000003"
                    },
                target: 
                    {
                        overriddenSetName: "contactleadscollection",
                        entityId: "00000000-0000-0000-0000-000000000003"
                    }
            };
            requests.push(WebApiClient.Associate(associateRequest));
            
            var disassociateRequest = {
                relationShip: "opportunity_customer_accounts",
                source: 
                    {
                        overriddenSetName: "contactleadscollection",
                        entityId: "00000000-0000-0000-0000-000000000003"
                    },
                target: 
                    {
                        overriddenSetName: "contactleadscollection",
                        entityId: "00000000-0000-0000-0000-000000000003"
                    }
            };
            requests.push(WebApiClient.Disassociate(disassociateRequest));
            
            Promise.all(requests)
            .then(function (results){
                expect(results).toBeDefined();
            })
            .catch(function (error) {
                expect(error).toBeUndefined();
            })
            .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Create", function() {      
        it("should fail if no entity name passed", function(){
            expect(function() {
                WebApiClient.Create({entity: account});
            }).toThrow();
        });
        
        it("should fail if no update entity passed", function(){
            expect(function() {
                WebApiClient.Create({entityName: "account"});
            }).toThrow();
        });
        
        it("should create record and return record URL", function(done){
            WebApiClient.Create({entityName: "account", entity: account})
                .then(function(response){
                    expect(response).toEqual("Fake-Account-Url");
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });

    describe("Retrieve", function() {      
        it("should fail if no entity name passed", function(){
            expect(function() {
                WebApiClient.Retrieve({});
            }).toThrow();
        });
        
        it("should retrieve by id", function(done){
            WebApiClient.Retrieve({entityName: "account", entityId: "00000000-0000-0000-0000-000000000001"})
                .then(function(response){
                    expect(response).toEqual(account);
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
        
        it("should retrieve multiple with query params", function(done){
            var request = {
                entityName: "account", 
                queryParams: "?$select=name,revenue,&$orderby=revenue asc,name desc&$filter=revenue ne null"
            };
            
            WebApiClient.Retrieve(request)
                .then(function(response){
                    expect(response).toEqual([account]);
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
        
        it("should per default only retrieve first page", function(done){
            var request = {
                entityName: "account", 
                queryParams: "?$select=pagingtestfirst"
            };
            
            WebApiClient.Retrieve(request)
                .then(function(response){
                    expect(response.value.length).toEqual(1);
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
        
        it("should retrieve all pages if wanted", function(done){
            WebApiClient.ReturnAllPages = true;
            
            var request = {
                entityName: "account", 
                queryParams: "?$select=pagingtestfirst"
            };
            
            WebApiClient.Retrieve(request)
                .then(function(response){
                    expect(response.value.length).toEqual(2);
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
        
        it("should retrieve by alternative key", function(done){
            WebApiClient.Retrieve(
            {
                entityName: "contact", 
                alternateKey: 
                    [
                        { property: "firstname", value: "Joe" },
                        { property: "emailaddress1", value: "abc@example.com"}
                    ]
            })
            .then(function(response){
                expect(response).toEqual(contact);
            })
            .catch(function(error) {
                expect(error).toBeUndefined();
            })
            // Wait for promise
            .finally(done);
            
            xhr.respond();
        });

        it("should retrieve by fetch", function(done){
        	var fetchXml = "<fetch mapping='logical'>" +
        						"<entity name='account'>" +
      								"<attribute name='accountid'/>" +
      								"<attribute name='name'/>" +
								"</entity>" +
						   "</fetch>";

            WebApiClient.Retrieve({entityName: "account", fetchXml: fetchXml})
                .then(function(response){
                    expect(response).toEqual(account);
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Update", function() {
        it("should fail if no entity Id passed", function(){
            expect(function() {
                WebApiClient.Update({entityName: "account", entity: account});
            }).toThrow();
        });
        
        it("should fail if no entity name passed", function(){
            expect(function() {
                WebApiClient.Update({entityId: "00000000-0000-0000-0000-000000000001", entity: account});
            }).toThrow();
        });
        
        it("should fail if no update entity passed", function(){
            expect(function() {
                WebApiClient.Update({entityName: "account", entityId: "00000000-0000-0000-0000-000000000001"});
            }).toThrow();
        });
        
        it("should update record and return", function(done){
            WebApiClient.Update({entityName: "account", entityId: "00000000-0000-0000-0000-000000000001",  entity: account})
                .then(function(response){
                    expect(response).toBeDefined();
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Delete", function() {
        it("should fail if no entity Id passed", function(){
            expect(function() {
                WebApiClient.Delete({entityName: "account"});
            }).toThrow();
        });
        
        it("should fail if no entity name passed", function(){
            expect(function() {
                WebApiClient.Delete({entityId: "00000000-0000-0000-0000-000000000001"});
            }).toThrow();
        });
        
        it("should delete record and return", function(done){
            WebApiClient.Delete({entityName: "account", entityId: "00000000-0000-0000-0000-000000000001"})
                .then(function(response){
                    expect(response).toBeDefined();
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Associate", function() {
        it("should fail if no target passed", function(){
            expect(function() {
                WebApiClient.Associate(
                {
                    relationShip: "opportunity_customer_accounts",
                    source: 
                        {
                            entityName: "opportunity",
                            entityId: "00000000-0000-0000-0000-000000000001"
                        }
                });
            }).toThrow();
        });
        
        it("should fail if no source passed", function(){
            expect(function() {
                WebApiClient.Associate(
                {
                    relationShip: "opportunity_customer_accounts",
                    target: 
                        {
                            entityName: "account",
                            entityId: "00000000-0000-0000-0000-000000000002"
                        }
                });
            }).toThrow();
        });
        
        it("should fail if no relationShip passed", function(){
            expect(function() {
                WebApiClient.Associate(
                {
                    source: 
                        {
                            entityName: "opportunity",
                            entityId: "00000000-0000-0000-0000-000000000001"
                        },
                    target: 
                        {
                            entityName: "account",
                            entityId: "00000000-0000-0000-0000-000000000002"
                        }
                });
            }).toThrow();
        });
        
        it("should associate record and return", function(done){
            WebApiClient.Associate(
                {
                    relationShip: "opportunity_customer_accounts",
                    source: 
                        {
                            entityName: "opportunity",
                            entityId: "00000000-0000-0000-0000-000000000001"
                        },
                    target: 
                        {
                            entityName: "account",
                            entityId: "00000000-0000-0000-0000-000000000002"
                        }
                })
                .then(function(response){
                    expect(response).toBeDefined();
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Disassociate", function() {
        it("should fail if no target passed", function(){
            expect(function() {
                WebApiClient.Disassociate(
                {
                    relationShip: "opportunity_customer_accounts",
                    source: 
                        {
                            entityName: "opportunity",
                            entityId: "00000000-0000-0000-0000-000000000001"
                        }
                });
            }).toThrow();
        });
        
        it("should fail if no source passed", function(){
            expect(function() {
                WebApiClient.Disassociate(
                {
                    relationShip: "opportunity_customer_accounts",
                    target: 
                        {
                            entityName: "account",
                            entityId: "00000000-0000-0000-0000-000000000002"
                        }
                });
            }).toThrow();
        });
        
        it("should fail if no relationShip passed", function(){
            expect(function() {
                WebApiClient.Disassociate(
                {
                    source: 
                        {
                            entityName: "opportunity",
                            entityId: "00000000-0000-0000-0000-000000000001"
                        },
                    target: 
                        {
                            entityName: "account",
                            entityId: "00000000-0000-0000-0000-000000000002"
                        }
                });
            }).toThrow();
        });
                
        it("should disassociate record and return", function(done){
            WebApiClient.Disassociate(
                {
                    relationShip: "opportunity_customer_accounts",
                    source: 
                        {
                            entityName: "opportunity",
                            entityId: "00000000-0000-0000-0000-000000000001"
                        },
                    target: 
                        {
                            entityName: "account",
                            entityId: "00000000-0000-0000-0000-000000000002"
                        }
                })
                .then(function(response){
                    expect(response).toBeDefined();
                })
                .catch(function(error) {
                    expect(error).toBeUndefined();
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Errors", function() {
        it("should be prettified by default", function(done){
            WebApiClient.PrettifyErrors = true;

            WebApiClient.Retrieve({entityName: "error"})
                .then(function(response){
                    expect(response).toBeUndefined();
                })
                .catch(function(error) {
                    expect(error).replace("\r", "").replace("\n", "")
                        .toBe("Internal Server Error: The function parameter 'EntityMoniker' cannot be found.Parameter name: parameterName");
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
        
        it("should return the response json as error when prettifying is deactivated", function(done){
            WebApiClient.PrettifyErrors = false;
            
            WebApiClient.Retrieve({entityName: "error"})
                .then(function(response){
                    expect(response).toBeUndefined();
                })
                .catch(function(error) {
                    var json = JSON.parse(errorJson);
                    json.xhrStatusText = "Internal Server Error";
                    
                    var expectedError = json.stringify(json);
                    
                    expect(error).toBe(expectedError);
                })
                // Wait for promise
                .finally(done);
            
            xhr.respond();
        });
    });
    
    describe("Headers", function() {
        it("should set default headers", function(){
            expect(WebApiClient.GetDefaultHeaders()).toBeDefined();
        });
        
        it("should allow to add own default headers", function(){
            var testHeader = {key: "newHeader", value: "newValue"};
            WebApiClient.AppendToDefaultHeaders (testHeader);
            
            var defaultHeaders = WebApiClient.GetDefaultHeaders();
            
            expect(defaultHeaders[defaultHeaders.length - 1]).toEqual(testHeader);
        });
    });
    
    describe("API Version", function() {
        it("should default to 8.0", function() {
            expect(WebApiClient.ApiVersion).toEqual("8.0");
        }); 
        
        it("should be editable", function() {
            WebApiClient.ApiVersion = "8.1";
            
            expect(WebApiClient.ApiVersion).toEqual("8.1");
        }); 
    });
});