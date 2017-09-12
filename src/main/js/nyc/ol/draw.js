var nyc = nyc || {};
nyc.ol = nyc.ol || {};

/**
 * @desc A class to provide the user with drawing tools
 * @public
 * @class
 * @extends {nyc.EventHandling}
 * @constructor
 * @param {nyc.ol.Draw.Options} options Constructor options
 * @fires nyc.ol.Draw#addfeature
 * @fires nyc.ol.Draw#changefeature
 * @fires nyc.ol.Draw#removefeature
 */
nyc.ol.Draw = function(options){
	this.features = new ol.Collection();
	this.map = options.map;
	this.view = this.map.getView();
	this.source = new ol.source.Vector({features: this.features});
	this.viewport = $(this.map.getViewport());
	this.removed = [];
	this.geoJson = new ol.format.GeoJSON();
	this.storeKey = document.location.href.replace(document.location.search, '') + 'nyc.ol.Draw.features';

	this.restore();

	this.layer = new ol.layer.Vector({
		source: this.source,
		style: options.style || this.defaultStyle,
		zIndex: 100
	});
	this.map.addLayer(this.layer);

	this.accuaracyLayer = new ol.layer.Vector({
		source: this.source,
		style: options.accuracyStyle || this.accuracyStyle,
		visible: options.showAccuracy === undefined ? true : options.showAccuracy
	});
	this.map.addLayer(this.accuaracyLayer);

	this.createModify();
	this.buttonMenu();
	this.mover = new nyc.ol.Drag(this.layer);
	this.mover.setActive(false);
	this.map.addInteraction(this.mover);
	this.viewport.on('contextmenu', $.proxy(this.contextMenu, this));
	$(document).keyup($.proxy(this.keyUp, this));

	this.tracker = new nyc.ol.Tracker({map: this.map});
	this.tracker.layer.setZIndex(200);
	this.tracker.on(nyc.ol.Tracker.EventType.UPDATED, this.updateTrack, this);
};

