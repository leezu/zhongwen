/*
        Zhongwen - A Chinese-English Popup Dictionary
        Original Work Copyright (C) 2011 Christian Schiller
        https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
        Modified work Copyright (C) 2017 Leonard Lausen
        https://github.com/leezu/zhongwen

        ---

        Originally based on Rikaikun 0.8
        Copyright (C) 2010 Erek Speed
        http://code.google.com/p/rikaikun/

        ---

        Originally based on Rikaichan 1.07
        by Jonathan Zarate
        http://www.polarcloud.com/

        ---

        Originally based on RikaiXUL 0.4 by Todd Rudick
        http://www.rikai.com/
        http://rikaixul.mozdev.org/

        ---

        This program is free software; you can redistribute it and/or modify
        it under the terms of the GNU General Public License as published by
        the Free Software Foundation; either version 2 of the License, or
        (at your option) any later version.

        This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        GNU General Public License for more details.

        You should have received a copy of the GNU General Public License
        along with this program; if not, write to the Free Software
        Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

        ---

        Please do not change or remove any of the copyrights or links to web pages
        when modifying any of the files.

*/
var zhongwenMain = {

    altView: 0,
    enabled: 0,

    tabIDs: {},

    loadDictionary: function() {
        if (!this.dict) {
            try {
                this.dict = new zhongwenDict();
            }
            catch (ex) {
                alert('Error loading dictionary: ' + ex);
                return false;
            }
        }
        return true;
    },

    // The callback for onActivated.
    // Just sends a message to the tab to enable itself if it hasn't already.
    onTabSelect: function(activeInfo) {
        zhongwenMain._onTabSelect(activeInfo);
    },
    _onTabSelect: function(activeInfo) {
        if ((this.enabled == 1))
            chrome.tabs.sendMessage(activeInfo.tabId, {
                "type":"enable",
                "config":zhongwenMain.config
            });
    },

    enable: function(tab) {

        localStorage['enabled'] = 1;

        if (!this.dict) {
            if (!this.loadDictionary()) return;
        }

        // Send message to current tab to add listeners and create stuff
        chrome.tabs.sendMessage(tab.id, {
            "type": "enable",
            "config": zhongwenMain.config
        });
        zhongwenMain.enabled = 1;

        chrome.tabs.sendMessage(tab.id, {
            "type": "showPopup",
            "isHelp": true
        });

        chrome.browserAction.setBadgeBackgroundColor({
            "color": [255, 0, 0, 255]
        });

        chrome.browserAction.setBadgeText({
            "text": "On"
        });

        chrome.contextMenus.create(
        {
            title: "Open word list",
            onclick: function() {
                var url = chrome.extension.getURL("/wordlist.html");
                var tabID = zhongwenMain.tabIDs['wordlist'];
                if (tabID) {
                    chrome.tabs.get(tabID, function(tab) {
                        if (tab && (tab.url.substr(-13) == 'wordlist.html')) {
                            chrome.tabs.reload(tabID);
                            chrome.tabs.update(tabID, {
                                active: true
                            });
                        } else {
                            chrome.tabs.create({
                                url: url
                            }, function(tab) {
                                zhongwenMain.tabIDs['wordlist'] = tab.id;
                                chrome.tabs.reload(tab.id);
                            });
                        }
                    });
                } else {
                    chrome.tabs.create({
                        url: url
                    }, function(tab) {
                        zhongwenMain.tabIDs['wordlist'] = tab.id;
                        chrome.tabs.reload(tab.id);
                    });
                }
            },
            contexts: ['all']
        });
    },

    disable: function(tab) {

        localStorage['enabled'] = 0;

        // Delete dictionary object after we implement it
        delete this.dict;

        zhongwenMain.enabled = 0;
        chrome.browserAction.setBadgeBackgroundColor({
            "color": [0,0,0,0]
        });
        chrome.browserAction.setBadgeText({
            "text": ""
        });

        // Send a disable message to all browsers.
        var windows = chrome.windows.getAll({
            "populate": true
        },
        function(windows) {
            for (var i =0; i < windows.length; ++i) {
                var tabs = windows[i].tabs;
                for ( var j = 0; j < tabs.length; ++j) {
                    chrome.tabs.sendMessage(tabs[j].id, {
                        "type":"disable"
                    });
                }
            }
        });
        
        chrome.contextMenus.removeAll();
    },

    enableToggle: function(tab) {
        if (zhongwenMain.enabled) {
            zhongwenMain.disable(tab);
        } else {
            zhongwenMain.enable(tab);
        }
    },

    search: function(text) {

        var entry = this.dict.wordSearch(text);
        if (entry != null) {
            for (var i = 0; i < entry.data.length; i++) {
                var word = entry.data[i][1];
                if (this.dict.hasKeyword(word) && (entry.matchLen == word.length)) {
                    // the final index should be the last one with the maximum length
                    entry.grammar = { keyword: word, index: i };
                }
            }
        }

        return entry;

    }
};
