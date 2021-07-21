class KVue {
    constructor(options) {
        this.$options = options
        this.$data = options.data
        observe(this.$data)
        proxy(this, '$data')
        new Compile(options.el, this)
    }
}

function defineReactive(obj, key, val) {
    observe(val)
    const dep = new Dep()
    Object.defineProperty(obj, key, {
        get() {
            Dep.target && dep.addDep(Dep.target)
            return val
        },
        set(newVel) {
            if(val !== newVel) {
                observe(newVel)
                val = newVel
            }
            dep.notify()
        }
    })
}

function observe(obj) {
    if(typeof obj !== 'object' || obj == null){
        return
    }
    new Observe(obj)
}

class Observe {
    constructor(value) {
        this.value = value
        this.walk(value)
    }

    walk(obj) {
        Object.keys(obj).forEach(key => {
            defineReactive(obj, key, obj[key])
        })
    }
}

function set(obj, key, val) {
    defineReactive(obj, key, val)
}

function proxy(vm, prop) {
    Object.keys(vm[prop]).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                return vm[prop][key]    
            },
            set(newVel) {
                vm[prop][key] = newVel
            }
        })
    })
}

class Dep {
    constructor() {
        this.deps = []
    }
    addDep(watcher) {
        this.deps.push(watcher)
    }
    notify() {
        this.deps.forEach(w => w.update())
    }
}

class Watcher {
    constructor(vm, key, updater) {
        this.vm = vm
        this.key = key
        this.updater = updater
        Dep.target = this
        this.vm[this.key] // 触发get，做依赖收集
        Dep.target = null
    }
    update() {
        this.updater.call(this.vm, this.vm[this.key])
    }
}

class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)
        this.compile(this.$el)
    }
    compile(el) {
        const childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if(this.isElement(node)) {
                this.compileElement(node)
            } else if(this.isInter(node)) {
                this.compileText(node)
            }
            if(node.childNodes) {
                this.compile(node)
            }
        })
    }
    isElement(node) {
        return node.nodeType === 1
    }
    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }
    isDir(attr) {
        return attr.indexOf('k-') === 0 || attr.indexOf(':') === 0
    }
    compileElement(node) {
        let nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
            let attrName = attr.attrName
            let exp = attr.value
            if(this.isDir(attrName)) {
                let dir = attrName.subString(2)
                this[dir] && this[dir](node, exp)
            }
        })
    }
    compileText(node) {
        // node.textContent = this.$vm[RegExp.$1]
        this.update(node, RegExp.$1, 'text')
    }
    text(node, exp) {
        node.textContent = this.$vm[exp]
    }
    update(node, exp, dir) {
        const fn = this[dir + 'Updater']
        // 初始化
        fn && fn(node, this.$vm[exp])
        // 更新
        new Watcher(this.$vm, exp, function(val) {
            fn && fn(node, val)
        })
    }
    textUpdater(node, val) {
        node.textContent = val
    }
}

function compile() {

}