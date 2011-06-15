define(["../buildControl", "../fileUtils", "../fs"], function(bc, fileUtils, fs) {
	var
		computingLayers
			// the set of layers being computed; use this to detect circular layer dependencies
			= {},

		computeLayerContents= function(
			layerModule,
			include,
			exclude
		) {
			// add property layerSet (a set of pqn) to layerModule that...
			//
			//	 * includes dependency tree of layerModule
			//	 * includes all modules in layerInclude and their dependency trees
			//	 * excludes all modules in layerExclude and their dependency trees
			//	 * excludes layerModule itself
			//
			// note: layerSet is built exactly as given above, so included modules that are later excluded
			// are *not* in result layerSet
			if(layerModule && computingLayers[layerModule.pqn]){
				bc.logError("cycle detected in layer dependencies with respect to layer " + layerModule.pqn);
				return {};
			}
			computingLayers[layerModule.pqn]= 1;

			var
				includeSet= {},
				visited,
				includePhase,
				traverse= function(module) {
					var pqn= module.pqn;

					if (visited[pqn]) {
						return;
					}
					visited[pqn]= 1;
					if (includePhase) {
						includeSet[pqn]= module;
					} else {
						delete includeSet[pqn];
					}
					if(module!==layerModule && module.layer){
						var layerModuleSet= module.moduleSet || computeLayerContents(module, module.layer.include, module.layer.exclude);
						for(var p in layerModuleSet){
							if (includePhase) {
								includeSet[p]= layerModuleSet[p];
							} else {
								delete includeSet[p];
							}
						}
					}else{
						for (var deps= module.deps, i= 0; deps && i<deps.length; traverse(deps[i++])){
						}
					}
				};

			visited= {};
			includePhase= true;
			if (layerModule) {
				traverse(layerModule);
			}
			include.forEach(function(mid) {
				var module= bc.amdResources[bc.getSrcModuleInfo(mid).pqn];
				if (!module) {
					bc.logError("failed to find module (" + mid + ") while computing layer include contents");
				} else {
					traverse(module);
				}
			});

			visited= {};
			includePhase= false;
			exclude.forEach(function(mid) {
				var module= bc.amdResources[bc.getSrcModuleInfo(mid).pqn];
				if (!module) {
					bc.logError("failed to find module (" + mid + ") while computing layer exclude contents");
				} else {
					traverse(module);
				}
			});

			if(layerModule){
				layerModule.moduleSet= includeSet;
				delete computingLayers[layerModule.pqn];
			}
			return includeSet;
		},

		insertAbsMid = function(
			text,
			resource
		){
			if(!resource.mid){
				return text;
			}
			var mid= (resource.pid ? resource.pid + "/" :  "") + resource.mid;
			return text.replace(/(define\s*\(\s*)(.+)/, "$1\"" + mid + "\", $2");
		},

		getLayerText= function(
			resource,
			include,
			exclude
		) {
			var
				cache= [],
				pluginLayerText= "",
				moduleSet= computeLayerContents(resource, include, exclude);
			for (var p in moduleSet) if(!resource || p!=resource.pqn){
				var module= moduleSet[p];
				if (module.getPluginLayerText) {
					pluginLayerText+= module.getPluginLayerText();
				} else if(module.getText){
					cache.push("'" + p + "':function(){\n" + module.getText() + "\n}");
				} else {
					bc.logError("failed to include module (" + module.src + ") in layer " + resource.src);
				}
			}
			var text= "";
			if(resource){
				text= resource.getText();
				if(resource.tag.amd && bc.insertAbsMids){
					text= insertAbsMid(text, resource);
				}
			}
			return "require({cache:{\n" + cache.join(",\n") + "}});\n" + pluginLayerText + "\n" + text;
		},

		getStrings= function(
			resource
		){
			var result= "";
			resource.deps.forEach(function(dep){
				if(dep.internStrings){
					result+= dep.internStrings();
				}
			});
			return result;
		},

		getDestFilename= function(resource){
			if(!resource.tag.syncNls && !resource.tag.nls && ((resource.layer && bc.layerOptimize) || (!resource.layer && bc.optimize))){
				return resource.dest + ".uncompressed.js";
			}else{
				return resource.dest;
			}
		},

		write= function(resource, callback) {
			fileUtils.ensureDirectoryByFilename(resource.dest);
			var text, copyright= "";
			if(resource.tag.syncNls){
				text= resource.getText();
			}else if(resource.layer){
				if(resource.layer.boot || resource.layer.discard){
					// recall resource.layer.boot layers are written by the writeDojo transform
					return 0;
				}
				text= resource.layerText= getLayerText(resource, resource.layer.include, resource.layer.exclude);
				copyright= resource.layer.copyright || "";
			}else{
				text= (bc.internStrings ? getStrings(resource) : "") + resource.getText();
				if(resource.tag.amd && bc.insertAbsMids){
					text= insertAbsMid(text, resource);
				}
				resource.text= text;
				copyright= resource.pack.copyright || "";
			}
			fs.writeFile(getDestFilename(resource), copyright + text, resource.encoding, function(err) {
				callback(resource, err);
			});
			return callback;
		};
		write.getLayerText= getLayerText;
		write.getDestFilename= getDestFilename;
		write.computeLayerContents= computeLayerContents;

		return write;
});
