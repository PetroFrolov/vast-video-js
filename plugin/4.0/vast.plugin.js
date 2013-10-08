/*
    support VAST for HTML5
    by P.Frolov
*/

// cross-domain request by postMesage

(function (_window) {

    // cross-domain request by postMesage
    var _xdr = {
	_V_ : _window._V_,
	_player : {},
	_el : null,

	init : function (player, options) {
		this._player = player;
		this._super(player, options);
		this._el = this.el;
		
		with (this._el.style) {
			visibility = 'hidden';
			width = '0px';
			height = '0px';
		}
	},

	createElement : function (type, attrs) {
		if (this._player.tech.el.localName === 'video') {
			return document.createElement('iframe');
		}
		return document.createElement('span');
	},

	getEl : function () {
		return this._el;
	}, 

	src : function (url) {
		if (!this._el)
			return;
		
		var e = (typeof this._player.el == 'function')? this._player.el() : this._player.el;
		if (e.fisrtChild.tagName.toUpperCase() != 'VIDEO')
			return;
		
		if (url && url.toUpperCase().indexOf('HTTP://') == 0) {
			this._el.src = url;
		}
	}
    };

    // skip buton
    var _skip = {
	_V_ : _window._V_,
	_player : {},
	_el : null,

	init: function (player, options) {
		this._player = player;
		this._super(player, options);
		
		this._backCompat();
		
		this._el = this.el;
		this._fadeOut();
	},

	/* compatible funcs */
	_backCompat : function () {
		if (typeof this._player.on !== 'function') {
			this._player.on = this._player.addEvent;
		}
		if (typeof this._player.off !== 'function') {
			this._player.off = this._player.removeEvent;
		}
	},

	_proxy : function (context, fn, uid) {
		if (typeof this._V_.proxy == 'function')
			return this._V_.proxy (context, fn, uid);
		if (typeof this._V_.bind == 'function')
			return this._V_.bind (context, fn, uid);
		return this._proxy_(context, fn, uid);
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
		return ' vjs-skip-button ';
	},

	_fadeIn: function () {
		if (typeof this.fideIn == 'function')
			return this.fideIn();
		this._el.style.display = 'block';
        },

	_fadeOut: function () {
		if (typeof this.fideOut == 'function')
			return this.fideOut();
		this._el.style.display = 'none';
	},

	show : function () {
		this._fadeIn();
		this._player.on('mouseover', this._proxy(this, this._fadeIn));
		this._player.on('mouseout', this._proxy(this, this._fadeOut));
	},

	hide : function () {
		this._fadeOut();
		this._player.off('mouseover', this._proxy(this, this._fadeIn));
		this._player.off('mouseout', this._proxy(this, this._fadeOut));
	},

	onClick: function () {
		if (this._player.vast)
			this._player.vast.onSkip();
		else
			this.hide();
	}
    };

    // click link
    var _link = {
	_V_ : _window._V_,
	_player : {},
	_el : null,

	init: function (player, options) {
		this._player = player;
		this._super(player, options);
		
		this._el = this.el;
		this.hide();
	},

	createElement: function (type, attrs) {
		if(this._player.tech.el.localName === 'video') {
			attrs = _V_.merge({
				className: this.buildCSSClass(),
				innerHTML: '<a href="#" target="_blank"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>'
			}, attrs); 
			
			return this._super(type, attrs);
		}
		return document.createElement('span');
	},

	buildCSSClass: function () {
		return ' vjs-link ';
	},

	show: function () {
		var _v = this._player.values;
		if (_v.currentSlot && _v.currentSlot.link) {
			this._el.innerHTML = '<a href="' + _v.currentSlot.link + '" target="_blank"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>';
			this._el.style.display = 'block';
			this.addClickEvent();
		}
	},

	hide: function () {
		this._el.style.display = 'none';
	},

	addClickEvent : function () {
		var _v = this._player.values;
		try {
			var a = this._el.getElementsByTagName('a')[0];
			if (window.addEventListener) {
				a.addEventListener('click', _V_.proxy(this, this.onClick), false);
			} else {
				a.attachEvent('onclick', _V_.proxy(this, this.onClick));
			}
		} catch (e) {}
	},

	onClick: function () {
		if (this._player.vast)
			this._player.vast.onClick();
		else
			this.hide();
	}
    };


    var _vast = {
	_V_ : _window._V_,
	_player : {},
	_el : null,

	/* compatible funcs */
	_backCompat : function () {
		if (typeof this._player.on !== 'function') {
			this._player.on = this._player.addEvent;
		}
		if (typeof this._player.off !== 'function') {
			this._player.off = this._player.removeEvent;
		}
	},

	_options : function () {
		return this._player.options;
	},

	_proxy : function (context, fn, uid) {
		if (typeof this._V_.proxy == 'function')
			return this._V_.proxy (context, fn, uid);
		if (typeof this._V_.bind == 'function')
			return this._V_.bind (context, fn, uid);
		return this._proxy_(context, fn, uid);
	},

	_getAbsoluteURL : function (url) {
		if (typeof this._V_.getAbsoluteURL == 'function')
			return this._V_.getAbsoluteURL (url);
		
		if (!url.match(/^https?:\/\//)) {
			var div = document.createElement('DIV');
			div.innerHTML = '<a href="' + url + '"></a>';
			url = div.firstChild.href;
		}
		return url;
	},

	/* useful funcs */
	_proxy_ : function (context, fn, uid) {
		var _v = this._player.values;
		// Make sure the function has a unique ID
		if (!fn.guid) { fn.guid = _v.guid++; }
		
		// Create the new function that changes the context
		var ret = function() {
			return fn.apply(context, arguments);
		}
		
		// Allow for the ability to individualize this function
		// Needed in the case where multiple objects might share the same prototype
		// IF both items add an event listener with the same function, then you try to remove just one
		// it will remove both because they both have the same guid.
		// when using this, you need to use the proxy method when you remove the listener as well.
		ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;
		
		return ret;
	},

	_each : function (arr, fn) {
		if (!arr || arr.length === 0)
			return;
		
		for (var i = 0, j = arr.length; i < j; ++i) {
			fn.call(this, arr[i], i);
		}
	},

	/* plugin methods */
	init: function (player, options) {
		this._player = player;
		this._backCompat();
		
		this._super(player, options);
		this._el = this.el;
		
		this.initAds();
		this.el.style.display = 'none';
	},
	
	createElement: function (type, attrs) {
		if(this._player.tech.el.localName === 'video') {
			return this._super(type, attrs);
		}
		return document.createElement('span');
	},
	
	initAds : function () {
		var options = this._options();
		
		if (!options.ads || 
		    !options.ads.hasOwnProperty('schedule') || 
		    !options.ads['schedule'].length ||
		    !options.ads.hasOwnProperty('servers') ||
		    !options.ads['servers'].length) {
			return;
		}
		
		var _v = this._player.values;
		_v.tempTime = 0;
		_v.adList = [];
		_v.mainTrack = this._player.currentSrc();
		_v.currentSlot = null;
		_v.skipAd = 0;
		_v.api = '';
		_v.paused = false;
		_v.xdrMethod = '';
		
		try {
			//change source fo itself for events fireing: http://dev.opera.com/articles/view/consistent-event-firing-with-html5-video/
			if (window.opera) {
				this._player.src(_v.src);
				this._player.load();
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
		a.source = '';
		a.mime = '';
		a.seen = false;
		a.playOnce = true;
		a.impression = [];
		a.events = {};
		a.link = '';
		a.clickEvents = [];
		
		return a;
	},

	convertTimeFormat: function (hhmmss) {
		var _time = hhmmss.substr(0,1)*3600+hhmmss.substr(3,2)*60+hhmmss.substr(6,2)*1;
		return _time;
	},

	constructAdList: function (responseObj) {
		var _v = this._player.values;
		var video = document.createElement('video');
		try {
			var adElements = responseObj.getElementsByTagName('Ad');
			var size = _v.adList.length;
			for (var a = 0, al = adElements.length; a < al && size; ++a) {

				try {
					impression = adElements[a].getElementsByTagName('Impression');
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
					mediaFiles = adElements[a].getElementsByTagName('MediaFiles')[0];
					mediaFile = mediaFiles.getElementsByTagName('MediaFile');

					mediaFound:
					for (var k = 0, kl = mediaFile.length; k < kl; ++k) {
						try {
							type = mediaFile[k].getAttribute('type').toLowerCase();
							if (type == 'video/x-mp4') {
								type = 'video/mp4';
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
					trackingEvents = adElements[a].getElementsByTagName('TrackingEvents')[0];
					tracking = trackingEvents.getElementsByTagName('Tracking');
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
					videoClicks = adElements[a].getElementsByTagName('VideoClicks')[0];
					clickThrough = videoClicks.getElementsByTagName('ClickThrough')[0];
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
					clickTracking = videoClicks.getElementsByTagName('ClickTracking');
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

			this._player.on('timeupdate', this._proxy(this, this.showAdSlots));
		} catch (e) {}
	},

	callEvent : function (url) {
		var _v =  this._player.values;
		//if (url.toUpperCase().indexOf('HTTP://') == 0) {
			var rnd = Math.round(Math.random()*100000);
			imgHandle = document.createElement('img');
			imgHandle.style.visibility = 'hidden';
			imgHandle.style.position = 'absolute';
			imgHandle.style.width = '0px';
			imgHandle.style.height = '0px';
			imgHandle.src = url + ((url.indexOf('?') > 0) ? '&' : '?') + 'r' + rnd + '=' + rnd;
			
			var parent = this._el.parentNode;
			parent.insertBefore(imgHandle, parent.firstChild);
		//}
	},

	xml2Doc : function (string) {
		if (!string)
			return false;
		
		var message = '';
		if (window.DOMParser) { // all browsers, except IE before version 9
			var parser = new DOMParser();
			try {
				xmlDoc = parser.parseFromString (string, 'text/xml');
			} catch (e) {
				// if text is not well-formed, 
				// it raises an exception in IE from version 9
				this._V_.log('XML parsing error.');
				return false;
			};
		} else {  // Internet Explorer before version 9
			if (typeof (ActiveXObject) == 'undefined') {
				this._V_.log('Cannot create XMLDocument object');
				return false;
			}
			ids = ['Msxml2.DOMDocument.6.0', 'Msxml2.DOMDocument.5.0', 'Msxml2.DOMDocument.4.0', 'Msxml2.DOMDocument.3.0', 'MSXML2.DOMDocument', 'MSXML.DOMDocument'];
			for (var i = 0, il = ids.length; i < il; ++i) {
				try {
					xmlDoc = new ActiveXObject(ids[i]);
					break;
				} catch (e) {}
			}
			if (!xmlDoc) {
				this._V_.log('Cannot create XMLDocument object');
				return false;
			}
			xmlDoc.loadXML(string);
			
			if (xmlDoc.parseError && xmlDoc.parseError.errorCode != 0) {
				this._V_.log('XML Parsing Error: ' + xmlDoc.parseError.reason
					  + ' at line ' + xmlDoc.parseError.line
					  + ' at position ' + xmlDoc.parseError.linepos);
				return false;
			} else {
				if (xmlDoc.documentElement) {
					if (xmlDoc.documentElement.nodeName == 'parsererror') {
						this._V_.log(xmlDoc.documentElement.childNodes[0].nodeValue);
					}
				} else {
					this._V_.log('XML Parsing Error!');
				}
			}
		}
		return xmlDoc;
	},

	adsReady : function (string) {
		this.constructAdList ( this.xml2Doc(string) );
	},

	adsError : function (error) {
		var _v = this._player.values;
		
		if (_v.xdrMethod == 'yql') {
			var protocol = location.protocol,
				hostname = location.hostname,
				exRegex = RegExp(protocol + '//' + hostname),
				query = 'select * from xml where url="' + encodeURI(_v.api) +'"',
				YQL = 'http' + (/^https/.test(protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?format=xml&q=' + query;
			
			if ( !exRegex.test(_v.api) && /:\/\//.test(_v.api) ) { //external url
				this._V_.get(YQL, this._proxy(this, this.adsReady));
			}
		} else if (_v.xdrMethod == 'xdr') {
			if (!this._player.xdr || !this._player.xdr.getEl())
				return;
		
			if (window.addEventListener) {
				window.addEventListener('message', this._proxy(this, this.adsXdrListener), false);
			} else {
				window.attachEvent('onmessage', this._proxy(this, this.adsXdrListener));
			}
			
			this._player.xdr.src(_v.api);
		}
	},

	adsXdrListener : function (event) {
		var _v = this._player.values;
		
		if (window.addEventListener) {
			window.removeEventListener('message', this._proxy (this, this.adsXdrListener), false);
		} else {
			window.dettachEvent('onmessage', this._proxy(this, this.adsXdrListener));
		}
		
		if (!this._player.xdr)
			return;
		
		this.constructAdList( this.xml2Doc(event.data) );
	},

	// Loading ads data from defined server
	adsRequest : function (adObj) {
		var _v = this._player.values;
		try {
			//constructing list for further populating and sorting
			for (v in adObj.schedule) {
				switch (adObj.schedule[v].position) {
					
					case 'pre-roll':
						var a = this.adSlot('pre-roll', 0);
						_v.adList.push(a);
						break;
					
					case 'mid-roll':
						var a = this.adSlot('mid-roll', this.convertTimeFormat(adObj.schedule[v].startTime));
						_v.adList.push(a);
						break;
					
					case 'post-roll':
						var a = this.adSlot('post-roll', -1);
						_v.adList.push(a);
						break;
					
					/*
					case 'auto:bottom':
						var a = this.adSlot('auto:bottom', this.convertTimeFormat(adObj.schedule[v].startTime));
						_v.adList.push(a);
						break;
					*/
					
					default:
						break;
				}
			}
			this._player.on('canplaytrough', this._proxy(this, this.setPostRollTime));
			this._player.on('canplay', this._proxy(this, this.setPostRollTime));
			this._player.on('loadeddata', this._proxy(this, this.setPostRollTime));
			this._player.on('loadedmetadata', this._proxy(this, this.setPostRollTime));
			this._player.load();
			
			try {
				_v.api = this._getAbsoluteURL(adObj.servers[0]['apiAddress']);
				
				// cross domain method
				if (adObj.servers[0].hasOwnProperty('xdrMethod')) {
					if (adObj.servers[0]['xdrMethod'] == 'yql' || adObj.servers[0]['xdrMethod'] == 'xdr')
						_v.xdrMethod = adObj.servers[0]['xdrMethod'];
				}
				
				this._V_.get(_v.api, this._proxy(this, this.adsReady), this._proxy(this, this.adsError) );
			} catch (e) { _v.api = ''; }
			
		} catch(e) {}
	},

	slotForCurrentTime : function (currentTime) {
		var _v = this._player.values;
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
		var _v = this._player.values;
		try {
			if (slot.source) {
				this._player.src(slot.source);
				this._player.load();
				this._player.play();
				_v.currentSlot = slot;
				_v.paused = false;
				
				if (this._player.readyState !== 4) { //HAVE_ENOUGH_DATA
					var _f =  this._proxy(this, this.waitSlotData);
					this._player.on('canplaythrough', _f);
					this._player.on('canplay', _f);
					this._player.on('loadeddata', _f);
					this._player.on('loadedmetadata', _f);
					
					this._player.pause();
				} else {
					this.enoughSlotData();
				}
				return;
			}
		} catch (e) {}
		this.resumePlayBackAfterSlotShow();
	},

	waitSlotData : function () {
		var _v = this._player.values;
		var _f =  this._proxy(this, this.waitSlotData);
		this._player.off('canplaythrough', _f);
		this._player.off('canplay', _f);
		this._player.off('loadeddata', _f);
		this._player.off('loadedmetadata', _f);
		
		this._player.play();
		this.enoughSlotData();
	},

	enoughSlotData : function () {
		var _v = this._player.values;
		
		// pixel-events
		this.onImpression();
		this.onStart();
			
		//activate click
		if (this._player.clickLink)
			this._player.clickLink.show();
		
		//time events
		this._player.on('timeupdate',  this._proxy(this, this.callSlotEvents));

		this._player.on('volumechange', this._proxy(this, this.onMute));
		this._player.on('play', this._proxy(this, this.onPause));
		this._player.on('pause', this._proxy(this, this.onPause));
		this._player.on('fullscreenchange', this._proxy(this, this.onFullscreen));
		this._player.on('ended', this._proxy(this, this.resumePlayBackAfterSlotShow));
	},

	enforcePrecision : function (n, nDecimalDigits) {
		return +(n).toFixed(nDecimalDigits);
	},

	setPostRollTime : function () {
		var _v = this._player.values;
		this._player.off('canplaytrough', this._proxy(this, this.setPostRollTime));
		this._player.off('canplay', this._proxy(this, this.setPostRollTime));
		this._player.off('loadeddata', this._proxy(this, this.setPostRollTime));
		this._player.off('loadedmetadata', this._proxy(this, this.setPostRollTime));
		for (v in _v.adList) {
			if (_v.adList[v].type == 'post-roll') {
				_v.adList[v].time = Math.floor(this._player.duration());
			}
		}
	},

	// @event
	showAdSlots : function () {
		var _v = this._player.values;
		var slot = this.slotForCurrentTime(Math.floor(this._player.currentTime()));
		if (slot) {
			slot.seen = true;
			_v.tempTime = this._player.currentTime();
			this._player.off('timeupdate', this._proxy(this, this.showAdSlots));
			
			this.showSlot(slot);
		}
	},

	// @event
	resumePlayBackAfterSlotShow : function () {
		var _v =  this._player.values;
		
		this._player.off('ended', this._proxy(this, this.resumePlayBackAfterSlotShow));
		this._player.off('timeupdate', this._proxy(this, this.callSlotEvents));
		this._player.off('volumechange', this._proxy(this, this.onMute));
		this._player.off('play', this._proxy(this, this.onPause));
		this._player.off('pause', this._proxy(this, this.onPause));
		this._player.off('fullscreenchange', this._proxy(this, this.onFullscreen));
		
		_v.currentSlot = null;
		this._player.src(_v.mainTrack);
		this._player.load();
		this._player.play();
		
		if (this._player.readyState !== 4) { //HAVE_ENOUGH_DATA
			var _f =  this._proxy(this, this.seekToOriginalPoint);
			this._player.on('canplaythrough', _f);
			this._player.on('canplay', _f);
			this._player.on('loadeddata', _f);
			this._player.on('loadedmetadata', _f);
			this._player.pause();
		} else if (_v.paused) {
			this._player.pause();
		}
	},

	// @event
	seekToOriginalPoint: function () {
		var _v = this._player.values;
		var _f =  this._proxy(this, this.seekToOriginalPoint);
		this._player.off('canplaythrough', _f);
		this._player.off('canplay', _f);
		this._player.off('loadeddata', _f);
		this._player.off('loadedmetadata', _f);
		this._player.currentTime( this.enforcePrecision(_v.tempTime,1) );
		if (_v.paused) {
			_v.paused = false;
		} else {
			this._player.play();
		}
		this._player.on('timeupdate', this._proxy(this, this.showAdSlots));
	},

	// @event
	callSlotEvents : function () {
		var _v = this._player.values;
		
		try {
			var currentTime = Math.floor(this._player.currentTime());
			var duration = this._player.duration();
			
			if (this._player.skipAdButton && _v.skipAd && currentTime == _v.skipAd) {
				this._player.skipAdButton.show();
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
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.impression,  this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onCreativeView : function () {
		var _v = this._player.values;
	},

	onStart : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['start'],  this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	onFirstQuartile : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['firstquartile'],  this._proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['firstquartile'] = [];
		} catch (e) {}
	},

	onMidPoint : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['midpoint'],  this._proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['midpoint'] = [];
		} catch (e) {}
	},

	onThirdQuartile : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['thirdquartile'],  this._proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['thirdquartile'] = [];
		} catch (e) {}
	},

	onComplete : function () {
		var _v = this._player.values;
		try {
			
			if (this._player.skipAdButton)
				this._player.skipAdButton.hide()
			if (this._player.clickLink)
				this._player.clickLink.hide();
			this._each(_v.currentSlot.events['complete'], this._proxy(this, this.callEvent));
			// to avoid multiple call
			_v.currentSlot.events['complete'] = [];
		} catch (e) {}
	},

	onMute : function () {
		var _v = this._player.values;
		if (this._player.muted()) {
			if (_v.isMuted)
				return; //already muted
			_v.isMuted = true;
		} else {
			if (!_v.isMuted)
				return; //already unmuted
			_v.isMuted = false;
		}
		try {
			this._each( _v.isMuted? _v.currentSlot.events['mute'] : _v.currentSlot.events['unmute'] , this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	onPause : function () {
		var _v = this._player.values;
		if (this._player.paused()) {
			if (_v.isPaused)
				return; //already paused
			_v.isPaused = true;
		} else {
			if (!_v.isPaused)
				return; //already resumed
			_v.isPaused = false;
		}
		try {
			this._each(_v.isPaused? _v.currentSlot.events['pause'] : _v.currentSlot.events['resume'], this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onRewind : function () {
		var _v = this._player.values;
		try {
			this._each( _v.currentSlot.events['rewind'], this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	onFullscreen : function () {
		var _v = this._player.values;
		try {
			this._each(this._player.isFullScreen ? _v.currentSlot.events['fullscreen'] : _v.currentSlot.events['exitfullscreen'], this._proxy(this, this.callEvent));
			this._each(this._player.isFullScreen ? _v.currentSlot.events['expand'] : _v.currentSlot.events['collapse'], this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onAcceptInvitation : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['acceptinvitation'] , this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	//TODO
	onClose : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['close'] , this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	onSkip : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['skip'], this._proxy(this, this.callEvent));
		} catch (e) {}
		
		if (this._player.skipAdButton)
			this._player.skipAdButton.hide();
		if (this._player.clickLink)
			this._player.clickLink.hide();
		
		this.resumePlayBackAfterSlotShow();
	},

	//TODO
	onProgress : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.events['progress'], this._proxy(this, this.callEvent));
		} catch (e) {}
	},

	onClick : function () {
		var _v = this._player.values;
		try {
			this._each(_v.currentSlot.clickEvents, this._proxy(this, this._player.vast.callEvent));
		} catch (e) {}
		
		if (this._player.skipAdButton)
			this._player.skipAdButton.hide();
		if (this._player.clickLink)
			this._player.clickLink.hide();
		
		_v.paused = true;
		this.resumePlayBackAfterSlotShow();
	}
    }; // var _vast

    try {
	if (_window.videojs) { // v4

		/**
		 * Merge two objects together and return the original.
		 * @param  {Object} obj1
		 * @param  {Object} obj2
		 * @return {Object}
		 */ 
		_merge = function(obj1, obj2){
			if (!obj2) { return obj1; }
			for (var key in obj2){
				if (obj2.hasOwnProperty(key)) {
					obj1[key] = obj2[key];
				}
			}
			return obj1;
		};

		/* for CDN version */
		function vastPlugin (options, args) {
			var _player = this;
			var _V_ = _window.videojs;
			
			_V_.Xdr = _V_.Component.extend(_merge(_xdr, {
				_V_ : _window.videojs,
				
				createElement : function (type, attrs) {
					var div = _V_.Component.prototype.createEl(null, {
						innerHTML : '<iframe style="width: 0px; height: 0px;">'
					});
					div.style.display = 'none';
					return div;
				},
				
				init : function (player, options) {
					options = typeof options == 'object'? options : {};
					options['el'] = this.createElement();
					
					_V_.Component.call(this, player, options);
					
					this._player = player;
					this._el = this.el().firstChild;
				}
			}));
			
			_V_.SkipAdButton = _V_.Button.extend(_merge(_skip, {
				_V_ : _window.videojs,
				
				init : function (player, options) {
					options = typeof options == 'object'? options : {};
					options['el'] = this.createElement();
					
					_V_.Button.call(this, player, options);
					
					this._player = player;
					this._el     = this.el();
					
					this.on('click', this.onClick);
					this._fadeOut();
				},
				
				createElement : function() {
					return _V_.Component.prototype.createEl('div', {
						className : this.buildCSSClass(),
						innerHTML : 'Skip Ad',
						role      : 'button'
					});
				}
			}));
			
			_V_.ClickLink = _V_.Component.extend(_merge(_link, {
				_V_ : _window.videojs,
				
				init : function (player, options) {
					options = typeof options == 'object'? options : {};
					options['el'] = this.createElement();
					
					_V_.Component.call(this, player, options);
					
					this._player = player;
					this._el     = this.el();
					this.hide();
				},
				
				createElement : function() {
					return _V_.Component.prototype.createEl('div', {
						className : this.buildCSSClass(),
						innerHTML : '<a href="#" target="_blank"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>'
					});
				}
			}));

			_V_.Vast = _V_.Component.extend(_merge(_vast, {
				_V_ : _window.videojs,
				
				_options : function () {
					return this._player.options();
				},
				
				init : function (player, options) {
					_V_.Component.call(this, player, options);
					
					this._player = player;
					this._el = this._player.el();
					this.initAds();
				}
			}));
			
			_player.ready( function() {
				this.values = {guid : 0};
				
				this.xdr = this.addChild('xdr');
				this.skipAdButton = this.addChild('skipAdButton');
				this.clickLink = this.addChild('clickLink');
				
				this.vast = this.addChild('vast');
			});
		};
		_window.videojs.plugin('vastPlugin', vastPlugin);
		
	} else {
		// xdr
		_V_.options.components['xdr'] = {};
		_V_.Xdr = _V_.Component.extend(_xdr);
		
		// skip button
		_V_.options.components['skipAdButton'] = {};
		_V_.SkipAdButton = _V_.Button.extend(_skip);

		// click link
		_V_.options.components['clickLink'] = {};
		_V_.ClickLink = _V_.Component.extend(_link);

		// vast plugin
		_window._V_.options.components['vast'] = {};
		_window._V_.Vast = _V_.Component.extend(_vast);
		
	}
    } catch (e) {}

}) (window);

