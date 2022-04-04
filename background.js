const url = "<YOUR SERVER URL>";
const localStorage = {};
const outAuth = "<YOUR SERVER AUTH HEADER";
//--------------------------------------------------------END OF INIT VARIABLES-----------------------------------------------------------------//

//CREATE PULSE ALARM------//
chrome.alarms.create("twitchPulse", {
    delayInMinutes: 1,
    periodInMinutes: 2
});
chrome.alarms.create("storageStartup", {
    delayInMinutes: 1
});
console.log("FROM BACKGROUND: Alarm Created")
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "twitchPulse") {
        console.log("FROM BACKGROUND: Alarm twitchpulse has triggered")
        pulse();
    }
    if(alarm.name === "storageStartup"){
        //INIT AND SET LOCAL STORAGE-----//
        getAllStorageSyncData()
    .then(items => {
        // Copy the data retrieved from storage into storageCache.
        Object.assign(localStorage, items);

    })
    .then(() => {
        setBadge();
    });
    }
});
console.log("FROM BACKGROUND: Listener Created");

//SET BADGE BACKGROUND(because white looks bad)----//
chrome.action.setBadgeBackgroundColor({ color: "#0a1f27" }, function () { console.log("FROM BACKGROUND:background color changed") });

//FIRST RUN INITIALIZE CLOUD STORAGE----//
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        installStorage();
    }
    else if (details.reason === "update") {
        auditStorage();

        const manifest = chrome.runtime.getManifest();
        const updateNotif = {
            type: "basic",
            message: ("Updated to version " + manifest.version),
            contextMessage: "Check options page for changelog!",
            title: "TwitchLight",
            iconUrl: "./images/icon48.png",
            eventTime: Date.now()
        };

        chrome.notifications.create("update", updateNotif, function () {
            setTimeout(() => {
                chrome.notifications.clear("update", (cleared) => {
                    console.log("Notification Cleared = " + cleared)
                })
            }, 7500)
        })
    }

})

//CREATE STORAGE CHANGE LISTENER TO DEPLOY NOTIFS WHEN NEEDED---//
chrome.storage.onChanged.addListener(function (changes, namespace) {
    console.log(changes)

    Object.keys(changes).forEach(prop => {
        console.log(prop);
        if(changes[prop].hasOwnProperty("newValue") && changes[prop].hasOwnProperty("oldValue")){
            if (changes[prop].newValue.status === true && changes[prop].oldValue.status === false && changes[prop].oldValue.status != undefined) {
                if (localStorage.options[prop + "Notif"] === true) {
                    sendNotification(prop);
                    setBadge()        
                }
            }
            if (changes[prop].newValue.ticker != undefined && changes[prop].newValue.ticker != changes[prop].oldValue.ticker && changes[prop].oldValue.ticker != undefined) {
                if (localStorage.options[prop + "Tick"] === true) {
                    sendTickerUpdate(prop);
                    setBadge()              
                }
    
            }
        }
    });
})

function auditStorage() {
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
            Object.assign(localStorage, data[0])
            chrome.storage.sync.set(localStorage, () => {
                console.log("INSTALL PULSE: Data updated")
            })
        })
        .then(() => {
            const storage = {
                options: {
                    theme: "dark"
                }
            }
            Object.keys(localStorage).forEach(prop => {
                if(prop != "options"){
                    storage.options[prop + "Notif"] = true;
                    storage.options[prop + "Tick"] = true;
                }
            })
            Object.assign(localStorage, storage)
        })
        .then(() => {
            chrome.storage.sync.set(localStorage, () => {
                console.log("INSTALL OPTIONS BLOCK INITIALIZED")
            })
        })
        .catch(e => { console.log(e) })

}


//PING THE SERVER FOR INFO AND UPDATE LOCAL AND CLOUD STORAGE(google give me webhooks pls)----//
function pulse() {
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
            console.log(data[0])
            Object.assign(localStorage, data[0])
            chrome.storage.sync.set(localStorage, () => {
                console.log("FROM PULSE: Data updated")
                console.log(localStorage);
            })
        })
        .then(() => {
            setBadge()
        })

        .catch((e) => {
            console.log(e)
        })

}


//FUNCTION TO INIT LOCAL STORAGE---//
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

function storageReset() {
    
    chrome.storage.sync.clear(()=>{
        installStorage();
    })
    
}
//FUNCTION TO SET BADGE NUMBER; PARSES DATA AND COUNTS LIVE STREAMERS----//
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


//FUNCTION TO DEPLOY NOTIFS-----//
function sendNotification(streamer) {
    const notif = {
        type: "basic",
        message: (streamer + " is Live!"),
        contextMessage: localStorage[streamer].game,
        title: "TwitchLight",
        iconUrl: ("./images/" + streamer + ".png"),
        eventTime: Date.now()
    };

    chrome.notifications.create(streamer, notif, function () {
        setTimeout(() => {
            chrome.notifications.clear(streamer, (cleared) => {
                console.log("Notification Cleared = " + cleared)
            })
        }, 6000)
    })
}

function sendTickerUpdate(streamer) {
    const notif = {
        type: "basic",
        message: (streamer + " has updated their ticker!"),
        contextMessage: localStorage[streamer].ticker,
        title: "TwitchLight",
        iconUrl: ("./images/" + streamer + ".png"),
        eventTime: Date.now()
    };

    chrome.notifications.create(streamer, notif, function () {
        setTimeout(() => {
            chrome.notifications.clear(streamer, (cleared) => {
                console.log("Notification Cleared = " + cleared)
            })
        }, 6000)
    })
}