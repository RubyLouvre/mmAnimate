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