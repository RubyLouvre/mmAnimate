Tween.prototype.updateColor = function (per, end) {
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