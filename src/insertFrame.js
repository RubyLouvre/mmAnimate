/*********************************************************************
 *                      时间轴操作,只对外暴露insertFrame                                    *
 **********************************************************************/
/**
 * @other
 * <p>一个时间轴<code>avalon.timeline</code>中包含许多帧, 一帧里面有各种渐变动画, 渐变的轨迹是由缓动公式所规定</p>
 */
var Timer = require('./timer')
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