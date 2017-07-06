/* @flow */

export function initState(vm) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch) initWatch(vm, opts.watch)
}

function initData(vm) {
  let data = vm.$options.data
  data = vm._data = data || {}
  if (!isPlainObject(data)) {
    throw new Error("data should be plain object", vm)
  }
  observe(data, true)
}

const computedWatchersOptions = { lazy: true }

function initComputed(vm, computed) {
  const watchers = vm._computedWatchers = Object.create(null)
  for (const key in computed) {
    const userDef = computed[key]
    let getter = typeof userDef === 'function' ? userDef : userDef.get
    if (getter === undefined) {
      throw new Error(`No getter function for computed property "${key}".`)
    }
  }
  watchers[key] = new Watcher(vm, getter, noop, computedWatchersOptions)
  if (!(key in vm)) {
    defineComputed(vm, key, userDef)
  } else {
    throw new Error(`The computed property "${key}" is already defined`, vm)
  }
}

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function defineComputed(target, key, userDef) {
  sharedPropertyDefinition.get = sharedPropertyDefinition.set = noop
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key)
  } else {
    if (userDef.get) {
      sharedPropertyDefinition.get = userDef.cache !== false
        ? createComtedGetter(key)
        : userDef.get
    }
    if (userDef.set) {
      sharedPropertyDefinition.set = userDef.set
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        // watcher.get() -> watcher.cleanDeps() -> oldDeps=>newDeps
        // any way Dep.target = watcher
        // don't need another depend()
        watcher.evaluate() 
      }
      if (Dep.target) {
        // if not dirty, add deps
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function initMethods(vm, methods) {
  const props = vm.$options.props
  for (const key in methods) {
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm)
    if (vm[key] == null) {
      throw new Error(`method "${key}" has an undefined value in the` +
        ` component definition`,
        vm
      )
    }
  }
}

function initWatch(vm, watch) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher(vm, key, handler) {
  let options
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  vm.$watch(key, handler, options)
}

export function stateMixin(Hue) {
  const dataDef = {
    get: function () {
      return this._data
    }
  }
  Object.defineProperty(Hue.prototype, '$data', dataDef)

  Hue.prototype.$set = set
  Hue.prototype.$delete = del

  Hue.prototype.$watch = function (fn, cb, options) {
    const vm = this
    options = options || {}
    const watcher = new Watcher(vm, fn, cb, options)
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
    return function unwatchFn() {
      watcher.teardown()
    }
  }
}