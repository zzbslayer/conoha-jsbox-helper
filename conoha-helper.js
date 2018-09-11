/* Conoha version */
const conoha_username = "null"
const conoha_password = "null"
const conoha_tenantId = "null"

let serviceCatalog = {}

const productCatagory = {
    "VPS":{
        "1GB":{
            RAM: "1GB",
            CPU: "2 Cores",
            SSD: "50GB",
            cost: 900
        },
        "2GB":{
            RAM: "2GB",
            CPU: "3 Cores",
            SSD: "50GB",
            cost: 1750
        },
        "4GB":{
            RAM: "4GB",
            CPU: "4 Cores",
            SSD: "50GB",
            cost: 3420
        },
        "8GB":{
            RAM: "8GB",
            CPU: "6 Cores",
            SSD: "50GB",
            cost: 6670
        },
        "16GB":{
            RAM: "16GB",
            CPU: "8 Cores",
            SSD: "50GB",
            cost: 13010
        },
        "32GB":{
            RAM: "32GB",
            CPU: "12 Cores",
            SSD: "50GB",
            cost: 25370
        },
        "64GB":{
            RAM: "64GB",
            CPU: "24 Cores",
            SSD: "50GB",
            cost: 49480
        }
    }
}

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
        url: "https://identity.tyo2.conoha.io/v2.0/tokens",
        header: {
            "Content-Type": "application/json"
        },
        body: requestbody,
        handler: function (resp) {
            var res = resp.data
            let serviceArray = res.access.serviceCatalog
            for (let i in serviceArray){
                let service = serviceArray[i]
                serviceCatalog[service.name] = service.endpoints[0].publicURL
            }
            let token = res.access.token.id;
            getServers(token);
        }
    });
}

function getRemaining(token, charges) {
    let url = serviceCatalog["Account Service"] + "/payment-summary"
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
            let remainCredit = sum - charges
            let balance = charges / sum
            let percentBalance = parseFloat(balance * 100).toFixed(2) + "%";
            $("remaining_credit").text =  Math.abs(remainCredit) + "円"; 
            $("progress_percent").text = percentBalance;
            $("charges").value = balance;
        }
    });
}

function getCost(token, serverInfo) {
    $http.request({
        method: "GET",
        url: serviceCatalog["Account Service"] + "/billing-invoices?limit=1",
        header: {
            "Content-Type": "application/json",
            "X-Auth-Token": token
        },
        body: {},
        handler: function (resp) {
            var data = resp.data
            let charges = data.billing_invoices[0].bill_plus_tax;
            let serverChargesPercent = parseFloat(charges) / parseFloat(serverInfo.cost);
            $("server_charges_label").text = "Current charges: " + charges + "円";
            $("server_charges_detail").text = parseFloat(serverChargesPercent * 100).toFixed(2) + "%";
            $("server_charges").value = parseFloat(serverChargesPercent);

            $("progress_label").text = "Charges this month: " + charges + "円";        
            getRemaining(token, charges);
        }
    });
}

function getServers(token){
    $http.request({
        method: "GET",
        url: serviceCatalog["Compute Service"] + "/servers",
        header: {
            "Content-Type": "application/json",
            "X-Auth-Token": token
        },
        body: {},
        handler: function(resp) {
            var data = resp.data;
            let servers = data.servers
            let id = servers[0].id
            getIP(token, id)
            getOrderInfo(token, id)
        }
    });
}

function getOrderInfo(token, id){
    $http.request({
        method: "GET",
        url: serviceCatalog["Account Service"] + "/order-items/" + id,
        header: {
            "Content-Type": "application/json",
            "X-Auth-Token": token
        },
        body: {},
        handler: function(resp) {
            var data = resp.data.order_item;
            let serverInfo = productCatagory[data.service_name][data.product_name]
            $("server_cpu_info").text = serverInfo.CPU;
            $("server_ram_info").text = serverInfo.RAM;
            $("server_ssd_info").text = serverInfo.SSD;
            getCost(token, serverInfo)
        }
    });
}

function getIP(token, id){
    $http.request({
        method: "GET",
        url: serviceCatalog["Compute Service"] + "/servers/" + id + "/ips",
        header: {
            "Content-Type": "application/json",
            "X-Auth-Token": token
        },
        body: {},
        handler: function(resp) {
            var data = resp.data;
            let ip = data.addresses["ext-118-27-4-0-23"]
            $("server_os").text = "# IPv4: " + ip[0].addr;
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
        }, {
            type: "label",
            props: {
                id: "server",
                align: $align.left,
                font: $font("bold", 14),
                text: "SERVER DETAILS",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("charges").bottom).offset(30)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_os",
                align: $align.left,
                font: $font("bold", 14),
                text: "# IP: ",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server").bottom).offset(10)
                make.height.equalTo(20)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_cpu",
                align: $align.left,
                font: $font(14),
                text: "CPU",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_os").bottom).offset(5)
                make.height.equalTo(20)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_cpu_info",
                align: $align.right,
                font: $font(14),
                text: "... Core",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_os").bottom).offset(7)
                make.height.equalTo(20)
                make.left.right.inset(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_ram",
                align: $align.left,
                font: $font(14),
                text: "RAM",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_cpu").bottom).offset(5)
                make.height.equalTo(20)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_ram_info",
                align: $align.right,
                font: $font(14),
                text: "... MB",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_cpu").bottom).offset(7)
                make.height.equalTo(20)
                make.left.right.inset(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_ssd",
                align: $align.left,
                font: $font(14),
                text: "SSD",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_ram").bottom).offset(5)
                make.height.equalTo(20)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_ssd_info",
                align: $align.right,
                font: $font(14),
                text: "... GB",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_ram").bottom).offset(7)
                make.height.equalTo(20)
                make.left.right.inset(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_charges_label",
                align: $align.left,
                font: $font(14),
                text: "Current charges: ",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_ssd").bottom).offset(5)
                make.left.right.equalTo(15)
            }
        }, {
            type: "label",
            props: {
                id: "server_charges_detail",
                align: $align.right,
                font: $font(14),
                text: "$...",
                textColor: $color("#2c2c2c")
            },
            layout: function (make, view) {
                make.top.equalTo($("server_ssd").bottom).offset(7)
                make.left.right.inset(15)
            }
        }, {
            type: "progress",
            props: {
                id: "server_charges"
            },
            layout: function (make, view) {
                make.top.equalTo($("server_charges_label").bottom).offset(5)
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