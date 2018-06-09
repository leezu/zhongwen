/*
        Zhongwen - Ein Chinesisch-Deutsch Popup-Wörterbuch
        Original Work Copyright (C) 2011-2013 Christian Schiller
        https://chrome.google.com/webstore/detail/jjkbnbgakjgfiajfkifdbhbfmjgmddeh
        German version of the Chinese-English Zhongwen Popup-Dictionary
        https://chrome.google.com/webstore/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
        Modified work Copyright (C) 2017 Leonard Lausen
        https://github.com/leezu/zhongwen
*/

var wlstring = localStorage['wordlist'];

var entries;
if (wlstring) {
  entries = JSON.parse(wlstring);
} else {
  entries = [];
}

$(function() {

  $('#words').jqGrid({
    data: entries,
    datatype: 'local',
    colNames: ['Simplified', 'Traditional',
      'Pinyin', 'Definition'
    ],
    colModel: [{
        name: 'simplified',
        index: 'simplified'
      },

      {
        name: 'traditional',
        index: 'traditional'
      },

      {
        name: 'pinyin',
        index: 'pinyin'
      },

      {
        name: 'definition',
        index: 'definition',
        cellattr: function(rowId, tv, rawObject,
          cm, rdata) {
          return 'style="white-space: normal;'
        }
      },
    ],
    multiselect: true,
    rowNum: 1000,
    rowList: [10, 20, 30],
    viewrecords: true,
    gridview: true,
    caption: 'Zhongwen: My Words',
    autowidth: true,
    height: '100%',
    emptyrecords: "No words",
    loadui: 'disable'
  });

  $('#savebutton').click(function(e) {
    var selected = jQuery("#words").getGridParam(
      'selarrrow');

    selected.sort();

    var set = {};
    for (var i in selected) {
      set[selected[i]] = 1;
    }

    var content = '';
    for (i in entries) {
      var entry_id = entries[i].id;
      if (set[entry_id]) {
        var entry = entries[i];
        content += entry.simplified;
        content += '\t';
        content += entry.traditional;
        content += '\t';
        content += entry.pinyin;
        content += '\t';
        content += entry.definition;
        content += '\r\n';
      }
    }

    var saveBlob = new Blob([content], {
      "type": "text/plain"
    });
    window.URL = window.URL || window.webkitURL; // Support Firefox & Chrome
    url = window.URL.createObjectURL(saveBlob);

    function onStartedDownload(id) {
      console.log(`Started downloading: ${id}`);
    }

    function onFailed(error) {
      console.log(`Download failed: ${error}`);
    }

    var downloading = browser.downloads.download({
      url: url,
      filename: "zhongwen-words.txt",
      conflictAction: 'uniquify',
      saveAs: true
    });
    downloading.then(onStartedDownload, onFailed);
  });

  $('#delete').click(function(e) {
    var selected = jQuery("#words").getGridParam(
      'selarrrow');

    selected.sort();

    var set = {};
    for (var i in selected) {
      set[selected[i]] = 1;
    }

    var toKeep = [];
    for (i in entries) {
      var entry_id = entries[i].id;
      if (!set[entry_id]) {
        toKeep.push(entries[i]);
      }
    }

    localStorage['wordlist'] = JSON.stringify(
      toKeep);

    location.reload(true);
  });

  $('#help').click(function(e) {
    $('#helpmsg').toggle('bounce', function() {
      if ($('#help').text() == 'Show help') {
        $('#help').text('Hide help');
      } else {
        $('#help').text('Show help');
      }
    });

  });

  if (entries.length > 0) {
    $('#nodata').hide();
    $('#save').show();
    $('#delete').show();
    $('#help').show();
  } else {
    $('#nodata').show();
    $('#save').hide();
    $('#delete').hide();
    $('#help').hide();
  }

});
