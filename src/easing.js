
var bezier = {
    "linear": [0.250, 0.250, 0.750, 0.750],
    "ease": [0.250, 0.100, 0.250, 1.000],
    "swing": [0.250, 0.100, 0.250, 1.000],
    "easeIn": [0.420, 0.000, 1.000, 1.000],
    "easeOut": [0.000, 0.000, 0.580, 1.000],
    "easeInOut": [0.420, 0.000, 0.580, 1.000],
    "easeInQuad": [0.550, 0.085, 0.680, 0.530],
    "easeInCubic": [0.550, 0.055, 0.675, 0.190],
    "easeInQuart": [0.895, 0.030, 0.685, 0.220],
    "easeInQuint": [0.755, 0.050, 0.855, 0.060],
    "easeInSine": [0.470, 0.000, 0.745, 0.715],
    "easeInExpo": [0.950, 0.050, 0.795, 0.035],
    "easeInCirc": [0.600, 0.040, 0.980, 0.335],
    "easeInBack": [0.600, -0.280, 0.735, 0.045],
    "easeOutQuad": [0.250, 0.460, 0.450, 0.940],
    "easeOutCubic": [0.215, 0.610, 0.355, 1.000],
    "easeOutQuart": [0.165, 0.840, 0.440, 1.000],
    "easeOutQuint": [0.230, 1.000, 0.320, 1.000],
    "easeOutSine": [0.390, 0.575, 0.565, 1.000],
    "easeOutExpo": [0.190, 1.000, 0.220, 1.000],
    "easeOutCirc": [0.075, 0.820, 0.165, 1.000],
    "easeOutBack": [0.175, 0.885, 0.320, 1.275],
    "easeInOutQuad": [0.455, 0.030, 0.515, 0.955],
    "easeInOutCubic": [0.645, 0.045, 0.355, 1.000],
    "easeInOutQuart": [0.770, 0.000, 0.175, 1.000],
    "easeInOutQuint": [0.860, 0.000, 0.070, 1.000],
    "easeInOutSine": [0.445, 0.050, 0.550, 0.950],
    "easeInOutExpo": [1.000, 0.000, 0.000, 1.000],
    "easeInOutCirc": [0.785, 0.135, 0.150, 0.860],
    "easeInOutBack": [0.680, -0.550, 0.265, 1.550],
    "custom": [0.000, 0.350, 0.500, 1.300],
    "random": [Math.random().toFixed(3),
        Math.random().toFixed(3),
        Math.random().toFixed(3),
        Math.random().toFixed(3)]
}
//缓动公式
avalon.easing = {}
avalon.each(bezier, function (key, value) {
    avalon.easing[key] = bezierToEasing([value[0], value[1]], [value[2], value[3]])
})
function bezierToEasing(p1, p2) {
    var A = [null, null], B = [null, null], C = [null, null],
            derivative = function (t, ax) {
                C[ax] = 3 * p1[ax], B[ax] = 3 * (p2[ax] - p1[ax]) - C[ax], A[ax] = 1 - C[ax] - B[ax]
                return t * (C[ax] + t * (B[ax] + t * A[ax]))
            },
            bezierXY = function (t) {
                return C[0] + t * (2 * B[0] + 3 * A[0] * t)
            },
            parametric = function (t) {
                var x = t, i = 0, z
                while (++i < 14) {
                    z = derivative(x, 0) - t
                    if (Math.abs(z) < 1e-3)
                        break
                    x -= z / bezierXY(x)
                }
                return x
            }
    return function (t) {
        return derivative(parametric(t), 1)
    }
}
avalon.bezier = bezier