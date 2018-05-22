import nyc from 'nyc/nyc'

import Dialog from '../../../src/nyc/Dialog'
import Share from '../../../src/nyc/Share'
import Tabs from '../../../src/nyc/Tabs'
import ListPager from '../../../src/nyc/ListPager'
import MapLocator from '../../../src/nyc/MapLocator'

import Translate from '../../../src/nyc/lang/Translate'
import Goog from '../../../src/nyc/lang/Goog'

import Basemap from '../../../src/nyc/ol/Basemap'
import Filters from '../../../src/nyc/ol/Filters'
import LocationMgr from '../../../src/nyc/ol/LocationMgr'
import MultiFeaturePopup from '../../../src/nyc/ol/MultiFeaturePopup'
import FeatureTip from '../../../src/nyc/ol/FeatureTip'

import CsvPoint from '../../../src/nyc/ol/format/CsvPoint'
import Decorate from '../../../src/nyc/ol/format/Decorate'

import FilterAndSort from '../../../src/nyc/ol/source/FilterAndSort'

import OlFeature from 'ol/feature'
import OlGeomPoint from 'ol/geom/point'
import OlLayerVector from 'ol/layer/vector'
import OlStyleStyle from 'ol/style/style'

import FinderApp from 'nyc/ol/FinderApp'

jest.mock('../../../src/nyc/Dialog')
jest.mock('../../../src/nyc/Share')
// jest.mock('../../../src/nyc/Tabs')
// jest.mock('../../../src/nyc/ListPager')
jest.mock('../../../src/nyc/MapLocator')

jest.mock('../../../src/nyc/lang/Translate')
jest.mock('../../../src/nyc/lang/Goog')

jest.mock('../../../src/nyc/ol/Basemap')
jest.mock('../../../src/nyc/ol/Filters')
jest.mock('../../../src/nyc/ol/LocationMgr')
jest.mock('../../../src/nyc/ol/MultiFeaturePopup')
jest.mock('../../../src/nyc/ol/FeatureTip')

jest.mock('../../../src/nyc/ol/format/CsvPoint')
// jest.mock('../../../src/nyc/ol/format/Decorate')

jest.mock('../../../src/nyc/ol/source/FilterAndSort')

jest.mock('ol/layer/vector')
jest.mock('ol/style/style')

const format = new CsvPoint({})
const style = new OlStyleStyle({})
const filterChoiceOptions = []

beforeEach(() => {
  $.resetMocks()
  Dialog.mockClear()
  Share.mockClear()
  // Tabs.mockClear()
  // ListPager.mockClear()
  MapLocator.mockClear()

  Translate.mockClear()
  Goog.mockClear()

  Basemap.mockClear()
  Filters.mockClear()
  LocationMgr.mockClear()
  MultiFeaturePopup.mockClear()
  FeatureTip.mockClear()

  CsvPoint.mockClear()
  // Decorate.mockClear()

  FilterAndSort.mockClear()

  OlLayerVector.mockClear()
  OlStyleStyle.mockClear()
})
afterEach(() => {
  $('body').empty()
})

