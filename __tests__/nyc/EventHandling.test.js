import EventHandling from 'nyc/EventHandling'

test('constructor', () => {
	expect.assertions(1)

	const handling = new EventHandling()
	expect(handling.evtHdlrs).toEqual({})
})

test('on', () => {
	expect.assertions(10)
	
	const handling = new EventHandling()

	const aHandler = () => {}
	const anotherHandler = (data) => {}
	const anObj = {
		name: 'anObj',
		handler: () => {}
	}
	const anotherObj = {
		name: 'anotherObj',
		handler: (data) => {}
	}

	handling.on('event1', aHandler)

	expect(handling.evtHdlrs['event1'].length).toBe(1)
	expect(handling.evtHdlrs['event1'][0]).toEqual({
		handler: aHandler, scope: undefined, remove: undefined
	})

	handling.on('event1', anObj.handler, anObj)

	expect(handling.evtHdlrs['event1'].length).toBe(2)
	expect(handling.evtHdlrs['event1'][0]).toEqual({
		handler: aHandler, scope: undefined, remove: undefined
	})
	expect(handling.evtHdlrs['event1'][1]).toEqual({
		handler: anObj.handler, scope: anObj, remove: undefined
	})

	handling.on('event2', anotherHandler)

	expect(handling.evtHdlrs['event2'].length).toBe(1)
	expect(handling.evtHdlrs['event2'][0]).toEqual({
		handler: anotherHandler, scope: undefined, remove: undefined
	})

	handling.on('event2', anotherObj.handler, anotherObj)

	expect(handling.evtHdlrs['event2'].length).toBe(2)
	expect(handling.evtHdlrs['event2'][0]).toEqual({
		handler: anotherHandler, scope: undefined, remove: undefined
	})
	expect(handling.evtHdlrs['event2'][1]).toEqual({
		handler: anotherObj.handler, scope: anotherObj, remove: undefined
	})
})

test('one', () => {
	expect.assertions(10)

	const handling = new EventHandling()

	const aHandler = () => {}
	const anotherHandler = (data) => {}
	const anObj = {
		name: 'anObj',
		handler: () => {}
	}
	const anotherObj = {
		name: 'anotherObj',
		handler: (data) => {}
	}

	handling.one('event1', aHandler)

	expect(handling.evtHdlrs['event1'].length).toBe(1)
	expect(handling.evtHdlrs['event1'][0]).toEqual({
		handler: aHandler, scope: undefined, remove: true
	})

	handling.one('event1', anObj.handler, anObj)

	expect(handling.evtHdlrs['event1'].length).toBe(2)
	expect(handling.evtHdlrs['event1'][0]).toEqual({
		handler: aHandler, scope: undefined, remove: true
	})
	expect(handling.evtHdlrs['event1'][1]).toEqual({
		handler: anObj.handler, scope: anObj, remove: true
	})

	handling.one('event2', anotherHandler)

	expect(handling.evtHdlrs['event2'].length).toBe(1)
	expect(handling.evtHdlrs['event2'][0]).toEqual({
		handler: anotherHandler, scope: undefined, remove: true
	})

	handling.one('event2', anotherObj.handler, anotherObj)

	expect(handling.evtHdlrs['event2'].length).toBe(2)
	expect(handling.evtHdlrs['event2'][0]).toEqual({
		handler: anotherHandler, scope: undefined, remove: true
	})
	expect(handling.evtHdlrs['event2'][1]).toEqual({
		handler: anotherObj.handler, scope: anotherObj, remove: true
	})
})

test('trigger a single stand alone function for a single event', () => {
	expect.assertions(2)

	const handling = new EventHandling()

	const aHandler = jest.fn()

	handling.on('event1', aHandler)

	handling.trigger('event1', 'data1')
	expect(aHandler).toHaveBeenCalledTimes(1)
	expect(aHandler.mock.calls[0][0]).toBe('data1')
})

