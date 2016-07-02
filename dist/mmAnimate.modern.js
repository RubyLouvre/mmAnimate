/*!
 * built in 2016-7-3:1 version 1.0 by 司徒正美
 * 2011.8.31
 *      将会传送器的abort方法上传到avalon.XHR.abort去处理
 *      修复serializeArray的bug
 *      对XMLHttpRequest.abort进行try...catch
 *      2012.3.31 v2 大重构,支持XMLHttpRequest Level2
 *      2013.4.8 v3 大重构 支持二进制上传与下载
 *      http://www.cnblogs.com/heyuquan/archive/2013/05/13/3076465.html
 *      2014.12.25  v4 大重构 
 *      2015.3.2   去掉mmPromise
 *      2015.3.13  使用加强版mmPromise
 *      2015.3.17  增加 xhr 的 onprogress 回调
 *      2016.7.2 fix跨域检测
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["avalon"] = factory();
	else
		root["avalon"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	//http://stackoverflow.com/questions/6221411/any-perspectives-on-height-auto-for-css3-transitions-and-animations
	//http://www.cnblogs.com/rubylouvre/archive/2009/09/04/1559557.html
	if (!(window.MozCSSKeyframeRule || window.WebKitCSSKeyframeRule || window.CSSKeyframeRule)) {
	    avalon.error("当前浏览器不支持CSS3 keyframe动画")
	}
	var canUse3D = __webpack_require__(1)
	var insertFrame = __webpack_require__(2)
	var Frame = __webpack_require__(4)
	__webpack_require__(6)
	__webpack_require__(9)
	__webpack_require__(8)


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
	    canUse3D(this)
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

/***/ },
/* 1 */
/***/ function(module, exports) {

	//分解用户的传参
	var rmobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
	var rgingerbread = /Android 2\.3\.[3-7]/i
	var support3D = (function () {
	    var prop = avalon.cssName("transform")
	    var el = document.createElement('div')
	    var root = document.documentElement
	    el.style[prop] = 'translate3d(1px,1px,1px)'
	    root.insertBefore(el, null)
	    if (window.getComputedStyle) {
	        return false
	    }
	    var val = getComputedStyle(el).getPropertyValue(prop)
	    root.removeChild(el)
	    return  null != val && val.length && 'none' != val
	})()

	function canUse3D(obj) {
	    var ua = navigator.userAgent
	    //是否开启3D硬件加速
	    obj.use3D = support3D && obj.use3D && (rmobile.test(ua) ? !rgingerbread(ua) : 1)

	}
	module.exports = canUse3D

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/*********************************************************************
	 *                      时间轴操作,只对外暴露insertFrame                                    *
	 **********************************************************************/
	/**
	 * @other
	 * <p>一个时间轴<code>avalon.timeline</code>中包含许多帧, 一帧里面有各种渐变动画, 渐变的轨迹是由缓动公式所规定</p>
	 */
	var Timer = __webpack_require__(3)
	var TimerID
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
	            //此方法是用于获取元素最初的显隐状态,让元素处于可动画状态(display不能为none)
	            //处理overflow,绑定after回调
	            frame.build()
	            frame.addKeyframe()
	        }
	        frame.startTime = now
	    } else { //中间自动生成的补间
	        var per = (now - frame.startTime) / frame.duration
	        var end = frame.gotoEnd || per >= 1 //gotoEnd可以被外面的stop方法操控,强制中止
	        if (frame.playState) {
	            for (var i = 0, tween; tween = frame.tweens[i++]; ) {
	                tween.run(per, end)
	            }
	            frame.fire("step") //每执行一帧调用的回调
	        }
	        if (end || frame.count == 0) { //最后一帧
	            frame.count--
	            frame.fire("after") //动画结束后执行的一些收尾工作
	            if (frame.count <= 0) {
	                frame.removeKeyframe()
	                frame.fire("complete") //执行用户回调
	                var neo = frame.troops.shift()
	                if (!neo) {
	                    return false
	                } //如果存在排队的动画,让它继续
	                timeline[index] = neo
	                neo.troops = frame.troops
	            } else {
	                frame.startTime = frame.gotoEnd = false
	                frame.frameName = ("fx" + Math.random()).replace(/0\./, "")
	                if (frame.revert) {
	                    frame.revertTweens()
	                } else {
	                    frame.createTweens(avalon.isHidden(frame.elem))
	                }  //如果设置了倒带

	            }
	        }
	    }
	    return true
	}

	module.exports = insertFrame

