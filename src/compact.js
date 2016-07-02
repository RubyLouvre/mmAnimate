//http://stackoverflow.com/questions/6221411/any-perspectives-on-height-auto-for-css3-transitions-and-animations
//http://www.cnblogs.com/rubylouvre/archive/2009/09/04/1559557.html
var canUse3D = require('./canUse3D')
var insertFrame = require('./insertFrame')
var Frame = require('./frame')
require('./parseColor/compact')
require('./updateColor')
require('./methods')

avalon.fn.animate = function (properties, options) {
    var frame = new Frame(this[0])
    if (typeof properties === "number") { //如果第一个为数字
        frame.duration = properties
        if (arguments.length === 1) {
            frame.playState = false
        }
    } else if (typeof properties === "object") {
        for (var name in properties) {//处理第一个参数
            var p = avalon.cssName(name) || name
            if (name !== p) {
                properties[p] = properties[name] //转换为驼峰风格borderTopWidth, styleFloat
                delete properties[name] //去掉连字符风格 border-top-width, float
            }
        }
        frame.props = properties
    }
    addOptions.apply(frame, arguments)//处理第二,第三...参数
    //将关键帧插入到时间轴中或插到已有的某一帧的子列队,等此帧完毕,让它再进入时间轴
    insertFrame(frame)
    return this
}


//分解用户的传参
function addOptions(properties) {
    //如果第二参数是对象
    for (var i = 1; i < arguments.length; i++) {
        addOption(this, arguments[i])
    }
    this.queue = !!(this.queue == null || this.queue) //是否插入子列队
    this.easing = avalon.easing[this.easing] ? this.easing : "ease"//缓动公式的名字
    this.count = (this.count === Infinity || isIndex(this.count)) ? this.count : 1
    this.gotoEnd = false//是否立即跑到最后一帧
    var duration = this.duration
    this.duration = typeof duration === "number" ? duration : /^\d+ms$/.test(duration) ?
            parseFloat(duration) : /^\d+s$/.test(duration) ? parseFloat(duration) * 1000 : 400 //动画时长
}

function isIndex(s) {//判定是非负整数，可以作为索引的
    return +s === s >>> 0
}

function addOption(frame, p, name) {
    if (!name) {
        switch (avalon.type(p)) {
            case "object":
                for (var i in p) {
                    addOption(frame, p[i], i)
                }
                break
            case "number":
                frame.duration = p
                break
            case "string":
                if (p === "slow") {
                    frame.duration = 600
                } else if (p === "fast") {
                    frame.duration = 200
                } else {
                    frame.easing = p
                }
                break
            case "function"://绑定各种回调
                frame.bind("complete", p)
                break
        }
    } else {
        if (typeof p === "function") {
            frame.bind(name, p)
        } else {
            frame[name] = p
        }
    }
}