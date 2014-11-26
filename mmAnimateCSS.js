// mmAnimate 2.0 2014.11.25
/**
 * @cnName 动画引擎
 * @enName mmAnimate
 * @introduce
 * <p>mmAnimate 基于CSS3 keyframe的实现</p>
 * <h3>使用方法</h3>
 * ```javascript
 avalon(elem).animate( properties [, duration] [, easing] [, complete] )
 avalon(elem).animate( properties, options )
 * ```
 */
define(["avalon"], function() {
    /*********************************************************************
     *                      主函数                                   *
     **********************************************************************/
    var effect = avalon.fn.animate = function(properties, options) {
        var frame = new Frame(this[0])
        if (typeof properties === "number") { //如果第一个为数字
            frame.duration = properties
            if (arguments.length === 1) {
                frame.playState = false
            }
        } else if (typeof properties === "object") {
            for (var name in properties) {//处理第一个参数
                if (name === "frameName") {
                    frame.frameName = properties.frameName
                    continue
                }
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
        this.easing = bezier[this.easing] ? this.easing : "linear"//缓动公式的名字
        this.count = (this.count === Infinity || isIndex(this.count)) ? this.count : 1
        this.gotoEnd = false//是否立即跑到最后一帧
        var duration = this.duration
        this.duration = typeof duration === "number" ? duration : /^\d+ms$/.test(duration) ? parseFloat(duration) :
                /^\d+s$/.test(duration) ? parseFloat(duration) * 1000 : 400 //动画时长
    }
    function isIndex(s) {//判定是非负整数，可以作为索引的
        return +s === s >>> 0;
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
    /*********************************************************************
     *                          缓动公式                              *
     **********************************************************************/
    avalon.mix(effect, {
        fps: 30
    })
    var bezier = {
        "linear": [0.250, 0.250, 0.750, 0.750],
        "ease": [0.250, 0.100, 0.250, 1.000],
        "easeIn": [0.420, 0.000, 1.000, 1.000],
        "easeOut": [0.000, 0.000, 0.580, 1.000],
        "easeInOut": [0.420, 0.000, 0.580, 1.000],
        "easeInQuad": [0.550, 0.085, 0.680, 0.530],
        "easeInCubic": [0.550, 0.055, 0.675, 0.190],
        "easeInQuart": [0.895, 0.030, 0.685, 0.220],
        "easeInQuint": [0.755, 0.050, 0.855, 0.060],
        "easeInSine": [0.470, 0.000, 0.745, 0.715],
        "easeInExpo": [0.950, 0.050, 0.795, 0.035],
        "easeInCirc": [0.600, 0.040, 0.980, 0.335],
        "easeInBack": [0.600, -0.280, 0.735, 0.045],
        "easeOutQuad": [0.250, 0.460, 0.450, 0.940],
        "easeOutCubic": [0.215, 0.610, 0.355, 1.000],
        "easeOutQuart": [0.165, 0.840, 0.440, 1.000],
        "easeOutQuint": [0.230, 1.000, 0.320, 1.000],
        "easeOutSine": [0.390, 0.575, 0.565, 1.000],
        "easeOutExpo": [0.190, 1.000, 0.220, 1.000],
        "easeOutCirc": [0.075, 0.820, 0.165, 1.000],
        "easeOutBack": [0.175, 0.885, 0.320, 1.275],
        "easeInOutQuad": [0.455, 0.030, 0.515, 0.955],
        "easeInOutCubic": [0.645, 0.045, 0.355, 1.000],
        "easeInOutQuart": [0.770, 0.000, 0.175, 1.000],
        "easeInOutQuint": [0.860, 0.000, 0.070, 1.000],
        "easeInOutSine": [0.445, 0.050, 0.550, 0.950],
        "easeInOutExpo": [1.000, 0.000, 0.000, 1.000],
        "easeInOutCirc": [0.785, 0.135, 0.150, 0.860],
        "easeInOutBack": [0.680, -0.550, 0.265, 1.550],
        "custom": [0.000, 0.350, 0.500, 1.300],
        "random": [Math.random().toFixed(3),
            Math.random().toFixed(3),
            Math.random().toFixed(3),
            Math.random().toFixed(3)]
    }
    avalon.easing = {//缓动公式

    }
    /*********************************************************************
     *                      定时器                                  *
     **********************************************************************/
    function AnimationTimer() {
        //不存在msRequestAnimationFrame，IE10与Chrome24直接用:requestAnimationFrame
        if (window.requestAnimationFrame) {
            return {
                start: requestAnimationFrame.bind(window),
                stop: cancelAnimationFrame.bind(window)
            }
            //Firefox11-没有实现cancelRequestAnimationFrame
            //并且mozRequestAnimationFrame与标准出入过大
        } else if (window.mozCancelRequestAnimationFrame && window.mozCancelAnimationFrame) {
            return {
                start: mozRequestAnimationFrame.bind(window),
                stop: mozCancelAnimationFrame.bind(window)
            }
        } else if (window.webkitRequestAnimationFrame && webkitRequestAnimationFrame(String)) {
            return {//修正某个特异的webKit版本下没有time参数
                start: webkitRequestAnimationFrame.bind(window),
                stop: (window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame).bind(window)
            }
        } else {
            //当你使用此模块时,你就不需要兼容旧式IE
        }
    }
    var Timer = new AnimationTimer()
    var TimerID = null
    /*********************************************************************
     *                      时间轴                                    *
     **********************************************************************/
    /**
     * @other
     * <p>一个时间轴<code>avalon.timeline</code>中包含许多帧, 一帧里面有各种渐变动画, 渐变的轨迹是由缓动公式所规定</p>
     */
    var timeline = avalon.timeline = []
    function insertFrame(frame) { //插入关键帧
        if (frame.queue) { //如果插入到已有的某一帧的子列队
            var gotoQueue = 1
            for (var i = timeline.length, el; el = timeline[--i]; ) {
                if (el.elem === frame.elem) { //★★★第一步
                    el.troops.push(frame) //子列队
                    gotoQueue = 0
                    break
                }
            }
            if (gotoQueue) { //★★★第二步
                timeline.unshift(frame)
            }
        } else {//插入时间轴
            timeline.push(frame)
        }
        if (!TimerID) { //时间轴只要存在帧就会执行定时器
            TimerID = Timer.start(function raf() {
                if (TimerID) {
                    deleteFrame()
                    Timer.start(raf)
                }
            })
        }
    }

    function deleteFrame() {
        var i = timeline.length
        while (--i >= 0) {
            if (!timeline[i].paused) { //如果没有被暂停
                //如果返回false或元素不存在,就从时间轴中删掉此关键帧
                if (!(timeline[i].elem && enterFrame(timeline[i], i))) {
                    timeline.splice(i, 1)
                }
            }
        }
        if (timeline.length === 0) {
            //如果时间轴里面没有关键帧,那么停止定时器,节约性能
            Timer.stop(TimerID)
            TimerID = null
        }
    }

    function enterFrame(frame, index) {
        //驱动主列队的动画实例进行补间动画(update)，
        //并在动画结束后，从子列队选取下一个动画实例取替自身
        var now = +new Date
        if (!frame.startTime) { //第一帧
            avalon.log(frame.frameName + "!!!!!!!!")
            if (frame.playState) {
                frame.fire("before")//动画开始前做些预操作
                if (avalon.css(frame.elem, "display") === "none" && !frame.elem.dataShow) {
                    frame.build()
                }
                frame.createTweens()
                frame.build()//如果是先hide再show,那么执行createTweens后再执行build则更为平滑
                frame.insertKeyFrame()
            }
            frame.startTime = now
        } else { //中间自动生成的补间
            var per = (now - frame.startTime) / frame.duration
            var end = frame.gotoEnd || per >= 1 //gotoEnd可以被外面的stop方法操控,强制中止
            if (frame.playState) {

                frame.fire("step") //每执行一帧调用的回调
            }
            if (end || frame.count === 0) { //最后一帧
                frame.count--
                frame.fire("after") //动画结束后执行的一些收尾工作
                var style = frame.elem.style
                frame.tweens.forEach(function(el) {
                    if (el.prop in style) {
                        style[el.prop] = el.end + el.unit
                    } else {
                        frame.elem[el.prop] = el.end
                    }
                })
                if (frame.count <= 0) {
                    frame.deleteKeyFrame()
                    frame.fire("complete") //执行用户回调
                    var neo = frame.troops.shift()
                    if (!neo) {
                        return false
                    } //如果存在排队的动画,让它继续
                    timeline[index] = neo
                    neo.troops = frame.troops
                } else {
                    frame.startTime = frame.gotoEnd = false
                    if (frame.revert)  //如果设置了倒带
                        frame.revertTweens()
                }
            }
        }
        return true
    }
    /*********************************************************************
     *                                  工具函数                          *
     **********************************************************************/
    var root = document.documentElement
    avalon.isHidden = function(node) {
        return  node.sourceIndex === 0 || avalon.css(node, "display") === "none" || !avalon.contains(root, node)
    }

    function dasherize(target) {
        return target.replace(/([a-z\d])(A-Z)/g, "$1-$2").replace(/\_/g, "-").replace(/^[A-Z]/, function(a) {
            return "-" + a.toLowerCase()
        })
    }
    //http://css3playground.com/flip-card.php

    var prefixJS = avalon.cssName("animation").replace(/animation/i, "");
    var prefixCSS = prefixJS === "" ? "" : "-" + prefixJS.toLowerCase() + "-";

    var rformat = /\\?\#{([^{}]+)\}/gm
    function format(str, object) {
        var array = avalon.slice(arguments, 1);
        return str.replace(rformat, function(match, name) {
            if (match.charAt(0) === "\\")
                return match.slice(1)
            var index = Number(name)
            if (index >= 0)
                return array[index]
            if (object && object[name] !== void 0)
                return object[name]
            return ""
        })
    }

    var styleElement;

    function insertCSSRule(rule) {
        if (!styleElement) {
            styleElement = document.getElementById("avalonStyle")
        }
        //动态插入一条样式规则
        try {
            var sheet = styleElement.sheet// styleElement.styleSheet;
            var cssRules = sheet.cssRules // sheet.rules;
            sheet.insertRule(rule, cssRules.length)
        } catch (e) {
        }
    }
    function deleteCSSRule(ruleName, keyframes) {
        //删除一条样式规则
        var prop = keyframes ? "name" : "selectorText";
        var name = keyframes ? "@keyframes " : "cssRule ";//调试用
        if (styleElement) {
            var sheet = styleElement.sheet;// styleElement.styleSheet;
            var cssRules = sheet.cssRules;// sheet.rules;
            for (var i = 0, n = cssRules.length; i < n; i++) {
                var rule = cssRules[i];
                if (rule[prop] === ruleName) {
                    sheet.deleteRule(i);
                    avalon.log("已经成功删除" + name + " " + ruleName);
                    break;
                }
            }
        }
    }

    /*********************************************************************
     *                                  逐帧动画                            *
     **********************************************************************/
    function Frame(elem) {
        this.$events = {}
        this.elem = elem
        this.troops = []
        this.tweens = []
        this.orig = {}
        this.props = {}
        this.count = 1
        this.frameName = "fx" + Date.now()
        this.playState = true //是否能更新
    }
    var $playState = avalon.cssName("animation-play-state")

    Frame.prototype = {
        constructor: Frame,
        bind: function(type, fn, unshift) {
            var fns = this.$events[type] || (this.$events[type] = []);
            var method = unshift ? "unshift" : "push"
            fns[method](fn)
        },
        fire: function(type) {
            var args = Array.prototype.slice.call(arguments, 1)
            var fns = this.$events[type] || []
            for (var i = 0, fn; fn = fns[i++]; ) {
                fn.call(this.elem, args)
            }
        },
        play: function(stop) {
            this.elem.style[$playState] = stop ? "paused" : "running"
            this.paused = stop ? Date.now() : null
        },
        build: function() {
            var frame = this
            var elem = frame.elem
            var props = frame.props
            var style = elem.style
            var inlineBlockNeedsLayout = !window.getComputedStyle
            //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
            //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
            //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
            //如果是动画则必须将它显示出来
            if ("height" in props || "width" in props) {
                frame.overflow = [style.overflow, style.overflowX, style.overflowY]
            }
            var display = style.display || avalon.css(elem, "display")
            var oldDisplay = elem.getAttribute("olddisplay")
            if (!oldDisplay) {
                if (display === "none") {
                    style.display = ""//尝试清空行内的display
                    display = avalon.css(elem, "display")
                    if (display === "none") {
                        display = avalon.parseDisplay(elem.nodeName)
                    }
                }
                elem.setAttribute("olddisplay", display)
            } else {
                if (display !== "none") {
                    elem.setAttribute("olddisplay", display)
                } else {
                    display = oldDisplay
                }
            }
            style.display = display
            //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
            if (display === "inline" && avalon.css(elem, "float") === "none") {
                style.display = "inline-block"
            }

            if (frame.overflow) {
                style.overflow = "hidden"
                frame.bind("after", function() {
                    style.overflow = frame.overflow[ 0 ]
                    style.overflowX = frame.overflow[ 1 ]
                    style.overflowY = frame.overflow[ 2 ]
                })
            }

            frame.bind("after", function() {
                if (frame.showState === "hide") {
                    this.style.display = "none"
                    this.dataShow = {}
                    for (var i in frame.orig) { //还原为初始状态
                        this.dataShow[i] = frame.orig[i]
                        avalon.css(this, i, frame.orig[i])
                    }
                }
            })
            this.build = avalon.noop //让其无效化
        },
        createTweens: function() {
            var hidden = avalon.isHidden(this.elem)
            for (var i in this.props) {
                createTweenImpl(this, i, this.props[i], hidden)
            }

        },
        deleteKeyFrame: function() {
            //删除一条@keyframes样式规则
            if (!effect.effects[this.frameName]) {
                deleteCSSRule(this.frameName, true)
            }
        },
        insertKeyFrame: function() {
            var from = []
            var to = []
            this.tweens.forEach(function(el) {
                from.push(dasherize(el.prop) + ":" + el.start + el.unit)
                to.push(dasherize(el.prop) + ":" + el.end + el.unit)
            })
            //CSSKeyframesRule的模板
            var frameRule = "@#{prefix}keyframes #{frameName}{ 0%{ #{from} } 100%{  #{to} }  }";
            var anmationRule = "#{frameName} #{duration}ms cubic-bezier(#{easing}) 0s 1 normal #{model} running";
            var rule1 = format(frameRule, {
                frameName: this.frameName,
                prefix: prefixCSS,
                from: from.join(";"),
                to: to.join(";")
            })

            var rule2 = format(anmationRule, {
                frameName: this.frameName,
                duration: this.duration,
                model: (this.showState === "hide") ? "backwards" : "forwards",
                easing: bezier[this.easing]
            })
            insertCSSRule(rule1)
            var elem = this.elem
            var style = elem.style

            style[avalon.cssName("animation")] = rule2


        },
        revertTweens: function() {

        }
    }
    var rfxnum = new RegExp("^(?:([+-])=|)(" + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ")([a-z%]*)$", "i")
    effect.effects = avalon.oneObject("show,hide,toggle,slideUp,slide,slideDown,slideUp,slideToggle,fadeIn,fadeOut, fadeToggle")


    function createTweenImpl(frame, name, value, hidden) {
        var elem = frame.elem
        var dataShow = elem.dataShow || {}
        var tween = new Tween(name, frame)
        var from = dataShow[name] || tween.cur() //取得起始值
        var to
        if (/color$/i.test(name)) {
            //用于分解属性包中的样式或属性,变成可以计算的因子
            parts = [from, value]
        } else {
            parts = rfxnum.exec(from)
            var unit = parts && parts[ 3 ] || (avalon.cssNumber[ name ] ? "" : "px")
            //处理 toggle, show, hide
            if (value === "toggle") {
                value = hidden ? "show" : "hide"
            }
            if (value === "show") {
                frame.showState = "show"
                avalon.css(elem, name, 0);
                parts = [0, parseFloat(from)]
            } else if (value === "hide") {
                frame.showState = "hide"
                frame.orig[name] = from
                parts = [parseFloat(from), 0]
                value = 0;
            } else {// "18em"  "+=18em"
                parts = rfxnum.exec(value)//["+=18em", "+=", "18", "em"]
                if (parts) {
                    parts[2] = parseFloat(parts[2]) //18
                    if (parts[3] && parts[ 3 ] !== unit) {//如果存在单位，并且与之前的不一样，需要转换
                        var clone = elem.cloneNode(true)
                        clone.style.visibility = "hidden"
                        clone.style.position = "absolute"
                        elem.parentNode.appendChild(clone)
                        avalon.css(clone, name, parts[2] + (parts[3] ? parts[3] : 0))
                        parts[ 2 ] = parseFloat(avalon.css(clone, name))
                        elem.parentNode.removeChild(clone)
                    }
                    to = parts[2]
                    from = parseFloat(from)
                    if (parts[ 1 ]) {
                        to = from + (parts[ 1 ] + 1) * parts[ 2 ]
                    }
                    parts = [from, to]
                }
            }
        }
        from = parts[0]
        to = parts[1]
        if (from + "" !== to + "") { //不处理起止值都一样的样式与属性
            tween.start = from
            tween.end = to
            tween.unit = unit || ""
            frame.tweens.push(tween)
        } else {
            delete frame.props[name]
        }
    }
    function Tween(prop, options) {
        this.elem = options.elem
        this.prop = prop
        this.easing = avalon.easing[options.easing]

    }

    Tween.prototype = {
        constructor: Tween,
        cur: function() {//取得当前值
            var hooks = Tween.propHooks[ this.prop ]
            return hooks && hooks.get ?
                    hooks.get(this) :
                    Tween.propHooks._default.get(this)
        },
        run: function(per, end) {//更新元素的某一样式或属性
            this.update(per, end)
            var hook = Tween.propHooks[ this.prop ]
            if (hook && hook.set) {
                hook.set(this);
            }
        },
        update: function(per, end) {
            this.now = (end ? this.end : this.start + this.easing(per) * (this.end - this.start))
        }
    }

    Tween.propHooks = {
        //只处理scrollTop, scrollLeft
        _default: {
            get: function(tween) {
                var result = avalon.css(tween.elem, tween.prop)
                return !result || result === "auto" ? 0 : result
            },
            set: function(tween) {
                avalon.css(tween.elem, tween.prop, tween.now + tween.unit)
            }
        }
    }
    avalon.each(["scrollTop", "scollLeft"], function(name) {
        Tween.propHooks[name] = {
            get: function(tween) {
                return tween.elem[tween.name]
            },
            set: function(tween) {
                tween.elem[tween.name] = tween.now
            }
        }
    })

    /*********************************************************************
     *                                  原型方法                            *
     **********************************************************************/

    avalon.fn.mix({
        delay: function(ms) {
            return this.animate(ms)
        },
        pause: function() {
            var cur = this[0]
            for (var i = 0, frame; frame = timeline[i]; i++) {
                if (frame.elem === cur) {
                    frame.play("stop")
                }
            }
            return this
        },
        resume: function() {
            var now = new Date
            var elem = this[0]
            for (var i = 0, frame; frame = timeline[i]; i++) {
                if (frame.elem === elem) {
                    frame.startTime += (now - frame.paused)
                    frame.play()
                }
            }
            return this
        },
        //如果clearQueue为true，是否清空列队
        //如果gotoEnd 为true，是否跳到此动画最后一帧
        stop: function(clearQueue, gotoEnd) {
            clearQueue = clearQueue ? "1" : ""
            gotoEnd = gotoEnd ? "1" : "0"
            var stopCode = parseInt(clearQueue + gotoEnd, 2) //返回0 1 2 3
            var node = this[0]
            for (var i = 0, frame; frame = timeline[i]; i++) {
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
                            frame.troops.forEach(function(a) {
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
        fxAttrs.concat.apply([], fxAttrs.slice(0, num)).forEach(function(name) {
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

    avalon.each(effects, function(method, props) {
        avalon.fn[method] = function() {
            props.frameName = method
            var args = [].concat.apply([props], arguments)
            return this.animate.apply(this, args)
        }
    })

    String("toggle,show,hide").replace(avalon.rword, function(name) {
        avalon.fn[name] = function() {
            var args = [].concat.apply([genFx(name, 3)], arguments)
            args[0].frameName = name
            return this.animate.apply(this, args)
        }
    })
    return avalon
})