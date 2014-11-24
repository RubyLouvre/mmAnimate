
define(["mmPromise"], function(avalon) {


    function Frame(node) {
        this.$events = {}
        this.node = node
        this.troops = []
        this.tweens = []
        this.orig = []
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
                fn.call(this.node, args)
            }
        },
        createTween: function() {
            var hidden = avalon.fx.isHidden(this.elem)
            for (var i in this.props) {
                createTweenImpl(this, i, this.props[i], hidden)
            }
        }
    }
    var rfxnum = new RegExp("^(?:([+-])=|)(" + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ")([a-z%]*)$", "i")
    function createTweenImpl(frame, name, value, hidden) {
        var node = frame.node
        var tween = new Tween(frame, name, value)
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
                frame.method = value;
                avalon.css(node, name, 0);
                parts = [0, parseFloat(from)]
            } else if (value === "hide") {
                frame.method = value;
                frame.orig[name] = from
                parts = [parseFloat(from), 0]
                value = 0;
            } else {// "18em"  "+=18em"
                parts = rfxnum.exec(value)//["+=18em", "+=", "18", "em"]
                if (parts) {
                    parts[2] = parseFloat(parts[2]) //18
                    if (parts[3] && parts[ 3 ] !== unit) {//如果存在单位，并且与之前的不一样，需要转换
                        var clone = node.cloneNode(true)
                        clone.style.visibility = "none"
                        clone.style.position = "absolute"
                        node.parentNode.appendChild(clone)
                        avalon.css(clone, name, parts[2] + (parts[3] ? parts[3] : 0))
                        parts[ 2 ] = parseFloat(avalon.css(clone, name))
                        node.parentNode.removeChild(clone)
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
        }
    }

    function Tween(options, prop, end) {
        this.options = options
        this.elem = this.node
        this.prop = prop
        this.end = end
        this.easing = this.options.easing
    }
    Tween.prototype = {
        cur: function() {
            var hooks = Tween.propHooks[ this.prop ];
            return hooks && hooks.get ?
                    hooks.get(this) :
                    Tween.propHooks._default.get(this);
        }
    }

    Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result = avalon.css(tween.elem, tween.prop)
                return !result || result === "auto" ? 0 : result
            },
            set: function(tween) {
                avalon.css(tween.elem, tween.prop, tween.now)
            }
        },
        scrollTop: {
        }
    };
    avalon.each(["scrollTop", "scollLeft"], function(name) {
        Tween.propHooks[name] = {
            get: function(tween) {
                return tween.elem[name]
            },
            set: function(tween) {
                tween.elem[name] = tween.now
            }
        }
    })




    var rfxnum = new RegExp("^(?:([+-])=|)(" + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ")([a-z%]*)$", "i")
    var root = document.documentElement
    avalon.mix(avalon.fx, {
        easing: {//缓动公式
            linear: function(pos) {
                return pos
            },
            swing: function(pos) {
                return (-Math.cos(pos * Math.PI) / 2) + 0.5
            }
        },
        fps: 30,
        isHidden: function(node) {
            return  node.sourceIndex === 0 || avalon.css(node, "display") === "none" || !avalon.contains(root, node)
        }
    })
    //==============================中央列队=======================================
    var timeline = avalon.timeline = [] //时间轴

    function insertFrame(frame) { //插入包含关键帧原始信息的帧对象
        if (frame.queue) { //如果指定要排队
            var gotoQueue = 1
            for (var i = timeline.length, el; el = timeline[--i]; ) {
                if (el.node === frame.node) { //★★★第一步
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
                if (!(timeline[i].node && enterFrame(timeline[i], i))) {
                    timeline.splice(i, 1)
                }
            }
        }
        timeline.length || (clearInterval(insertFrame.id), insertFrame.id = null)
    }
//.animate( properties [, duration] [, easing] [, complete] )
//.animate( properties, options )


//==============================裁剪用户传参到可用状态===========================
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
    }

    var effect = avalon.fn.animate = avalon.fn.fx = function(props) {
//将多个参数整成两个，第一参数暂时别动
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

    function enterFrame(frame, index) {
//驱动主列队的动画实例进行补间动画(update)，
//并在动画结束后，从子列队选取下一个动画实例取替自身
        var node = frame.node,
                now = +new Date
        if (!frame.startTime) { //第一帧
            frame.fire("before")//动画开始前做些预操作
            frame.props && parseFrames(frame.node, frame, index) //parse原始材料为关键帧
            frame.props = frame.props || []
            AnimationPreproccess[frame.method || "noop"](node, frame) //parse后也要做些预处理
            frame.startTime = now
        } else { //中间自动生成的补间
            var per = (now - frame.startTime) / frame.duration
            var end = frame.gotoEnd || per >= 1 //gotoEnd可以被外面的stop方法操控,强制中止
            var hooks = effect.updateHooks
            if (frame.update) {
                for (var i = 0, obj; obj = frame.props[i++]; ) { // 处理渐变
                    (hooks[obj.type] || hooks._default)(node, per, end, obj)
                }
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
            } else {
                frame.fire("step") //每执行一帧调用的回调
            }
        }
        return true
    }
    return avalon
})
