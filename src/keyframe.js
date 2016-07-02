var Tween = require('./tween')
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

 