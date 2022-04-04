const localStorage = {};
const outAuth = "<YOUR SERVER AUTH HEADER>";
const url = "<YOUR SERVER URL>";

//Dim font color
//border + shadow on boxes
//gradient on boxes?

const initStorageCache = getAllStorageSyncData()
    .then(items => {
        Object.assign(localStorage, items);
        console.log(localStorage);
    });

const notifOptions = {
    type: "basic",
    title: "TwitchLight",
    message: "This is a test!",
    iconUrl: "./images/icon48.png",
    eventTime: Date.now()
}

function saveOptions() {

    Object.keys(localStorage).forEach(prop => {
        if ($("#" + prop + "Notifs").prop("checked") != undefined) {
            localStorage.options[prop + "Notif"] = $("#" + prop + "Notifs").prop("checked")
            localStorage.options[prop + "Tick"] = $("#" + prop + "Ticker").prop("checked")
        }
    })

    localStorage.options.theme = $("#setTheme").prop("value");

    console.log(localStorage.options)

    chrome.storage.sync.set(localStorage, function () {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
        loadOptions();
        setBadge();
    });
};

function loadOptions() {
    chrome.storage.sync.get(null, (items) => {
        if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
        }
        else {
            Object.keys(items).forEach(prop => {
                if ($("#" + prop + "Notifs").prop("checked") != undefined) {
                    $("#" + prop + "Notifs").prop("checked", items.options[prop + "Notif"])
                    $("#" + prop + "Ticker").prop("checked", items.options[prop + "Tick"])
                }
            })
            document.body.setAttribute("data-theme", items.options.theme);
            $("#setTheme").prop("value", items.options.theme);
        }
    });
}

function loadOnline() {
    chrome.storage.sync.get(null, (items) => {
        if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
        }
        else {
            Object.keys(items).forEach(prop => {
                if (items[prop].status === true && items[prop].status != undefined) {
                    $("#" + prop + "Online").text("LIVE")
                }
            })
        }
    })
}

function handleTestNotif() {
    chrome.notifications.getAll((notifications) => {

        if (Object.keys(notifications).length != 0) {
            setTimeout(() => {
                chrome.notifications.create("testNote", notifOptions, function (id) {
                    setTimeout(() => {
                        chrome.notifications.clear("testNote", (cleared) => {
                            console.log("Notification Cleared = " + cleared)
                        })
                    }, 5000)
                })
            }, 5500)
        }
        else {
            chrome.notifications.create("testNote", notifOptions, function (id) {
                setTimeout(() => {
                    chrome.notifications.clear("testNote", (cleared) => {
                        console.log("Notification Cleared = " + cleared)
                    })
                }, 5000)
            })
        }
    });
}

function getAllStorageSyncData() {
    // Immediately return a promise and start asynchronous work
    return new Promise((resolve, reject) => {
        // Asynchronously fetch all data from storage.sync.
        chrome.storage.sync.get(null, (items) => {
            // Pass any observed errors down the promise chain.
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // Pass the data retrieved from storage down the promise chain.
            resolve(items);
        });
    });
}

function sendNotification(streamer, notif) {
    chrome.notifications.create(streamer, notif, function () {
        setTimeout(() => {
            chrome.notifications.clear(streamer, (cleared) => {
                console.log("Notification Cleared = " + cleared)
            })
        }, 5000)
    })
}

function populateOptions() {
    chrome.storage.sync.get(null, (items) => {
        if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
        }
        else {
            Object.keys(items).forEach(item => {
                if (item != "options")
                    $("#insertOptions").append("<div class='col'><div class='card mb-3 mx-auto border-0 bg-transparent' style='max-width: 900px;'><div class='row g-0 card-bg p-2' style='border-radius: 15px;'><div class='col-md-2 d-flex align-items-center'><img src=" + items[item].profile + " class='card-img border border-4 mx-auto'></div><div class='col-md-7'><div class='card-body'><figure class='text my-auto'><h5 class='card-title my-2'>" + item + "</h5><p class='card-text my-2' id='" + item + "Online'>Offline</p><p class='card-text my-2'><a href='https://www.twitch.tv/" + item.toLowerCase() + "' target='_blank'> <small >Visit Twitch Channel</small></a></p></figure></div></div><div class='col-md-3 d-flex flex-column'><div class='form-check form-switch  mt-auto mb-2 ms-4 me-auto'><input class='form-check-input' type='checkbox' role='switch' id='" + item + "Notifs' checked><label class='form-check-label' for='" + item + "Notifs'>Notifications</label></div><div class='form-check form-switch mt-2 mb-auto ms-4 me-auto'><label class='form-check-label' for='" + item + "Ticker'>Ticker Updates</label><input class='form-check-input' type='checkbox' role='switch' id='" + item + "Ticker' checked></div></div></div></div></div>")
            })
        }
    })
}

