
define(["mmPromise"], function(avalon) {


    var effect = avalon.fn.animate = avalon.fn.fx = function(props) {
        //avalon(elem).animate( properties [, duration] [, easing] [, complete] )
        //avalon(elem).animate( properties, options )
        var frame = new Frame(this[0])
        addOptions.apply(frame, arguments)//处理第二,第三...参数
        for (var name in props) {//处理第一个参数
            var p = avalon.cssName(name) || name
            if (name !== p) {
                props[p] = props[name] //转换为驼峰风格borderTopWidth, styleFloat
                delete props[name] //去掉连字符风格 border-top-width, float
            }
        }
        frame.props = props
        //包含关键帧的原始信息的对象到主列队或子列队
        insertFrame(frame)
        return this
    }
    avalon.mix(effect, {
        easing: {//缓动公式
            linear: function(pos) {
                return pos
            },
            swing: function(pos) {
                return (-Math.cos(pos * Math.PI) / 2) + 0.5
            }
        },
        fps: 30
    })

    //分解用户的传参
    function addOptions(properties) {
        if (typeof properties === "number") { //如果第一个为数字
            this.duration = properties
        }
        //如果第二参数是对象
        for (var i = 1; i < arguments.length; i++) {
            addOption(this, arguments[i])
        }
        this.duration = typeof this.duration === "number" ? this.duration : 400
        this.queue = !!(this.queue == null || this.queue) //默认进行排队
        this.easing = avalon.easing[this.easing] ? this.easing : "swing"
        this.update = true
        this.gotoEnd = false
    }

    function addOption(frame, p, name) {
        if (p === "slow") {
            frame.duration = 600
        } else if (p === "fast") {
            frame.duration = 200
        } else {
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
                    frame.easing = p
                    break
                case "function":
                    name = name || "complete"
                    frame.bind(name, p)
                    break
            }
        }
    }
    //==============================中央列队=======================================
    var timeline = avalon.timeline = [] //时间轴

    function insertFrame(frame) { //插入包含关键帧原始信息的帧对象
        if (frame.queue) { //如果指定要排队
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
        } else {
            timeline.push(frame)
        }
        if (insertFrame.id === null) { //只要数组中有一个元素就开始运行
            insertFrame.id = setInterval(deleteFrame, 1000 / avalon.fps)
        }
    }

    insertFrame.id = null

    function deleteFrame() {
        //执行动画与尝试删除已经完成或被强制完成的帧对象
        var i = timeline.length
        while (--i >= 0) {
            if (!timeline[i].paused) { //如果没有被暂停
                if (!(timeline[i].elem && enterFrame(timeline[i], i))) {
                    timeline.splice(i, 1)
                }
            }
        }
        timeline.length || (clearInterval(insertFrame.id), insertFrame.id = null)
    }

    function enterFrame(frame, index) {
        //驱动主列队的动画实例进行补间动画(update)，
        //并在动画结束后，从子列队选取下一个动画实例取替自身
        var now = +new Date
        if (!frame.startTime) { //第一帧
            frame.fire("before")//动画开始前做些预操作
            frame.createTweens()
            frame.build()
            frame.startTime = now
        } else { //中间自动生成的补间
            var per = (now - frame.startTime) / frame.duration
            var end = frame.gotoEnd || per >= 1 //gotoEnd可以被外面的stop方法操控,强制中止
            if (frame.update) {
                for (var i = 0, tween; tween = frame.tweens[i++]; ) {
                    tween.run(per, end)
                }
                frame.fire("step") //每执行一帧调用的回调
            }
            if (end) { //最后一帧
                frame.fire("after") //动画结束后执行的一些收尾工作
                frame.fire("complete") //执行用户回调
                if (frame.revert && frame.negative.length) { //如果设置了倒带
                    Array.prototype.unshift.apply(frame.positive, frame.negative.reverse())
                    frame.negative = [] // 清空负向列队
                }
                var neo = frame.positive.shift()
                if (!neo) {
                    return false
                } //如果存在排队的动画,让它继续
                timeline[index] = neo
                neo.positive = frame.positive
                neo.negative = frame.negative
            }
        }
        return true
    }

    //帧对象
    function Frame(node) {
        this.$events = {}
        this.elem = node
        this.troops = []
        this.tweens = []
        this.orig = []
    }
    var root = document.documentElement

    Frame.isHidden = function(node) {
        return  node.sourceIndex === 0 || avalon.css(node, "display") === "none" || !avalon.contains(root, node)
    }

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
            if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
                //如果是动画则必须将它显示出来
                frame.overflow = [style.overflow, style.overflowX, style.overflowY]

                var display = elem.getAttribute("olddisplay")
                if (!display || display === "none") {
                    display = avalon.parseDisplay(elem.nodeName)
                    elem.setAttribute("olddisplay", display)
                }
                elem.style.display = display

                //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                if (display === "inline" && avalon.css(elem, "float") === "none") {
                    if (inlineBlockNeedsLayout) { //IE
                        if (display === "inline") {
                            elem.style.display = "inline-block"
                        } else {
                            elem.style.display = "inline"
                            elem.style.zoom = 1
                        }
                    }
                } else { //W3C
                    elem.style.display = "inline-block"
                }
            }
            if (frame.overflow) {
                style.overflow = "hidden"
                frame.bind("after", function() {
                    style.overflow = frame.overflow[ 0 ]
                    style.overflowX = frame.overflow[ 1 ]
                    style.overflowY = frame.overflow[ 2 ]
                    frame.overflow = null
                })
            }
            if (frame.showState === "hide") {
                frame.bind("after", function() {
                    this.style.display = "none"
                    for (var i in frame.orig) { //还原为初始状态
                        avalon.css(this, i, frame.orig[i])
                    }
                })
            }
        },
        createTween: function() {
            var hidden = Frame.isHidden(this.elem)
            for (var i in this.props) {
                createTweenImpl(this, i, this.props[i], hidden)
            }
        }
    }

    var rfxnum = new RegExp("^(?:([+-])=|)(" + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ")([a-z%]*)$", "i")

    function createTweenImpl(frame, name, value, hidden) {
        var elem = frame.elem
        var tween = new Tween(name, frame)
        var from = tween.cur() //取得起始值
        var to
        if (/color$/.test(name)) {
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
                avalon.css(elem, name, 0);
                parts = [0, parseFloat(from)]
            } else if (value === "hide") {
                frame.orig[name] = from
                parts = [parseFloat(from), 0]
                value = 0;
            } else {// "18em"  "+=18em"
                parts = rfxnum.exec(value)//["+=18em", "+=", "18", "em"]
                if (parts) {
                    parts[2] = parseFloat(parts[2]) //18
                    if (parts[3] && parts[ 3 ] !== unit) {//如果存在单位，并且与之前的不一样，需要转换
                        var clone = elem.cloneNode(true)
                        clone.style.visibility = "none"
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
        if (from + "" !== to + "") { //不处理初止值都一样的样式与属性
            tween.start = from
            tween.end = to
            tween.unit = unit
            frame.tweens.push(tween)
        } else {
            delete frame.props[name]
        }
    }

    //缓动对象
    function Tween(prop, options) {
        this.elem = options.elem
        this.prop = prop
        this.easing = avalon.easing[this.options.easing]
        if (/color$/i.test(prop)) {
            this.update = this.updateColor
        }
    }

    Tween.prototype = {
        cur: function() {
            var hooks = Tween.propHooks[ this.prop ]
            return hooks && hooks.get ?
                    hooks.get(this) :
                    Tween.propHooks._default.get(this)
        },
        run: function(per, end) {
            this.update(per, end)
            var hook = Tween.propHooks[ this.prop ]
            if (hook && hook.set) {
                hook.set(this);
            } else {
                Tween.propHooks._default.set(this)
            }
        },
        updateColor: function(per, end) {
            if (end) {
                var rgb = this.end
            } else {
                var pos = this.easing(per)
                rgb = this.start.map(function(from, i) {
                    return Math.max(Math.min(parseInt(from + (this.end[i] - from) * pos, 10), 255), 0)
                }, this)
            }
            this.now = "rgb(" + rgb + ")"
        },
        update: function(per, end) {
            this.now = (end ? this.end : this.start + this.easing(per) * (this.end - this.start))
        }
    }

    Tween.propHooks = {
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
    //=======================转换各种颜色值为RGB数组===========================
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
        var parseColor = new function() {
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
            return function(color) {
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
            color.replace(/\w{2}/g, function(a) {
                ret.push(parseInt(a, 16))
            })
            return (colorMap[color] = ret)
        }
        if (window.VBArray) {
            return (colorMap[color] = parseColor(color))
        }
        return colorMap.white
    }
    avalon.parseColor = color2array
    return avalon
})