nyc.ol.Draw.prototype = {
	/**
	 * @desc The tracker used to draw based on device geolocation 
	 * @public
	 * @member {nyc.ol.Tracker}
	 */
	tracker: null,
	/**
	 * @private
	 * @member {ol.interaction.Draw}
	 */
	drawer: null,
	/**
	 * @private
	 * @member {ol.interaction.Modify}
	 */
	modify: null,
	/**
	 * @private
	 * @member {nyc.ol.Tracker}
	 */
	tracker: null,
	/**
	 * @private
	 * @member {ol.Collection}
	 */
	features: null,
	/**
	 * @private
	 * @member {nyc.ol.Drag}
	 */
	mover: null,
	/**
	 * @private
	 * @member {ol.Map}
	 */
	map: null,
	/**
	 * @private
	 * @member {ol.View}
	 */
	view: null,
	/**
	 * @private
	 * @member {ol.Feature}
	 */
	gpsTrack: null,
	/**
	 * @private
	 * @member {Array<ol.Feature>}
	 */
	removed: null,
	/**
	 * @private
	 * @member {nyc.ol.Draw.Type}
	 */
	type: null,
	/**
	 * @private
	 * @member {ol.source.Vector}
	 */
	source: null,
	/**
	 * @private
	 * @member {ol.layer.Vector}
	 */
	layer: null,
	/**
	 * @private
	 * @member {JQuery}
	 */
	viewport: null,
	/**
	 * @private
	 * @member {JQuery}
	 */
	mnuBtn: null,
	/**
	 * @private
	 * @member {JQuery}
	 */
	saveBtn: null,
	/**
	 * @private
	 * @member {JQuery}
	 */
	btnMnu: null,
	/**
	 * @private
	 * @member {JQuery}
	 */
	ctxMnu: null,
	/**
	 * @private
	 * @member {nyc.Dialog}
	 */
	dia: null,
	/**
	 * @private
	 * @member {ol.format.GeoJSON}
	 */
	geoJson: null,
	/**
	 * @private
	 * @member {number}
	 */
	gpsDeltaMean: 500,
	/**
	 * @private
	 * @member {number}
	 */
	accuracyLimit: 0,
	/**
	 * @private
	 * @member {string}
	 */
	storeKey: true,
	/**
	 * @private
	 * @member {boolean}
	 */
	firstRun: true,
	/**
	 * @desc Set the accuracy limit for geolocation capture
	 * @public
	 * @method
	 * @param {number} limit The accuracy limit in meters
	 */
	setGpsAccuracyLimit: function(limit){
		this.accuracyLimit = limit;
		if (this.tracker){
			this.tracker.accuracyLimit = limit;
		}
	},
	/**
	 * @desc Return the active state
	 * @public
	 * @method
	 * @return {boolean} The active state
	 */
	active: function(){
		if (this.drawer) return this.drawer.getActive();
		if (this.tracker) return this.tracker.getTracking();
		return false;
	},
	/**
	 * @desc Activate to begin adding drawings of the specified type
	 * @public
	 * @method
	 * @param {nyc.ol.Draw.Type} type The drawing type to activate
	 */
	activate: function(type){
		var me = this;
		me.deactivate();
		me.type = type;
		if (type != nyc.ol.Draw.Type.NONE){
			var geometryFunction, maxPoints;
			$('draw-ctx-mnu').addClass(type);
			me.source.on('addfeature', me.triggerFeatureEvent, me);
			me.source.on('changefeature', me.triggerFeatureEvent, me);
			if (type == nyc.ol.Draw.Type.GPS || type == nyc.ol.Draw.Type.FREE){
				type = nyc.ol.Draw.Type.LINE;
			}else if (type == nyc.ol.Draw.Type.SQUARE){
				type = nyc.ol.Draw.Type.CIRCLE;
				geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
			}else if (type == nyc.ol.Draw.Type.BOX){
				type = nyc.ol.Draw.Type.LINE;
				maxPoints = 2;
				geometryFunction = me.boxGeometry;
			}

			if (me.type == nyc.ol.Draw.Type.GPS){
				me.beginGpsCapture();
			}else{
				me.drawer = new ol.interaction.Draw({
					source: me.source,
					type: type,
					geometryFunction: geometryFunction,
					maxPoints: maxPoints,
					freehandCondition: $.proxy(me.freehandCondition, me),
					condition: $.proxy(me.drawCondition, me)
				});
				me.map.addInteraction(me.drawer);
				me.map.addInteraction(me.modify);
			}
		}
	},
	/**
	 * @desc Get the features that are unchanged or have been added, changed, or removed
	 * @public
	 * @method
	 * @return {Object<string, Array<ol.Feature>>} The features
	 */
	getFeatures: function(){
		var features = {added: [], changed: [], unchanged: [], removed: this.removed};
		this.features.forEach(function(feature){
			if (feature._added){
				features.added.push(feature);
			}else if (feature._changed){
				features.changed.push(feature);
			}else{
				features.unchanged.push(feature);
			}
		});
		return features;
	},
	/**
	 * @desc Set features on the drawing layer
	 * @public
	 * @method
	 * @param {Array<nyc.ol.Feature>} The features
	 */
	setFeatures: function(features){
		var feats = this.features;
		feats.clear();
		this.removed = [];
		$.each(features, function(){
			feats.push(this);
		});
	},
	/**
	 * @desc Remove a features from the drawing layer
	 * @public
	 * @method
	 * @param {ol.Feature} feature The feature to remove
	 */
	removeFeature: function(feature){
		this.source.removeFeature(feature);
		this.removed.push(feature);
		this.store();
		this.trigger(nyc.ol.FeatureEventType.REMOVE, feature);
	},
	/**
	 * @desc Remove all features from the drawing layer
	 * @public
	 * @method
	 */
	clear: function(){
		this.source.clear();
		delete this.gpsTrack;
		this.removed = [];
		this.store();
	},
	/**
	 * @desc Deactivate to stop drawing
	 * @public
	 * @method
	 */
	deactivate: function(){
		this.type = null;
		this.mnuBtn.removeClass('point line polygon circle square box free gps');
		this.map.removeInteraction(this.modify);
		if (this.drawer){
			this.map.removeInteraction(this.drawer);
			this.source.un('addfeature', this.triggerFeatureEvent, this);
			this.source.un('changefeature', this.triggerFeatureEvent, this);
			delete this.drawer;
		}
		if (this.tracker.getTracking()){
			this.closePolygon(nyc.ol.FeatureEventType.CHANGE, this.getGpsTrack());
			this.tracker.setTracking(false);
		}
		if (this.mover){
			this.mover.setActive(false);
		}
	},
	/**
	 * @private
	 * @method
	 */
	createModify: function(){
		this.modify = new ol.interaction.Modify({
			features: this.features,
			deleteCondition: $.proxy(this.deleteCondition, this)
		});
	},
	/**
	 * @private
	 * @method
	 * @param {JQueryEvent} event
	 */
	keyUp: function(event){
		if (event.keyCode == 27){
			this.escape();
		}
	},
	/**
	 * @private
	 * @method
	 * @param {Array<ol.Coordinate>} coordinates
	 * @param {ol.geom.Polygon=} geometry
	 * @return {ol.geom.Polygon}
	 */
	boxGeometry: function(coordinates, geometry){
		if (!geometry){
			geometry = new ol.geom.Polygon(null);
		}
		var start = coordinates[0];
		var end = coordinates[1];
		if (end){
			geometry.setCoordinates([
                 [start, [start[0], end[1]], end, [end[0], start[1]], start]
            ]);
		}
		return geometry;
	},
	/**
	 * @private
	 * @method
	 * @param {ol.MapBrowserEvent} mapEvent
	 * @return {boolean}
	 */
	deleteCondition: function(event){
		if (ol.events.condition.singleClick(event) && ol.events.condition.noModifierKeys(event)){
			this.escape();
			return true;
		}
	},
	/**
	 * @private
	 * @method
	 * @param {ol.MapBrowserEvent} mapEvent
	 * @return {boolean}
	 */
	drawCondition: function(mapEvt){
	    var evt = mapEvt.originalEvent;
		return evt.button != 2 &&
			!evt.shiftKey &&
			!$(evt.target).hasClass('draw-mnu-btn') &&
			!this.mover.getActive();
	},
	/**
	 * @private
	 * @method
	 * @param {ol.MapBrowserEvent} mapEvent
	 * @return {boolean}
	 */
	freehandCondition: function(mapEvt){
		return this.type == nyc.ol.Draw.Type.FREE && this.drawCondition(mapEvt);
	},
	/**
	 * @private
	 * @method
	 * @return {ol.style.Style}
	 */
	accuracyStyle: function(feature, resolution){
		var accuracy = feature.get('accuracy') || 0;
		var pixelAccuracy = accuracy/resolution;
        return new ol.style.Style({
			image: new ol.style.Circle({
				radius: pixelAccuracy,
				fill: new ol.style.Fill({
					color: 'rgba(255,255,0,.03)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(255,255,0,1)',
					width: .25
				})
			}),
			zindex: 100
		});
	},
	/**
	 * @private
	 * @method
	 * @return {Array<ol.style.Style>}
	 */
	defaultStyle: function(feature, resolution){
		var accuracy = feature.get('accuracy') || 0;
		var radius = accuracy ? 3 : 7;
		return [
	        new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255,255,255,.2)'
				}),
	        	zindex: 0
	        }),
	        new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 3
				}),
				zindex: 200
			}),
	        new ol.style.Style({
	        	image: new ol.style.Circle({
					radius: radius,
					fill: new ol.style.Fill({
						color: 'red'
					})
				}),
				zindex: 300
			})
		];
	},
	/**
	 * @private
	 * @method
	 */
	getGpsTrack: function(){
		if (!this.gpsTrack || $.inArray(this.gpsTrack, this.features.getArray()) == -1){
			this.gpsTrack = new ol.Feature({geometry: new ol.geom.LineString([], 'XYZM')});
			this.features.push(this.gpsTrack);
		}
		return this.gpsTrack;
	},
	/**
	 * @private
	 * @method
	 */
	beginGpsCapture: function(){
		this.tracker.accuracyLimit = this.accuracyLimit;
		this.tracker.setTracking(true);
	},
	/**
	 * @private
	 * @method
	 */
	updateTrack: function(){
		var tracker = this.tracker,
			position = tracker.positions[tracker.positions.length - 1],
			gpsTrack = this.getGpsTrack();
		gpsTrack.setGeometry(tracker.track);
		this.source.addFeature(position);
	},
	/**
	 * @private
	 * @method
	 */
	escape: function(){
		var drawer = this.drawer;
		if (drawer && drawer.getActive()){
			drawer.setActive(false);
			drawer.setActive(true);
		}
	},
	/**
	 * @private
	 * @method
	 */
	closeMenus: function(){
		$('.draw-ctx-mnu, .draw-btn-mnu').slideUp(function(){
			$('.draw-ctx-mnu').remove();
		});
	},
	/**
	 * @private
	 * @method
	 */
	buttonMenu: function(){
		var me = this, viewport = me.viewport;
		viewport.find('.ol-overlaycontainer-stopevent').append(nyc.ol.Draw.BUTTON_MENU_HTML).trigger('create');
		me.btnMnu = viewport.find('.draw-btn-mnu').controlgroup({});
		me.mnuBtn = viewport.find('.draw-btn');
		me.mnuBtn.click(function(){
			me.btnMnu.slideToggle();
			me.btnMnu.controlgroup('refresh');
		});
		$(this.map.getTarget()).click($.proxy(me.btnMnu.slideUp, me.btnMnu));
		if (nyc.storage.canDownload()){
			me.saveBtn = viewport.find('.draw-mnu-btn.save');
			me.saveBtn.click($.proxy(me.save, me));
		}else{
			me.saveBtn = $();
		}
		viewport.find('.draw-mnu-btn').click($.proxy(me.choose, me));
	},
	/**
	 * @private
	 * @method
	 */
	save: function(){
		nyc.storage.saveToFile('drawing.json', this.getGeoJson());
	},
	/**
	 * @private
	 * @method
	 * @param {JQuery.Event} event
	 */
	choose: function(event){
		var me = this, btn = event.target;
		var type = $(btn).data('draw-type'), css = btn.className.split(' ')[1] || '';
		if (css == 'delete'){
			this.clear();
		}else if(css == 'cancel'){
			me.deactivate();
		}else{
			me.activate(type);
			me.mnuBtn.removeClass('point line polygon circle square box free gps');
			me.mnuBtn.addClass(css);
		}
		me.closeMenus();
	},
	/**
	 * @private
	 * @method
	 * @param {JQuery.Event} event
	 */
	contextMenu: function(event){
		var me = this, map = me.map;
		if (me.active()){
			var feature = map.forEachFeatureAtPixel(
				map.getEventPixel(event), function(feature){
		    		if ($.inArray(feature, me.features.getArray()) > -1){
		    			return feature;
		    		}
		        });
		    if (feature){
				me.showContextMenu(event, feature);
		    }
		}
	    return false;
	},
	/**
	 * @private
	 * @method
	 * @param {ol.Feature} feature
	 */
	showContextMenu: function(event, feature){
		var me = this, left = event.offsetX, ctxMnu = $('.draw-ctx-mnu');
		if (!ctxMnu.length){
			ctxMnu = $(nyc.ol.Draw.CONTEXT_MENU_HTML).trigger('create');
		}
		ctxMnu.addClass(me.type.toLowerCase());
		me.viewport.one('click', function(e){
    		me.escape();
	    	me.closeMenus();
		});
		me.viewport.find('.ol-overlaycontainer-stopevent').append(ctxMnu);
		if (left + 125 > me.viewport.width()) {
			left = left - 125;
		}
		ctxMnu.css({left: left + 'px', top: event.offsetY + 'px'});
		ctxMnu.slideDown().controlgroup({});
		ctxMnu.find('.delete').one('click', function(){
			me.removeFeature(feature);
			me.closeMenus();
		});
		ctxMnu.find('.move').one('click', function(){
			me.mover.setActive(true);
			me.closeMenus();
		});
	},
	/**
	 * @private
	 * @method
	 * @param {ol.source.VectorEvent} event
	 */
	triggerFeatureEvent: function(event){
		var feature = event.feature;
		if (event.type == nyc.ol.FeatureEventType.ADD){
			feature._added = true;
		}else if (event.type == nyc.ol.FeatureEventType.CHANGE){
			feature._changed = true;
		}
		if (this.type == nyc.ol.Draw.Type.FREE && event.type == nyc.ol.FeatureEventType.ADD){
			this.closePolygon(event.type, feature);
		}else{
			this.triggerEvent(event.type, feature);
		}
	},
	/**
	 * @private
	 * @method
	 * @param {nyc.ol.FeatureEventType} eventType
	 * @param {ol.Feature} feature
	 */
	closePolygon: function(eventType, feature){
		var me = this;
		me.source.un('addfeature', me.triggerFeatureEvent, me);
		me.source.un('changefeature', me.triggerFeatureEvent, me);
		if (feature.getGeometry().getCoordinates().length >= 3){
			me.dia = me.dia || new nyc.Dialog();
			me.dia.yesNo({message: 'Create ploygon?', callback: function(yesNo){
				me.triggerEvent(eventType, feature, yesNo);
				me.source.on('addfeature', me.triggerFeatureEvent, me);
				me.source.on('changefeature', me.triggerFeatureEvent, me);
			}});
		}else{
			me.source.on('addfeature', me.triggerFeatureEvent, me);
			me.source.on('changefeature', me.triggerFeatureEvent, me);
		}
	},
	/**
	 * @private
	 * @method
	 * @param {ol.Feature} feature
	 * @param {boolean} polygon
	 * @return {ol.Feature}
	 */
	geomToPolygon: function(feature, polygon){
		var geom = feature.getGeometry();
		if (geom.getType() == 'Circle'){
			feature.setGeometry(ol.geom.Polygon.fromCircle(geom));
		}else if (polygon){
			geom.appendCoordinate(geom.getFirstCoordinate());
			feature.setGeometry(new ol.geom.Polygon([geom.getCoordinates()]));
		}
		this.store();
		return feature;
	},
	/**
	 * @private
	 * @method
	 * @param {nyc.ol.Draw.Type} drawType
	 */
	triggerEvent: function(type, feature, polygon){
		this.saveBtn.show();
		this.btnMnu.controlgroup('refresh');
		this.trigger(type, this.geomToPolygon(feature, polygon));
	},
	/**
	 * @private
	 * @method
	 */
	getGeoJson: function(){
		return this.geoJson.writeFeatures(
			this.source.getFeatures(),
			{featureProjection: this.view.getProjection()}
		);
	},
	/**
	 * @private
	 * @method
	 */
	store: function(){
		var features = this.source.getFeatures();
		if (features.length){
			nyc.storage.setItem(
				this.storeKey,
				this.geoJson.writeFeatures(
					features,
					{featureProjection: this.view.getProjection()}
				)
			);
			this.saveBtn.show();
			this.btnMnu.controlgroup('refresh');
		}else{
			nyc.storage.removeItem(this.storeKey);
			this.saveBtn.hide();
			this.btnMnu.controlgroup('refresh');
		}
	},
	/**
	 * @private
	 * @method
	 */
	restore: function(){
		var me = this, features = nyc.storage.getItem(me.storeKey);
		if (features){
			features = me.geoJson.readFeatures(
				features,
				{
					dataProjection: 'EPSG:4326',
					featureProjection: this.view.getProjection()
				}
			);
		}
		if (features && features.length){
			var dia = new nyc.Dialog();
			dia.yesNo({
				message: 'Retore previous drawing data?',
				callback: function(yesNo){
					if (yesNo){
						me.features.extend(features);
						me.saveBtn.show();
						me.btnMnu.controlgroup('refresh');
					}
				}
			});
		}
	}
};