function storageReset() {
    
    chrome.storage.sync.clear(()=>{
        installStorage();
    })
    
}

function storageAudit() {
    fetch(
        url,
        {
            method: "POST",
            mode: "cors",
            headers:
            {
                "Content-type": "application/json",
                "chrome": outAuth
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log("AUDIT: Begin streamer audit")
            Object.assign(localStorage, data[0])
            Object.keys(localStorage).forEach(prop =>{
                if(!data[0].hasOwnProperty(prop) && prop != "options"){
                    chrome.storage.sync.remove(prop)
                    chrome.storage.sync.remove([(prop + "Notif"), (prop + "Tick")])
                    delete localStorage[prop]
                    delete localStorage.options[prop + "Notif"]
                    delete localStorage.options[prop + "Tick"]
                    console.log("AUDIT: " + prop + " has been removed")
                }
            })
            console.log("AUDIT: Streamer audit complete")
        })
        .then(() => {
            console.log("AUDIT: Begin options audit")
            Object.keys(localStorage).forEach(prop => {
                if(prop != "options" && localStorage.options[prop + "Notif"] === undefined){
                    localStorage.options[prop + "Notif"] = true;
                    localStorage.options[prop + "Tick"] = true;
                    console.log("AUDIT: Options for " + prop + " added")
                }
            })
            console.log("AUDIT: Options audit complete")
        })
        .then(() => {
            chrome.storage.sync.set(localStorage, () => {
                console.log("AUDIT: Operation complete")
            })
        })
        .catch(e => { console.log(e) })

}

function installStorage() {
    const fresh = {}
    fetch(
        url,
        {
            method: "POST",
            mode: "cors",
            headers:
            {
                "Content-type": "application/json",
                "chrome": outAuth
            },
        })
        .then(response => response.json())
        .then(data => {
            Object.assign(fresh, data[0])
            chrome.storage.sync.set(fresh, () => {
                console.log("INSTALL PULSE: Data updated")
            })
        })
        .then(() => {
            const storage = {
                options: {
                    theme: "dark"
                }
            }
            Object.keys(fresh).forEach(prop => {
                if(prop != "options"){
                    storage.options[prop + "Notif"] = true;
                    storage.options[prop + "Tick"] = true;
                }
            })
            Object.assign(fresh, storage)
        })
        .then(() => {
            chrome.storage.sync.set(fresh, () => {
                console.log("INSTALL OPTIONS BLOCK INITIALIZED")
            })
        })
        .catch(e => { console.log(e) })

}

function setBadge() {
    var badgeCount = 0;

    Object.entries(localStorage).forEach(function ([key, value]) {
        if(localStorage.options[key + "Notif"] === true){
            if (value.status === true) {
                console.log("SETBADGE:" + key + " is live.")
                badgeCount++;
            }
            else if (value.status === undefined) {
                console.log("SETBADGE: OPTIONS BLOCK " + key)
            }
        }
    })
    var badgeText = badgeCount.toString()
    console.log("FROM SETBADGE: " + badgeText);

    chrome.action.setBadgeText({ text: badgeText }, function () { console.log("FROM BACKGROUND:badge text changed") });
}

document.getElementById("testNotif").addEventListener("click", handleTestNotif);

document.getElementById("resetStorage").addEventListener("click", storageReset);

document.getElementById("auditStorage").addEventListener("click", storageAudit);

document.addEventListener('DOMContentLoaded', populateOptions);

document.addEventListener('DOMContentLoaded', loadOptions);

document.addEventListener('DOMContentLoaded', loadOnline, { once: true });

document.getElementById('save').addEventListener('click',
    saveOptions);