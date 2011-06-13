dojo.provide("davinci.appcache");

dojo.require("dojox.widget.Toaster");

if(typeof applicationCache != "undefined" && window.location.search.indexOf("nocache") == -1){
	dojo.addOnLoad(function(){
        var topic = "davinci-appcache",
            ffToaster,
            ffToasterTimer;

		new dojox.widget.Toaster({
			positionDirection: "br-up",
			duration: 4000,
			messageTopic: topic
		});
	
		if(dojo.isFF && davinci.useAppCache){
			// Firefox has a prompt to allow appcache.  If after some interval, the appcache hasn't loaded, encourage the user to click 'allow'
			ffToasterTimer = setTimeout(function(){
		        ffToaster = new dojox.widget.Toaster({
		            id: "davinci_warn",
		            positionDirection: "tr-down",
		            duration: 0
		        });
		        ffToaster.setContent("For improved performance, click \"Allow\" above for offline storage.",
		                "error");
			}, 5000);
		}

		applicationCache.addEventListener("cached", function(x){
			dojo.publish(topic, [{message:"Application cached", type:"message"}]);
		}, false);
		
		applicationCache.addEventListener("progress", function(x){
	//		dojo.publish(topic, [{message:"Progress...", type:"warning"}]); //TODO: loaded and total properties unimplemented?
			console.log("AppCache progress...");
			console.dir(x);
		}, false);
		
		applicationCache.addEventListener("checking", function(x){
			dojo.publish(topic, [{message:"Checking for updates to application cache", type:"warning"}]);
			if (ffToasterTimer) {
				cancelTimeout(ffToasterTimer);
				ffToasterTimer = 0;
			}
			if (ffToaster) {
			    ffToaster.hide();
			    // XXX destroy, to remove from memory?
			}
		}, false);
		
		applicationCache.addEventListener("downloading", function(x){
			dojo.publish(topic, [{message:"Downloading cache...", type:"warning"}]);
		}, false);
		
		applicationCache.addEventListener("error", function(x){
			dojo.publish(topic, [{message:"Error loading cache", type:"error"}]);
			console.dir(x);
		}, false);
		
		applicationCache.addEventListener("obsolete", function(x){
			dojo.publish(topic, [{message:"Manifest missing", type:"error"}]);
		}, false);
		
		applicationCache.addEventListener("noupdate", function(x){
			dojo.publish(topic, [{message:"No updates to application cache", type:"message"}]);
		}, false);
		
		applicationCache.addEventListener("updateready", function(x){
			applicationCache.swapCache();
			dojo.publish(topic, [{message:"Application cache update ready", type:"message"}]);
			alert("An update is now available.  The application will reload.");
			window.location.reload();
		}, false);

		var rev = function(str){ var r = (str||"").match(/Revision: (\d+)\|/); return r && r[1]; };
		if (rev(davinci.repositoryinfoLive) != rev(davinci.repositoryinfo)) {
			try{
				applicationCache.update();
				dojo.publish(topic, [{message:"Update available.  Loading updates...", type:"warning"}]);
			} catch(e) {
				console.error(e);
			}
		}
	});
}