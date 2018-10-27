// ==UserScript==
// @namespace       ProxyFiend.ProxyLib
// @exclude         *

// ==UserLibrary==
// @name            ProxyLib
// @description     Fixes a few of GreaseMonkey/TamperMonkey's shortfalls.
// @copyright       2018, ProxyFiend (https://openuserjs.org/users/ProxyFiend)
// @homepageURL     https://openuserjs.org/libs/ProxyFiend/ProxyLib/
// @license         MIT
// @version         1.0.0

// ==/UserScript==

// ==/UserLibrary==

// ==OpenUserJS==
// @author ProxyFiend
// ==/OpenUserJS==

var GM_metadata = GM_metadataParse(GM.info.scriptMetaStr)

/**
 * Prints a debug message to the console.
 * @param {string} message - String to be printed as a debug message.
 */
function GM_debug(message) {
    if (GM_metadata.prefix != undefined) {
        console.debug("[" + GM_metadata.prefix + "] " + message);
    } else {
        console.debug("[GM] " + message);
    }
};

/**
 * Inserts a stylesheet into the page's head tag.
 * @param {string} url - The URL to insert as a stylesheet.
 */
function GM_css(url) {
    var styleElement = document.createElement("link");
    styleElement.setAttribute("type", "text/css");
    styleElement.setAttribute("rel", "stylesheet");
    styleElement.setAttribute("href", url);
    document.head.appendChild(styleElement);
};

/**
 * Inserts a script into the page's head tag.
 * @param {string} url - The URL to insert as a script.
 */
function GM_script(url) {
    var scriptElement = document.createElement("script");
    scriptElement.setAttribute("src", url);
    document.head.appendChild(scriptElement);
}

/**
 * Get a JSON object using GreaseMonkey XHR.
 * @param {Object} data - XHR request data.
 * @returns Retrieved JSON data.
 */
function GM_getJSON(data) {
    GM_xmlhttpRequest({
        method: "GET",
        url: data.url + "?" + jQuery.param(data.data),
        onload: function (resp) {
            data.onload(JSON.parse(resp.responseText), resp);
        }
    });
};

/**
 * Parses userscript metadata into an object for reading extra data/settings.
 * @param {string} metadataBlock - The metadata string to parse.
 * @returns {Object} Metadata parsed into an object.
 */
function GM_metadataParse(metadataBlock) {
    metadataBlock = metadataBlock.toString();
    var re = /\/\/ @(\S+)(?:\s+(.*))?/;
    var headers = {};
    var name, prefix, header, key, value;
    var lines = metadataBlock.split(/[\r\n]+/).filter(function (e, i, a) {
        return (e.match(re));
    });
    for (var line in lines) {
        [, name, value] = lines[line].replace(/\s+$/, "").match(re);

        switch (name) {
            case "licence":
                name = "license";
                break;
        }

        [key, prefix] = name.split(/:/).reverse();
        if (key) {
            if (prefix) {
                if (!headers[prefix])
                    headers[prefix] = new Object;
                header = headers[prefix];
            } else
                header = headers;

            if (header[key]) {
                if (!(header[key] instanceof Array))
                    header[key] = new Array(header[key]);
                header[key].push(value || "");
            } else
                header[key] = value || "";
        }
    }

    if (headers["license"])
        headers["licence"] = headers["license"];
    return headers;
}