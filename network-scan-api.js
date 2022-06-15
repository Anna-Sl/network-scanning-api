const netScanner = {
    wifi: {
        onAvailabilityChanged: null,
        isEnabled: null,

        onSuccessAndOptionsList: null,
        onErrorList: null,

        initialize: function (data) {
            this.isEnabled = data.isEnabled;
            this.onSuccessAndOptionsList = [];
            this.onErrorList = [];
        },

        scan: function(onsuccess, onerror, options) {
            if (onsuccess != null) {
                const onsuccessAndOpt = {
                    "onsuccess": onsuccess,
                    "options": options
                }
                this.onSuccessAndOptionsList.push(onsuccessAndOpt);
            } if (onerror != null)
                this.onErrorList.push(onerror);

            const cachedStr = androidInterface.scanWifi(JSON.stringify(options));
            if (cachedStr != null) {
                const cached = JSON.parse(cachedStr);
                cached.points = netScanner.filter(cached.points, options);
                __async_call__(onsuccess, cached);
            }
        },

        getCached: function (options) {
            if (options === undefined || options === null) {
                options = {};
            }
            const cachedStr = androidInterface.getCachedWifiData(JSON.stringify(options));
            const cached = JSON.parse(cachedStr);
            cached.points = netScanner.filter(cached.points, options);
            return cached;
        },

    },

    ble: {
        onAvailabilityChanged: null,
        isEnabled: null,

        onSuccessAndOptionsList: null,
        onErrorList: null,

        initialize: function (data) {
            this.isEnabled = data.isEnabled;
            this.onSuccessAndOptionsList = [];
            this.onErrorList = [];
        },

        scan: function(onsuccess, onerror, options) {
            if (onsuccess != null) {
                const onsuccessAndOpt = {
                    "onsuccess": onsuccess,
                    "options": options
                }
                this.onSuccessAndOptionsList.push(onsuccessAndOpt);
            } if (onerror != null)
                this.onErrorList.push(onerror);

            const cachedStr = androidInterface.scanBle(JSON.stringify(options));
            if (cachedStr != null) {
                const cached = JSON.parse(cachedStr);
                cached.points = netScanner.filter(cached.points, options);
                __async_call__(onsuccess, cached);
            }
        },

        getCached: function (options) {
            if (options === undefined || options === null) {
                options = {};
            }
            const cachedStr = androidInterface.getCachedBleData(JSON.stringify(options));
            const cached = JSON.parse(cachedStr);
            cached.points = netScanner.filter(cached.points, options);
            return cached;
        },

    },

    filter: function (points, options) {
        if (options === undefined || options === null || Object.keys(options).length===0) {
            return points;
        }
        if (options.names === undefined && options.addresses === undefined
            && options.prefixNames === undefined && options.filters === undefined) {
            return points;
        }
        console.debug("options.names is " + options.names);
        let result = [];
        for (const point of points) {
            if (options.names != null) {
                if (options.names.includes(point.name)) {
                    result.push(point);
                    continue;
                }
            }
            if (options.prefixNames != null) {
                console.debug("prefixNames is " + JSON.stringify(options.prefixNames));
                const capturedPrefixNames = options.prefixNames.filter(prefix =>
                    point.name!=null && point.name.startsWith(prefix));
                if (capturedPrefixNames !== undefined && capturedPrefixNames.length !== 0) {
                    result.push(point);
                    continue;
                }
            }
            if (options.ids != null) {
                console.debug("ids is " + JSON.stringify(options.ids));
                if (options.ids.includes(point.id)) {
                    result.push(point);
                    continue;
                }
            }
            if (options.filters != null) {
                console.debug("filters is" + JSON.stringify(options.filters));
                if (options.filters.filter(filter => {
                    filter.name === point.name
                    || filter.id === point.id
                    || point.name.startsWith(filter.prefixName)
                }) !== undefined) {
                    result.push(point);
                }
            }
        }
        return result;
    },

}

function __pbOnAvailabilityChanged__(net, data) {
    if (data != null) {
        net.isEnabled = data.isEnabled;
        if (net.onAvailabilityChanged)
            __async_call__(net.onAvailabilityChanged, data.isEnabled);
    }
}

function __pbOnNetworkScanned__(net, data) {
    if (data != null) {
        if (data.error != null) {
            const onerrorList = net.onErrorList;
            for (const onerror of onerrorList) {
                __async_call__(onerror, data.error);
            }
        } else {
            const onsuccessAndOptList = net.onSuccessAndOptionsList;
            const points = data.points;
            for (const onsuccessAndOpt of onsuccessAndOptList) {
                let filteredPoints = netScanner.filter(points, onsuccessAndOpt.options);
                console.debug("pbOnNetworkScanned callback: "+ JSON.stringify(filteredPoints));
                __async_call__(onsuccessAndOpt.onsuccess, filteredPoints);
            }
        }
        net.initialize(data);
    }
}

function __async_call__(fun, params) {
    new Promise(function(resolve, reject) {
        fun(params);
        resolve("success");
    }).then(result => {});
}

function pbOnAvailabilityChanged(networkDataStr) {
    console.debug("pbOnAvailabilityChanged is CALLED with networkDataStr="+networkDataStr);
    const networkData = JSON.parse(networkDataStr);
    __pbOnAvailabilityChanged__(netScanner.wifi, networkData.wifiData);
    __pbOnAvailabilityChanged__(netScanner.ble, networkData.bleData);
}

function pbOnNetworkScanned(networkDataStr) {
    console.debug("pbOnNetworkScanned is CALLED with networkDataStr="+networkDataStr);
    const networkData = JSON.parse(networkDataStr);
    __pbOnNetworkScanned__(netScanner.wifi, networkData.wifiData);
    __pbOnNetworkScanned__(netScanner.ble, networkData.bleData);
}

function pbOnPageLoaded(networkDataStr) {
    console.debug("pbOnPageLoaded is CALLED with networkDataStr"+networkDataStr);
    const networkData = JSON.parse(networkDataStr);
    netScanner.wifi.initialize(networkData.wifiData);
    netScanner.ble.initialize(networkData.bleData);
    openedInPhysicalBrowser(networkData.wifiData, networkData.bleData);
}