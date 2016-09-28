//分解用户的传参
var rmobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
var rgingerbread = /Android 2\.3\.[3-7]/i
var support3D = (function () {
    var prop = avalon.cssName("transform")
    var el = document.createElement('div')
    var root = document.documentElement
    el.style[prop] = 'translate3d(1px,1px,1px)'
    root.insertBefore(el, null)
    if (!window.getComputedStyle) {
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
