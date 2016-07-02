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