nyc.inherits(nyc.ol.Draw, nyc.EventHandling);

/**
 * @desc Constructor options for {@link nyc.ol.Draw}
 * @public
 * @typedef {Object}
 * @property {ol.Map} map The OpenLayers map with which the user will interact
 * @property {ol.style.Style=} style The style to use for features added to the map
 * @property {ol.style.Style=} accuracyStyle The style to use for displaying geolocation accuracy values
 * @property {boolean} [showAccuracy=true] Visibility of the accuracy layer
 */
nyc.ol.Draw.Options;

/**
 * @desc Enumeration for draw types
 * @public
 * @enum {string}
 */
nyc.ol.Draw.Type  = {
	/**
	 * @desc The point drawing type
	 */
	POINT: 'Point',
	/**
	 * @desc The line drawing type
	 */
	LINE: 'LineString',
	/**
	 * @desc The polugon drawing type
	 */
	POLYGON: 'Polygon',
	/**
	 * @desc The circle drawing type
	 */
	CIRCLE: 'Circle',
	/**
	 * @desc The square drawing type
	 */
	SQUARE: 'Square',
	/**
	 * @desc The box drawing type
	 */
	BOX: 'Box',
	/**
	 * @desc The freehand drawing type
	 */
	FREE: 'Free',
	/**
	 * @desc The GPS capture drawing type
	 */
	GPS: 'GPS',
	/**
	 * @desc No drawing type
	 */
	NONE: 'None'
};

