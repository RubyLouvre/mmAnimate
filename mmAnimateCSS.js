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
        this.easing = avalon.easing[this.easing] ? this.easing : "swing"//缓动公式的名字
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
            var timeLast = 0
            // http://jsperf.com/date-now-vs-date-gettime/11
            var now = Date.now || function() {
                return (new Date).getTime()
            }
            return {
                start: function(callback) {//主要用于IE，必须千方百计要提高性能
                    var timeCurrent = now()
                    // http://jsperf.com/math-max-vs-comparison/3
                    var timeDelta = 16 - (timeCurrent - timeLast)
                    if (timeDelta < 0)
                        timeDelta = 0
                    timeLast = timeCurrent + timeDelta
                    return setTimeout(callback, timeDelta)
                },
                stop: function(id) {
                    clearTimeout(id)
                }
            };
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
            if (end) { //最后一帧
                frame.count--
                frame.fire("after") //动画结束后执行的一些收尾工作
                if (frame.count === 0) {
                    frame.fire("complete") //执行用户回调
                    var neo = frame.troops.shift()
                    if (!neo) {
                        return false
                    } //如果存在排队的动画,让它继续
                    timeline[index] = neo
                    neo.troops = frame.troops
                } else {
                    delete frame.startTime
                    frame.gotoEnd = false
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
                return match.slice(1);
            var index = Number(name);
            if (index >= 0)
                return array[index];
            if (object && object[name] !== void 0)
                return object[name];
            return ''
        })
    }

    var styleElement;

    function insertCSSRule(rule) {
        if (!styleElement) {
            styleElement = document.getElementById("avalonStyle")
        }
        //动态插入一条样式规则
        try {
            var sheet = styleElement.sheet;// styleElement.styleSheet;
            var cssRules = sheet.cssRules; // sheet.rules;
            sheet.insertRule(rule, cssRules.length);
        } catch (e) {
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
        this.orig = []
        this.props = {}
        this.dataShow = {}
        this.count = 1
        this.playState = true //是否能更新
    }
    Frame.$name = avalon.cssName("animation")
    Frame.$direction = avalon.cssName("animation-direction")
    Frame.$FillMode = avalon.cssName("animation-fill-mode")
    Frame.$easing = avalon.cssName("animation-timing-function")

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
                if (!inlineBlockNeedsLayout || avalon.parseDisplay(elem.nodeName) === "inline") {
                    style.display = "inline-block"
                } else {
                    style.zoom = 1
                }
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
        insertKeyFrame: function() {
            var from = []
            var to = []
            this.tweens.forEach(function(el) {
                from.push(dasherize(el.prop) + ":" + el.start + el.unit)
                to.push(dasherize(el.prop) + ":" + el.end + el.unit)
            })

            //CSSKeyframesRule的模板
            var frameRule = "@#{prefix}keyframes #{frameName}{ 0%{ #{from} } 100%{  #{to} }  }";
            var rule2 = format(frameRule, {
                frameName: this.frameName,
                prefix: prefixCSS,
                from: from.join(";"),
                to: to.join(";")
            })
            insertCSSRule(rule2)
            var elem = this.elem
            var style = elem.style
            style[ Frame.$name] = this.frameName
            style[Frame.$direction] = ""
            style[Frame.$fillMode] = this.frameName === "hide" || this.frameName === "slideUp" ? "backwards" : "forwards";
            style[Frame.$easing] = ""
            style[Frame.$count] = "1"



        },
        revertTweens: function() {

        }
    }


})()