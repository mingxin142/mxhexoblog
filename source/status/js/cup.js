window.myApp = window.myApp || {};
myApp.dashboard = (function($) {
  var _template = "";
  var _loaded = 0;
  var _intervalId = 0;
  var _start = Date.now();
  var _refresh = ((typeof (__refresh) == "number") ? __refresh : 300);
  var _uptimeRanges = "";
  var _secondsToday = 0;
  var $_container = {};
  var $_lastUpdate = {};
  var $_servertitle = {};
  var showQueue = [];
  var tmpdate;
  var datestr = "";
  var _hasError = false;

  function init() {
    _start = Date.now();
    _template = $('#server-template').html();
    $_container = $('#server-container').html('');
    $_servertitle = $('#server-title').html('');
    $_lastUpdate = $('#last-update');

    $_servertitle.append("<th style=\"width:21%\"></th>");
    $_servertitle.append("<th style=\"width:9%\">近30日</th>");
    for (var d = 6; d >= 0; d--) {
      tmpdate = new Date(+ new Date() - 86400000 * d);
      datestr = (tmpdate.getMonth() + 1) + "-" + tmpdate.getDate();
      $_servertitle.append("<th style=\"width:10%\">" + datestr + "</th>");
    }
    var ranges = getUptimeRanges();
    _uptimeRanges = ranges.ranges;
    _secondsToday = ranges.secondsToday;

    _loaded = 0;
    showQueue = [];
    _hasError = false;

    for (var i in __apiKeys) {
      getUptime(__apiKeys[i], i);
    }
    _intervalId = setInterval(countdown, 1000);
  }
  function getUptimeRanges() {
    var now = +new Date();
    var midnight = +(new Date).setHours(0, 0, 0, 0);
    now = Math.floor(now / 1000);
    midnight = Math.floor(midnight / 1000);

    var r = []; // custom_uptime_ranges
    r.push((now - 86400 * 30) + '_' + now);
    r.push((midnight - 86400 * 6) + '_' + (midnight - 86400 * 5 - 1));
    r.push((midnight - 86400 * 5) + '_' + (midnight - 86400 * 4 - 1));
    r.push((midnight - 86400 * 4) + '_' + (midnight - 86400 * 3 - 1));
    r.push((midnight - 86400 * 3) + '_' + (midnight - 86400 * 2 - 1));
    r.push((midnight - 86400 * 2) + '_' + (midnight - 86400 * 1 - 1));
    r.push((midnight - 86400 * 1) + '_' + (midnight - 86400 * 0 - 1));
    if (now === midnight) now += 1;
    r.push(midnight + '_' + now);
    return { ranges: r.join('-'), secondsToday: now - midnight };
  }
  /* load uptime variables from uptimerobot
  */
  function getUptime(apikey, id) {
    $.post({
      url: 'https://api.uptimerobot.com/v2/getMonitors',
      data: 'api_key=' + apikey + '&custom_uptime_ranges=' + _uptimeRanges + '&format=json&logs=1&logs_limit=100',
      dataType: 'json',
      success: function(str) {
        var htmls = [];
        for (var i in str.monitors) {
          htmls.push(buildServerHTML(str.monitors[i]));
        }
        showQueue[id] = { id: id, htmls: htmls, shown: false };
        updatePage();
      }
    });
  }

  /* build the html */
  function buildServerHTML(data, ids) {
    data.alert = "";
    switch (parseInt(data.status, 10)) {
      case 0:
        data.statustext = "未知";
        data.statusicon = "question-sign";
        data.label = "default";
        break;
      case 1:
        data.statustext = "未知";
        data.statusicon = "question-sign";
        data.label = "default";
        break;
      case 2:
        data.statustext = "正常";
        data.statusicon = "ok";
        data.label = "success";
        data.alert = "";
        break;
      case 8:
        data.statustext = "异常";
        data.statusicon = "exclamation-sign";
        data.label = "warning";
        data.alert = "warning";
        _hasError = true;
        break;
      case 9:
        data.statustext = "故障";
        data.statusicon = "remove";
        data.label = "danger";
        data.alert = "danger";
        _hasError = true;
        break;
    }

    //make sure log is set
    var barstarttime, barendtime, period, bar = [], remainlen = 1;
    period = 86400000; // 24 hrs
    barendtime = + new Date()
    barstarttime = barendtime - period;
    if (!data.logs.length) {
      var typeid;
      switch (parseInt(data.status, 10)) {
        case 2:
          typeid = 2; //green
          break;
        case 8:
        case 9:
          typeid = 1; //red
          break;
        default:
          typeid = 0; //grey
      }
      bar.push({
        typeid: typeid,
        len: 1,
        left: barstarttime,
        right: barendtime
      });
    } else {
      var starttime = barstarttime,
          endtime = barendtime,
          starttype, endtype;
      for (var r = 0; r < data.logs.length; r++) {
        starttime = data.logs[r].datetime * 1000;
        if (starttime < barstarttime) {
          starttime = barstarttime;
        }
        endtype = data.logs[r].type;
        switch (parseInt(endtype, 10)) {
          case 1:
            endtype = 1; //grey
            break;
          case 2:
            endtype = 2; //green
            break;
          default:
            endtype = 0; //grey
        }
        remainlen = remainlen - (endtime - starttime) / period;
        if (bar.length > 0 && bar[bar.length - 1].typeid == endtype) {
          bar[bar.length - 1].len += (endtime - starttime) / period;
          bar[bar.length - 1].left = starttime;
        } else {
          bar.push({
            typeid: endtype,
            len: (endtime - starttime) / period,
            left: starttime,
            right: endtime
          });
        }
        endtime = starttime;
        if (starttime <= barstarttime) {
          break;
        }
      }
      if (starttime > barstarttime) {
        switch (parseInt(endtype, 10)) {
        case 1:
          starttype = 2;
          //grey
          break;
        case 2:
          starttype = 1;
          //green
          break;
        default:
          starttype = 0;
          //grey
        }
        if (bar.length > 0 && bar[bar.length - 1].typeid == endtype) {
          bar[bar.length - 1].len += remainlen;
          bar[bar.length - 1].left = barstarttime;
        } else {
          bar.push({
            typeid: starttype,
            len: remainlen,
            start: barstarttime,
            end: bar[bar.length - 1].left
          });
        }
      }
    }
    var stat, stattip;
    data.progress = [];
    while (stat = bar.pop()) {
      stattip = "" + Type2Word(parseInt(stat.typeid), true);
      if (stat.len == 1) {
        stattip += " (近24小时)"
      } else {
        if (stat.right - stat.left < 1000 * 3540) {
          stattip += " (" + new Number((stat.right - stat.left) / (1000 * 60)).toFixed(0) + " 分钟)";
        } else {
          stattip += " (" + new Number((stat.right - stat.left) / (1000 * 3600)).toFixed(1) + " 小时)";
        }
        stattip += "<br><span class=\"ttime\">" + num2string(stat.left) + " ~ " + num2string(stat.right) + "</span>";
      }
      data.progress.push({
        typeid: stat.typeid,
        types: getLogType,
        len: (stat.len * 100).toString(),
        stattip: stattip
      })
    }
    // gather data for the graphs
    var uptimes = data.custom_uptime_ranges.split("-");
    var uptimetext = [], hours, minutes;
    for (a = 0; a < uptimes.length; a++) {
      if (a === 0) { // last 30 days
        minutes = (100 - uptimes[a]) / 100 * 1440 * 30;
      } else if (a === 7) { // today
        minutes = (100 - uptimes[a]) / 100 * (_secondsToday / 60);
      } else {
        minutes = (100 - uptimes[a]) / 100 * 1440;
      }
      hours = minutes / 60;
      if (uptimes[a] >= 99.99) {
        uptimetext[a] = "可用率 100%";
      } else if (minutes < 60) {
        uptimetext[a] = "可用率 " + new Number(uptimes[a]).toFixed(2) + "%<br>故障 " + new Number(minutes).toFixed(0) + " 分钟";
      } else {
        uptimetext[a] = "可用率 " + new Number(uptimes[a]).toFixed(2) + "%<br>故障 " + new Number(hours).toFixed(1) + " 小时";
      }
    }
    //uptimes.push(data.alltimeuptimeratio);
    data.charts = [
      { uptime: uptimes[0], uptimetext: uptimetext[0], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[1], uptimetext: uptimetext[1], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[2], uptimetext: uptimetext[2], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[3], uptimetext: uptimetext[3], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[4], uptimetext: uptimetext[4], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[5], uptimetext: uptimetext[5], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[6], uptimetext: uptimetext[6], uptype: getUptimeColor, upsign: getUptimeSign },
      { uptime: uptimes[7], uptimetext: uptimetext[7], uptype: getUptimeColor, upsign: getUptimeSign }
    ];
    var $output = $(Mustache.render(_template, data));
    return $output;
  }

  /* display the html on the page */
  function updatePage() {
    //append it in the container
    for (var k = 0; k < __apiKeys.length; k++) {
      if (showQueue[k] == undefined) {
        break;
      } else if (showQueue[k].shown === true) {
        continue;
      } else {
        for (var i in showQueue[k].htmls) {
          $_container.append(showQueue[k].htmls[i]);
        }
        showQueue[k].shown = true;
        _loaded++;
      }
    }

    if (_loaded === __apiKeys.length) {
      $('.set-tooltip').tooltip({
        html: true
      });
      $('#stattip-load').addClass('hide');
      if (_hasError) {
        $('#stattip-err').removeClass('hide');
        $('#stattip-ok').addClass('hide');
      } else {
        $('#stattip-ok').removeClass('hide');
        $('#stattip-err').addClass('hide');
      }
    }
  }
  /* count down till next refresh */
  function countdown() {
    var now = Date.now();
    var elapsed = parseInt((now - _start) / 1000, 10);
    var mins = Math.floor((_refresh - elapsed) / 60);
    var secs = _refresh - (mins * 60) - elapsed;
    secs = (secs < 10) ? "0" + secs : secs;
    if (elapsed > _refresh) {
      clearInterval(_intervalId);
      init();
    } else {
      $_lastUpdate.html(mins + ':' + secs);
    }
  }
  /* give the icon in front of log line a nice color */
  function getLogType() {
    switch (parseInt(this.typeid, 10)) {
    case 1:
      return "danger";
    case 2:
      return "success";
    case 99:
      return "default";
    case 98:
      return "default";
    default:
      return "default";
    }
  }
  function Type2Word(t, icon) {
    switch (t) {
    case 1:
      return (icon ? "<span class=\"glyphicon glyphicon-remove-sign\"></span> " : "") + "故障";
    case 2:
      return (icon ? "<span class=\"glyphicon glyphicon-ok-sign\"></span> " : "") + "正常";
      //case 99:
      //  return "未知";
      //case 98:
      //  return "未知";
    default:
      return (icon ? "<span class=\"glyphicon glyphicon-question-sign\"></span> " : "") + "未知";
    }
  }
  function num2string(num) {
    tmpdate = new Date(parseInt(num));
    datestr = (tmpdate.getMonth() + 1) + "-" + tmpdate.getDate() + " " + tmpdate.getHours() + ":" + (tmpdate.getMinutes() < 10 ? "0" + tmpdate.getMinutes() : tmpdate.getMinutes());
    return datestr;
  }
  function getUptimeColor() {
    var upt = this.uptime;
    if (upt >= 99.99) {
      return "success";
    } else if (upt >= 98.00) {
      return "warning";
    } else {
      return "danger";
    }
  }
  function getUptimeSign() {
    var upt = this.uptime;
    if (upt >= 99.99) {
      return "ok-sign";
    } else if (upt >= 98.00) {
      return "exclamation-sign";
    } else {
      return "remove-sign";
    }
  }
  return {
    init: init
  };
}(jQuery));