/**
 * @private
 * @const
 * @type {string}
 */
//nyc.ol.Draw.CONTEXT_MENU_HTML = '<div class="ctl ol-unselectable draw-ctx-mnu">' +
//		'<div class="draw-mnu-btn delete"><button class="ctl-btn ui-btn ui-corner-top">Delete feature</button></div>' +
	//	'<div class="draw-mnu-btn move"><button class="ctl-btn ui-btn ui-corner-bottom">Move feature</button></div>' +
	//'</div>';
nyc.ol.Draw.CONTEXT_MENU_HTML =	'<div class="ol-unselectable ctl draw-ctx-mnu" data-role="controlgroup">' +
	'<button class="draw-mnu-btn delete" data-role="button">Delete feature</button>' +
	'<button class="draw-mnu-btn move" data-role="button">Move feature</button>' +
	'</div>';

/**
 * @private
 * @const
 * @type {string}
 */
nyc.ol.Draw.BUTTON_MENU_HTML = '<a class="draw-btn ctl ctl-btn" data-role="button" data-icon="none" data-iconpos="notext">Draw</a></div>' +
'<div class="ol-unselectable ctl draw-btn-mnu" data-role="controlgroup">' +
	'<button class="draw-mnu-btn save" data-draw-type="None" data-role="button" title="Save the current drawing">Save...</button>' +
	'<button class="draw-mnu-btn point" data-draw-type="Point" data-role="button" title="Click to draw a point">Point</button>' +
	'<button class="draw-mnu-btn line" data-draw-type="LineString" data-role="button" title="Click to draw each point of a line">Line</button>' +
	'<button class="draw-mnu-btn polygon" data-draw-type="Polygon" data-role="button" title="Click to draw each point of a polygon">Polygon</button>' +
	'<button class="draw-mnu-btn circle" data-draw-type="Circle" data-role="button" title="Click then drag to draw a circle">Circle</button>' +
	'<button class="draw-mnu-btn square" data-draw-type="Square" data-role="button" title="Click then drag to draw a square">Square</button>' +
	'<button class="draw-mnu-btn box" data-draw-type="Box" data-role="button" title="Click then drag to draw a box">Box</button>' +
	'<button class="draw-mnu-btn free" data-draw-type="Free" data-role="button" title="Click and drag to draw a freehand line">Freehand</button>' +
	'<button class="draw-mnu-btn gps" data-draw-type="GPS" data-role="button" title="Capture coordiantes from device geoloaction">GPS Capture</button>' +
	'<button class="draw-mnu-btn delete" data-draw-type="None" data-role="button" title="Delete all drawn features">Clear All</button>' +
	'<button class="draw-mnu-btn cancel" data-draw-type="None" data-role="button" title="Deactivate drawing">Deactivate</button>' +
