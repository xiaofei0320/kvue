class Vue {
  constructor(options) {
    this.$options = options
    this.$data = options.data

    observe(this.$data)

    proxy(this, '$data')
  }
}


class Observer {
  constructor(value) {
    this.value = value
    this.walk(value)
  }

  walk(obj) {
    Object.keys(obj).forEach(Key => {
      Object.defineReactive(obj, key, obj[key])
    })
  }
}

function observe(obj) {
  if (typeof obj !== 'object' || obj == null) {
    return
  }

  new Observer(obj)
}

function defineReactive(obj, key) {
  observe()
}

function proxy(vm, prop) {
  Object.keys(vm[prop]).forEach(key => {
    Object.defineProperty(vm, key, {
      get() {
        return vm[prop][key]
      },
      set(newVal) {
        vm[prop][key] = newVal
      }
    })
  })
}

class Watch {
  constructor(vm, key, updater) {
    this.vm = vm
    this.key = key
    this.updater = updater
  }

  update() {
    this.updater.call(this.vm, this.vm[this.key])
  }
}

class Compile {
  constructor(el, vm) {
    this.$vm = vm
    this.$el = document.querySelector(el)
  }
}