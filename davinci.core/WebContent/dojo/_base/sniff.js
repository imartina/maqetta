define(["./kernel", "../has"], function(dojo, has){
	// module:
	//		dojo/sniff
	// summary:
	//		This module populates the dojo browser version sniffing properties.

	if(!has("host-browser")){
		return dojo;
	}
	var
		n = navigator,
		dua = n.userAgent,
		dav = n.appVersion,
		tv = parseFloat(dav),
		isOpera,
		isAIR,
		isKhtml,
		isWebKit,
		isChrome,
		isMac,
		isSafari,
		isMozilla ,
		isMoz,
		isIE,
		isFF,
		isQuirks,
		isIos,
		isWii;

	/*=====
	dojo.isBrowser = {
		//	example:
		//	| if(dojo.isBrowser){ ... }
	};

	dojo.isFF = {
		//	example:
		//	| if(dojo.isFF > 1){ ... }
	};

	dojo.isIE = {
		// example:
		//	| if(dojo.isIE > 6){
		//	|		// we are IE7
		//	| }
	};

	dojo.isSafari = {
		//	example:
		//	| if(dojo.isSafari){ ... }
		//	example:
		//		Detect iPhone:
		//	| if(dojo.isSafari && navigator.userAgent.indexOf("iPhone") != -1){
		//	|		// we are iPhone. Note, iPod touch reports "iPod" above and fails this test.
		//	| }
	};

	dojo.mixin(dojo, {
		// isBrowser: Boolean
		//		True if the client is a web-browser
		isBrowser: true,
		//	isFF: Number | undefined
		//		Version as a Number if client is FireFox. undefined otherwise. Corresponds to
		//		major detected FireFox version (1.5, 2, 3, etc.)
		isFF: 2,
		//	isIE: Number | undefined
		//		Version as a Number if client is MSIE(PC). undefined otherwise. Corresponds to
		//		major detected IE version (6, 7, 8, etc.)
		isIE: 6,
		//	isKhtml: Number | undefined
		//		Version as a Number if client is a KHTML browser. undefined otherwise. Corresponds to major
		//		detected version.
		isKhtml: 0,
		//	isWebKit: Number | undefined
		//		Version as a Number if client is a WebKit-derived browser (Konqueror,
		//		Safari, Chrome, etc.). undefined otherwise.
		isWebKit: 0,
		//	isMozilla: Number | undefined
		//		Version as a Number if client is a Mozilla-based browser (Firefox,
		//		SeaMonkey). undefined otherwise. Corresponds to major detected version.
		isMozilla: 0,
		//	isOpera: Number | undefined
		//		Version as a Number if client is Opera. undefined otherwise. Corresponds to
		//		major detected version.
		isOpera: 0,
		//	isSafari: Number | undefined
		//		Version as a Number if client is Safari or iPhone. undefined otherwise.
		isSafari: 0,
		//	isChrome: Number | undefined
		//		Version as a Number if client is Chrome browser. undefined otherwise.
		isChrome: 0
		//	isMac: Boolean
		//		True if the client runs on Mac
		isMac: 0,
		// isIos: Boolean
		//		True if client is iPhone, iPod, or iPad
		isIos: 0
		// isWii: Boolean
		//		True if client is Wii
		isWii: 0
	});
	=====*/

	dojo.isBrowser = true,
	dojo._name = "browser";

	// fill in the rendering support information in dojo.render.*
	if(dua.indexOf("Opera") >= 0){ isOpera = tv; }
	if(dua.indexOf("AdobeAIR") >= 0){ isAIR = 1; }
	isKhtml = (dav.indexOf("Konqueror") >= 0) ? tv : 0;
	isWebKit = parseFloat(dua.split("WebKit/")[1]) || undefined;
	isChrome = parseFloat(dua.split("Chrome/")[1]) || undefined;
	isMac = dav.indexOf("Macintosh") >= 0;
	isIos = /iPhone|iPod|iPad/.test(dua);
	isWii = typeof opera != "undefined" && opera.wiiremote;

	// safari detection derived from:
	//		http://developer.apple.com/internet/safari/faq.html#anchor2
	//		http://developer.apple.com/internet/safari/uamatrix.html
	var index = Math.max(dav.indexOf("WebKit"), dav.indexOf("Safari"), 0);
	if(index && !isChrome){
		// try to grab the explicit Safari version first. If we don't get
		// one, look for less than 419.3 as the indication that we're on something
		// "Safari 2-ish".
		isSafari = parseFloat(dav.split("Version/")[1]);
		if(!isSafari || parseFloat(dav.substr(index + 7)) <= 419.3){
			isSafari = 2;
		}
	}

	if (!has("dojo-webkit")) {
		if(dua.indexOf("Gecko") >= 0 && !isKhtml && !isWebKit){
			isMozilla = isMoz = tv;
		}
		if(isMoz){
			//We really need to get away from this. Consider a sane isGecko approach for the future.
			isFF = parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1]) || undefined;
		}
		if(document.all && !isOpera){
			isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;
			//In cases where the page has an HTTP header or META tag with
			//X-UA-Compatible, then it is in emulation mode.
			//Make sure isIE reflects the desired version.
			//document.documentMode of 5 means quirks mode.
			//Only switch the value if documentMode's major version
			//is different from isIE's major version.
			var mode = document.documentMode;
			if(mode && mode != 5 && Math.floor(isIE) != mode){
				isIE = mode;
			}
		}

		//Workaround to get local file loads of dojo to work on IE 7
		//by forcing to not use native xhr.
		if(isIE && window.location.protocol === "file:"){
			//TODO: look at this with respect to v1.7 loader changes
			dojo.config.ieForceActiveXXhr=true;
		}
	}
	dojo.locale = dojo.locale || (isIE ? n.userLanguage : n.language).toLowerCase();

	isQuirks = document.compatMode == "BackCompat";

	has.add("browser", 1);
	has.add("opera", dojo.isOpera= isOpera);
	has.add("air", dojo.isAIR= isAIR);
	has.add("khtml", dojo.isKhtml= isKhtml);
	has.add("webKit", dojo.isWebKit= isWebKit);
	has.add("chrome", dojo.isChrome= isChrome);
	has.add("mac ", dojo.isMac = isMac );
	has.add("safari", dojo.isSafari= isSafari);
	has.add("mozilla ", dojo.isMozilla = dojo.isMoz = isMozilla );
	has.add("ie", dojo.isIE = isIE );
	has.add("ff", dojo.isFF= isFF);
	has.add("quirks", dojo.isQuirks= isQuirks);
	has.add("ios", dojo.isIos= isIos);
	dojo._isDocumentOk = function(http){
		var stat = http.status || 0;
		return (stat >= 200 && stat < 300) ||	 // Boolean
			stat == 304 ||			// allow any 2XX response code
			stat == 1223 ||			// get it out of the cache
							// Internet Explorer mangled the status code
			!stat; // OR we're Titanium/browser chrome/chrome extension requesting a local file
	};

	has.add("vml", isIE);
	if (has("vml")) {
		// TODO: can this be moved to a more-appropriate module?
		// TODO: can the try-catch be removed if we know that vml is supported?
		try{
			(function(){
				document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
				var vmlElems = ["*", "group", "roundrect", "oval", "shape", "rect", "imagedata", "path", "textpath", "text"],
					i = 0, l = 1, s = document.createStyleSheet();
				if(isIE >= 8){
					i = 1;
					l = vmlElems.length;
				}
				for(; i < l; ++i){
					s.addRule("v\\:" + vmlElems[i], "behavior:url(#default#VML); display:inline-block");
				}
			})();
		}catch(e){}
	}

	return dojo;

});