'</div>';

/**
 * @desc A class to move features
 * @class
 * @extends {ol.interaction.Pointer}
 * @constructor
 * @param {ol.layer.Vector} layer The layer whose features can be moved
 * @see http://www.openlayers.org/
 */
nyc.ol.Drag = function(layer){
	/**
	 * @private
	 * @member {ol.layer.Vector}
	 */
	this.layer = layer;
	ol.interaction.Pointer.call(this, {
		handleDownEvent: nyc.ol.Drag.prototype.handleDownEvent,
		handleDragEvent: nyc.ol.Drag.prototype.handleDragEvent,
		handleMoveEvent: nyc.ol.Drag.prototype.handleMoveEvent,
		handleUpEvent: nyc.ol.Drag.prototype.handleUpEvent
	});
	/**
	 * @private
	 * @member {ol.Pixel}
	 */
	this.coords = null;
	/**
	 * @private
	 * @member {ol.Feature}
	 */
	this.feature = null;
	/**
	 * @private
	 * @member {string}
	 */
	this.prevCursor = null;
};

ol.inherits(nyc.ol.Drag, ol.interaction.Pointer);

/**
 * @private
 * @method
 * @param {ol.MapBrowserEvent} event
 * @return {boolean}
 */
nyc.ol.Drag.prototype.handleDownEvent = function(event){
	var me = this, map = event.map;
	var feature = map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
		if (layer === me.layer){
			return feature;
		}
	});
	if (feature) {
		this.coords = event.coordinate;
		this.feature = feature;
	}
	return !!feature;
};

