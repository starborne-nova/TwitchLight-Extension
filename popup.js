const localStorage = {};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = getAllStorageSyncData()
  .then(items => {
    // Copy the data retrieved from storage into storageCache.
    Object.assign(localStorage, items)
  })
  .then(() => {
    console.log(localStorage)
    populate();
  });


//COCK
//
//Skeleton out all the streamitems first and sort them
//Then make the page divs and slap them together


function populate() {
  document.body.setAttribute("data-theme", localStorage.options.theme);
  var counter = 1;
  var pageCounter = 1;
  var page = 1

  Object.keys(localStorage).forEach(prop => {
    const item = "item" + counter.toString();
    const ticker = "ticker" + counter.toString();
    if (pageCounter > 6) {
      page++;
      pageCounter = 1;
    }
    if (prop != "options") {
      if (localStorage.options[prop + "Notif"] === true && localStorage[prop].status) {
        $("#page" + page.toString()).append(("<div class='streamItem' id='" + prop + "'><a href='https://www.twitch.tv/" + prop.toLowerCase() + "' target='_blank'><ul class='popup-container'><li id='" + item + "'><h3 class='streamer'>" + prop + "</h3><h4 class='offline' id='" + prop + "Status'>OFFLINE</h4></li><li><h4 class='ticker hide' id='" + ticker + "'>Ticker: </h4></li></ul></a></div>"))
        $("#" + prop + "Status").text((localStorage[prop].game.substring(0, 32))).attr("class", "online")
        $("#" + prop).attr("class", "streamItem-online")
        $("#" + item).mouseenter(function () {
          $("#" + ticker).removeClass("hide");
        })
        if (localStorage[prop].ticker.indexOf("http") < 55) {
          $("#" + ticker).text((localStorage[prop].ticker.substring(0, (localStorage[prop].ticker.indexOf("http"))))).attr("class", "ticker hide overflow-hidden")
        }
        if (localStorage[prop].ticker.indexOf("http") === -1 || localStorage[prop].ticker.indexOf("http") >= 55) {
          $("#" + ticker).text((localStorage[prop].ticker.substring(0, 55))).attr("class", "ticker hide overflow-hidden")
        }
        counter++;
        pageCounter++;
      }
    }
  })

  Object.keys(localStorage).forEach(prop => {
    const item = "item" + counter.toString();
    const ticker = "ticker" + counter.toString();
    if (pageCounter > 6) {
      page++;
      pageCounter = 1;
    }

    if (prop != "options") {
      if (localStorage.options[prop + "Notif"] === true && !localStorage[prop].status) {
        $("#page" + page.toString()).append(("<div class='streamItem' id='" + prop + "'><a href='https://www.twitch.tv/" + prop.toLowerCase() + "' target='_blank'><ul class='popup-container'><li id='" + item + "'><h3 class='streamer'>" + prop + "</h3><h4 class='offline' id='" + prop + "Status'>OFFLINE</h4></li><li><h4 class='ticker hide' id='" + ticker + "'>Ticker: </h4></li></ul></a></div>"))
        if (localStorage[prop].ticker.indexOf("http") < 55) {
          $("#" + ticker).text((localStorage[prop].ticker.substring(0, (localStorage[prop].ticker.indexOf("http"))))).attr("class", "ticker hide overflow-hidden")
        }
        if (localStorage[prop].ticker.indexOf("http") === -1 || localStorage[prop].ticker.indexOf("http") >= 55) {
          $("#" + ticker).text((localStorage[prop].ticker.substring(0, 55))).attr("class", "ticker hide overflow-hidden")
        }
        $("#" + item).mouseenter(function () {
          $("#" + ticker).removeClass("hide");
        })
        counter++;
        pageCounter++;
      }
    }
  })

  if (page > 1) {
    $("#popupControl").append(("<li class='page-item'><a class='page-link bg-dark text-white' href='#' aria-label='Previous' id='pLast'><span aria-hidden='true'>&laquo;</span></a><li>"))

    $("#popupControl").append(("<li class='page-item active' id='pitem1'><a class='page-link bg-dark text-white' href='#' id='pbutton1'>1</a></li>"))

    for (let i = 1; i <= page; i++) {
      if (i != 1) {
        $("#popupControl").append(("<li class='page-item' id='pitem" + i.toString() + "'><a class='page-link bg-dark text-white' href='#' id='pbutton" + i.toString() + "'>" + i.toString() + "</a></li>"))
        $("#pbutton" + i.toString()).click((e) => {
          e.preventDefault();
          $( "div[id*='page']" ).filter(":visible").hide()
          $(".active").toggleClass("active")
          $("#pitem" + i.toString()).toggleClass("active")
          $("#page" + i.toString()).show()
        })
      }
    }
    $("#popupControl").append(("<li class='page-item'><a class='page-link bg-dark text-white' href='#' aria-label='Next' id='pNext'><span aria-hidden='true'>&raquo;</span></a></li>"))

    $("#pbutton1").click((e) => {
      e.preventDefault();
      $( "div[id*='page']" ).filter(":visible").hide()
      $(".active").toggleClass("active")
      $("#pitem1").toggleClass("active")
      $("#page1").show()
    })

    $("#pNext").click((e) => {
    e.preventDefault();
    const activeS = $("div[id*='page']").filter(":visible").attr("id").substring(4);
    const activeI = parseInt(activeS)
    console.log(activeI)
    if (activeI != page) {
      $( "div[id*='page']" ).filter(":visible").hide()
      $(".active").toggleClass("active")
      $("#page" + ((activeI + 1).toString())).show()
      $("#pitem" + ((activeI + 1).toString())).toggleClass("active")
    }
    if (activeI === page) {
      $( "div[id*='page']" ).filter(":visible").hide()
      $(".active").toggleClass("active")
      $("#page1").show()
      $("#pitem1").toggleClass("active")
    }
  })
  
  $("#pLast").click((e) => {
    e.preventDefault();
    const activeS = $("div[id*='page']").filter(":visible").attr("id").substring(4);
    const activeI = parseInt(activeS)
    console.log(activeI)
    if (activeI != 1) {
      $( "div[id*='page']" ).filter(":visible").hide()
      $(".active").toggleClass("active")
      $("#page" + ((activeI - 1).toString())).show()
      $("#pitem" + ((activeI - 1).toString())).toggleClass("active")
    }
    if (activeI === 1) {
      $( "div[id*='page']" ).filter(":visible").hide()
      $(".active").toggleClass("active")
      $("#page" + page.toString()).show()
      $("#pitem" + page.toString()).toggleClass("active")
    }
  })
  }
  $( "div[id*='page']" ).filter(":visible").hide()
  $("#page1").show()
}

function getAllStorageSyncData() {

  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (items) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(items);
    });
  });
}