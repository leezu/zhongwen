/*
        Zhongwen - Ein Chinesisch-Deutsch Popup-Wörterbuch
        Copyright (C) 2011-2013 Christian Schiller
        https://chrome.google.com/webstore/detail/jjkbnbgakjgfiajfkifdbhbfmjgmddeh

        German version of the Chinese-English Zhongwen Popup-Dictionary
        https://chrome.google.com/webstore/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
*/

chrome.browserAction.onClicked.addListener(zhongwenMain.enableToggle);
chrome.tabs.onActiveChanged.addListener(zhongwenMain.onTabSelect);

chrome.extension.onRequest.addListener(function(request, sender, response) {

    switch(request.type) {
        case 'enable?':
            zhongwenMain.onTabSelect(sender.tab.id);
            break;
        case 'search':
            var e = zhongwenMain.search(request.text);
            response(e);
            break;
        case 'open':
                        
            var tabID = zhongwenMain.tabIDs[request.tabType];
            if (tabID) {
                chrome.tabs.get(tabID, function(tab) {
                    if (tab && (tab.url.substr(-13) == 'wordlist.html')) {
                        chrome.tabs.reload(tabID);
                        chrome.tabs.update(tabID, {
                            active: true
                        });
                    } else {
                        chrome.tabs.create({
                            url: request.url
                            }, function(tab) {
                            zhongwenMain.tabIDs[request.tabType] = tab.id;
                            if (request.tabType == 'wordlist') {
                                // make sure the table is sized correctly
                                chrome.tabs.reload(tab.id);
                            }
                        });
                    }
                });
            } else {
                chrome.tabs.create({
                    url: request.url
                    }, function(tab) {
                    zhongwenMain.tabIDs[request.tabType] = tab.id;
                    if (request.tabType == 'wordlist') {
                        // make sure the table is sized correctly
                        chrome.tabs.reload(tab.id);
                    }
                });
            }
                        
            break;

        case 'copy':
            var txt = document.createElement('textarea');
            txt.style.position = "absolute";
            txt.style.left = "-100%";
            txt.value = request.data;
            document.body.appendChild(txt);
            txt.select();
            document.execCommand('copy');
            document.body.removeChild(txt);
            break;
        case 'add':
            var json = localStorage['wordlist'];
                        
            var wordlist;
            if (json) {
                wordlist = JSON.parse(json);
            } else {
                wordlist = []
            }
                        
            for (var i in request.entries) {
                            
                var entry = {}
                entry.simplified = request.entries[i].simplified;
                entry.traditional = request.entries[i].traditional;
                entry.pinyin = request.entries[i].pinyin;
                entry.definition = request.entries[i].definition;
                            
                wordlist.push(entry);
            }                            
            localStorage['wordlist'] = JSON.stringify(wordlist);

            var tabID = zhongwenMain.tabIDs['wordlist'];
            if (tabID) {
                chrome.tabs.get(tabID, function(tab) {
                    if (tab) {
                        chrome.tabs.reload(tabID);
                    }
                });
            }

            break;
        case 'iframe':
            chrome.tabs.executeScript(sender.tab.id, {
                file: 'content.js',
                allFrames: true
            })
            break;
        default:
    // ignore
    }
});

function initStorage(key, defaultValue) {
    var currentValue = localStorage[key];
    if (!currentValue) {
        localStorage[key] = defaultValue;
    }
}

initStorage("popupcolor", "yellow");
initStorage("tonecolors", "yes");
initStorage("fontSize", "small");
initStorage("skritterTLD", "com");
initStorage("zhuyin", "no");

zhongwenMain.config = {};
zhongwenMain.config.css = localStorage["popupcolor"];
zhongwenMain.config.tonecolors = localStorage["tonecolors"];
zhongwenMain.config.fontSize = localStorage["fontSize"]
zhongwenMain.config.skritterTLD = localStorage.skritterTLD;
zhongwenMain.config.zhuyin = localStorage.zhuyin;

if (localStorage['enabled'] == 1) {
   zhongwenMain.loadDictionary();
   zhongwenMain.enabled = 1;
} else {
    zhongwenMain.enabled = 0;
}
