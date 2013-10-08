/*
    support VAST for HTML5
    by P.Frolov
*/

// cross-domain request by postMesage
_V_.options.components['xdr'] = {};

_V_.Xdr = _V_.Component.extend({

	init: function (player, options) {
		this._super(player, options);
		
		with (this.el.style) {
			visibility = 'hidden';
			width = '0px';
			height = '0px';
		}
	},

	createElement: function (type, attrs) {
		if (this.player.tech.el.localName === 'video') {
			return document.createElement('iframe');
		}
		return document.createElement('span');
	},

	src : function (url) {
		if (this.player.tech.el.localName !== 'video')
			return;
		
		if (url && url.toUpperCase().indexOf('HTTP://') == 0) {
			this.el.src = url;
		}
	}
});

_V_.options.components['skipAdButton'] = {};

_V_.SkipAdButton = _V_.Button.extend({

	init: function (player, options) {
		this._super(player, options);
		
		this.fadeOut();
	},

	createElement: function (type, attrs) {
		if(this.player.tech.el.localName === 'video') {
			attrs = _V_.merge({
				className: this.buildCSSClass(),
				innerHTML: 'Skip Ad'
			}, attrs); 
			
			return this._super(type, attrs);
		}
		return document.createElement('span');
	},

	buildCSSClass: function () {
		return " vjs-skip-button ";
	},

	show : function () {
		this.fadeIn();
		this.player.addEvent("mouseover", this.proxy(this.fadeIn));
		this.player.addEvent("mouseout", this.proxy(this.fadeOut));
	},

	hide : function () {
		this.fadeOut();
		this.player.removeEvent("mouseover", this.proxy(this.fadeIn));
		this.player.removeEvent("mouseout", this.proxy(this.fadeOut));
	},

	onClick: function () {
		if (this.player.vast)
			this.player.vast.onSkip();
		else
			this.hide();
	}
});

_V_.options.components['clickLink'] = {};

_V_.ClickLink = _V_.Component.extend({

	init: function (player, options) {
		this._super(player, options);
		
		this.hide();
	},

	createElement: function (type, attrs) {
		if(this.player.tech.el.localName === 'video') {
			attrs = _V_.merge({
				className: this.buildCSSClass(),
				innerHTML: '<a href="#" target="_blank"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>'
			}, attrs); 
			
			return this._super(type, attrs);
		}
		return document.createElement('span');
	},

	buildCSSClass: function () {
		return " vjs-link ";
	},

	show: function () {
		var _v = this.player.values;
		if (_v.currentSlot && _v.currentSlot.link) {
			this.el.innerHTML = '<a href="' + _v.currentSlot.link + '" target="_blank"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>';
			this.el.style.display = 'block';
			this.addClickEvent();
		}
	},

	hide: function () {
		this.el.style.display = 'none';
	},

	addClickEvent : function () {
		var _v = this.player.values;
		try {
			var a = this.el.getElementsByTagName('a')[0];
			if (window.addEventListener) {
				a.addEventListener('click', _V_.proxy(this, this.onClick), false);
			} else {
				a.attachEvent('onclick', _V_.proxy(this, this.onClick));
			}
		} catch (e) {}
	},

	onClick: function () {
		if (this.player.vast)
			this.player.vast.onClick();
		else
			this.hide();
	}
});


_V_.options.components['vast'] = {};

