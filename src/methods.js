/*********************************************************************
 *                                  原型方法                            *
 **********************************************************************/

avalon.fn.mix({
    delay: function (ms) {
        return this.animate(ms)
    },
    pause: function () {
        var cur = this[0]
        for (var i = 0, frame; frame = avalon.timeline[i]; i++) {
            if (frame.elem === cur) {
                frame.paused = new Date - 0
            }
        }
        return this
    },
    resume: function () {
        var now = new Date
        var elem = this[0]
        for (var i = 0, frame; frame = avalon.timeline[i]; i++) {
            if (frame.elem === elem) {
                frame.startTime += (now - frame.paused)
                delete frame.paused
            }
        }
        return this
    },
    //如果clearQueue为true，是否清空列队
    //如果gotoEnd 为true，是否跳到此动画最后一帧
    stop: function (clearQueue, gotoEnd) {
        clearQueue = clearQueue ? "1" : ""
        gotoEnd = gotoEnd ? "1" : "0"
        var stopCode = parseInt(clearQueue + gotoEnd, 2) //返回0 1 2 3
        var node = this[0]
        for (var i = 0, frame; frame = avalon.timeline[i]; i++) {
            if (frame.elem === node) {
                frame.gotoEnd = true
                frame.count = 0
                switch (stopCode) { //如果此时调用了stop方法
                    case 0:
                        // false false 中断当前动画，继续下一个动画
                        frame.playState = frame.revert = false
                        break
                    case 1:
                        // false true立即跳到最后一帧，继续下一个动画
                        frame.revert = false
                        break
                    case 2:
                        // true false清空该元素的所有动画
                        delete frame.elem
                        break
                    case 3:
                        // true true 立即完成该元素的所有动画
                        frame.troops.forEach(function (a) {
                            a.gotoEnd = true
                        })
                        break
                }
            }
        }
        return this
    }
})
/*********************************************************************
 *                                 常用特效                            *
 **********************************************************************/
var fxAttrs = [
    ["height", "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"],
    ["width", "marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"],
    ["opacity"]
]
function genFx(type, num) { //生成属性包
    var obj = {}
    fxAttrs.concat.apply([], fxAttrs.slice(0, num)).forEach(function (name) {
        obj[name] = type
    })
    return obj
}


var effects = {
    slideDown: genFx("show", 1),
    slideUp: genFx("hide", 1),
    slideToggle: genFx("toggle", 1),
    fadeIn: {
        opacity: "show"
    },
    fadeOut: {
        opacity: "hide"
    },
    fadeToggle: {
        opacity: "toggle"
    }
}

avalon.each(effects, function (method, props) {
    avalon.fn[method] = function () {
        var args = [].concat.apply([props, {frameName: method}], arguments)
        return this.animate.apply(this, args)
    }
})

String("toggle,show,hide").replace(avalon.rword, function (name) {
    avalon.fn[name] = function () {
        var args = [].concat.apply([genFx(name, 3), {frameName: name}], arguments)
        return this.animate.apply(this, args)
    }
})