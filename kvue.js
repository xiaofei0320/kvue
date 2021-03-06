// 替换数组原型中的7个方法
// const orginalProto = Array.prototype
// const arrayProto = Object.create(orginalProto)
// ['push', 'pop', 'shift', 'unshift'].forEach(method => {
//     arrayProto[method] = function() {
//         orginalProto[method].apply(this, arguments)
//     }
// })

function observe(obj) {
    if(typeof obj !== 'object' || obj == null) {
        return
    }
    if(Array.isArray(obj)) {
        obj.__proto__ = arrayProto
        const keys = Object.keys(obj)
        for(let i = 0; i < obj.length; i++) {
            observe(obj[i])
        }
    }

    // 每次遍历对象属性创建一个Ob实例
    new Observe(obj)
}


function defineReactive(obj, key, val) {
    observe(val)
    // 创建dep实例和key一一对应
    const dep = new Dep()
    Object.defineProperty(obj, key, {
        get() {
            // console.log('get', key, val);
            Dep.target && dep.addDep(Dep.target)
            return val
        },
        set(newVal) {       
            if (newVal !== val) {
                observe(newVal)
                // console.log('set', key, val);
                val = newVal
            }
            
            dep.notify()
        }
    })
}

function set(obj, key, val) {
    defineReactive(obj, key, val)
}

// 代理$data
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

class KVue {
    constructor(options) {
        this.$options = options
        this.$data = options.data
        observe(this.$data)
        proxy(this, '$data')
        new Compile(options.el, this)
    }

}

// 分辨响应式的数据对象是对象还是数组
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

// watcher：和模板中的依赖一一对应，如果某个key发生变化，则执行更新函数
class Watcher {
    constructor(vm, key, updater) {
        this.vm = vm
        this.key = key
        this.updater = updater
        Dep.target = this
        this.vm[this.key] // 触发get，做依赖收集
        Dep.target = null
    }

    // 更新方法让Dep调用
    update() {
        this.updater.call(this.vm, this.vm[this.key])
    }
}

// vm是kvue的实例，用于初始化和更新数据
// el是选择器可以获取模板dom
class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)
        this.compile(this.$el)
    }
    compile(el) {   
        const childNodes = el.childNodes
        
        Array.from(childNodes).forEach((node, index) => {
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
    // 编译插值文本
    compileText(node) {
        // node.textContent = this.$vm[RegExp.$1]
        this.update(node, RegExp.$1, 'text')
    }
    // 编译元素节点
    compileElement(node) {
        // 获取属性  
        let nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
            // attr内置对象，name value
            let attrName = attr.name
            let exp = attr.value
            // 如果是指令，获取指令函数执行
            if(this.isDir(attrName)) {
                let dir = attrName.substring(2)
                this[dir] && this[dir](node, exp)
            } 
            if(this.isHandle(attrName)) {
                const dir = attrName.substring(1)
                this.eventHandler(node, exp)
            }
        })
    }
    isDir(attr) {
        return attr.indexOf('k-') === 0 || attr.indexOf(':') === 0
    }
    isHandle(attr) {
        return attr.indexOf('v-') === 0 || attr.indexOf('@') === 0
    }
    text(node, exp) {
        node.textContent = this.$vm[exp]
    }
    isHandle(dir) {
        return dir.indexOf('@') === 0
    }
    eventHandler(node, exp, dir) {
        const fn = this.$vm.$options.method && this.$vm.$options.method[exp]
        node.addEventListener(dir, fn.bind(this.$vm))
    }
    model(node, exp) {
        this.update(node, exp, 'model')
        node.addEventListener('input', e => {
            this.$vm[exp] = e.target.value
        })
    }
    modelUpdater(node, value) {
        node.value = value
    }
}