test('trigger stand alone function from many for a single event', () => {
	expect.assertions(3)

	const handling = new EventHandling()

	const aHandlerNotToCall = jest.fn(data => {})

	const aHandlerToCall = jest.fn(data => {
		expect(data).toBe('data2')
	})

	handling.on('event1', aHandlerNotToCall)
	handling.on('event2', aHandlerToCall)

	handling.trigger('event2', 'data2')
	expect(aHandlerNotToCall).toHaveBeenCalledTimes(0)
	expect(aHandlerToCall).toHaveBeenCalledTimes(1)
})

test('trigger multiple stand alone function for a single event', () => {
	expect.assertions(4)

	const handling = new EventHandling()

	const handler1 = jest.fn(data => {
		expect(data).toBe('data1')
	})

	const handler2 = jest.fn(data => {
		expect(data).toBe('data1')
	})

	handling.on('event1', handler1)
	handling.on('event1', handler2)

	handling.trigger('event1', 'data1')
	expect(handler1).toHaveBeenCalledTimes(1)
	expect(handler2).toHaveBeenCalledTimes(1)
})

test('trigger function within scope', () => {
	expect.assertions(2)

	const handling = new EventHandling()

	const scope = {
		handler: jest.fn(data => {
			expect(data).toBe('data1')
		})
	}

	handling.on('event1', scope.handler, scope)

	handling.trigger('event1', 'data1')
	expect(scope.handler).toHaveBeenCalledTimes(1)
})

test('trigger non-event', () => {
  expect.assertions(1)

	const handling = new EventHandling()

	const scope = {
		handler: jest.fn(data => {
			expect(true).toBe(false)
		})
	}

	handling.trigger('event1', 'data1')
	expect(scope.handler).toHaveBeenCalledTimes(0)
})

test('off single handler', () => {
  expect.assertions(2)

	const handling = new EventHandling()

	const aHandler = jest.fn()

	handling.on('event1', aHandler)
	expect(handling.evtHdlrs['event1'].length).toBe(1)

	handling.off('event1', aHandler)
	expect(handling.evtHdlrs['event1'].length).toBe(0)
})

test('off multiple handlers remove from middle', () => {
  expect.assertions(4)

	const handling = new EventHandling()

	const handler1 = jest.fn()
	const handler2 = jest.fn()
	const handler3 = jest.fn()

	handling.on('event1', handler1)
	handling.on('event1', handler2)
	handling.on('event1', handler3)

	expect(handling.evtHdlrs['event1'].length).toBe(3)

	handling.off('event1', handler2)
	expect(handling.evtHdlrs['event1'].length).toBe(2)
	expect(handling.evtHdlrs['event1'][0].handler).toEqual(handler1)
	expect(handling.evtHdlrs['event1'][1].handler).toEqual(handler3)
})

test('off multiple handlers remove from beginnig', () => {
  expect.assertions(4)

	const handling = new EventHandling()

	const handler1 = jest.fn()
	const handler2 = jest.fn()
	const handler3 = jest.fn()

	handling.on('event1', handler1)
	handling.on('event1', handler2)
	handling.on('event1', handler3)

	expect(handling.evtHdlrs['event1'].length).toBe(3)

	handling.off('event1', handler1)
	expect(handling.evtHdlrs['event1'].length).toBe(2)
	expect(handling.evtHdlrs['event1'][0].handler).toEqual(handler2)
	expect(handling.evtHdlrs['event1'][1].handler).toEqual(handler3)
})

test('off multiple handlers remove from end', () => {
  expect.assertions(4)

	const handling = new EventHandling()

	const handler1 = jest.fn()
	const handler2 = jest.fn()
	const handler3 = jest.fn()

	handling.on('event1', handler1)
	handling.on('event1', handler2)
	handling.on('event1', handler3)

	expect(handling.evtHdlrs['event1'].length).toBe(3)

	handling.off('event1', handler3)
	expect(handling.evtHdlrs['event1'].length).toBe(2)
	expect(handling.evtHdlrs['event1'][0].handler).toEqual(handler1)
	expect(handling.evtHdlrs['event1'][1].handler).toEqual(handler2)
})
