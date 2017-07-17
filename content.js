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

var zhongwenContent = {

    altView: 0,

    lastFound: null,

    keysDown: [],

    // Hack because SelEnd can't be sent in messages
    lastSelEnd:  [],
    // Hack because ro was coming out always 0 for some reason.
    lastRo: 0,

    //Adds the listeners and stuff.
    enableTab: function() {
        if (!window.zhongwen) {
            window.zhongwen = {};
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('keydown', this.onKeyDown);
            document.addEventListener('keyup', this.onKeyUp);
            document.addEventListener('DOMNodeInserted', this.onDOMNodeInserted)
        }
    },
    
    onDOMNodeInserted: function(ev) {
        if (ev.target.nodeName == 'IFRAME') {
            chrome.extension.sendRequest({
                "type": "iframe"
            });
        }
    },

    //Removes the listeners and stuff
    disableTab: function() {
        if (window.zhongwen) {
            var e;
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('keydown', this.onKeyDown);
            document.removeEventListener('keyup', this.onKeyUp);
            document.removeEventListener('DOMNodeInserted', this.onDOMNodeInserted)

            e = document.getElementById('zhongwen-css');
            if (e) e.parentNode.removeChild(e);
            e = document.getElementById('zhongwen-window');
            if (e) e.parentNode.removeChild(e);

            this.clearHi();
            delete window.zhongwen;
        }
    },

    getContentType: function(tDoc) {
        var m = tDoc.getElementsByTagName('meta');
        for(var i in m) {
            if(m[i].httpEquiv == 'Content-Type') {
                var con = m[i].content;
                con = con.split(';');
                return con[0];
            }
        }
        return null;
    },

    showPopup: function(text, elem, x, y, looseWidth) {
        var topdoc = window.document;

        if (!x || !y) x = y = 0;

        var popup = topdoc.getElementById('zhongwen-window');

        if (!popup) {
            var css = topdoc.createElementNS('http://www.w3.org/1999/xhtml', 'link');
            css.setAttribute('rel', 'stylesheet');
            css.setAttribute('type', 'text/css');
            var cssdoc = window.zhongwen.config.css;
            css.setAttribute('href', chrome.extension.getURL('css/popup-' +
                cssdoc + '.css'));
            css.setAttribute('id', 'zhongwen-css');
            topdoc.getElementsByTagName('head')[0].appendChild(css);

            popup = topdoc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            popup.setAttribute('id', 'zhongwen-window');
            topdoc.documentElement.appendChild(popup);

            popup.addEventListener('dblclick',
                function (ev) {
                    zhongwenContent.hidePopup();
                    ev.stopPropagation();
                }, true);
        }

        popup.style.width = 'auto';
        popup.style.height = 'auto';
        popup.style.maxWidth = (looseWidth ? '' : '600px');

        if (zhongwenContent.getContentType(topdoc) == 'text/plain') {
            var df = document.createDocumentFragment();
            df.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml', 'span'));
            df.firstChild.innerHTML = text;

            while (popup.firstChild) {
                popup.removeChild(popup.firstChild);
            }
            popup.appendChild(df.firstChild);
        }
        else {
            popup.innerHTML = text;
        }

        if (elem) {
            popup.style.top = '-1000px';
            popup.style.left = '0px';
            popup.style.display = '';

            var pW = popup.offsetWidth;
            var pH = popup.offsetHeight;

            // guess!
            if (pW <= 0) pW = 200;
            if (pH <= 0) {
                pH = 0;
                var j = 0;
                while ((j = text.indexOf('<br/>', j)) != -1) {
                    j += 5;
                    pH += 22;
                }
                pH += 25;
            }

            if (this.altView == 1) {
                x = window.scrollX;
                y = window.scrollY;
            }
            else if (this.altView == 2) {
                x = (window.innerWidth - (pW + 20)) + window.scrollX;
                y = (window.innerHeight - (pH + 20)) + window.scrollY;
            }
            // This probably doesn't actually work
            else if (elem instanceof window.HTMLOptionElement) {
                // these things are always on z-top, so go sideways

                x = 0;
                y = 0;

                var p = elem;
                while (p) {
                    x += p.offsetLeft;
                    y += p.offsetTop;
                    p = p.offsetParent;
                }
                if (elem.offsetTop > elem.parentNode.clientHeight) y -= elem.offsetTop;

                if ((x + popup.offsetWidth) > window.innerWidth) {
                    // too much to the right, go left
                    x -= popup.offsetWidth + 5;
                    if (x < 0) x = 0;
                }
                else {
                    // use SELECT's width
                    x += elem.parentNode.offsetWidth + 5;
                }
            }
            else {
                // go left if necessary
                if ((x + pW) > (window.innerWidth - 20)) {
                    x = (window.innerWidth - pW) - 20;
                    if (x < 0) x = 0;
                }

                // below the mouse
                var v = 25;

                // go up if necessary
                if ((y + v + pH) > window.innerHeight) {
                    var t = y - pH - 30;
                    if (t >= 0) y = t;
                }
                else y += v;

                x += window.scrollX;
                y += window.scrollY;
            }
        }
        else {
            x += window.scrollX;
            y += window.scrollY;
        }

        // (-1, -1) indicates: leave position unchanged
        if (x != -1 && y != -1) {
            popup.style.left = x + 'px';
            popup.style.top = y + 'px';
            popup.style.display = '';
        }
    },

    hidePopup: function() {
        var popup = document.getElementById('zhongwen-window');
        if (popup) {
            popup.style.display = 'none';
            popup.innerHTML = '';
        }
    },

    isVisible: function() {
        var popup = document.getElementById('zhongwen-window');
        return (popup) && (popup.style.display != 'none');
    },

    clearHi: function() {
        var tdata = window.zhongwen;
        if ((!tdata) || (!tdata.prevSelView)) return;
        if (tdata.prevSelView.closed) {
            tdata.prevSelView = null;
            return;
        }

        var sel = tdata.prevSelView.getSelection();
        if ((sel.isCollapsed) || (tdata.selText == sel.toString())) {
            sel.removeAllRanges();
        }
        tdata.prevSelView = null;
        tdata.selText = null;
    },

    onKeyDown: function(ev) {
        zhongwenContent._onKeyDown(ev)
    },
    _onKeyDown: function(ev) {

        if (ev.ctrlKey || ev.metaKey) {
            return;
        }

        if (ev.altKey && (ev.keyCode == 87)) {  // Alt+W
            chrome.extension.sendRequest({
                type: 'open',
                tabType: 'wordlist',
                url: '/wordlist.html'
            });
            return;
        }

        if (this.keysDown[ev.keyCode]) {
            return;
        }

        if (!this.isVisible()) {
            if (window.getSelection() && !(window.getSelection().toString().length > 0)) {
                return;
            }
        }

        var i;

        switch (ev.keyCode) {
            case 27:        // esc
                this.hidePopup();
                break;
            case 65:        // a
                this.altView = (this.altView + 1) % 3;
                this.show(window.zhongwen);
                break;
            case 67:        // c
                this.copyToClipboard(this.getTexts());
                break;
            case 66:        // b
                var ofs = window.zhongwen.uofs;
                var tdata = window.zhongwen;
                for (i = 0; i < 10; i++) {
                    tdata.uofs = --ofs;
                    var ret = this.show(tdata, true);
                    if (ret == 0) {
                        break;
                    } else if (ret == 2) {
                        tdata.prevRangeNode = this.findPreviousTextNode(tdata.prevRangeNode.parentNode, tdata.prevRangeNode);
                        tdata.prevRangeOfs = 0;
                        ofs = tdata.prevRangeNode.data.length;
                    }
                }
                break;

            case 71:        // g
                if (window.zhongwen.config.grammar != 'no' && this.isVisible() && this.lastFound.grammar) {
                    var sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://resources.allsetlearning.com/chinese/grammar/%E4%B8%AA
                    var allset = 'http://resources.allsetlearning.com/chinese/grammar/' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: allset
                    });
                }
                break;

            case 77:        // m
                window.zhongwen.uofsNext = 1;
            // falls through
            case 78:        // n
                tdata = window.zhongwen;
                for (i = 0; i < 10; i++) {
                    tdata.uofs += tdata.uofsNext;
                    ret = this.show(tdata);
                    if (ret == 0) {
                        break;
                    } else if (ret == 2) {
                        tdata.prevRangeNode = this.findNextTextNode(tdata.prevRangeNode.parentNode, tdata.prevRangeNode);
                        tdata.prevRangeOfs = 0;
                        tdata.uofs = 0;
                        tdata.uofsNext = 0;
                    }
                }
                break;

            case 82:        // r
                
                var entries = [];
                for (var j = 0; j < this.lastFound.length; j++) {
                    var entry = {};
                    entry.simplified = this.lastFound[j][0];
                    entry.traditional = this.lastFound[j][1];
                    entry.pinyin = this.lastFound[j][2];
                    entry.definition = this.lastFound[j][3];
                    entries.push(entry);
                }
                
                chrome.extension.sendRequest({
                    "type": "add",
                    "entries": entries
                });
                
                this.showPopup("Added to word list.<p>Press Alt+W to open word list.", null, -1, -1);

                break;
                
            case 83:        // s
                if (this.isVisible()) {

                    // http://www.skritter.com/vocab/api/add?from=Chrome&lang=zh&word=浏览&trad=瀏 覽&rdng=liú lǎn&defn=to skim over; to browse
                
                    var skritter = 'http://legacy.skritter.com';
                    if (window.zhongwen.config.skritterTLD == 'cn') {
                        skritter = 'http://legacy.skritter.cn';
                    }

                    skritter +=
                    '/vocab/api/add?from=Zhongwen&siteref=Zhongwen&lang=zh&word=' +
                    encodeURIComponent(this.lastFound[0][0]) +
                    '&trad=' + encodeURIComponent(this.lastFound[0][1]) +
                    '&rdng=' + encodeURIComponent(this.lastFound[0][4]) +
                    '&defn=' + encodeURIComponent(this.lastFound[0][3]);

                    chrome.extension.sendRequest({
                        type: 'open',
                        tabType: 'skritter',
                        url: skritter
                    });
                }
                break;

            case 84:     // t
                if (this.isVisible()) {
                    var sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=%E8%BF%9B%E8%A1%8C
                    var tatoeba = 'http://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: tatoeba
                    });
                }
                break;

            case 88:        // x
                this.altView = 0;
                window.zhongwen.popY -= 20;
                this.show(window.zhongwen);
                break;
            case 89:        // y
                this.altView = 0;
                window.zhongwen.popY += 20;
                this.show(window.zhongwen);
                break;

            case 49:     // 1
                if (ev.altKey) {
                    var sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://www.nciku.com/search/all/%E4%B8%AD
                    var nciku = 'http://www.nciku.com/search/all/' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: nciku
                    });
                }
                break;
            case 50:     // 2
                if (ev.altKey) {
                    sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://www.yellowbridge.com/chinese/wordsearch.php?searchMode=C&word=%E4%B8%AD
                    var yellow = 'http://www.yellowbridge.com/chinese/wordsearch.php?searchMode=C&word=' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: yellow
                    });
                }
                break;
            case 51:     // 3
                if (ev.altKey) {
                    sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://dict.cn/%E7%BF%BB%E8%AF%91
                    var dictcn = 'http://dict.cn/' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: dictcn
                    });
                }
                break;
            case 52:     // 4
                if (ev.altKey) {
                    sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://www.iciba.com/%E4%B8%AD%E9%A4%90
                    var iciba = 'http://www.iciba.com/' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: iciba
                    });
                }
                break;
            case 53:     // 5
                if (ev.altKey) {
                    sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://www.mdbg.net/chindict/chindict.php?page=worddict&wdrst=0&wdqb=%E6%B0%B4
                    var mdbg = 'http://www.mdbg.net/chindict/chindict.php?page=worddict&wdrst=0&wdqb=' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: mdbg
                    });
                }
                break;
            case 54:     // 6
                if (ev.altKey) {
                    sel = encodeURIComponent(
                        window.getSelection().toString());

                    // http://jukuu.com/show-%E8%AF%8D%E5%85%B8-0.html
                    var jukuu = 'http://jukuu.com/show-' + sel + '-0.html';

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: jukuu
                    });
                }
                break;
            case 55:     // 7
                if (ev.altKey) {
                    sel = encodeURIComponent(
                        window.getSelection().toString());

                    // https://www.moedict.tw/~%E4%B8%AD%E6%96%87
                    var moedict = 'https://www.moedict.tw/~' + sel;

                    chrome.extension.sendRequest({
                        type: 'open',
                        url: moedict
                    });
                }
                break;
            default:
                return;
        }

        if (ev.keyCode != 71 && ev.keyCode != 83 && ev.keyCode != 84 && ev.keyCode != 87 &&
            (ev.keyCode < 49 || 57 < ev.keyCode)) {
            // don't do this for opening a new Grammar, Skritter, Tatoeba or dictionary tab,
            // or the wordlist, because onKeyUp won't be called
            this.keysDown[ev.keyCode] = 1;
        }

    },

    getTexts: function() {
        var result = '';
        for (var i = 0; i < this.lastFound.length; i++) {
            result += this.lastFound[i].slice(0, -1).join('\t');
            result += '\n';
        }
        return result;
    },

    onKeyUp: function(ev) {
        if (zhongwenContent.keysDown[ev.keyCode]) zhongwenContent.keysDown[ev.keyCode] = 0;
    },

    unicodeInfo: function(c) {
        var hex = '0123456789ABCDEF';
        var u = c.charCodeAt(0);
        return c + ' U' + hex[(u >>> 12) & 15] + hex[(u >>> 8) & 15] + hex[(u >>> 4) & 15] + hex[u & 15];
    },

    // Gets text from a node
    // returns a string
    // node: a node
    // selEnd: the selection end object will be changed as a side effect
    // maxLength: the maximum length of returned string
    // xpathExpr: an XPath expression, which evaluates to text nodes, will be evaluated
    // relative to "node" argument
    getInlineText: function (node, selEndList, maxLength) {
        var endIndex;

        if (node.nodeName == '#text') {
            endIndex = Math.min(maxLength, node.data.length);
            selEndList.push({
                node: node,
                offset: endIndex
            });
            return node.data.substring(0, endIndex);
        } else {
            return '';
        }
    },

    getTextFromRange: function (rangeParent, offset, selEndList, maxLength) {
        var text = '';
        var endIndex;

        if (rangeParent.nodeType != Node.TEXT_NODE) {
            return '';
        }

        endIndex = Math.min(rangeParent.data.length, offset + maxLength);
        text += rangeParent.data.substring(offset, endIndex);
        selEndList.push( {
            node: rangeParent,
            offset: endIndex
        } );

        var nextNode = rangeParent;
        while (((nextNode = this.findNextTextNode(nextNode.parentNode, nextNode)) != null) && (text.length < maxLength)) {
            text += this.getInlineText(nextNode, selEndList, maxLength - text.length);
        }

        return text;
    },

    show: function(tdata, backwards) {

        var rp = tdata.prevRangeNode;
        var ro = tdata.prevRangeOfs + tdata.uofs;
        var u;

        tdata.uofsNext = 1;

        if (!rp) {
            this.clearHi();
            this.hidePopup();
            return 1;
        }

        if ((ro < 0) || (ro >= rp.data.length)) {
            this.clearHi();
            this.hidePopup();
            return 2;
        }

        // if we have '   XYZ', where whitespace is compressed, X never seems to get selected
        while (((u = rp.data.charCodeAt(ro)) == 32) || (u == 9) || (u == 10) || (u == 13)) {
            if (!backwards) {
                ++ro;
            } else {
                --ro;
            }
            if (ro < 0 || rp.data.length <= ro) {
                this.clearHi();
                this.hidePopup();
                return 2;
            }
        }

        if ((isNaN(u)) ||
            ((u != 0x25CB) &&
                ((u < 0x3400) || (u > 0x9FFF)) &&
                ((u < 0xF900) || (u > 0xFAFF)) &&
                ((u < 0xFF21) || (u > 0xFF3A)) &&
                ((u < 0xFF41) || (u > 0xFF5A)))) {
            this.clearHi();
            this.hidePopup();
            return 3;
        }

        //selection end data
        var selEndList = [];
        var text = this.getTextFromRange(rp, ro, selEndList, 30 /*maxlength*/);

        lastSelEnd = selEndList;
        lastRo = ro;
        chrome.extension.sendRequest({
            "type": "search",
            "text": text
        },
        zhongwenContent.processEntry);

        return 0;

    },

    processEntry: function(e) {

        var tdata = window.zhongwen;

        var ro = lastRo;

        var selEndList = lastSelEnd;

        if (!e) {
            zhongwenContent.hidePopup();
            zhongwenContent.clearHi();
            return -1;
        }

        if (!e.matchLen) e.matchLen = 1;
        tdata.uofsNext = e.matchLen;
        tdata.uofs = (ro - tdata.prevRangeOfs);

        var rp = tdata.prevRangeNode;
        // don't try to highlight form elements
        if (!('form' in tdata.prevTarget)) {
            var doc = rp.ownerDocument;
            if (!doc) {
                zhongwenContent.clearHi();
                zhongwenContent.hidePopup();
                return 0;
            }
            zhongwenContent.highlightMatch(doc, rp, ro, e.matchLen, selEndList, tdata);
            tdata.prevSelView = doc.defaultView;
        }

        zhongwenContent.processHtml(zhongwenContent.makeHtml(e, window.zhongwen.config.tonecolors != 'no'));
    },

    processHtml: function(html) {
        var tdata = window.zhongwen;
        zhongwenContent.showPopup(html, tdata.prevTarget, tdata.popX, tdata.popY, false);
        return 1;
    },

    debugObject: function(name, obj) {
        var debugstr = name + '=\n';
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                debugstr = debugstr + " " + prop + "=" + obj[prop] + "\n";
            }
        }
        console.log(debugstr);
    },

    highlightMatch: function (doc, rp, ro, matchLen, selEndList, tdata) {
        if (selEndList == undefined || selEndList.length === 0) return;

        var selEnd;
        var offset = matchLen + ro;

        for (var i = 0, len = selEndList.length; i < len; i++) {
            selEnd = selEndList[i]
            if (offset <= selEnd.offset) break;
            offset -= selEnd.offset;
        }

        var range = doc.createRange();
        range.setStart(rp, ro);
        range.setEnd(selEnd.node, offset);

        var sel = doc.defaultView.getSelection();
        if ((!sel.isCollapsed) && (tdata.selText != sel.toString()))
            return;
        sel.removeAllRanges();
        sel.addRange(range);
        tdata.selText = sel.toString();
    },

    getFirstTextChild: function(node) {
        var nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT, null);
        return nodeIterator.nextNode();
    },

    makeDiv: function(input) {
        var div = document.createElement('div');
        
        div.id = '_zhongwenDiv';
        
        var text;
        if (input.value) {
            text = input.value;
        } else if (input.nodeName == 'IFRAME') {
            // gmail
            text = $(input.contentDocument).find('body').html();
        } else {
            text = '';
        }
        div.innerHTML = text;

        div.style.cssText = document.defaultView.getComputedStyle(input, "").cssText;
        div.scrollTop = input.scrollTop;
        div.scrollLeft = input.scrollLeft;
        div.style.position = "absolute";
        div.style.zIndex = 7000;
        $(div).offset({
            top: $(input).offset().top, 
            left: $(input).offset().left
        })
		
        return div;
    },

    onMouseMove:
    function(ev) {
        zhongwenContent._onMouseMove(ev);
    },
    _onMouseMove: function(ev) {
        var tdata = window.zhongwen;        // per-tab data

        if(ev.target.nodeName == 'TEXTAREA' || ev.target.nodeName == 'INPUT'
            || ev.target.nodeName == 'DIV' || ev.target.nodeName == 'IFRAME') {

            var div = document.getElementById('_zhongwenDiv');

            if (ev.altKey) {
                
                if (!div && (ev.target.nodeName == 'TEXTAREA' || ev.target.nodeName == 'INPUT' ||
                    ev.target.nodeName == 'IFRAME')) {
                
                    div = zhongwenContent.makeDiv(ev.target);
                    document.body.appendChild(div);
                    div.scrollTop = ev.target.scrollTop;
                    div.scrollLeft = ev.target.scrollLeft;
                
                }
                
            } else {
                
                if (div) {
                    document.body.removeChild(div);
                }
                
            }

        }

        if (tdata.clientX && tdata.clientY) {
            if (ev.clientX == tdata.clientX && ev.clientY == tdata.clientY) {
                return;
            }
        }
        tdata.clientX = ev.clientX;
        tdata.clientY = ev.clientY;

        var range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
        if (range == null) return;
        var rp = range.startContainer;
        var ro = range.startOffset;

        if (ev.target == tdata.prevTarget) {
            if ((rp == tdata.prevRangeNode) && (ro == tdata.prevRangeOfs)) return;
        }

        if (tdata.timer) {
            clearTimeout(tdata.timer);
            tdata.timer = null;
        }

        if((rp.data) && ro == rp.data.length) {
            rp = this.findNextTextNode(rp.parentNode, rp);
            ro = 0;
        }
        
        // The case where the text before div is empty.
        if(rp && rp.parentNode != ev.target) {
            rp = zhongwenContent.findNextTextNode(rp.parentNode, rp);
            ro=0;
        }

        // Otherwise, we're off in nowhere land and we should go home.
        else if(!(rp) || ((rp.parentNode != ev.target))){
            rp = null;
            ro = -1;

        }

        tdata.prevTarget = ev.target;
        tdata.prevRangeNode = rp;
        tdata.prevRangeOfs = ro;
        tdata.uofs = 0;
        this.uofsNext = 1;

        if ((rp) && (rp.data) && (ro < rp.data.length)) {
            tdata.popX = ev.clientX;
            tdata.popY = ev.clientY;
            tdata.timer = setTimeout(
                function() {
                    zhongwenContent.show(tdata);
                }, 50);
            return;
        }

        // Don't close just because we moved from a valid popup slightly over
        // to a place with nothing.
        var dx = tdata.popX - ev.clientX;
        var dy = tdata.popY - ev.clientY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 4) {
            this.clearHi();
            this.hidePopup();
        }
    },

    findNextTextNode : function(root, previous) {
        if (root == null) {
            return null;
        }
        var nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
        var node = nodeIterator.nextNode();
        while (node != previous) {
            node = nodeIterator.nextNode();
            if (node == null) {
                return this.findNextTextNode(root.parentNode, previous);
            }
        }
        var result = nodeIterator.nextNode();
        if (result != null) {
            return result;
        } else {
            return this.findNextTextNode(root.parentNode, previous);
        }
    },

    findPreviousTextNode : function(root, previous) {
        if (root == null) {
            return null;
        }
        var nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
        var node = nodeIterator.nextNode();
        while (node != previous) {
            node = nodeIterator.nextNode();
            if (node == null) {
                return this.findPreviousTextNode(root.parentNode, previous);
            }
        }
        nodeIterator.previousNode();
        var result = nodeIterator.previousNode();
        if (result != null) {
            return result;
        } else {
            return this.findPreviousTextNode(root.parentNode, previous);
        }
    },

    copyToClipboard : function(data) {
        chrome.extension.sendRequest({
            "type": "copy",
            "data": data
        });

        this.showPopup("Copied to clipboard", null, -1, -1);
    },

    makeHtml: function(entry, showToneColors) {

        var e;
        var html = '';
        var texts = [];

        if (entry == null) return '';

        for (var i = 0; i < entry.data.length; ++i) {
            e = entry.data[i][0].match(/^([^\s]+?)\s+([^\s]+?)\s+\[(.*?)\]?\s*\/(.+)\//);
            if (!e) continue;

            // Hanzi

            var hanziClass = 'w-hanzi';
            if (window.zhongwen.config.fontSize == 'small') {
                hanziClass += '-small';
            }
            html += '<span class="' + hanziClass + '">' + e[2] + '</span>&nbsp;';
            if (e[1] != e[2]) {
                html += '<span class="' + hanziClass + '">' + e[1] + '</span>&nbsp;';
            }

            // Pinyin

            var pinyinClass = 'w-pinyin';
            if (window.zhongwen.config.fontSize == 'small') {
                pinyinClass += '-small';
            }
            var p = this.pinyinAndZhuyin(e[3], showToneColors, pinyinClass);
            html += p[0];

            // Zhuyin

            if (window.zhongwen.config.zhuyin == 'yes') {
                html += '<br>' + p[2];
            }

            // Definition

            var defClass = 'w-def';
            if (window.zhongwen.config.fontSize == 'small') {
                defClass += '-small';
            }
            var translation = e[4].replace(/\//g, '; ');
            html += '<br><span class="' + defClass + '">' + translation + '</span><br>';

            // Grammar
            if (window.zhongwen.config.grammar != 'no' && entry.grammar && entry.grammar.index == i) {
                html += '<br><span class="grammar">Press "g" for grammar and usage notes.</span><br><br>'
            }

            texts[i] = [e[2], e[1], p[1], translation, e[3]];
        }
        if (entry.more) {
            html += '&hellip;<br/>';
        }

        this.lastFound = texts;
        this.lastFound.grammar = entry.grammar;

        return html;
    },

    tones : {
        1 : '&#772;',
        2 : '&#769;',
        3: '&#780;',
        4: '&#768;',
        5: ''
    },

    utones : {
        1 : '\u0304',
        2 : '\u0301',
        3 : '\u030C',
        4 : '\u0300',
        5: ''
    },

    parse: function(s) {
        var m = s.match(/([^AEIOU:aeiou:]*)([AEIOUaeiou:]+)([^aeiou:]*)([1-5])/);
        return m;
    },

    tonify: function(vowels, tone) {
        var html = '';
        var text = '';

        if (vowels == 'ou') {
            html = 'o' + this.tones[tone] + 'u';
            text = 'o' + this.utones[tone] + 'u'
        } else {
            var tonified = false;
            for (var i = 0; i < vowels.length; i++) {
                var c = vowels.charAt(i);
                html += c;
                text += c;
                if (c == 'a' || c == 'e') {
                    html += this.tones[tone];
                    text += this.utones[tone];
                    tonified = true;
                } else if ((i == vowels.length - 1) && !tonified) {
                    html += this.tones[tone];
                    text += this.utones[tone];
                    tonified = true;
                }
            }
            html = html.replace(/u:/, '&uuml;');
            text = text.replace(/u:/, '\u00FC');
        }

        return [html, text];
    },

    pinyinAndZhuyin: function(syllables, showToneColors, pinyinClass) {
        var text = '';
        var html = ''
        var zhuyin = '';
        var a = syllables.split(/[\s·]+/);
        for (var i = 0; i < a.length; i++) {
            var syllable = a[i];
            
            // ',' in pinyin
            if (syllable == ',') {
                html += ' ,';
                text += ' ,';
                continue;
            }
            
            if (i > 0) {
                html += '&nbsp;';
                text += ' ';
                zhuyin += '&nbsp;'
            }
            if (syllable == 'r5') {
                if (showToneColors) {
                    html += '<span class="' + pinyinClass + ' tone5">r</span>';
                } else {
                    html += '<span class="' + pinyinClass + '">r</span>';
                }
                text += 'r';
                continue;
            }
            if (syllable == 'xx5') {
                if (showToneColors) {
                    html += '<span class="' + pinyinClass + ' tone5">??</span>';
                } else {
                    html += '<span class="' + pinyinClass + '">??</span>';
                }
                text += '??';
                continue;
            }
            var m = this.parse(syllable);
            if (showToneColors) {
                html += '<span class="' + pinyinClass + ' tone' + m[4] + '">';
            } else {
                html += '<span class="' + pinyinClass + '">';
            }
            var t = this.tonify(m[2], m[4]);
            html += m[1] + t[0] + m[3];
            html += '</span>';
            text += m[1] + t[1] + m[3];
            
            var zhuyinClass = 'w-zhuyin';
            if (window.zhongwen.config.fontSize == 'small') {
                zhuyinClass += '-small';
            }
            
            zhuyin += '<span class="tone' + m[4] + ' ' + zhuyinClass + '">' 
            + this.zhuyinMap[syllable.substring(0, syllable.length -1).toLowerCase()] 
            + this.zhuyinTones[syllable[syllable.length - 1]] + '</span>'
        }
        return [html, text, zhuyin]
    },
    
    zhuyinTones : ['?', '', '\u02CA', '\u02C7', '\u02CB', '\u30FB'],
    
    zhuyinMap : {
        'a': '\u311a',
        'ai': '\u311e',
        'an': '\u3122',
        'ang': '\u3124',
        'ao': '\u3120',
        'ba': '\u3105\u311a',
        'bai': '\u3105\u311e',
        'ban': '\u3105\u3122',
        'bang': '\u3105\u3124',
        'bao': '\u3105\u3120',
        'bei': '\u3105\u311f',
        'ben': '\u3105\u3123',
        'beng': '\u3105\u3125',
        'bi': '\u3105\u3127',
        'bian': '\u3105\u3127\u3122',
        'biao': '\u3105\u3127\u3120',
        'bie': '\u3105\u3127\u311d',
        'bin': '\u3105\u3127\u3123',
        'bing': '\u3105\u3127\u3125',
        'bo': '\u3105\u311b',
        'bu': '\u3105\u3128',
        'ca': '\u3118\u311a',
        'cai': '\u3118\u311e',
        'can': '\u3118\u3122',
        'cang': '\u3118\u3124',
        'cao': '\u3118\u3120',
        'ce': '\u3118\u311c',
        'cen': '\u3118\u3123',
        'ceng': '\u3118\u3125',
        'cha': '\u3114\u311a',
        'chai': '\u3114\u311e',
        'chan': '\u3114\u3122',
        'chang': '\u3114\u3124',
        'chao': '\u3114\u3120',
        'che': '\u3114\u311c',
        'chen': '\u3114\u3123',
        'cheng': '\u3114\u3125',
        'chi': '\u3114',
        'chong': '\u3114\u3128\u3125',
        'chou': '\u3114\u3121',
        'chu': '\u3114\u3128',
        'chua': '\u3114\u3128\u311a',
        'chuai': '\u3114\u3128\u311e',
        'chuan': '\u3114\u3128\u3122',
        'chuang': '\u3114\u3128\u3124',
        'chui': '\u3114\u3128\u311f',
        'chun': '\u3114\u3128\u3123',
        'chuo': '\u3114\u3128\u311b',
        'ci': '\u3118',
        'cong': '\u3118\u3128\u3125',
        'cou': '\u3118\u3121',
        'cu': '\u3118\u3128',
        'cuan': '\u3118\u3128\u3122',
        'cui': '\u3118\u3128\u311f',
        'cun': '\u3118\u3128\u3123',
        'cuo': '\u3118\u3128\u311b',
        'da': '\u3109\u311a',
        'dai': '\u3109\u311e',
        'dan': '\u3109\u3122',
        'dang': '\u3109\u3124',
        'dao': '\u3109\u3120',
        'de': '\u3109\u311c',
        'dei': '\u3109\u311f',
        'den': '\u3109\u3123',
        'deng': '\u3109\u3125',
        'di': '\u3109\u3127',
        'dian': '\u3109\u3127\u3122',
        'diang': '\u3109\u3127\u3124',
        'diao': '\u3109\u3127\u3120',
        'die': '\u3109\u3127\u311d',
        'ding': '\u3109\u3127\u3125',
        'diu': '\u3109\u3127\u3121',
        'dong': '\u3109\u3128\u3125',
        'dou': '\u3109\u3121',
        'du': '\u3109\u3128',
        'duan': '\u3109\u3128\u3122',
        'dui': '\u3109\u3128\u311f',
        'dun': '\u3109\u3128\u3123',
        'duo': '\u3109\u3128\u311b',
        'e': '\u311c',
        'ei': '\u311f',
        'en': '\u3123',
        'er': '\u3126',
        'fa': '\u3108\u311a',
        'fan': '\u3108\u3122',
        'fang': '\u3108\u3124',
        'fei': '\u3108\u311f',
        'fen': '\u3108\u3123',
        'feng': '\u3108\u3125',
        'fo': '\u3108\u311b',
        'fou': '\u3108\u3121',
        'fu': '\u3108\u3128',
        'ga': '\u310d\u311a',
        'gai': '\u310d\u311e',
        'gan': '\u310d\u3122',
        'gang': '\u310d\u3124',
        'gao': '\u310d\u3120',
        'ge': '\u310d\u311c',
        'gei': '\u310d\u311f',
        'gen': '\u310d\u3123',
        'geng': '\u310d\u3125',
        'gong': '\u310d\u3128\u3125',
        'gou': '\u310d\u3121',
        'gu': '\u310d\u3128',
        'gua': '\u310d\u3128\u311a',
        'guai': '\u310d\u3128\u311e',
        'guan': '\u310d\u3128\u3122',
        'guang': '\u310d\u3128\u3124',
        'gui': '\u310d\u3128\u311f',
        'gun': '\u310d\u3128\u3123',
        'guo': '\u310d\u3128\u311b',
        'ha': '\u310f\u311a',
        'hai': '\u310f\u311e',
        'han': '\u310f\u3122',
        'hang': '\u310f\u3124',
        'hao': '\u310f\u3120',
        'he': '\u310f\u311c',
        'hei': '\u310f\u311f',
        'hen': '\u310f\u3123',
        'heng': '\u310f\u3125',
        'hong': '\u310f\u3128\u3125',
        'hou': '\u310f\u3121',
        'hu': '\u310f\u3128',
        'hua': '\u310f\u3128\u311a',
        'huai': '\u310f\u3128\u311e',
        'huan': '\u310f\u3128\u3122',
        'huang': '\u310f\u3128\u3124',
        'hui': '\u310f\u3128\u311f',
        'hun': '\u310f\u3128\u3123',
        'huo': '\u310f\u3128\u311b',
        'ji': '\u3110\u3127',
        'jia': '\u3110\u3127\u311a',
        'jian': '\u3110\u3127\u3122',
        'jiang': '\u3110\u3127\u3124',
        'jiao': '\u3110\u3127\u3120',
        'jie': '\u3110\u3127\u311d',
        'jin': '\u3110\u3127\u3123',
        'jing': '\u3110\u3127\u3125',
        'jiong': '\u3110\u3129\u3125',
        'jiu': '\u3110\u3127\u3121',
        'ju': '\u3110\u3129',
        'juan': '\u3110\u3129\u3122',
        'jue': '\u3110\u3129\u311d',
        'jun': '\u3110\u3129\u3123',
        'ka': '\u310e\u311a',
        'kai': '\u310e\u311e',
        'kan': '\u310e\u3122',
        'kang': '\u310e\u3124',
        'kao': '\u310e\u3120',
        'ke': '\u310e\u311c',
        'ken': '\u310e\u3123',
        'keng': '\u310e\u3125',
        'kong': '\u310e\u3128\u3125',
        'kou': '\u310e\u3121',
        'ku': '\u310e\u3128',
        'kua': '\u310e\u3128\u311a',
        'kuai': '\u310e\u3128\u311e',
        'kuan': '\u310e\u3128\u3122',
        'kuang': '\u310e\u3128\u3124',
        'kui': '\u310e\u3128\u311f',
        'kun': '\u310e\u3128\u3123',
        'kuo': '\u310e\u3128\u311b',
        'la': '\u310c\u311a',
        'lai': '\u310c\u311e',
        'lan': '\u310c\u3122',
        'lang': '\u310c\u3124',
        'lao': '\u310c\u3120',
        'le': '\u310c\u311c',
        'lei': '\u310c\u311f',
        'leng': '\u310c\u3125',
        'li': '\u310c\u3127',
        'lia': '\u310c\u3127\u311a',
        'lian': '\u310c\u3127\u3122',
        'liang': '\u310c\u3127\u3124',
        'liao': '\u310c\u3127\u3120',
        'lie': '\u310c\u3127\u311d',
        'lin': '\u310c\u3127\u3123',
        'ling': '\u310c\u3127\u3125',
        'liu': '\u310c\u3127\u3121',
        'lo': '\u310c\u311b',
        'long': '\u310c\u3128\u3125',
        'lou': '\u310c\u3121',
        'lu': '\u310c\u3128',
        'l': '\u310c\u3128\u3122',
        'luan': '\u310c\u3128\u3123',
        'le': '\u310c\u3128\u311b',
        'lun': '\u310c\u3129',
        'ln': '\u310c\u3129\u311d',
        'luo': '\u310c\u3129\u3123',
        'ma': '\u3107\u311a',
        'mai': '\u3107\u311e',
        'man': '\u3107\u3122',
        'mang': '\u3107\u3124',
        'mao': '\u3107\u3120',
        'me': '\u3107\u311c',
        'mei': '\u3107\u311f',
        'men': '\u3107\u3123',
        'meng': '\u3107\u3125',
        'mi': '\u3107\u3127',
        'mian': '\u3107\u3127\u3122',
        'miao': '\u3107\u3127\u3120',
        'mie': '\u3107\u3127\u311d',
        'min': '\u3107\u3127\u3123',
        'ming': '\u3107\u3127\u3125',
        'miu': '\u3107\u3127\u3121',
        'mo': '\u3107\u311b',
        'mou': '\u3107\u3121',
        'mu': '\u3107\u3128',
        'na': '\u310b\u311a',
        'nai': '\u310b\u311e',
        'nan': '\u310b\u3122',
        'nang': '\u310b\u3124',
        'nao': '\u310b\u3120',
        'ne': '\u310b\u311c',
        'nei': '\u310b\u311f',
        'nen': '\u310b\u3123',
        'neng': '\u310b\u3125',
        'ni': '\u310b\u3127',
        'nia': '\u310b\u3127\u311a',
        'nian': '\u310b\u3127\u3122',
        'niang': '\u310b\u3127\u3124',
        'niao': '\u310b\u3127\u3120',
        'nie': '\u310b\u3127\u311d',
        'nin': '\u310b\u3127\u3123',
        'ning': '\u310b\u3127\u3125',
        'niu': '\u310b\u3127\u3121',
        'nong': '\u310b\u3128\u3125',
        'nou': '\u310b\u3121',
        'nu': '\u310b\u3128',
        'n': '\u310b\u3128\u3122',
        'nuan': '\u310b\u3128\u3123',
        'ne': '\u310b\u3128\u311b',
        'nun': '\u310b\u3129',
        'nuo': '\u310b\u3129\u311d',
        'ou': '\u3121',
        'pa': '\u3106\u311a',
        'pai': '\u3106\u311e',
        'pan': '\u3106\u3122',
        'pang': '\u3106\u3124',
        'pao': '\u3106\u3120',
        'pei': '\u3106\u311f',
        'pen': '\u3106\u3123',
        'peng': '\u3106\u3125',
        'pi': '\u3106\u3127',
        'pian': '\u3106\u3127\u3122',
        'piao': '\u3106\u3127\u3120',
        'pie': '\u3106\u3127\u311d',
        'pin': '\u3106\u3127\u3123',
        'ping': '\u3106\u3127\u3125',
        'po': '\u3106\u311b',
        'pou': '\u3106\u3121',
        'pu': '\u3106\u3128',
        'qi': '\u3111\u3127',
        'qia': '\u3111\u3127\u311a',
        'qian': '\u3111\u3127\u3122',
        'qiang': '\u3111\u3127\u3124',
        'qiao': '\u3111\u3127\u3120',
        'qie': '\u3111\u3127\u311d',
        'qin': '\u3111\u3127\u3123',
        'qing': '\u3111\u3127\u3125',
        'qiong': '\u3111\u3129\u3125',
        'qiu': '\u3111\u3127\u3121',
        'qu': '\u3111\u3129',
        'quan': '\u3111\u3129\u3122',
        'que': '\u3111\u3129\u311d',
        'qun': '\u3111\u3129\u3123',
        'ran': '\u3116\u3122',
        'rang': '\u3116\u3124',
        'rao': '\u3116\u3120',
        're': '\u3116\u311c',
        'ren': '\u3116\u3123',
        'reng': '\u3116\u3125',
        'ri': '\u3116',
        'rong': '\u3116\u3128\u3125',
        'rou': '\u3116\u3121',
        'ru': '\u3116\u3128',
        'ruan': '\u3116\u3128\u3122',
        'rui': '\u3116\u3128\u311f',
        'run': '\u3116\u3128\u3123',
        'ruo': '\u3116\u3128\u311b',
        'sa': '\u3119\u311a',
        'sai': '\u3119\u311e',
        'san': '\u3119\u3122',
        'sang': '\u3119\u3124',
        'sao': '\u3119\u3120',
        'se': '\u3119\u311c',
        'sei': '\u3119\u311f',
        'sen': '\u3119\u3123',
        'seng': '\u3119\u3125',
        'sha': '\u3115\u311a',
        'shai': '\u3115\u311e',
        'shan': '\u3115\u3122',
        'shang': '\u3115\u3124',
        'shao': '\u3115\u3120',
        'she': '\u3115\u311c',
        'shei': '\u3115\u311f',
        'shen': '\u3115\u3123',
        'sheng': '\u3115\u3125',
        'shi': '\u3115',
        'shong': '\u3115\u3128\u3125',
        'shou': '\u3115\u3121',
        'shu': '\u3115\u3128',
        'shua': '\u3115\u3128\u311a',
        'shuai': '\u3115\u3128\u311e',
        'shuan': '\u3115\u3128\u3122',
        'shuang': '\u3115\u3128\u3124',
        'shui': '\u3115\u3128\u311f',
        'shun': '\u3115\u3128\u3123',
        'shuo': '\u3115\u3128\u311b',
        'si': '\u3119',
        'song': '\u3119\u3128\u3125',
        'sou': '\u3119\u3121',
        'su': '\u3119\u3128',
        'suan': '\u3119\u3128\u3122',
        'sui': '\u3119\u3128\u311f',
        'sun': '\u3119\u3128\u3123',
        'suo': '\u3119\u3128\u311b',
        'ta': '\u310a\u311a',
        'tai': '\u310a\u311e',
        'tan': '\u310a\u3122',
        'tang': '\u310a\u3124',
        'tao': '\u310a\u3120',
        'te': '\u310a\u311c',
        'teng': '\u310a\u3125',
        'ti': '\u310a\u3127',
        'tian': '\u310a\u3127\u3122',
        'tiao': '\u310a\u3127\u3120',
        'tie': '\u310a\u3127\u311d',
        'ting': '\u310a\u3127\u3125',
        'tong': '\u310a\u3128\u3125',
        'tou': '\u310a\u3121',
        'tu': '\u310a\u3128',
        'tuan': '\u310a\u3128\u3122',
        'tui': '\u310a\u3128\u311f',
        'tun': '\u310a\u3128\u3123',
        'tuo': '\u310a\u3128\u311b',
        'wa': '\u3128\u311a',
        'wai': '\u3128\u311e',
        'wan': '\u3128\u3122',
        'wang': '\u3128\u3124',
        'wei': '\u3128\u311f',
        'wen': '\u3128\u3123',
        'weng': '\u3128\u3125',
        'wo': '\u3128\u311b',
        'wu': '\u3128',
        'xi': '\u3112\u3127',
        'xia': '\u3112\u3127\u311a',
        'xian': '\u3112\u3127\u3122',
        'xiang': '\u3112\u3127\u3124',
        'xiao': '\u3112\u3127\u3120',
        'xie': '\u3112\u3127\u311d',
        'xin': '\u3112\u3127\u3123',
        'xing': '\u3112\u3127\u3125',
        'xiong': '\u3112\u3129\u3125',
        'xiu': '\u3112\u3127\u3121',
        'xu': '\u3112\u3129',
        'xuan': '\u3112\u3129\u3122',
        'xue': '\u3112\u3129\u311d',
        'xun': '\u3112\u3129\u3123',
        'ya': '\u3127\u311a',
        'yan': '\u3127\u3122',
        'yang': '\u3127\u3124',
        'yao': '\u3127\u3120',
        'ye': '\u3127\u311d',
        'yi': '\u3127',
        'yin': '\u3127\u3123',
        'ying': '\u3127\u3125',
        'yong': '\u3129\u3125',
        'you': '\u3127\u3121',
        'yu': '\u3129',
        'yuan': '\u3129\u3122',
        'yue': '\u3129\u311d',
        'yun': '\u3129\u3123',
        'za': '\u3117\u311a',
        'zai': '\u3117\u311e',
        'zan': '\u3117\u3122',
        'zang': '\u3117\u3124',
        'zao': '\u3117\u3120',
        'ze': '\u3117\u311c',
        'zei': '\u3117\u311f',
        'zen': '\u3117\u3123',
        'zeng': '\u3117\u3125',
        'zha': '\u3113\u311a',
        'zhai': '\u3113\u311e',
        'zhan': '\u3113\u3122',
        'zhang': '\u3113\u3124',
        'zhao': '\u3113\u3120',
        'zhe': '\u3113\u311c',
        'zhei': '\u3113\u311f',
        'zhen': '\u3113\u3123',
        'zheng': '\u3113\u3125',
        'zhi': '\u3113',
        'zhong': '\u3113\u3128\u3125',
        'zhou': '\u3113\u3121',
        'zhu': '\u3113\u3128',
        'zhua': '\u3113\u3128\u311a',
        'zhuai': '\u3113\u3128\u311e',
        'zhuan': '\u3113\u3128\u3122',
        'zhuang': '\u3113\u3128\u3124',
        'zhui': '\u3113\u3128\u311f',
        'zhun': '\u3113\u3128\u3123',
        'zhuo': '\u3113\u3128\u311b',
        'zi': '\u3117',
        'zong': '\u3117\u3128\u3125',
        'zou': '\u3117\u3121',
        'zu': '\u3117\u3128',
        'zuan': '\u3117\u3128\u3122',
        'zui': '\u3117\u3128\u311f',
        'zun': '\u3117\u3128\u3123',
        'zuo': '\u3117\u3128\u311b'
    }
}

//Event Listeners
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        switch(request.type) {
            case 'enable':
                zhongwenContent.enableTab();
                window.zhongwen.config = request.config;
                break;
            case 'disable':
                zhongwenContent.disableTab();
                break;
            case 'showPopup':
                if (!request.isHelp || window == window.top) { 
                    zhongwenContent.showPopup(request.text);
                }
                break;
            default:
        }
    }
    );

// When a page first loads, checks to see if it should enable script
chrome.extension.sendRequest({
    "type": "enable?"
});
