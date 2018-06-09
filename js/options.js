/*
        Zhongwen - Ein Chinesisch-Deutsch Popup-Wörterbuch
        Original Work Copyright (C) 2011-2013 Christian Schiller
        https://chrome.google.com/webstore/detail/jjkbnbgakjgfiajfkifdbhbfmjgmddeh
        German version of the Chinese-English Zhongwen Popup-Dictionary
        https://chrome.google.com/webstore/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
        Modified work Copyright (C) 2018 Leonard Lausen
        https://github.com/leezu/zhongwen
*/

function restoreOptions() {
  var optionsPromise = browser.storage.sync.get({
    options: {
      'popupcolor': "yellow",
      'tonecolors': "yes",
      'fontSize': "small",
      'skritterTLD': "com",
      'zhuyin': "no",
      'grammar': "yes"
    }
  });
  optionsPromise.then((storage) => {
    let options = storage.options;
    for (var i = 0; i < document.optform.popupcolor.length; i++) {
      if (document.optform.popupcolor[i].value ==
        options.popupcolor) {
        document.optform.popupcolor[i].selected = true;
        break;
      }
    }

    if (options.tonecolors == 'no') {
      document.optform.tonecolors[1].selected = true;
    } else {
      document.optform.tonecolors[0].selected = true;
    }

    if (options.fontSize == 'small') {
      document.optform.fontSize[1].selected = true;
    } else {
      document.optform.fontSize[0].selected = true;
    }

    if (options.skritterTLD == 'cn') {
      document.optform.skritterTLD[1].selected = true;
    } else {
      document.optform.skritterTLD[0].selected = true;
    }

    if (options.zhuyin == 'yes') {
      document.optform.zhuyin[1].selected = true;
    } else {
      document.optform.zhuyin[0].selected = true;
    }

    if (options.grammar == 'no') {
      document.optform.grammar[1].selected = true;
    } else {
      document.optform.grammar[0].selected = true;
    }
  });
}

function saveOptions() {
  let options = {
    'popupcolor': document.optform.popupcolor.value,
    'tonecolors': document.optform.tonecolors.value,
    'fontSize': document.optform.fontSize.value,
    'skritterTLD': document.optform.skritterTLD.value,
    'zhuyin': document.optform.zhuyin.value,
    'grammar': document.optform.grammar.value
  };
  let setting = browser.storage.sync.set({
    options
  });
}

document.addEventListener('DOMContentLoaded',
  restoreOptions);
document.querySelector("form").addEventListener("submit",
  saveOptions);
