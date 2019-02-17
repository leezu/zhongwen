/*
 Zhongwen - A Chinese-English Popup Dictionary
 Copyright (C) 2011 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde

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

function zhongwenDict() {
    this.loadDictionary();
}

zhongwenDict.prototype = {

    wordDict: '',
    wordIndex: '',

    grammarKeywords: {},

    fileRead: function (url, callback) {
        var req = new XMLHttpRequest();
        req.open("GET", url, true);

        req.onload = function (e) {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    callback(req.responseText);
                } else {
                    console.error(req.statusText);
                }
            }
        };
        req.onerror = function (e) {
            console.error(req.statusText);
        };

        req.send(null);
    },

    find: function (data, text) {
        const tlen = text.length;
        var beg = 0;
        var end = data.length - 1;
        var i;
        var mi;
        var mis;

        while (beg < end) {
            mi = Math.floor((beg + end) / 2);
            i = data.lastIndexOf('\n', mi) + 1;

            mis = data.substr(i, tlen);
            if (text < mis) end = i - 1;
            else if (text > mis) beg = data.indexOf('\n', mi + 1) + 1;
            else return data.substring(i, data.indexOf('\n', mi + 1));
        }
        return null;
    },

    loadDictionary: function () {
        this.fileRead(chrome.extension.getURL("data/cedict_ts.u8"), function (text) {
            zhongwenDict.prototype.wordDict = text;
        });
        this.fileRead(chrome.extension.getURL("data/cedict.idx"), function (text) {
            zhongwenDict.prototype.wordIndex = text;
        });
        this.fileRead(chrome.extension.getURL("data/grammarKeywordsMin.json"),
            function (text) {
                zhongwenDict.prototype.grammarKeywords = JSON.parse(text)
            });
    },

    hasKeyword: function (keyword) {
        return this.grammarKeywords[keyword];
    },

    wordSearch: function (word, max) {
        var entry = {};

        var dict = this.wordDict;
        var index = this.wordIndex;
        var maxTrim = 7;
        var cache = {};
        var have = {};
        var count = 0;
        var maxLen = 0;

        if (max != null) {
            maxTrim = max;
        }

        entry.data = [];

        while (word.length > 0) {
            var ix = cache[word];
            if (!ix) {
                ix = this.find(index, word + ',');
                if (!ix) {
                    cache[word] = [];
                    continue;
                }
                ix = ix.split(',');
                cache[word] = ix;
            }

            for (var j = 1; j < ix.length; ++j) {
                var offset = ix[j];
                if (have[offset]) continue;

                var dentry = dict.substring(offset, dict.indexOf('\n', offset));

                if (count >= maxTrim) {
                    entry.more = 1;
                    break;
                }

                have[offset] = 1;
                ++count;
                if (maxLen == 0) maxLen = word.length;

                entry.data.push([dentry, word]);
            } // for j < ix.length
            if (count >= maxTrim) break;
            word = word.substr(0, word.length - 1);
        } // while word.length > 0

        if (entry.data.length == 0) return null;

        entry.matchLen = maxLen;
        return entry;
    },

    translate: function (text) {
        var e, o;
        var skip;

        o = {};
        o.data = [];
        o.textLen = text.length;

        while (text.length > 0) {
            e = this.wordSearch(text, 1);
            if (e != null) {
                if (o.data.length >= 7) {
                    o.more = 1;
                    break;
                }
                o.data.push(e.data[0]);
                skip = e.matchLen;
            }
            else {
                skip = 1;
            }
            text = text.substr(skip, text.length - skip);
        }

        if (o.data.length == 0) {
            return null;
        }

        o.textLen -= text.length;
        return o;
    }
};
