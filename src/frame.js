/*********************************************************************
 *                                  逐帧动画                            *
 **********************************************************************/
var Tween = require('./tween')

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