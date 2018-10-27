// ==UserScript==
// @name            Hentai Cafe Tweaks
// @namespace       ProxyFiend.HentaiCafeTweaks
// @prefix          HCT
// @author          ProxyFiend
// @homepage        https://openuserjs.org/scripts/ProxyFiend/Hentai_Cafe_Tweaks
// @supportURL      https://openuserjs.org/scripts/ProxyFiend/Hentai_Cafe_Tweaks/issues
// @copyright       2018, ProxyFiend (https://twitter.com/ProxyFiend)
// @license         MIT
// @version         1.3
// @description     Tweaks Hentai Cafe, making it easier to use, and easier to save doujin for offline enjoyment.
// @include         /.*:\/\/hentai\.cafe\/(?!artist|tag|78-2|category|page)([^\/]+)/
// @updateURL       https://openuserjs.org/meta/ProxyFiend/Hentai_Cafe_Tweaks.meta.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/1.4.2/jquery.scrollTo.min.js
// @require         https://openuserjs.org/src/libs/ProxyFiend/jQuery_Binary_Ajax.js
// @require         https://openuserjs.org/src/libs/ProxyFiend/ProxyLib.js
// @grant           GM_notification
// ==/UserScript==

/*
 *   DO NOT CHANGE ANYTHING BEYOND HERE, UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

(function () {
    'use strict';

    var progress = 0;
    var zip = new JSZip();
    var timer;
    var deferreds = [];
    var completed = [];

    const regex = /.*:\/\/hentai\.cafe\/(?!artist|tag|78-2|category|page)([^\/]+)/gm;
    let m;
    m = regex.exec(window.location);
    switch (m[1]) {
        case "manga":
            MangaPageScript();
            break;
        default:
            DownloadPageScript();
    }


    function MangaPageScript() {
        var key_flag = false;
        var key_scrolltimer;

        // Unbind events
        jQuery(document).unbind("keydown");
        jQuery(document).unbind("keyup");
        jQuery(".inner>a").attr("onclick", "").unbind("click");

        jQuery(document).keydown(function (e) {
            if (!jQuery("input").is(":focus")) {
                if (e.keyCode == 37 || e.keyCode == 65) {
                    e.preventDefault();
                    if (!key_flag) {
                        key_flag = true;
                        window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: "smooth"
                        });
                        prevPage();
                    }
                }
                if (e.keyCode == 39 || e.keyCode == 68) {
                    e.preventDefault();
                    if (!key_flag) {
                        key_flag = true;
                        window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: "smooth"
                        });
                        nextPage();
                    }
                }

                if (e.keyCode == 40 || e.keyCode == 83) {
                    e.preventDefault();
                    GM_debug("Triggered scroll down.");
                    if (!key_flag) {
                        key_flag = true;
                        key_scrolltimer = setInterval(function () {
                            window.scrollBy({
                                top: 13,
                                left: 0,
                                behavior: "instant"
                            });
                        }, 20);
                    }
                }

                if (e.keyCode == 38 || e.keyCode == 87) {
                    e.preventDefault();
                    if (!key_flag) {
                        key_flag = true;
                        key_scrolltimer = setInterval(function () {
                            window.scrollBy({
                                top: -13,
                                left: 0,
                                behavior: "instant"
                            });
                        }, 20);
                    }
                }
            }
        });

        jQuery(".inner>a").click(function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth"
            });
            nextPage();
        });

        jQuery(document).keyup(function (e) {
            key_scrolltimer = window.clearInterval(key_scrolltimer);
            key_flag = false;
        });
    };

    function DownloadPageScript() {
        jQuery("div.entry-content>div.last>p").append(
            jQuery("<a/>").addClass("x-btn x-btn-flat x-btn-rounded x-btn-large").attr("title", "Download").append(
                jQuery("<i/>").addClass("x-icon x-icon-download").attr("data-x-icon", "")).append(
                jQuery("<span/>").text("Download")).css("height", "53.9844px")
            .click(function () {
                if (progress === 0) {
                    downloadDoujin();
                    jQuery("a[title='Download'] span").animate({
                        opacity: 0
                    }).queue(function (n) {
                        jQuery(this).text("Downloading").dequeue();
                    }).animate({
                        width: "115px"
                    }).animate({
                        opacity: 1
                    });
                }
            }));

        jQuery("body").append(
            jQuery("<div/>").addClass("progress-bar").css({
                position: "fixed",
                bottom: "-10px",
                height: "10px",
                width: "100%",
                margin: "0px",
                background: "#121212"
            }).append(
                jQuery("<div/>").addClass("progress").css({
                    width: "0%",
                    height: "100%",
                    margin: "0px",
                    background: "#1e73be"
                })
            )
        );

        var deferredAddZip = function (url, filename, zip) {
            var deferred = jQuery.Deferred();
            jQuery.ajax({
                url: url,
                type: "GET",
                dataType: "binary",
                processData: false,
                success: function (result) {
                    completed.push(filename);
                    zip.file(filename, result, {
                        binary: true
                    });
                    GM_debug("Loaded page: " + filename);
                    deferred.resolve(result);
                },
                error: function (result) {
                    deferred.reject(result);
                }
            });
            return deferred;
        };

        var downloadDoujin = function () {
            progress = 1;

            jQuery("div.progress-bar").animate({
                bottom: "0px"
            }, {
                duration: 200,
                easing: "linear"
            });

            jQuery.ajax({
                url: jQuery("a.x-btn[title='Read']").attr("href"),
                dataType: "html",
                success: function (data) {
                    var obj = jQuery("<div/>").append(jQuery.parseHTML(data, true));
                    jQuery.globalEval(obj.find("#content>script")[0].innerText.substr(0, obj.find("#content>script")[0].innerText.indexOf("var next_chapter")));
                    GM_debug("Loaded page data.");

                    pages.forEach(function (page) {
                        deferreds.push(deferredAddZip(page.url.replace("cdn.", ""), page.filename, zip));
                        GM_debug("Added page: " + page.filename);
                    });

                    timer = setInterval(function () {
                        var total = 0;
                        var loaded = 0;
                        var percentage = 0;

                        total = pages.length;
                        loaded = completed.length;
                        percentage = ((loaded / total) * 100);

                        GM_debug("Total: " + total + "; Loaded: " + loaded + "; Percentage: " + percentage);

                        jQuery("div.progress-bar>div.progress").animate({
                            width: percentage + "%"
                        }, {
                            duration: 200
                        });
                    }, 250);

                    jQuery.when.apply(jQuery, deferreds).done(function () {
                        clearInterval(timer);
                        jQuery("div.progress-bar>div.progress").animate({
                            width: "100%"
                        }, {
                            duration: 200
                        });
                        zip.generateAsync({
                            type: "blob"
                        })
                            .then(function (blob) {
                            saveAs(blob, jQuery("div.entry-content>div.last>h3").text() + ".zip");

                            jQuery("a[title='Download'] span").animate({
                                opacity: 0
                            }).queue(function (n) {
                                jQuery(this).text("Completed").dequeue();
                            }).animate({
                                width: "95px"
                            }).animate({
                                opacity: 1
                            });

                            setTimeout(function () {
                                jQuery("div.progress-bar").animate({
                                    bottom: "-10px"
                                }, {
                                    duration: 200,
                                    easing: "linear"
                                });
                            }, 2000);
                            GM_notification({
                                title: "Hentai Cafe Downloader",
                                text: jQuery("div.entry-content>div.last>h3").text() + " has finished downloading. Enjoy!",
                                timeout: 2000
                            });
                        });
                    });
                }
            });
        };
    };
})();