test('constructor', () => {
  expect.assertions(60)

  const finderApp = new FinderApp({
    title: 'Finder App',
    splashContent: 'splash page message',
    facilityTabTitle: 'Facility Title',
    facilityUrl: 'http://facility',
    facilityFormat: format,
    facilityStyle: style,
    filterTabTitle: 'Filter Title',
    filterChoiceOptions: filterChoiceOptions,
    geoclientUrl: 'http://geoclient'
  })

  expect(finderApp.pager instanceof ListPager).toBe(true)
  expect(finderApp.pager.getContainer().length).toBe(1)
  expect(finderApp.pager.getContainer().get(0)).toBe($('#facilities').get(0))

  expect(Basemap).toHaveBeenCalledTimes(1)
  expect(Basemap.mock.calls[0][0]).toEqual({target: 'map'})

  expect(FilterAndSort).toHaveBeenCalledTimes(1)
  expect(FilterAndSort.mock.calls[0][0].url).toBe('http://facility')
  expect(FilterAndSort.mock.calls[0][0].format instanceof Decorate).toBe(true)
  expect(FilterAndSort.mock.calls[0][0].format.parentFormat).toBe(format);
  expect(FilterAndSort.mock.calls[0][0].format.decoration).toBe(FinderApp.DEFAULT_DECORATIONS);

  expect(OlLayerVector).toHaveBeenCalledTimes(1)
  expect(OlLayerVector.mock.calls[0][0].source).toBe(finderApp.source)
  expect(OlLayerVector.mock.calls[0][0].style).toBe(style)

  expect(finderApp.map.addLayer).toHaveBeenCalledTimes(1)
  expect(finderApp.map.addLayer.mock.calls[0][0]).toBe(finderApp.layer)

  expect(MultiFeaturePopup).toHaveBeenCalledTimes(1)
  expect(MultiFeaturePopup.mock.calls[0][0].map).toBe(finderApp.map)
  expect(MultiFeaturePopup.mock.calls[0][0].layers.length).toBe(1)
  expect(MultiFeaturePopup.mock.calls[0][0].layers[0]).toBe(finderApp.layer)

  expect(finderApp.location).toEqual({})

  expect(FeatureTip).toHaveBeenCalledTimes(1)
  expect(FeatureTip.mock.calls[0][0].map).toBe(finderApp.map)
  expect(FeatureTip.mock.calls[0][0].tips.length).toBe(1)
  expect(FeatureTip.mock.calls[0][0].tips[0].layer).toBe(finderApp.layer)
  expect(typeof FeatureTip.mock.calls[0][0].tips[0].label).toBe('function')

  expect(FeatureTip.mock.calls[0][0].tips[0].label({getName: () => {return 'Fred'}}).html).toBe('Fred')

  expect(LocationMgr).toHaveBeenCalledTimes(1)
  expect(LocationMgr.mock.calls[0][0].map).toBe(finderApp.map)
  expect(LocationMgr.mock.calls[0][0].url).toBe('http://geoclient')
  expect(finderApp.locationMgr.on).toHaveBeenCalledTimes(2)
  expect(finderApp.locationMgr.on.mock.calls[0][0]).toBe('geocode')
  expect(finderApp.locationMgr.on.mock.calls[0][1]).toBe(finderApp.located)
  expect(finderApp.locationMgr.on.mock.calls[0][2]).toBe(finderApp)
  expect(finderApp.locationMgr.on.mock.calls[1][0]).toBe('geolocate')
  expect(finderApp.locationMgr.on.mock.calls[1][1]).toBe(finderApp.located)
  expect(finderApp.locationMgr.on.mock.calls[1][2]).toBe(finderApp)

  expect(Filters).toHaveBeenCalledTimes(1)
  expect(Filters.mock.calls[0][0].target).toBe('#filters')
  expect(Filters.mock.calls[0][0].source).toBe(finderApp.source)
  expect(Filters.mock.calls[0][0].choiceOptions).toBe(filterChoiceOptions)
  expect(finderApp.filters.on).toHaveBeenCalledTimes(1)
  expect(finderApp.filters.on.mock.calls[0][0]).toBe('change')
  expect(finderApp.filters.on.mock.calls[0][1]).toBe(finderApp.resetList)
  expect(finderApp.filters.on.mock.calls[0][2]).toBe(finderApp)

  expect(finderApp.tabs instanceof Tabs).toBe(true)
  expect(finderApp.tabs.tabs.children().length).toBe(3)

  expect(finderApp.view.fit).toHaveBeenCalledTimes(1)
  expect(finderApp.view.fit.mock.calls[0][0]).toBe(Basemap.EXTENT)
  expect(finderApp.view.fit.mock.calls[0][1].size).toEqual([100, 100])
  expect(finderApp.view.fit.mock.calls[0][1].duration).toBe(500)

  expect(Dialog).toHaveBeenCalledTimes(1)
  expect(Dialog.mock.calls[0][0]).toBe('splash')
  expect(Dialog.mock.instances[0].ok.mock.calls[0][0].message).toBe('splash page message')
  expect(Dialog.mock.instances[0].ok.mock.calls[0][0].buttonText[0]).toBe('Continue...')

  expect(Share).toHaveBeenCalledTimes(1)
  expect(Share.mock.calls[0][0].target).toBe('#map')

  expect(Goog).toHaveBeenCalledTimes(1)
  expect(Goog.mock.calls[0][0].target).toBe('#map')
  expect(Goog.mock.calls[0][0].languages).toBe(Translate.DEFAULT_LANGUAGES)
  expect(Goog.mock.calls[0][0].button).toBe(true)
})

