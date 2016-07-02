define(["mmAnimate"], function(avalon) {
    //用法与draggable相似  ms-animate="vmID, optionName"
    //也可以通过添加辅助指令进行配置
    //data-animate-duration
    //data-animate-class
    //data-animate-count
    //data-animate-easing
    //data-animate-complete
    //data-animate-step
    //data-animate-prop
    //data-animate-use3d
    avalon.bindingHandlers.animate = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "animate"]
        var ID = args[0].trim(), opts = args[1], model, vmOptions
        if (ID && ID != "$") {
            model = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!model) {
                return
            }
        }
        data.element.removeAttribute("ms-animate")
        if (!model) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            model = vmodels.length ? vmodels[0] : null
        }
        var fnObj = model || {}
        if (model && typeof model[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element
        var options = avalon.mix({}, vmOptions || {}, data[opts] || {}, avalon.getWidgetData(element, "animate"))

        "step,complete".replace(avalon.rword, function(name) {
            var method = options[name]
            if (typeof method === "string") {
                if (typeof fnObj[method] === "function") {
                    options[name] = fnObj[method]
                }
            }
        })
        var props = options.props
        delete options.props
        var animateCallback = avalon.bind(element, options.event, function() {
            avalon(element).animate(props, options.props)
        })

        function offTree() {
            if (!element.msRetain && !document.documentElement.contains(element)) {
                avalon.unbind(element, options.event, animateCallback)
                return false
            }
        }
        if (window.chrome) {
            element.addEventListener("DOMNodeRemovedFromDocument", function() {
                setTimeout(offTree)
            })
        } else {
            avalon.tick(offTree)
        }
    }
    return avalon
})
