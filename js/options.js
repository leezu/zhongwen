/*
        Zhongwen - A Chinese-English Popup Dictionary
        Copyright (C) 2012 Christian Schiller
        https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
*/

function loadVals() {
    var storedValue = localStorage['popupcolor'];
    for (var i = 0; i < document.optform.popupcolor.length; i++) {
        if(document.optform.popupcolor[i].value == storedValue) {
            document.optform.popupcolor[i].selected = true;
            break;
        }
    }

    storedValue = localStorage['tonecolors'];
    if(storedValue == 'no') {
        document.optform.tonecolors[1].selected = true;
    }
    else {
        document.optform.tonecolors[0].selected = true;
    }

    storedValue = localStorage['fontSize'];
    if(storedValue == 'small') {
        document.optform.fontSize[1].selected = true;
    }
    else {
        document.optform.fontSize[0].selected = true;
    }

    storedValue = localStorage['skritterTLD'];
    if(storedValue == 'cn') {
        document.optform.skritterTLD[1].selected = true;
    }
    else {
        document.optform.skritterTLD[0].selected = true;
    }
        
    storedValue = localStorage['zhuyin'];
    if(storedValue == 'yes') {
        document.optform.zhuyin[1].selected = true;
    }
    else {
        document.optform.zhuyin[0].selected = true;
    }

    storedValue = localStorage['grammar'];
    if(storedValue == 'no') {
        document.optform.grammar[1].selected = true;
    }
    else {
        document.optform.grammar[0].selected = true;
    }

    storedValue = localStorage['simpTrad'];
    if(storedValue == 'auto') {
        document.optform.simpTrad[1].selected = true;
    }
    else {
        document.optform.simpTrad[0].selected = true;
    }
}

function storeVals() {
    localStorage['popupcolor'] = document.optform.popupcolor.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.css = localStorage['popupcolor'];

    localStorage['tonecolors'] = document.optform.tonecolors.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.tonecolors = localStorage['tonecolors'];

    localStorage['fontSize'] = document.optform.fontSize.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.fontSize = localStorage['fontSize'];

    localStorage['skritterTLD'] = document.optform.skritterTLD.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.skritterTLD = localStorage['skritterTLD'];

    localStorage['zhuyin'] = document.optform.zhuyin.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.zhuyin = localStorage['zhuyin'];

    localStorage['grammar'] = document.optform.grammar.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.grammar = localStorage['grammar'];

    localStorage['simpTrad'] = document.optform.simpTrad.value;
    chrome.extension.getBackgroundPage().zhongwenMain.config.simpTrad = localStorage['simpTrad'];

}

$(function() {
    $('#save').click(storeVals);
});

window.onload = loadVals;

