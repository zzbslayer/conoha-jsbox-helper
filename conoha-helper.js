/* Conoha version */
let conoha_username = "null"
let conoha_password = "null"
let conoha_tenantId = "null"

/* You should check which token url to use in your api dashboard */
let token_url2 = "https://identity.tyo2.conoha.io/v2.0/tokens"
let token_url1 = "https://identity.tyo1.conoha.io/v2.0/tokens"

let serviceCatalog = {
    accountService: null
}

var remainCredit = 0
var charges = 0

function getConohaInfo(username, password, tenantId) {
    let requestbody = 
        { "auth": 
            { "passwordCredentials": 
                {   "username": username, 
                    "password": password
                },
                "tenantId": tenantId
            }
        }

    $http.request({
        method: "POST",
        url: token_url2,
        header: {
            "Content-Type": "application/json"
        },
        body: requestbody,
        handler: function (resp) {
            let res = resp.data
            console.log(res.access)
            let serviceArray = res.access.serviceCatalog
            for (let i in serviceArray){
                let service = serviceArray[i]
                if (service.name === "Account Service"){
                    serviceCatalog.accountService = service.endpoints[0].publicURL
                }
            }
            console.log(serviceCatalog)
            let token = res.access.token.id;
            getCost(token);
        }
    });
}

function getRemaining(token) {
    let url = serviceCatalog.accountService + "/payment-summary"
    $http.request({
        method: "GET",
        url: url,
        header: {
            "Content-Type": "application/json",
            "X-Auth-Token": token
        },
        body: {},
        handler: function (resp) {
            let sum = resp.data.payment_summary.total_deposit_amount;
            remainCredit = sum - charges
            let balance = charges / sum
            let percentBalance = parseFloat(balance * 100).toFixed(2) + "%";
            $("remaining_credit").text =  Math.abs(remainCredit) + "円"; 
            $("progress_percent").text = percentBalance;
            $("charges").value = balance;
        }
    });
}

function getCost(token) {
    $http.request({
        method: "GET",
        url: serviceCatalog.accountService + "/billing-invoices?limit=1",
        header: {
            "Content-Type": "application/json",
            "X-Auth-Token": token
        },
        body: {},
        handler: function (resp) {
            charges = resp.data.billing_invoices[0].bill_plus_tax;
            //console.log(cost)
            $("progress_label").text = "Charges this month: " + charges + "円";        
            getRemaining(token);
        }
    });
}

function renderUI() {
    $ui.render({
        props: {
            title: "Conoha"
        },
        views: [
        {
            type: "label",
            props: {
                id: "conoha_title",
                align: $align.left,
                font:$font(28),
                text: "Conoha",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo(5)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "username",
                align: $align.left,
                text: "Username: " + conoha_username,
                font: $font(12),
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("conoha_title").bottom)
                make.height.equalTo(20)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "email",
                align: $align.left,
                text: "Email: null",
                font: $font(12),
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("username").bottom)
                make.height.equalTo(20)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "remaining_credit",
                font: $font(28),
                text: "..円",
                align: $align.right,
                textColor: $color("#0000FF")
            },
            layout: function (make, view) {
                make.right.inset(15)
                make.top.equalTo($("conoha_title").bottom)
            }
        }, {
            type: "label",
            props: {
                id: "remaining_credit_label",
                font: $font(12),
                align: $align.right,
                textColor: $color("#2c2c2c"),
                text: "Remaining Credit"
            },
            layout: function (make, view) {
                make.right.inset(15)
                make.top.equalTo(view.super).equalTo($("remaining_credit").bottom)
            }
        }, {
            type: "label",
            props: {
                id: "progress_label",
                align: $align.left,
                font: $font("bold", 14),
                text: "Charges this month: ",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("email").bottom).offset(5)
                make.height.equalTo(30)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "progress_percent",
                align: $align.right,
                font: $font(14),
                text: "...%",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("email").bottom).offset(7)
                make.height.equalTo(30)
                make.left.right.inset(15)
            }
        }, {
            type: "progress",
            props: {
                id: "charges"
            },
            layout: function (make, view) {
                make.top.equalTo($("progress_label").bottom).offset(5)
                make.left.equalTo(15)
                make.right.inset(15)
            }
        }]
    })
}

function main() {
    renderUI();
    $ui.toast("Refreshing...");
    getConohaInfo(conoha_username, conoha_password, conoha_tenantId);
}

main();