function observe(obj) {
  if (typeof obj !== 'object' || obj == null) {
    return
  }
  Object.keys(obj).forEach(key => {
    defineReactive(obj, key, obj[key])
  })
}


function defineReactive(obj, key, val) {
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log('get', key, val);
      return val
    },
    set(newVal) {
      if (newVal !== val) {
        observe(newVal)
        console.log('set', key, val);
        val = newVal
      }
    }
  })
}

function set(obj, key, val) {
  defineReactive(obj, key, val)
}

const obj = {
  foo: 1
}
observe(obj)
obj.foo = 100
obj.foo
set(obj, 'bar', '10')
obj.bar = 20