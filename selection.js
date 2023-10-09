$(document).ready(function () {
  $('body').append('<div id="ec-bubble"><pre id="ec-bubble-text"></pre></div>');

  $(document).click(function () {
    hideBubble();
  });

  $('#ec-bubble').click(function (event) {
    event.stopPropagation();
  });

  $(document).dblclick(function (e) {
    processSelection(e);
  });

  $(document).bind('mouseup', function (e) {
    processSelection(e);
  });

});

function processSelection(e) {
  let text = getSelectedText();

  if ($.isNumeric(text) && text.length >= 10 && text.length <= 20) {
    if (text.length > 10) {  // Handle millisecond timestamps
      text = text.substring(0, 10);
    }
    var date = timestampToDate(gps2unix(text));
    showBubble(e, getLocalString(date), getUTCString(date));
  }
}

function getSelectedText() {
  var text = "";

  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== 'Control') {
    text = document.selection.createRange().text;
  }

  return text;
}

function timestampToDate(ts) {
  ts = ts.length === 13 ? parseInt(ts) : ts * 1000;
  return new Date(ts);
}

function getLocalString(date) {
  tz = date.getTimezoneOffset()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} GMT${tz < 0 ? '+' : '-'}${pad(Math.floor(tz / 60))}:${pad(tz % 60)}`
}

function getUTCString(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} GMT`
}

function pad(v) {
  return v.toString().padStart(2, '0')
}

function showBubble(e, localDateStr, utcDateStr) {
  $('#ec-bubble').css('top', e.pageY + 20 + "px");
  $('#ec-bubble').css('left', e.pageX - 85 + "px");
  $('#ec-bubble-text').html('Interpreting GPS epoch<br/>' + localDateStr + '<br/>' + utcDateStr);
  $('#ec-bubble').css('visibility', 'visible');
}

function hideBubble() {
  $('#ec-bubble').css('visibility', 'hidden');
  $('#ec-bubble-text').html('');
}

function getleaps() {
  'use strict';
  return [46828800, 78364801, 109900802, 173059203, 252028804,
          315187205, 346723206, 393984007, 425520008, 457056009, 504489610,
          551750411, 599184012, 820108813, 914803214, 1025136015, 1119744016,
          1167264017];
}

function isleap(gpsTime) {
  'use strict';

  var i, isLeap, leaps;
  isLeap = false;
  leaps = getleaps();
  for (i = 0; i < leaps.length; i += 1) {
      if (gpsTime === leaps[i]) {
          isLeap = true;
          break;
      }
  }
  return isLeap;
}

function countleaps(gpsTime, accum_leaps) {
  'use strict';

  var i, leaps, nleaps;
  leaps = getleaps();
  nleaps = 0;

  if (accum_leaps) {
      for (i = 0; i < leaps.length; i += 1) {
          if (gpsTime + i >= leaps[i]) {
              nleaps += 1;
          }
      }
  } else {
      for (i = 0; i < leaps.length; i += 1) {
          if (gpsTime >= leaps[i]) {
              nleaps += 1;
          }
      }
  }
  return nleaps;
}

function isunixtimeleap(unixTime) {
  'use strict';

  var gpsTime;
  gpsTime = unixTime - 315964800;
  gpsTime += countleaps(gpsTime, true) - 1;

  return isleap(gpsTime);
}


// Convert Unix Time to GPS Time
function unix2gps(unixTime) {
  'use strict';

  var fpart, gpsTime, ipart;

  ipart = Math.floor(unixTime);
  fpart = unixTime % 1;
  gpsTime = ipart - 315964800;

  if (isunixtimeleap(Math.ceil(unixTime))) {
      fpart *= 2;
  }

  return gpsTime + fpart + countleaps(gpsTime, true);
}

// Convert GPS Time to Unix Time
function gps2unix(gpsTime) {
  'use strict';

  var fpart, ipart, unixTime;
  fpart = gpsTime % 1;
  ipart = Math.floor(gpsTime);
  unixTime = ipart + 315964800 - countleaps(ipart, false);

  if (isleap(ipart + 1)) {
      unixTime = unixTime + fpart / 2;
  } else if (isleap(ipart)) {
      unixTime = unixTime + (fpart + 1) / 2;
  } else {
      unixTime = unixTime + fpart;
  }
  return unixTime;
}