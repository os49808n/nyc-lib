/**
 * @module nyc/ol/MapMgr
 */

import $ from 'jquery'
import nyc from 'nyc'
import Decorate from 'nyc/ol/format/Decorate'
import FilterAndSort from 'nyc/ol/source/FilterAndSort'
import Collapsible from 'nyc/Collapsible'
import ListPager from 'nyc/ListPager'
import Basemap from 'nyc/ol/Basemap'
import MultiFeaturePopup from 'nyc/ol/MultiFeaturePopup'
import FeatureTip from 'nyc/ol/FeatureTip'
import Layer from 'ol/layer/Vector'
import LocationMgr from 'nyc/ol/LocationMgr'
import MapLocator from 'nyc/MapLocator'

const proj4 = nyc.proj4

/**
 * @desc Class that provides an nyc.ol.Basemap with controls and data from CSV
 * @public
 * @abstract
 * @class
 */
class MapMgr {
  /**
   * @desc Create an instance of Basemap
   * @public
   * @constructor
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   */
  constructor(options) {
  /**
     * @private
     * @member {module:nyc/Search~Search.FeatureSearchOptions}
     */
    this.facilitySearch = options.facilitySearch    
    /**
     * @private
     * @member {module:nyc/ListPager~ListPager}
     */
    this.pager = this.createPager(options)
    /**
     * @desc The data to display in the map layer
     * @public
     * @member {module:nyc/ol/format/CsvPoint~CsvPoint}
     */
    this.source = this.createSource(options)
    this.source.autoLoad().then($.proxy(this.ready, this))
    /**
     * @desc The map
     * @public
     * @member {ol.Map}
     */
    this.map = new Basemap({
      target: $(options.mapTarget).get(0)
    })
    /**
     * @desc The view
     * @public
     * @member {ol.View}
     */
    this.view = this.map.getView()    
    /**
     * @desc The vector layer for facilities
     * @public
     * @member {ol.layer.Vector}
     */
    this.layer = new Layer({
      source: this.source,
      style: this.createStyle(options)
    })
    this.map.addLayer(this.layer)
    /**
     * @desc The popup
     * @public
     * @member {module:nyc/ol/MultiFeaturePopup~MultiFeaturePopup}
     */
    this.popup = new MultiFeaturePopup({
      map: this.map,
      layers: [this.layer]
    })
    /**
     * @desc The LocationMgr
     * @public
     * @member {module:nyc/ol/LocationMgr~LocationMgr}
     */
    this.locationMgr = this.createLocationMgr(options)
    this.locationMgr.on('geocoded', this.located, this)
    this.locationMgr.on('geolocated', this.located, this)
    /**
     * @private
     * @member {module:nyc/Locator~Locator.Result}
     */
    this.location = {}
    new FeatureTip({
      map: this.map,
      tips: [{
        layer: this.layer,
        label: (feature) => {
          return {html: feature.getTip()}
        }
      }]
    })
    this.view.fit(Basemap.EXTENT, {
      size: this.map.getSize(),
      duration: 500
    })
    this.checkMouseWheel(options.mouseWheelZoom)
  }
  /**
   * @desc Crreate the parent format for the source
   * @public
   * @abstract
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   * @returns {ol.format.Feature} The parent format
   */
  createParentFormat(options) {
    throw 'must be implemented'
  }
  /**
   * @desc Crreate the feature decorations
   * @public
   * @abstract
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   * @returns {Array<Object<string, Object>>} The embellished decorations
   */
  createDecorations(options) {
    throw 'must be implemented'
  }  
  /**
   * @desc Handles geocoded and geolocated events
   * @access protected
   * @method
   * @param {module:nyc/Locator~Locator.Result} location Location
   */
  located(location) {
    this.location = location
    if (this.pager) {
      this.resetList()
    }
  }
  /**
   * @desc Reset the facilities list
   * @public
   * @method
   * @param {Object} event Event object
   */
  resetList(event) {
    const coordinate = this.location.coordinate
    this.popup.hide()
    this.pager.reset(
      coordinate ? this.source.sort(coordinate) : this.source.getFeatures()
    )
  }
  /**
   * @desc Handles features after they are loaded
   * @access protected
   * @method
   * @param {Array<ol.Feature>} features The facility features
   */
  ready(features) {
    features = features || []
    if (this.facilitySearch) {
      const options = typeof this.facilitySearch === 'object' ? this.facilitySearch : {}
      options.features = features
      this.locationMgr.search.setFeatures(options)
    }
    this.pager.reset(features)
    nyc.ready($('body'))
  }
  /**
   * @desc Centers and zooms to the provided feature
   * @public
   * @method
   * @param {ol.Feature} feature OpenLayers feature
   */
  zoomTo(feature) {
    const popup = this.popup
    popup.hide()
    this.map.once('moveend', () => {
      popup.showFeature(feature)
    })
    this.view.animate({
      center: feature.getGeometry().getCoordinates(),
      zoom: MapLocator.ZOOM_LEVEL
    })
  }  
  /**
   * @desc Provides directions to the provided facility feature
   * @public
   * @method
   * @param {ol.Feature} feature OpenLayers feature
   */
  directionsTo(feature) {
    const to = encodeURIComponent(feature.getFullAddress())
    let from = this.getFromAddr()
    from = from ? encodeURIComponent(from) : to
    window.open(`https://www.google.com/maps/dir/${from}/${to}`)
  }
  /**
   * @desc Convert current user location into usable form for Google directions API
   * @protected
   * @method
   * @return {string|Array<number>} Location coordinates or name
   */
  getFromAddr() {
    const location = this.location
    if (location.type === 'geolocated') {
      const coordinates = proj4(
        this.view.getProjection().getCode(),
        'EPSG:4326',
        location.coordinate
      )
      return `${coordinates[1]},${coordinates[0]}`
    }
    return location.name || ''
  }
  /**
   * @desc Handles the event triggered when a rendered feature's collapsible details is expanded
   * @access protected
   * @method
   * @param {Object} event Event object
   */
  expandDetail(event) {
    this.popup.pan()
  }
  /**
   * @private
   * @method
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   */
  createStyle(options) {
    if (options.iconUrl) {
      //create a style based on an icon url
    }
    return options.facilityStyle
  }
  /**
   * @private
   * @method
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   */
  createSource(options) {
    const parentFormat = this.createParentFormat(options)
    const decorations = this.createDecorations(options)
    return new FilterAndSort({
      url: options.facilityUrl,
      format: new Decorate({
        decorations: decorations,
        parentFormat: parentFormat
      })
    })
  }
  /**
   * @private
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   * @returns {module:nyc/ListPager~ListPager|undefined}
   */
  createPager(options) {
    if (options.listTarget) {
      return new ListPager({
        target: options.listTarget,
        itemType: options.facilityType
      })
    }
  }
  /**
   * @private
   * @method
   * @param {module:nyc/ol/MapMgr~MapMgr.Options} options Constructor options
   * @returns {module:nyc/ol/LocationMgr~LocationMgr}
   */
  createLocationMgr(options) {
    return new LocationMgr({
      map: this.map,
      searchTarget: options.searchTarget,
      dialogTarget: options.mapTarget,
      url: options.geoclientUrl
    })  
  }
  /**
   * @private
   * @method
   * @param {boolean} mouseWheelZoom
   */
  checkMouseWheel(mouseWheelZoom) {
    if (mouseWheelZoom !== true) {
      let wheel
      this.map.getInteractions().forEach(interaction => {
        if (interaction instanceof MouseWheelZoom) {
          wheel = interaction
        }
      })
      this.map.removeInteraction(wheel)
    }
  }  
}