describe('zoomTo', () => {
  test('zoomTo map tab button hidden', () => {
    expect.assertions(9)
    const feature = new OlFeature({geometry: new OlGeomPoint([0, 0])})
    
    const finderApp = new FinderApp({
      title: 'Finder App',
      splashContent: 'splash page message',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    $('h3.btn-0').hide()
    finderApp.zoomTo(feature)

    expect(finderApp.popup.hide).toHaveBeenCalledTimes(1)

    expect(finderApp.map.once).toHaveBeenCalledTimes(1)
    expect(finderApp.map.once.mock.calls[0][0]).toBe('moveend')
    expect(typeof finderApp.map.once.mock.calls[0][1]).toBe('function')

    expect(finderApp.popup.showFeature).toHaveBeenCalledTimes(1)
    expect(finderApp.popup.showFeature.mock.calls[0][0]).toBe(feature)
    
    expect(finderApp.view.animate).toHaveBeenCalledTimes(1)
    expect(finderApp.view.animate.mock.calls[0][0].center).toEqual(feature.getGeometry().getCoordinates())
    expect(finderApp.view.animate.mock.calls[0][0].zoom).toBe(MapLocator.ZOOM_LEVEL)
  })

  test('zoomTo map tab button visible', () => {
    expect.assertions(11)
    const feature = new OlFeature({geometry: new OlGeomPoint([0, 0])})
    
    const finderApp = new FinderApp({
      title: 'Finder App',
      splashContent: 'splash page message',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    finderApp.tabs.open = jest.fn()

    $('h3.btn-0').show()
    finderApp.zoomTo(feature)

    expect(finderApp.tabs.open).toHaveBeenCalledTimes(1)
    expect(finderApp.tabs.open.mock.calls[0][0]).toBe('#map')

    expect(finderApp.popup.hide).toHaveBeenCalledTimes(1)

    expect(finderApp.map.once).toHaveBeenCalledTimes(1)
    expect(finderApp.map.once.mock.calls[0][0]).toBe('moveend')
    expect(typeof finderApp.map.once.mock.calls[0][1]).toBe('function')

    expect(finderApp.popup.showFeature).toHaveBeenCalledTimes(1)
    expect(finderApp.popup.showFeature.mock.calls[0][0]).toBe(feature)
    
    expect(finderApp.view.animate).toHaveBeenCalledTimes(1)
    expect(finderApp.view.animate.mock.calls[0][0].center).toEqual(feature.getGeometry().getCoordinates())
    expect(finderApp.view.animate.mock.calls[0][0].zoom).toBe(MapLocator.ZOOM_LEVEL)
  })  
})

describe('directionsTo', () => {
  test('directionsTo without from', () => {
    expect.assertions(0)
    const feature = new OlFeature({geometry: new OlGeomPoint([0, 0])})
    
    const finderApp = new FinderApp({
      title: 'Finder App',
      splashContent: 'splash page message',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    finderApp.directionsTo(feature)
  })
})

test('directionsTo without from', () => {
  expect.assertions(8)
  
  const finderApp = new FinderApp({
    title: 'Finder App',
    splashContent: 'splash page message',
    facilityTabTitle: 'Facility Title',
    facilityUrl: 'http://facility',
    facilityFormat: format,
    facilityStyle: style,
    geoclientUrl: 'http://geoclient'
  })

  const filters = finderApp.createFilters('mock-filterChoiceOptions')

  expect(Filters).toHaveBeenCalledTimes(1)
  expect(Filters.mock.calls[0][0].target).toBe('#filters')
  expect(Filters.mock.calls[0][0].source).toBe(finderApp.source)
  expect(Filters.mock.calls[0][0].choiceOptions).toBe('mock-filterChoiceOptions')

  expect(filters.on).toHaveBeenCalledTimes(1)
  expect(filters.on.mock.calls[0][0]).toBe('change')
  expect(filters.on.mock.calls[0][1]).toBe(finderApp.resetList)
  expect(filters.on.mock.calls[0][2]).toBe(finderApp)
})

test('showSplash', () => {
  expect.assertions(4)
  
  const finderApp = new FinderApp({
    title: 'Finder App',
    facilityTabTitle: 'Facility Title',
    facilityUrl: 'http://facility',
    facilityFormat: format,
    facilityStyle: style,
    geoclientUrl: 'http://geoclient'
  })

  finderApp.showSplash('splash page message')

  expect(Dialog).toHaveBeenCalledTimes(1)
  expect(Dialog.mock.calls[0][0]).toBe('splash')
  expect(Dialog.mock.instances[0].ok.mock.calls[0][0].message).toBe('splash page message')
  expect(Dialog.mock.instances[0].ok.mock.calls[0][0].buttonText[0]).toBe('Continue...')
})

describe('createTabs', () => {
  test('createTabs called from constructor no filters', () => {
    expect.assertions(12)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      geoclientUrl: 'http://geoclient'
    })

    expect(finderApp.tabs instanceof Tabs).toBe(true)
    expect(finderApp.tabs.tabs.children().length).toBe(2)
    expect(finderApp.tabs.tabs.find('#map').length).toBe(1)
    expect(finderApp.tabs.tabs.find('#map').data('btn').html()).toBe('<span class=\"screen-reader-only\">show </span>Map')
    expect(finderApp.tabs.tabs.find('#facilities').length).toBe(1)
    expect(finderApp.tabs.tabs.find('#facilities').data('btn').html()).toBe('<span class=\"screen-reader-only\">show </span>Facility Title')
  
    expect($.mocks.resize).toHaveBeenCalledTimes(1)
    expect($.mocks.resize.mock.instances[0].get(0)).toBe(window)

    expect($.mocks.proxy).toHaveBeenCalled()
    const lastCall = $.mocks.proxy.mock.calls.length - 1
    expect($.mocks.proxy.mock.calls[lastCall][0]).toBe(finderApp.adjustTabs)
    expect($.mocks.proxy.mock.calls[lastCall][1]).toBe(finderApp)

    expect($.mocks.resize.mock.calls[0][0]).toBe($.mocks.proxy.returnedValues[lastCall])
  })

  test('createTabs called from constructor has filters', () => {
    expect.assertions(14)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    expect(finderApp.tabs instanceof Tabs).toBe(true)
    expect(finderApp.tabs.tabs.children().length).toBe(3)
    expect(finderApp.tabs.tabs.find('#map').length).toBe(1)
    expect(finderApp.tabs.tabs.find('#map').data('btn').html()).toBe('<span class=\"screen-reader-only\">show </span>Map')
    expect(finderApp.tabs.tabs.find('#facilities').length).toBe(1)
    expect(finderApp.tabs.tabs.find('#facilities').data('btn').html()).toBe('<span class=\"screen-reader-only\">show </span>Facility Title')
    expect(finderApp.tabs.tabs.find('#filters').length).toBe(1)
    expect(finderApp.tabs.tabs.find('#filters').data('btn').html()).toBe('<span class=\"screen-reader-only\">show </span>Filter Title')
  
    expect($.mocks.resize).toHaveBeenCalledTimes(1)
    expect($.mocks.resize.mock.instances[0].get(0)).toBe(window)

    expect($.mocks.proxy).toHaveBeenCalled()
    const lastCall = $.mocks.proxy.mock.calls.length - 1
    expect($.mocks.proxy.mock.calls[lastCall][0]).toBe(finderApp.adjustTabs)
    expect($.mocks.proxy.mock.calls[lastCall][1]).toBe(finderApp)

    expect($.mocks.resize.mock.calls[0][0]).toBe($.mocks.proxy.returnedValues[lastCall])
  })
})

describe('adjustTabs', () => {
  test('adjustTabs full width', () => {
    expect.assertions(2)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      geoclientUrl: 'http://geoclient'
    })

    finderApp.tabs.open = jest.fn()

    $(window).width(500)
    finderApp.tabs.getContainer().width(500)

    finderApp.adjustTabs()

    expect(finderApp.tabs.open).toHaveBeenCalledTimes(1)
    expect(finderApp.tabs.open.mock.calls[0][0]).toBe('#map')
  })

  test('adjustTabs not full width', () => {
    expect.assertions(2)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    finderApp.tabs.open = jest.fn()

    $(window).width(500)
    finderApp.tabs.getContainer().width(400)

    finderApp.adjustTabs()

    expect(finderApp.tabs.open).toHaveBeenCalledTimes(1)
    expect(finderApp.tabs.open.mock.calls[0][0]).toBe('#facilities')
  })
})

test('resizeMap', () => {
  expect.assertions(2)

  const finderApp = new FinderApp({
    title: 'Finder App',
    facilityTabTitle: 'Facility Title',
    facilityUrl: 'http://facility',
    facilityFormat: format,
    facilityStyle: style,
    filterTabTitle: 'Filter Title',
    filterChoiceOptions: filterChoiceOptions,
    geoclientUrl: 'http://geoclient'
  })

  $('#map').width(500)
  $('#map').height(400)

  finderApp.resizeMap()

  expect(finderApp.map.setSize).toHaveBeenCalledTimes(2)
  expect(finderApp.map.setSize.mock.calls[1][0]).toEqual([500, 400])
})

test('located', () => {
  expect.assertions(2)

  const finderApp = new FinderApp({
    title: 'Finder App',
    facilityTabTitle: 'Facility Title',
    facilityUrl: 'http://facility',
    facilityFormat: format,
    facilityStyle: style,
    filterTabTitle: 'Filter Title',
    filterChoiceOptions: filterChoiceOptions,
    geoclientUrl: 'http://geoclient'
  })

  finderApp.resetList = jest.fn()

  finderApp.located('mock-location')

  expect(finderApp.location).toBe('mock-location')
  expect(finderApp.resetList).toHaveBeenCalledTimes(1)
})

describe('resetList', () => {
  test('resetList is filter event has coordinate', () => {
    expect.assertions(7)

    const features = [{}, {}]
    FilterAndSort.features = features

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    finderApp.location = {coordinate: [0, 0]}
    finderApp.pager.reset = jest.fn()

    finderApp.resetList(finderApp.filters)

    expect($('#tabs .btns h3.btn-2').hasClass('filtered')).toBe(true)

    expect(finderApp.popup.hide).toHaveBeenCalledTimes(1)

    expect(finderApp.pager.reset).toHaveBeenCalledTimes(1)
    expect(finderApp.pager.reset.mock.calls[0][0]).toBe(features)

    expect(finderApp.source.getFeatures).toHaveBeenCalledTimes(0)
    expect(finderApp.source.sort).toHaveBeenCalledTimes(1)
    expect(finderApp.source.sort.mock.calls[0][0]).toBe(finderApp.location.coordinate)
  })

  test('resetList no filter event no coordinate', () => {
    expect.assertions(7)

    const features = [{}, {}]
    FilterAndSort.features = features

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    finderApp.pager.reset = jest.fn()

    finderApp.resetList()

    expect($('#tabs .btns h3.btn-2').hasClass('filtered')).toBe(false)

    expect(finderApp.popup.hide).toHaveBeenCalledTimes(1)

    expect(finderApp.pager.reset).toHaveBeenCalledTimes(1)
    expect(finderApp.pager.reset.mock.calls[0][0]).toBe(features)

    expect(finderApp.source.sort).toHaveBeenCalledTimes(0)
    expect(finderApp.source.getFeatures).toHaveBeenCalledTimes(1)
    expect(finderApp.source.getFeatures.mock.calls[0][0]).toBe(finderApp.location.coordinate)
  })
})

test('parentFomat', () => {
  expect.assertions(2)

  const format = {parentFomat: 'mock-format'}

  const finderApp = new FinderApp({
    title: 'Finder App',
    facilityTabTitle: 'Facility Title',
    facilityUrl: 'http://facility',
    facilityFormat: format,
    facilityStyle: style,
    filterTabTitle: 'Filter Title',
    filterChoiceOptions: filterChoiceOptions,
    geoclientUrl: 'http://geoclient'
  })

  expect(finderApp.parentFomat(format)).toBe('mock-format')  

  delete format.parentFomat

  expect(finderApp.parentFomat(format)).toBe(format)  
})

describe('decorations', () => {
  test('decorations none supplied', () => {
    expect.assertions(2)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    const decorations = finderApp.decorations({}, {})

    expect(decorations.length).toBe(1)
    expect(decorations[0]).toBe(FinderApp.FEATURE_DECORATIONS)
  })

  test('decorations supplied on parentFormat', () => {
    expect.assertions(3)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    const decoratedFormat = {
      parentFomat: {
        decorations: [{foo: 'bar', bar: 'foo'}]
      }
  }
    const decorations = finderApp.decorations({}, decoratedFormat)

    expect(decorations.length).toBe(2)
    expect(decorations[0]).toBe(FinderApp.FEATURE_DECORATIONS)
    expect(decorations[1]).toBe(decoratedFormat.parentFomat.decorations[0])
  })

  test('decorations supplied on format', () => {
    expect.assertions(3)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    const decoratedFormat = {
      decorations: [{foo: 'bar', bar: 'foo'}]
    }

    const decorations = finderApp.decorations({}, decoratedFormat)

    expect(decorations.length).toBe(2)
    expect(decorations[0]).toBe(FinderApp.FEATURE_DECORATIONS)
    expect(decorations[1]).toBe(decoratedFormat.decorations[0])
  })

  test('decorations supplied on parentFormat', () => {
    expect.assertions(3)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    const decoratedFormat = {
      parentFomat: {
        decorations: [{foo: 'bar', bar: 'foo'}]
      }
  }
    const decorations = finderApp.decorations({}, decoratedFormat)

    expect(decorations.length).toBe(2)
    expect(decorations[0]).toBe(FinderApp.FEATURE_DECORATIONS)
    expect(decorations[1]).toBe(decoratedFormat.parentFomat.decorations[0])
  })

  test('decorations supplied on options', () => {
    expect.assertions(3)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    const options = {
      decorations: [{foo: 'bar', bar: 'foo'}]
    }

    const decorations = finderApp.decorations(options, {})

    expect(decorations.length).toBe(2)
    expect(decorations[0]).toBe(FinderApp.FEATURE_DECORATIONS)
    expect(decorations[1]).toBe(options.decorations[0])
  })

  test('decorations supplied on all the things', () => {
    expect.assertions(5)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    const options = {
      decorations: [{foo: 'bar', bar: 'foo'}]
    }
    const decoratedFormat = {
      parentFomat: {
        decorations: [{doo: 'fus', wtf: 'lol'}]
      },
      decorations: [{you: 'me', me: 'you'}]
    }

    const decorations = finderApp.decorations(options, decoratedFormat)

    expect(decorations.length).toBe(4)
    expect(decorations[0]).toBe(FinderApp.FEATURE_DECORATIONS)
    expect(decorations[1]).toBe(decoratedFormat.parentFomat.decorations[0])
    expect(decorations[2]).toBe(decoratedFormat.decorations[0])
    expect(decorations[3]).toBe(options.decorations[0])
  })
})

describe('ready', () => {
  const ready = nyc.ready
  afterEach(() => {
    nyc.ready = ready
  })

  test('ready no search options', () => {
    expect.assertions(6)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    nyc.ready = jest.fn()
    finderApp.pager.reset = jest.fn()
    finderApp.locationMgr.zoomSearch = {
      setFeatures: jest.fn()
    }

    finderApp.ready('mock-features')

    expect(finderApp.pager.reset).toHaveBeenCalledTimes(1)
    expect(finderApp.pager.reset.mock.calls[0][0]).toBe('mock-features')

    expect(finderApp.locationMgr.zoomSearch.setFeatures).toHaveBeenCalledTimes(1)
    expect(finderApp.locationMgr.zoomSearch.setFeatures.mock.calls[0][0].features).toBe('mock-features')

    expect(nyc.ready).toHaveBeenCalledTimes(1)
    expect(nyc.ready.mock.calls[0][0].get(0)).toBe(document.body)
  })

  test('ready has search options', () => {
    expect.assertions(7)

    const finderApp = new FinderApp({
      title: 'Finder App',
      facilityTabTitle: 'Facility Title',
      facilityUrl: 'http://facility',
      facilityFormat: format,
      facilityStyle: style,
      filterTabTitle: 'Filter Title',
      filterChoiceOptions: filterChoiceOptions,
      geoclientUrl: 'http://geoclient'
    })

    nyc.ready = jest.fn()
    finderApp.pager.reset = jest.fn()
    finderApp.locationMgr.zoomSearch = {
      setFeatures: jest.fn()
    }
    finderApp.facilitySearchOptions = {}
    finderApp.ready('mock-features')

    expect(finderApp.pager.reset).toHaveBeenCalledTimes(1)
    expect(finderApp.pager.reset.mock.calls[0][0]).toBe('mock-features')

    expect(finderApp.locationMgr.zoomSearch.setFeatures).toHaveBeenCalledTimes(1)
    expect(finderApp.locationMgr.zoomSearch.setFeatures.mock.calls[0][0]).toBe(finderApp.facilitySearchOptions)
    expect(finderApp.locationMgr.zoomSearch.setFeatures.mock.calls[0][0].features).toBe('mock-features')

    expect(nyc.ready).toHaveBeenCalledTimes(1)
    expect(nyc.ready.mock.calls[0][0].get(0)).toBe(document.body)
  })
})

describe('handleButton',() => {
  let target
  beforeEach(() => {
    target = $('<div></div>')
    target.data('feature', 'mock-feature')
    target = target.get(0)
    $('body').append(target)
  })
  afterEach(() => {
    $(target).remove()
  })

  test('handleButton map', () => {
    expect.assertions(6)
    
    global.finderApp = {
      zoomTo: jest.fn(),
      directionsTo: jest.fn()
    }

    $(target).addClass('map')

    FinderApp.handleButton({currentTarget: target})

    expect(global.finderApp.directionsTo).toHaveBeenCalledTimes(0)
    expect(global.finderApp.zoomTo).toHaveBeenCalledTimes(1)
    expect(global.finderApp.zoomTo.mock.calls[0][0]).toBe('mock-feature')

    $(target).removeClass('map')

    FinderApp.handleButton({currentTarget: target})

    expect(global.finderApp.zoomTo).toHaveBeenCalledTimes(1)
    expect(global.finderApp.directionsTo).toHaveBeenCalledTimes(1)
    expect(global.finderApp.directionsTo.mock.calls[0][0]).toBe('mock-feature')
  })
})