/**
 * @private
 * @method
 * @param {ol.MapBrowserEvent} event
 */
nyc.ol.Drag.prototype.handleDragEvent = function(event){
	var me = this, map = event.map;

	var feature = map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
		if (layer === me.layer){
			return feature;
		}
	});

	var deltaX = event.coordinate[0] - me.coords[0];
	var deltaY = event.coordinate[1] - me.coords[1];

	var geometry = me.feature.getGeometry();
	geometry.translate(deltaX, deltaY);

	me.coords[0] = event.coordinate[0];
	me.coords[1] = event.coordinate[1];
};

/**
 * @private
 * @method
 * @param {ol.MapBrowserEvent} event
 */
nyc.ol.Drag.prototype.handleMoveEvent = function(event){
	var me = this, map = event.map;
	var feature = map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
		if (layer === me.layer){
			return feature;
		}
	});
	if (feature){
		$(map.getViewport()).css('cursor', 'move');
	}
};

/**
 * @private
 * @method
 * @param {ol.MapBrowserEvent} event
 * @return {boolean}
 */
nyc.ol.Drag.prototype.handleUpEvent = function(event) {
	this.coords = null;
	this.feature = null;
	$(event.map.getViewport()).css('cursor', 'inherit');
	this.setActive(false);
	return false;
};