/**
 * @desc Default facility feature decorations
 * @public
 * @const
 * @mixin
 * @type {Object<string, fuction>}
 */
MapMgr.FEATURE_DECORATIONS = {
  /**
   * @desc Returns a facility feature rendered as a jQuery
   * @public
   * @method
   * @return {jQuery} The rendered feature
   */
  html() {
    return $('<div class="facility"></div>')
      .addClass(this.cssClass())
      .append(this.distanceHtml())
      .append(this.nameHtml())
      .append(this.distanceHtml(true))
      .append(this.addressHtml())
      .append(this.phoneButton())
      .append(this.emailButton())
      .append(this.websiteButton())
      .append(this.mapButton())
      .append(this.directionsButton())
      .append(this.detailsCollapsible())
  },
  /**
   * @desc Returns the feature tip value
   * @public
   * @method
   */
  getTip() {
    return this.getName()
  },
  /**
   * @desc Returns the name of a facility feature
   * @public
   * @method
   */
  getName() {
    throw 'A getName decoration must be provided'
  },
  /**
   * @desc Returns a CSS class for the rendered facility feature
   * @public
   * @method
   */
  cssClass() {},
  /**
   * @desc Returns the address line 1 of a facility feature
   * @public
   * @method
   */
  getAddress1() {
    throw 'A getAddress1 decoration must be provided to use default html method and directions'
  },
  /**
   * @desc Returns the address line 2 of a facility feature
   * @public
   * @method
   * @return {string} The address line 2
   */
  getAddress2() {
    return ''
  },
  /**
   * @desc Returns the city, state zip line of a facility feature
   * @public
   * @method
   */
  getCityStateZip() {
    throw 'A getCityStateZip decoration must be provided to use default html method and directions'
  },
  /**
   * @desc Returns full address for use with Google directions API
   * @public
   * @method
   * @return {string} The full address
   */
  getFullAddress() {
    return `${this.getAddress1()}\n${this.getAddress2()},\n${this.getCityStateZip()}`
  },
  /**
   * @desc Returns the phone number for a facility feature
   * @public
   * @method
   */
  getPhone() {},
  /**
   * @desc Returns the email for a facility feature
   * @public
   * @method
   */
  getEmail() {},
  /**
   * @desc Returns the website URL for a facility feature
   * @public
   * @method
   */
  getWebsite() {},
  /**
   * @desc Returns additional details for the facility feature
   * @public
   * @method
   */
  detailsHtml() {},
  /**
   * @desc Returns the name of a facility feature as jQuery
   * @public
   * @method
   * @return {jQuery} The name of a facility feature as jQuery
   */
  nameHtml() {
    return $('<h3 class="name notranslate"></h3>').html(this.getName())
  },
  /**
   * @desc Returns the full address of a facility feature as jQuery
   * @public
   * @method
   * @return {jQuery} The full address of a facility feature as jQuery
   */
  addressHtml() {
    const html = $('<div class="addr notranslate"></div>')
      .append(`<div class="ln1">${this.getAddress1()}</div>`)
    if (this.getAddress2()) {
      html.append(`<div class="ln2">${this.getAddress2()}</div>`)
    }
    return html.append(`<div class="ln3">${this.getCityStateZip()}</div>`)
  },
  /**
   * @desc Returns a button as jQuery that when clicked will zoom to the facility
   * @public
   * @method
   * @return {jQuery} The map button as jQuery
   */
  mapButton() {
    return $('<button class="btn rad-all map btn-dark">Map</button>')
      .prepend('<span class="screen-reader-only">Locate this facility on the </span>')
      .data('feature', this)
      .click(this.handleButton)
  },
  /**
   * @desc Returns a button as jQuery that when clicked will provide directions to the facility
   * @public
   * @method
   * @return {jQuery} The directions button as jQuery
   */
  directionsButton() {
    return $('<button class="btn rad-all dir btn-dark">Directions</button>')
      .data('feature', this)
      .click(this.handleButton)
  },
  /**
   * @desc Returns a button as jQuery that when clicked will call the provided phone number
   * @public
   * @method
   * @return {jQuery} The phone button as jQuery
   */
  phoneButton() {
    const phone = this.getPhone()
    if (phone) {
      return $(`<a class="btn rad-all phone btn-dark" role="button">${phone}</a>`)
        .attr('href', `tel:${phone}`)
    }
  },
  /**
   * @desc Returns a button as jQuery that when clicked will open email editor for the provided email
   * @public
   * @method
   * @return {jQuery} The email button as jQuery
   */
  emailButton() {
    const email = this.getEmail()
    if (email) {
      return $('<a class="btn rad-all email btn-dark" role="button">Email</a>')
        .attr('href', `mailto:${email}`)
    }
  },
  /**
   * @desc Returns a button as jQuery that when clicked will open the facility web site
   * @public
   * @method
   * @return {jQuery} The website button as jQuery
   */
  websiteButton() {
    const url = this.getWebsite()
    if (url) {
      return $('<a class="btn rad-all web btn-dark" target="blank" role="button">Website</a>')
        .attr('href', url)
    }
  },
  /**
   * @desc Returns the distance from the user location to the facility as jQuery
   * @public
   * @method
   * @param {boolean} screenReaderOnly Return distance for screen readers
   * @return {jQuery} The distance from the user location to the facility as jQuery
   */
  distanceHtml(screenReaderOnly) {
    if (this.getDistance) {
      const html = $('<div class="dist"></div>')
      const distance = this.getDistance()
      if (screenReaderOnly) {
        html.addClass('screen-reader-only')
        if (distance.units === 'ft') {
          return html.html(`${(distance.distance / 5280).toFixed(2)} miles`)
        }
        return html.html(`${(distance.distance / 1000).toFixed(2)} kilometers`)
      }
      html.attr('aria-hidden', true)
      if (distance.units === 'ft') {
        return html.html(`&bull; ${(distance.distance / 5280).toFixed(2)} mi &bull;`)
      }
      return html.html(`&bull; ${(distance.distance / 1000).toFixed(2)} km &bull;`)
    }
  },
  /**
   * @desc Returns collapsible details for the facility features as jQuery
   * @public
   * @method
   * @return {jQuery} The collapsible details as jQuery
   */
  detailsCollapsible() {
    const details = this.detailsHtml()
    if (details) {
      const collapsible = new Collapsible({
        target: $('<div class="dtl"></div>'),
        title: this.detailButtonText || 'Details',
        content: details,
        collapsed: true
      })
      collapsible.on('change', this.app.expandDetail, this.app)
      return collapsible.getContainer()
    }
  },
  /**
   * @desc Handles map and direction button click
   * @public
   * @static
   * @function
   * @param {jQuery.Event} event Event object
   */
  handleButton(event) {
    const target = $(event.currentTarget)
    const feature = target.data('feature')
    if (target.hasClass('map')) {
      feature.app.zoomTo(feature)
    } else {
      feature.app.directionsTo(feature)
    }
  }
}

/**
 * @desc Constructor options for {@link module:nyc/ol/MapMgr~MapMgr}
 * @public
 * @typedef {Object}
 * @property {string} facilityUrl The URL for the facility features data
 * @property {string} geoclientUrl The URL for the Geoclient geocoder with approriate keys
 * @property {jQuery|Element|string=} mapTarget The target element for the map
 * @property {jQuery|Element|string=} searchTarget The target element for search input
 * @property {jQuery|Element|string=} listTarget The target element for facility list
 * @property {string} [facilityType=Facilities] Title for the facilites list
 * @property {string=} iconUrl A URL to an image for use as a falcility symbol
 * @property {ol.style.Style=} facilityStyle The styling for the facilities layer
 * @property {module:nyc/Search~Search.FeatureSearchOptions|boolean} [facilitySearch=true] Search options for feature searches or true to use default search options
 * @property {boolean} [mouseWheelZoom=false] Allow mouse wheel map zooming
 */
MapMgr.Options

export default MapMgr