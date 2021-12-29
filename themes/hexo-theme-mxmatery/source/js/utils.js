/**
 * 动态添加JavaScript
 * @param {*} url 资源地址
 * @param {*} callback 回调方法
 */
function getScript(url, callback) {
    var script = document.createElement('script')
    script.type = "text/javascript"
    if (typeof (callback) != "undefined") {
        if (script.readyState) {
            console.log(script.onreadystatechange)
            script.onreadystatechange = function () {
                if (script.readyState === "loaded" || script.readyState === "complete") {
                    script.onreadystatechange = null
                    callback()
                }
            }
        } else {
            script.onload = function () {
                callback()
            }
        }
    }
    script.src = url
    if (document.getElementById("scripts") != null) {
        document.getElementById("scripts").appendChild(script)
    } else {
        document.body.appendChild(script)
    }
}

/**
 * 图片懒加载
 * @param {*} img 需要懒加载的img元素(标签)
 * @param {*} attr 图片的真实url地址
 */
function ImgLazyLoad(img, attr) {
    var imgLazyLoad = document.querySelectorAll(img)

    function LazyLoad(target) {
        const io = new IntersectionObserver((entries, Observer) => {
            entries.forEach(entry => {
                setTimeout(function () {
                    if (entry.isIntersecting) {
                        const img = entry.target
                        const src = img.getAttribute(attr)
                        img.setAttribute("src", src)
                        Observer.disconnect()
                    }
                }, 500)
            })
        })
        io.observe(target)
    }

    imgLazyLoad.forEach(LazyLoad)
}

ImgLazyLoad("body img[data-img]", "data-img")

/**
 * 搜索
 */
var searchFunc = function (path, search_id, content_id) {
    'use strict';
    $.ajax({
        url: path,
        dataType: "xml",
        success: function (xmlResponse) {
            // get the contents from search data
            var datas = $("entry", xmlResponse).map(function () {
                return {
                    title: $("title", this).text(),
                    content: $("content", this).text(),
                    url: $("url", this).text()
                };
            }).get();
            var $input = document.getElementById(search_id);
            var $resultContent = document.getElementById(content_id);
            $input.addEventListener('input', function () {
                var str = '<ul class=\"search-result-list\">';
                var keywords = this.value.trim().toLowerCase().split(/[\s\-]+/);
                $resultContent.innerHTML = "";
                if (this.value.trim().length <= 0) {
                    return;
                }
                // perform local searching
                datas.forEach(function (data) {
                    var isMatch = true;
                    var content_index = [];
                    var data_title = data.title.trim().toLowerCase();
                    var data_content = data.content.trim().replace(/<[^>]+>/g, "").toLowerCase();
                    var data_url = data.url;
                    var index_title = -1;
                    var index_content = -1;
                    var first_occur = -1;
                    // only match artiles with not empty titles and contents
                    if (data_title != '' && data_content != '') {
                        keywords.forEach(function (keyword, i) {
                            index_title = data_title.indexOf(keyword);
                            index_content = data_content.indexOf(keyword);
                            if (index_title < 0 && index_content < 0) {
                                isMatch = false;
                            } else {
                                if (index_content < 0) {
                                    index_content = 0;
                                }
                                if (i == 0) {
                                    first_occur = index_content;
                                }
                            }
                        });
                    }
                    // show search results
                    if (isMatch) {
                        str += "<li><a href='" + data_url + "' class='search-result-title'>《 " + data_title + " 》</a>";
                        var content = data.content.trim().replace(/<[^>]+>/g, "");
                        if (first_occur >= 0) {
                            // cut out 100 characters
                            var start = first_occur - 20;
                            var end = first_occur + 80;
                            if (start < 0) {
                                start = 0;
                            }
                            if (start == 0) {
                                end = 100;
                            }
                            if (end > content.length) {
                                end = content.length;
                            }
                            var match_content = content.substr(start, end);
                            // highlight all keywords
                            keywords.forEach(function (keyword) {
                                var regS = new RegExp(keyword, "gi");
                                match_content = match_content.replace(regS, "<em class=\"search-keyword\">" + keyword + "</em>");
                            });

                            str += "<p class=\"search-result\">" + match_content + "...</p>"
                        }
                        str += "</li>";
                    }
                });
                str += "</ul>";
                $resultContent.innerHTML = str;
            });
        }
    });
}

/**
 *
 */
