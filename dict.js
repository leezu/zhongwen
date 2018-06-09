/*
        Zhongwen - Ein Chinesisch-Deutsch Popup-Wörterbuch
        Original Work Copyright (C) 2011-2013 Christian Schiller
        https://chrome.google.com/webstore/detail/jjkbnbgakjgfiajfkifdbhbfmjgmddeh
        German version of the Chinese-English Zhongwen Popup-Dictionary
        https://chrome.google.com/webstore/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
        Modified work Copyright (C) 2018 Leonard Lausen
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
async function loadDictData() {
  let wordDict = fetch(browser.extension.getURL(
    "data/handedict.u8")).then(
    processText);
  let wordIndex = fetch(browser.extension.getURL(
    "data/handedict.idx")).then(
    processText);
  let grammarKeywords = fetch(browser.extension.getURL(
    "data/grammarKeywordsMin.json")).then(processJson);

  return Promise.all([wordDict, wordIndex, grammarKeywords]);
}

async function processText(response) {
  return response.text();
}

async function processJson(response) {
  return response.json();
}

class ZhongwenDictionary {
  constructor (wordDict, wordIndex, grammarKeywords) {
    this.wordDict = wordDict;
    this.wordIndex = wordIndex;
    this.grammarKeywords = grammarKeywords;
  }

    find(data, text) {
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
    }

    hasKeyword(keyword) {
        return this.grammarKeywords[keyword];
    }

    wordSearch(word, max) {
        var entry = { };

        var dict = this.wordDict;
        var index = this.wordIndex;
        var maxTrim = 7;
        var cache = {};
        var have = {};
        var count = 0;
        var maxLen = 0;

        if (max != null){
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
    }

    translate(text) {
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
