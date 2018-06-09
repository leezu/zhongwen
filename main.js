/*
        Zhongwen - Ein Chinesisch-Deutsch Popup-Wörterbuch
        Copyright (C) 2011-2013 Christian Schiller
        https://chrome.google.com/webstore/detail/jjkbnbgakjgfiajfkifdbhbfmjgmddeh

        German version of the Chinese-English Zhongwen Popup-Dictionary
        https://chrome.google.com/webstore/detail/kkmlkkjojmombglmlpbpapmhcaljjkde

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

    miniHelp:
        '<span style="font-weight: bold;">Zhongwen Chinesisch-Deutsch W&ouml;rterbuch&nbsp;&nbsp;&nbsp;</span><br><br>' +
        '<p>' +
        '<span style="font-style: italic; font-weight: bold;">Neu: </span>' +
        '<span style="font-style: italic;">Zhongwen kann auch Text in Eingabefeldern &uuml;bersetzen,<br>' +
        ' hierf&uuml;r einfach die Alt-Taste gedr&uuml;ckt halten.</span><br><br>' +
        '<p>' +
        'Tastaturk&uuml;rzel:' +
        '<p>' +
        '<table style="margin: 20px;" cellspacing=5 cellpadding=5>' +
        '<tr><td><b>N&nbsp;:</b></td><td>&nbsp;N&auml;chstes Wort</td></tr>' +
        '<tr><td><b>B&nbsp;:</b></td><td>&nbsp;Vorheriges Zeichen</td></tr>' +
        '<tr><td><b>M&nbsp;:</b></td><td>&nbsp;N&auml;chstes Zeichen</td></tr>' +
        '<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>' +
        '<tr><td><b>A&nbsp;:</b></td><td>&nbsp;Andere Position des Popup-Fensters</td></tr>' +
        '<tr><td><b>Y&nbsp;:</b></td><td>&nbsp;Schiebe Popup-Fenster nach unten</td></tr>' +
        '<tr><td><b>X&nbsp;:</b></td><td>&nbsp;Schiebe Popup-Fenster nach oben</td></tr>' +
        '<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>' +
        '<tr><td><b>C&nbsp;:</b></td><td>&nbsp;Wort mit &Uuml;bersetzung in die Zwischenablage kopieren</td></tr>' +
        '<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>' +
        '<tr><td><b>S&nbsp;:</b></td><td>&nbsp;Wort zum Lernen bei Skritter vormerken</td></tr>' +
        '<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>' +
        '<tr><td><b>R&nbsp;:</b></td><td>&nbsp;Wort zu interner Wortliste hinzuf&uuml;gen</td></tr>' +
        '<tr><td><b>Alt + W&nbsp;:</b></td><td>&nbsp;Wortliste anzeigen</td></tr>' +
        '<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>' +
        '<tr><td colspan=2>Selektierten Text in Online-W&ouml;rterbuch nachschlagen (englisch):</td></tr>' +
        '<tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>' +
        '<tr><td><b>Alt + 1&nbsp;:</b></td><td>&nbsp;nciku</td></tr>' +
        '<tr><td><b>Alt + 3&nbsp;:</b></td><td>&nbsp;Dict.cn</td></tr>' +
        '<tr><td><b>Alt + 4&nbsp;:</b></td><td>&nbsp;iCIBA</td></tr>' +
        '<tr><td><b>Alt + 5&nbsp;:</b></td><td>&nbsp;MDBG</td></tr>' +
        '<tr><td><b>Alt + 6&nbsp;:</b></td><td>&nbsp;JuKuu</td></tr>' +
        '<tr><td><b>T&nbsp;:</b></td><td>&nbsp;Tatoeba</td></tr>' +
        '</table>',

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

    // The callback for onSelectionChanged.
    // Just sends a message to the tab to enable itself if it hasn't
    // already.
    onTabSelect: function(tabId) {
        zhongwenMain._onTabSelect(tabId);
    },
    _onTabSelect: function(tabId) {
        if ((this.enabled == 1))
            chrome.tabs.sendRequest(tabId, {
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
        chrome.tabs.sendRequest(tab.id, {
            "type": "enable",
            "config": zhongwenMain.config
        });
        zhongwenMain.enabled = 1;

        chrome.tabs.sendRequest(tab.id, {
            "type": "showPopup",
            "text": zhongwenMain.miniHelp,
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
            title: "Wortliste anzeigen",
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
                    chrome.tabs.sendRequest(tabs[j].id, {
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

        return this.dict.wordSearch(text);

    }
};
