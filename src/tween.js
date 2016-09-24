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
    },
    updateColor: function (per, end) {
        if (end) {
            var rgb = this.end
        } else {
            var pos = this.easing(per)
            rgb = this.start.map(function (from, i) {
                return Math.max(Math.min(parseInt(from + (this.end[i] - from) * pos, 10), 255), 0)
            }, this)
        }
        this.now = "rgb(" + rgb + ")"
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
module.exports = Tween;

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