_V_.Vast = _V_.Component.extend({

	init: function (player, options) {
		this._super(player, options);
		this.initAds();
		
		this.el.style.display = 'none';
	},
	
	createElement: function (type, attrs) {
		if(this.player.tech.el.localName === 'video') {
			return this._super(type, attrs);
		}
		return document.createElement('span');
	},
	
	initAds : function () {
		var options = this.player.options;
		
		if (!options.ads || 
		    !options.ads.hasOwnProperty('schedule') || 
		    !options.ads['schedule'].length ||
		    !options.ads.hasOwnProperty('servers') ||
		    !options.ads['servers'].length) {
			return;
		}
		
		var _v = this.player.values;
		_v.tempTime = 0;
		_v.adList = [];
		_v.mainTrack = _v.src;
		_v.currentSlot = null;
		_v.skipAd = 0;
		_v.api = '';
		_v.paused = false;
		_v.xdrMethod = '';
		
		try {
			//change source fo itself for events fireing: http://dev.opera.com/articles/view/consistent-event-firing-with-html5-video/
			if (window.opera) {
				this.player.src(_v.src);
				this.player.load();
			}
		
			if (options.ads.skipAd.enabled)
				_v.skipAd = options.ads.skipAd.timeOut || 3;
		} catch (e) {}
		
		//window.counterOfStreams = 0;
		this.adsRequest(options.ads);
	},

	adSlot: function (_type,_time) {
		var a = {};
		a.type = _type;
		a.time = _time;
		a.source = "";
		a.mime = "";
		a.seen = false;
		a.playOnce = true;
		a.impression = [];
		a.events = {};
		a.link = "";
		a.clickEvents = [];
		
		return a;
	},

	convertTimeFormat: function (hhmmss) {
		var _time = hhmmss.substr(0,1)*3600+hhmmss.substr(3,2)*60+hhmmss.substr(6,2)*1;
		return _time;
	},

	constructAdList: function (responseObj) {
		var _v = this.player.values;
		var video = document.createElement("video");
		try {
			var adElements = responseObj.getElementsByTagName("Ad");
			var size = _v.adList.length;
			for (var a = 0, al = adElements.length; a < al && size; ++a) {

				try {
					impression = adElements[a].getElementsByTagName("Impression");
					for (var k = 0, kl = impression.length;k < kl; ++k) {
						for (var l = 0, ll = impression[k].childNodes.length;l < ll; ++l) {
							var data = impression[k].childNodes[l].data.replace(/^\s+/,'').replace(/\s+$/, '');
							if (!data)
								continue;
							_v.adList[a].impression.push(data);
						}
					}
				} catch (e) {}

				try {
					mediaFiles = adElements[a].getElementsByTagName("MediaFiles")[0];
					mediaFile = mediaFiles.getElementsByTagName("MediaFile");

					mediaFound:
					for (var k = 0, kl = mediaFile.length; k < kl; ++k) {
						try {
							type = mediaFile[k].getAttribute('type').toLowerCase();
							if (type == 'video/x-mp4') {
								type = "video/mp4";
							}

							if (!video.canPlayType || !video.canPlayType(type).replace(/no/, ''))
								continue;
							for (var l = 0, ll = mediaFile[k].childNodes.length; l < ll; ++l) {
								var data = null;
								if (mediaFile[k].childNodes[l].data && mediaFile[k].childNodes[l].data.replace(/^\s+/,'').replace(/\s+$/, '').length > 0) {
									data = mediaFile[k].childNodes[l].data.replace(/^\s+/,'').replace(/\s+$/, '');
								} else if (mediaFile[k].childNodes[l].childNodes[0]) {
									data = mediaFile[k].childNodes[l].childNodes[0].data.replace(/^\s+/,'').replace(/\s+$/, '');
								}
								if (!data || data.length == 0) {
									continue;
								}
								_v.adList[a].source = data;
								_v.adList[a].mime = type;
								break mediaFound;
							}
						} catch (e) {}
					}
				} catch (e) {}

				try {
					trackingEvents = adElements[a].getElementsByTagName("TrackingEvents")[0];
					tracking = trackingEvents.getElementsByTagName("Tracking");
					for (var k = 0, kl = tracking.length; k < kl; ++k) {
						var event = tracking[k].getAttribute('event');
						if (!event)
							continue;
						for (var l = 0, ll = tracking[k].childNodes.length; l < ll; ++l) {
							var data = null;
							if (tracking[k].childNodes[l].data && tracking[k].childNodes[l].data.replace(/^\s+/,'').replace(/\s+$/, '').length > 0) {
								data = tracking[k].childNodes[l].data.replace(/^\s+/,'').replace(/\s+$/, '');
							} else if (tracking[k].childNodes[l] && tracking[k].childNodes[l].childNodes[0] && tracking[k].childNodes[l].childNodes[0].data && tracking[k].childNodes[l].childNodes[0].data.replace(/^\s+/,'').replace(/\s+$/, '')) {
								data = tracking[k].childNodes[l].childNodes[0].data.replace(/^\s+/,'').replace(/\s+$/, '');
							}
								
							if (!data)
								continue;
							if (!_v.adList[a].events[event.toLowerCase()])
								_v.adList[a].events[event.toLowerCase()] = [];
							_v.adList[a].events[event.toLowerCase()].push(data);
							break;
						}
					}
				} catch (e) {}

				try {
					videoClicks = adElements[a].getElementsByTagName("VideoClicks")[0];
					clickThrough = videoClicks.getElementsByTagName("ClickThrough")[0];
					for (var k = 0, kl = clickThrough.childNodes.length; k < kl; ++k) {
						var data = null;
						if (clickThrough.childNodes[k].data && clickThrough.childNodes[k].data.replace(/^\s+/,'').replace(/\s+$/, '').length > 0) {						
							data = clickThrough.childNodes[k].data.replace(/^\s+/,'').replace(/\s+$/, '');
						} else if (clickThrough.childNodes[k].childNodes[0] && clickThrough.childNodes[k].childNodes[0].data && clickThrough.childNodes[k].childNodes[0].data.replace(/^\s+/,'').replace(/\s+$/, '').length > 0) {
							data = clickThrough.childNodes[k].childNodes[0].data.replace(/^\s+/,'').replace(/\s+$/, '');
						}
						if (!data)
							continue;
						if (data.toUpperCase().indexOf('HTTP://') != 0 && data.toUpperCase().indexOf('HTTPS://') != 0)
							continue;
						_v.adList[a].link = data;
						break;
					}
					clickTracking = videoClicks.getElementsByTagName("ClickTracking");
					for (var k = 0, kl = clickTracking.length; k < kl; ++k) {
						for (var l = 0, ll = clickTracking[k].childNodes.length; l < ll; ++l) {
							var data = clickTracking[k].childNodes[l].data.replace(/^\s+/,'').replace(/\s+$/, '');
							if (!data)
								continue;
							_v.adList[a].clickEvents.push(data);
							break;
						}
					}
				} catch (e) {}

				if (_v.adList[a].source)
					--size;
			}
			if (size)
				_v.adList = _v.adList.slice(0, _v.adList.length - size);

			this.player.addEvent('timeupdate', _V_.proxy(this, this.showAdSlots));
		} catch (e) {}
	},

	callEvent : function (url) {
		var _v =  this.player.values;
		if (url.toUpperCase().indexOf("HTTP://") == 0) {
			var rnd = Math.round(Math.random()*100000);
			imgHandle = document.createElement('img');
			imgHandle.style.visibility = "hidden";
			imgHandle.style.position = "absolute";
			imgHandle.style.width = "0px";
			imgHandle.style.height = "0px";
			imgHandle.src = url + ((url.indexOf('?') > 0) ? '&' : '?') + 'r' + rnd + '=' + rnd;
			_V_.insertFirst(imgHandle, this.player.el.parentNode);
		}
	},

	xml2Doc : function (string) {
		if (!string)
			return false;
		
		var message = "";
		if (window.DOMParser) { // all browsers, except IE before version 9
			var parser = new DOMParser();
			try {
				xmlDoc = parser.parseFromString (string, "text/xml");
			} catch (e) {
				// if text is not well-formed, 
				// it raises an exception in IE from version 9
				_V_.log("XML parsing error.");
				return false;
			};
		} else {  // Internet Explorer before version 9
			if (typeof (ActiveXObject) == "undefined") {
				_V_.log("Cannot create XMLDocument object");
				return false;
			}
			ids = ["Msxml2.DOMDocument.6.0", "Msxml2.DOMDocument.5.0", "Msxml2.DOMDocument.4.0", "Msxml2.DOMDocument.3.0", "MSXML2.DOMDocument", "MSXML.DOMDocument"];
			for (var i = 0, il = ids.length; i < il; ++i) {
				try {
					xmlDoc = new ActiveXObject(ids[i]);
					break;
				} catch (e) {}
			}
			if (!xmlDoc) {
				_V_.log("Cannot create XMLDocument object");
				return false;
			}
			xmlDoc.loadXML(string);
			
			if (xmlDoc.parseError && xmlDoc.parseError.errorCode != 0) {
				_V_.log("XML Parsing Error: " + xmlDoc.parseError.reason
					  + " at line " + xmlDoc.parseError.line
					  + " at position " + xmlDoc.parseError.linepos);
				return false;
			} else {
				if (xmlDoc.documentElement) {
					if (xmlDoc.documentElement.nodeName == "parsererror") {
						_V_.log(xmlDoc.documentElement.childNodes[0].nodeValue);
					}
				} else {
					_V_.log("XML Parsing Error!");
				}
			}
		}
		return xmlDoc;
	},

	adsReady : function (string) {
		this.constructAdList ( this.xml2Doc(string) );
	},

	adsError : function (error) {
		var _v = this.player.values;
		
		if (_v.xdrMethod == "yql") {
			var protocol = location.protocol,
				hostname = location.hostname,
				exRegex = RegExp(protocol + '//' + hostname),
				query = 'select * from xml where url="' + encodeURI(_v.api) +'"',
				YQL = 'http' + (/^https/.test(protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?format=xml&q=' + query;
			
			if ( !exRegex.test(_v.api) && /:\/\//.test(_v.api) ) { //external url
				_V_.get(YQL, _V_.proxy(this, this.adsReady));
			}
		} else if (_v.xdrMethod == "xdr") {
			if (!this.player.xdr)
				return;
		
			if (window.addEventListener) {
				window.addEventListener('message', _V_.proxy(this, this.adsXdrListener), false);
			} else {
				window.attachEvent('onmessage', _V_.proxy(this, this.adsXdrListener));
			}
			
			this.player.xdr.src(_v.api);
		}
	},

	adsXdrListener : function (event) {
		var _v = this.player.values;
		
		if (window.addEventListener) {
			window.removeEventListener('message', _V_.proxy (this, this.adsXdrListener), false);
		} else {
			window.dettachEvent('onmessage', _V_.proxy(this, this.adsXdrListener));
		}
		
		if (!this.player.xdr)
			return;
		
		this.constructAdList( this.xml2Doc(event.data) );
	},

	// Loading ads data from defined server
	adsRequest : function (adObj) {
		var _v = this.player.values;
		try {
			//constructing list for further populating and sorting
			for (v in adObj.schedule) {
				switch (adObj.schedule[v].position) {
					
					case "pre-roll":
						var a = this.adSlot("pre-roll",0);
						_v.adList.push(a);
						break;
					
					case "mid-roll":
						var a = this.adSlot("mid-roll", this.convertTimeFormat(adObj.schedule[v].startTime));
						_v.adList.push(a);
						break;
					
					case "post-roll":
						var a = this.adSlot("post-roll",-1);
						_v.adList.push(a);
						break;
					
					/*
					case "auto:bottom":
						var a = this.adSlot("auto:bottom", this.convertTimeFormat(adObj.schedule[v].startTime));
						_v.adList.push(a);
						break;
					*/
					
					default:
						break;
				}
			}
			this.player.addEvent("canplaytrough", _V_.proxy(this, this.setPostRollTime));
			this.player.addEvent("canplay", _V_.proxy(this, this.setPostRollTime));
			this.player.addEvent("loadeddata", _V_.proxy(this, this.setPostRollTime));
			this.player.addEvent("loadedmetadata", _V_.proxy(this, this.setPostRollTime));
			this.player.load();
			
			try {
				_v.api = _V_.getAbsoluteURL(adObj.servers[0]["apiAddress"]);
				
				// cross domain method
				if (adObj.servers[0].hasOwnProperty("xdrMethod")) {
					if (adObj.servers[0]["xdrMethod"] == "yql" || adObj.servers[0]["xdrMethod"] == "xdr")
						_v.xdrMethod = adObj.servers[0]["xdrMethod"];
				}
				
				_V_.get(_v.api, _V_.proxy(this, this.adsReady), _V_.proxy(this, this.adsError) );
			} catch (e) { _v.api = ''; }
			
		} catch(e) {}
	},

	slotForCurrentTime : function (currentTime) {
		var _v = this.player.values;
		for (v in _v.adList) { 
			if (!_v.adList[v].seen) {
				if (_v.adList[v].time == currentTime) {
					return _v.adList[v];
				}
			}
		}
		return null;
	},

	showSlot : function (slot) {
		var _v = this.player.values;
		try {
			if (slot.source) {
				this.player.src(slot.source);
				this.player.load();
				this.player.play();
				_v.currentSlot = slot;
				_v.paused = false;
				
				if (this.player.readyState !== 4) { //HAVE_ENOUGH_DATA
					var _f =  _V_.proxy(this, this.waitSlotData);
					this.player.addEvent('canplaythrough', _f);
					this.player.addEvent('canplay', _f);
					this.player.addEvent('loadeddata', _f);
					this.player.addEvent('loadedmetadata', _f);
					this.player.pause();
				} else {
					this.enoughSlotData();
				}
				return;
			}
		} catch (e) {}
		this.resumePlayBackAfterSlotShow();
	},

	waitSlotData : function () {
		var _v = this.player.values;
		var _f =  _V_.proxy(this, this.waitSlotData);
		this.player.removeEvent('canplaythrough', _f);
		this.player.removeEvent('canplay', _f);
		this.player.removeEvent('loadeddata', _f);
		this.player.removeEvent('loadedmetadata', _f);
		
		this.player.play();
		this.enoughSlotData();
	},

	enoughSlotData : function () {
		var _v = this.player.values;
		
		// pixel-events
		this.onImpression();
		this.onStart();
			
		//activate click
		if (this.player.clickLink)
			this.player.clickLink.show();
		
		//time events
		this.player.addEvent('timeupdate',  _V_.proxy(this, this.callSlotEvents));
		
		this.player.addEvent('volumechange', _V_.proxy(this, this.onMute));
		this.player.addEvent('play', _V_.proxy(this, this.onPause));
		this.player.addEvent('pause', _V_.proxy(this, this.onPause));
		this.player.addEvent('fullscreenchange', _V_.proxy(this, this.onFullscreen));
		
		this.player.addEvent('ended', _V_.proxy(this, this.resumePlayBackAfterSlotShow));
		
	},

	enforcePrecision : function (n, nDecimalDigits) {
		return +(n).toFixed(nDecimalDigits);
	},

	setPostRollTime : function () {
		var _v = this.player.values;
		this.player.removeEvent("canplaytrough", _V_.proxy(this, this.setPostRollTime));
		this.player.removeEvent("canplay", _V_.proxy(this, this.setPostRollTime));
		this.player.removeEvent("loadeddata", _V_.proxy(this, this.setPostRollTime));
		this.player.removeEvent("loadedmetadata", _V_.proxy(this, this.setPostRollTime));
		for (v in _v.adList) {
			if (_v.adList[v].type == "post-roll") {
				_v.adList[v].time = Math.floor(this.player.duration());
			}
		}
	},

	// @event
	showAdSlots : function () {
		var _v = this.player.values;
		var slot = this.slotForCurrentTime(Math.floor(this.player.currentTime()));
		if (slot) {
			slot.seen = true;
			_v.tempTime = this.player.currentTime();
			this.player.removeEvent('timeupdate', _V_.proxy(this, this.showAdSlots));
			
			this.showSlot(slot);
		}
	},

	// @event
	resumePlayBackAfterSlotShow : function () {
		var _v =  this.player.values;
		
		this.player.removeEvent('ended', _V_.proxy(this, this.resumePlayBackAfterSlotShow));
		
		this.player.removeEvent('timeupdate', _V_.proxy(this, this.callSlotEvents));
		
		this.player.removeEvent('volumechange', _V_.proxy(this, this.onMute));
		this.player.removeEvent('play', _V_.proxy(this, this.onPause));
		this.player.removeEvent('pause', _V_.proxy(this, this.onPause));
		this.player.removeEvent('fullscreenchange', _V_.proxy(this, this.onFullscreen));
		
		_v.currentSlot = null;
		this.player.src(_v.mainTrack);
		this.player.load();
		this.player.play();
		
		if (this.player.readyState !== 4) { //HAVE_ENOUGH_DATA
			var _f =  _V_.proxy(this, this.seekToOriginalPoint);
			this.player.addEvent('canplaythrough', _f);
			this.player.addEvent('canplay', _f);
			this.player.addEvent('loadeddata', _f);
			this.player.addEvent('loadedmetadata', _f);
			this.player.pause();
		} else if (_v.paused) {
			this.player.pause();
		}
	},

	// @event
	seekToOriginalPoint: function () {
		var _v = this.player.values;
		var _f =  _V_.proxy(this, this.seekToOriginalPoint);
		this.player.removeEvent('canplaythrough', _f);
		this.player.removeEvent('canplay', _f);
		this.player.removeEvent('loadeddata', _f);
		this.player.removeEvent('loadedmetadata', _f);
		this.player.currentTime( this.enforcePrecision(_v.tempTime,1) );
		if (_v.paused) {
			_v.paused = false;
		} else {
			this.player.play();
		}
		this.player.addEvent('timeupdate', _V_.proxy(this, this.showAdSlots));
	},

	// @event
	callSlotEvents : function () {
		var _v = this.player.values;
		
		try {
			var currentTime = Math.floor(this.player.currentTime());
			var duration = this.player.duration();
			
			if (this.player.skipAdButton && _v.skipAd && currentTime == _v.skipAd) {
				this.player.skipAdButton.show();
			}
			
			if (Math.floor(0.25 * duration) == currentTime) {
				this.onFirstQuartile();
				return;
			}
			if (Math.floor(0.5 * duration) == currentTime) {
				this.onMidPoint();
				return;
			}
			if (Math.floor(0.75 * duration) == currentTime) {
				this.onThirdQuartile();
				return;
			}
			if (Math.floor(duration) == currentTime) {
				this.onComplete();
				return;
			}
		} catch (e) {
		    //console.log(e);
		}
	},

	/* @pixel-events */
	onImpression : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.impression,  _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onCreativeView : function () {
		var _v = this.player.values;
	},

	onStart : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['start'],  _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	onFirstQuartile : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['firstquartile'],  _V_.proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['firstquartile'] = [];
		} catch (e) {}
	},

	onMidPoint : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['midpoint'],  _V_.proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['midpoint'] = [];
		} catch (e) {}
	},

	onThirdQuartile : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['thirdquartile'],  _V_.proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['thirdquartile'] = [];
		} catch (e) {}
	},

	onComplete : function () {
		var _v = this.player.values;
		try {
			if (this.player.skipAdButton)
				this.player.skipAdButton.hide()
			if (this.player.clickLink)
				this.player.clickLink.hide();
			_V_.each(_v.currentSlot.events['complete'], _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	onMute : function () {
		var _v = this.player.values;
		if (this.player.muted()) {
			if (_v.isMuted)
				return; //already muted
			_v.isMuted = true;
		} else {
			if (!_v.isMuted)
				return; //already unmuted
			_v.isMuted = false;
		}
		try {
			_V_.each( _v.isMuted? _v.currentSlot.events['mute'] : _v.currentSlot.events['unmute'] , _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	onPause : function () {
		var _v = this.player.values;
		if (this.player.paused()) {
			if (_v.isPaused)
				return; //already paused
			_v.isPaused = true;
		} else {
			if (!_v.isPaused)
				return; //already resumed
			_v.isPaused = false;
		}
		try {
			_V_.each(_v.isPaused? _v.currentSlot.events['pause'] : _v.currentSlot.events['resume'], _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onRewind : function () {
		var _v = this.player.values;
		try {
			_V_.each( _v.currentSlot.events['rewind'], _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	onFullscreen : function () {
		var _v = this.player.values;
		try {
			_V_.each(this.player.isFullScreen ? _v.currentSlot.events['fullscreen'] : _v.currentSlot.events['exitfullscreen'], _V_.proxy(this, this.callEvent));
			_V_.each(this.player.isFullScreen ? _v.currentSlot.events['expand'] : _v.currentSlot.events['collapse'], _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onAcceptInvitation : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['acceptinvitation'] , _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onClose : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['close'] , _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	onSkip : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['skip'], _V_.proxy(this, this.callEvent));
		} catch (e) {}
		
		if (this.player.skipAdButton)
			this.player.skipAdButton.hide();
		if (this.player.clickLink)
			this.player.clickLink.hide();
		
		this.resumePlayBackAfterSlotShow();
	},

	//TODO
	onProgress : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.events['progress'], _V_.proxy(this, this.callEvent));
		} catch (e) {}
	},

	onClick : function () {
		var _v = this.player.values;
		try {
			_V_.each(_v.currentSlot.clickEvents, _V_.proxy(this, this.player.vast.callEvent));
		} catch (e) {}
		
		if (this.player.skipAdButton)
			this.player.skipAdButton.hide();
		if (this.player.clickLink)
			this.player.clickLink.hide();
		
		_v.paused = true;
		this.resumePlayBackAfterSlotShow();
	}

});