/***/ },
/* 3 */
/***/ function(module, exports) {

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
	        var now = Date.now || function () {
	            return (new Date).getTime()
	        }
	        return {
	            start: function (callback) {//主要用于IE，必须千方百计要提高性能
	                var timeCurrent = now()
	                // http://jsperf.com/math-max-vs-comparison/3
	                var timeDelta = 16 - (timeCurrent - timeLast)
	                if (timeDelta < 0)
	                    timeDelta = 0
	                timeLast = timeCurrent + timeDelta
	                return setTimeout(callback, timeDelta)
	            },
	            stop: function (id) {
	                clearTimeout(id)
	            }
	        }
	    }
	}
	module.exports = new AnimationTimer()

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*********************************************************************
	 *                                  逐帧动画                            *
	 **********************************************************************/
	var Tween = __webpack_require__(5)

	function Frame(elem) {
	    this.$events = {}
	    this.elem = elem
	    this.troops = []
	    this.tweens = []
	    this.orig = {}
	    this.props = {}
	    this.count = 1
	    this.frameName = ("fx" + Math.random()).replace(/0\./, "")
	    this.playState = true //是否能更新
	}
	var root = document.documentElement

	avalon.isHidden = function (node) {
	    return  node.sourceIndex === 0 || avalon.css(node, "display") === "none" || !avalon.contains(root, node)
	}

	Frame.prototype = {
	    constructor: Frame,
	    bind: function (type, fn, unshift) {
	        var fns = this.$events[type] || (this.$events[type] = [])
	        var method = unshift ? "unshift" : "push"
	        fns[method](fn)
	    },
	    fire: function (type) {
	        var args = Array.prototype.slice.call(arguments, 1)
	        var fns = this.$events[type] || []
	        for (var i = 0, fn; fn = fns[i++]; ) {
	            fn.call(this.elem, args)
	        }
	    },
	    build: function () {
	        var frame = this
	        var elem = frame.elem
	        var props = frame.props
	        var style = elem.style
	        var inlineBlockNeedsLayout = !window.getComputedStyle
	        //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
	        //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
	        //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
	        //如果是动画则必须将它显示出来
	        var hidden = avalon.isHidden(elem)
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
	        this.createTweens(hidden)

	        if (frame.overflow) {
	            style.overflow = "hidden"
	            frame.bind("after", function () {
	                style.overflow = frame.overflow[ 0 ]
	                style.overflowX = frame.overflow[ 1 ]
	                style.overflowY = frame.overflow[ 2 ]
	            })
	        }

	        frame.bind("after", function () {
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
	    removeKeyframe: avalon.noop,
	    addKeyframe: avalon.noop,
	    createTweens: function (hidden) {
	        this.tweens = []
	        for (var i in this.props) {
	            createTweenImpl(this, i, this.props[i], hidden)
	        }
	    },
	    revertTweens: function () {
	        for (var i = 0, tween; tween = this.tweens[i++]; ) {
	            var start = tween.start
	            var end = tween.end
	            tween.start = end
	            tween.end = start
	            this.props[tween.name] = Array.isArray(tween.start) ?
	                    "rgb(" + tween.start + ")" :
	                    (tween.unit ? tween.start + tween.unit : tween.start)
	        }
	    }
	}

	var rfxnum = new RegExp("^(?:([+-])=|)(" + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ")([a-z%]*)$", "i")

	function createTweenImpl(frame, name, value, hidden) {
	    var elem = frame.elem
	    var dataShow = elem.dataShow || {}
	    var tween = new Tween(name, frame)
	    var from = dataShow[name] || tween.cur() //取得起始值
	    var to, parts
	    var color2array = avalon.__parseColor
	    if (/color$/i.test(name)) {
	        //用于分解属性包中的样式或属性,变成可以计算的因子
	        parts = [color2array(from), color2array(value)]
	    } else {
	        parts = rfxnum.exec(from)
	        var unit = parts && parts[ 3 ] || (avalon.cssNumber[ name ] ? "" : "px")
	        //处理 toggle, show, hide
	        if (value === "toggle") {
	            value = hidden ? "show" : "hide"
	        }
	        if (value === "show") {
	            frame.showState = "show"
	            avalon.css(elem, name, 0)
	            parts = [0, parseFloat(from)]
	        } else if (value === "hide") {
	            frame.showState = "hide"
	            frame.orig[name] = from
	            parts = [parseFloat(from), 0]
	            value = 0
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

	module.exports = Frame
	/**
	 * @other
	 * <p>avalon.fn.delay, avalon.fn.slideDown, avalon.fn.slideUp,
	 * avalon.fn.slideToggle, avalon.fn.fadeIn, avalon.fn.fadeOut,avalon.fn.fadeToggle
	 * avalon.fn.show, avalon.fn.hide, avalon.fn.toggle这些方法其实都是avalon.fn.animate的
	 * 二次包装，包括<code>avalon.fn.animate</code>在内，他们的功能都是往时间轴添加一个帧对象(Frame)</p>
	 *<p>帧对象能在时间轴内存在一段时间，持续修改某一元素的N个样式或属性。</p>
	 *<p><strong>Frame</strong>对象拥有以下方法与属性</p>
	 <table class="table-doc" border="1">
	 <colgroup>
	 <col width="180"/> <col width="80"/> <col width="120"/>
	 </colgroup>
	 <tr>
	 <th>名字</th><th>类型</th><th>默认值</th><th>说明</th>
	 </tr>
	 <tr>
	 <td>elem</td><td>Element</td><td></td><td>处于动画状态的元素节点</td>
	 </tr>
	 <tr>
	 <td>$events</td><td>Object</td><td>{}</td><td>放置各种回调</td>
	 </tr>
	 <tr>
	 <td>troops</td><td>Array</td><td>[]</td><td>当queue为true，同一个元素产生的帧对象会放在这里</td>
	 </tr>
	 <tr>
	 <td>tweens</td><td>Array</td><td>[]</td><td>放置各种补间动画Tween</td>
	 </tr>
	 <tr>
	 <td>orig</td><td>Object</td><td>{}</td><td>保存动画之前的样式，用于在隐藏后还原</td>
	 </tr>
	 <tr>
	 <td>playState</td><td>Boolean</td><td>true</td><td>是否能进行动画，比如暂停了此值就为false</td>
	 </tr>
	 <tr>
	 <td>frameName</td><td>String</td><td>("fx" + Math.random()).replace(/0\./,"")</td><td>当前动画的名字</td>
	 </tr>
	 <tr>
	 <td>count</td><td>Number</td><td>1</td><td>能重复多少次</td>
	 </tr>
	 <tr>
	 <td>bind(type, fn, unshift)</td><td></td><td></td><td>
	 <table border="1">
	 <tbody><tr>
	 <th style="width:100px">参数名/返回值</th><th style="width:70px">类型</th> <th>说明</th> </tr>
	 <tr>
	 <td>type</td>
	 <td>String</td>
	 <td>事件名</td>
	 </tr>
	 <tr>
	 <td>fn</td>
	 <td>Function</td>
	 <td>回调，this为元素节点</td>
	 </tr>
	 <tr>
	 <td>unshift</td>
	 <td>Undefined|String</td>
	 <td>判定是插在最前还是最后</td>
	 </tr>
	 </tbody></table>
	 </td>
	 </tr>
	 <tr>
	 <td>fire(type, [otherArgs..])</td><td></td><td></td><td>触发回调，可以传N多参数</td></tr>           
	 </table>
	 */

/***/ },
/* 5 */
/***/ function(module, exports) {

	/*********************************************************************
	 *                                 渐变动画                            *
	 **********************************************************************/

	function Tween(prop, options) {
	    this.elem = options.elem
	    this.name = prop
	    this.easing = avalon.easing[options.easing]
	    this.scrollXY = prop === "scrollTop" || prop === "scrollLeft"

	    if (/color$/i.test(prop) && this.updateColor) {
	        this.update = this.updateColor
	    }
	}

	Tween.prototype = {
	    constructor: Tween,
	    cur: function () {//取得当前值
	        var hook = Tween.propHooks[ this.name ]
	        return hook && hook.get ?
	                hook.get(this) :
	                Tween.propHooks._default.get(this)
	    },
	    run: function (per, end) {//更新元素的某一样式或属性
	        this.update(per, end)
	        var hook = Tween.propHooks[ this.name ]
	        if (hook && hook.set) {
	            hook.set(this)
	        } else {
	            Tween.propHooks._default.set(this)
	        }
	    },
	    update: function (per, end) {
	        this.now = (end ? this.end : this.start + this.easing(per) * (this.end - this.start))
	    }
	}

	Tween.propHooks = {
	    _default: {
	        get: function (tween) {
	            var result = avalon.css(tween.elem, tween.name)
	            return !result || result === "auto" ? 0 : result
	        },
	        set: function (tween) {
	            avalon.css(tween.elem, tween.name, tween.now + tween.unit)
	        }
	    }
	}


	;["scrollTop", "scrollLeft"].forEach(function (name) {
	    Tween.propHooks[name] = {
	        get: function (tween) {
	            return tween.elem[tween.name]
	        },
	        set: function (tween) {
	            tween.elem[tween.name] = tween.now
	        }
	    }
	})

	/**
	 * @other
	 * <p>渐变动画<code>Tween</code>是我们实现各种特效的最小单位，它用于修改某一个属性值或样式值</p>
	 *<p><strong>Tween</strong>对象拥有以下方法与属性</p>
	 <table class="table-doc" border="1">
	 <colgroup>
	 <col width="180"/> <col width="80"/> <col width="120"/>
	 </colgroup>
	 <tr>
	 <th>名字</th><th>类型</th><th>默认值</th><th>说明</th>
	 </tr>
	 <tr>
	 <td>elem</td><td>Element</td><td></td><td>元素节点</td>
	 </tr>
	 <tr>
	 <td>name</td><td>String</td><td>""</td><td>属性名或样式名，以驼峰风格存在</td>
	 </tr>
	 <tr>
	 <td>start</td><td>Number</td><td>0</td><td>渐变的开始值</td>
	 </tr>
	 <tr>
	 <td>end</td><td>Number</td><td>0</td><td>渐变的结束值</td>
	 </tr>
	 <tr>
	 <td>now</td><td>Number</td><td>0</td><td>当前值</td>
	 </tr>
	 <tr>
	 <td>run(per, end)</td><td></td><td></td><td>更新元素的某一样式或属性，内部调用</td>
	 </tr>
	 <tr>
	 <td>cur()</td><td></td><td></td><td>取得当前值</td>
	 </tr>
	 </table>
	 */

/***/ },
/* 6 */
/***/ function(module, exports) {

	/*********************************************************************
	 *                      转换各种颜色值为RGB数组                            *
	 **********************************************************************/
	var colorMap = {
	    "black": [0, 0, 0],
	    "gray": [128, 128, 128],
	    "white": [255, 255, 255],
	    "orange": [255, 165, 0],
	    "red": [255, 0, 0],
	    "green": [0, 128, 0],
	    "yellow": [255, 255, 0],
	    "blue": [0, 0, 255]
	}
	if (window.VBArray) {
	    var parseColor = new function () {
	        var body
	        try {
	            var doc = new ActiveXObject("htmlfile")
	            doc.write("<body>")
	            doc.close()
	            body = doc.body
	        } catch (e) {
	            body = createPopup().document.body
	        }
	        var range = body.createTextRange()
	        return function (color) {
	            body.style.color = String(color).trim()
	            var value = range.queryCommandValue("ForeColor")
	            return [value & 0xff, (value & 0xff00) >> 8, (value & 0xff0000) >> 16]
	        }
	    }
	}

	function color2array(val) { //将字符串变成数组
	    var color = val.toLowerCase(),
	            ret = []
	    if (colorMap[color]) {
	        return colorMap[color]
	    }
	    if (color.indexOf("rgb") === 0) {
	        var match = color.match(/(\d+%?)/g),
	                factor = match[0].indexOf("%") !== -1 ? 2.55 : 1
	        return (colorMap[color] = [parseInt(match[0]) * factor, parseInt(match[1]) * factor, parseInt(match[2]) * factor])
	    } else if (color.charAt(0) === '#') {
	        if (color.length === 4)
	            color = color.replace(/([^#])/g, '$1$1')
	        color.replace(/\w{2}/g, function (a) {
	            ret.push(parseInt(a, 16))
	        })
	        return (colorMap[color] = ret)
	    }
	    if (window.VBArray) {
	        return (colorMap[color] = parseColor(color))
	    }
	    return colorMap.white
	}
	avalon.__parseColor = color2array

/***/ },
/* 7 */,
/* 8 */
/***/ function(module, exports) {

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

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var Tween = __webpack_require__(5)
	function dasherize(target) {
	    return target.replace(/([a-z\d])(A-Z)/g, "$1-$2").replace(/\_/g, "-").replace(/^[A-Z]/, function (a) {
	        return "-" + a.toLowerCase()
	    })
	}
	//http://css3playground.com/flip-card.php

	var prefixJS = avalon.cssName("animation").replace(/animation/i, "")
	var prefixCSS = prefixJS === "" ? "" : "-" + prefixJS.toLowerCase() + "-"
	var frameRule = "@#{prefix}keyframes #{frameName}{ 0%{ #{from} } 100%{  #{to} }  }"

	var rformat = /\\?\#{([^{}]+)\}/gm
	function format(str, object) {
	    var array = avalon.slice(arguments, 1)
	    return str.replace(rformat, function (match, name) {
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

	var styleElement
	function eachCSSRule(ruleName, callback, keyframes) {
	    if (!styleElement) {
	        styleElement = document.getElementById("avalonStyle")
	    }
	    var prop = keyframes ? "name" : "selectorText"
	   // var name = keyframes ? "@keyframes " : "cssRule ";//调试用
	    //动态插入一条样式规则
	    var sheet = styleElement.sheet// styleElement.styleSheet;
	    var cssRules = sheet.cssRules // sheet.rules;
	    var pos = -1
	    for (var i = 0, n = cssRules.length; i < n; i++) {
	        var rule = cssRules[i]
	        if (rule[prop] === ruleName) {
	            pos = i
	            break
	        }
	    }
	    //如果想插入一条样式规则,  sheet.insertRule(rule, cssRules.length)
	    //如果想删除一条样式规则, sheet.deleteRule(i);
	    callback.call(sheet, pos, n)
	}
	function insertKeyframe(ruleName, rule) {
	    eachCSSRule(ruleName, function (pos, end) {
	        if (pos === -1) {
	            this.insertRule(rule, end)
	        }
	    }, true)
	}

	function deleteKeyframe(ruleName) {
	    eachCSSRule(ruleName, function (pos) {
	        if (pos !== -1) {
	            this.deleteRule(pos)
	        }
	    }, true)
	}

	avalon.mix(Tween.prototype, {
	    removeKeyframe: function () {
	        //删除一条@keyframes样式规则
	        deleteKeyframe(this.frameName)
	    },
	    addKeyframe: function () {
	        var from = []
	        var to = []
	        var set3D = false
	        var frame = this
	        this.tweens.forEach(function (el) {
	            if (frame.use3D && /transform/i.test(el.name) && !set3D) {
	                set3D = true
	            }
	            from.push(dasherize(el.name) + ":" + el.start + el.unit)
	            to.push(dasherize(el.name) + ":" + el.end + el.unit)
	        })

	        //CSSKeyframesRule的模板
	        var anmationRule = "#{frameName} #{duration}ms cubic-bezier(#{easing}) 0s 1 normal #{model} running"
	        var rule1 = format(frameRule, {
	            frameName: this.frameName,
	            prefix: prefixCSS,
	            from: from.join(";"),
	            to: to.join(";")
	        })
	        insertKeyframe(this.frameName, rule1)
	        var rule2 = format(anmationRule, {
	            frameName: this.frameName,
	            duration: this.duration,
	            model: "forwards", //(this.showState === "hide") ? "backwards" : "forwards",
	            easing: avalon.bezier[this.easing]
	        })
	        var elem = this.elem
	        elem.style[avalon.cssName("animation")] = rule2
	        //http://aerotwist.com/blog/on-translate3d-and-layer-creation-hacks/
	        if (this.use3D && !set3D) {
	            elem.style[avalon.cssName("transform")] = "translate3d(0,0,0)"
	        }
	    }
	})

	 

/***/ }
/******/ ])
});
;