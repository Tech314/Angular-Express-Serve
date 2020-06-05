"use strict";
const express = require("express");
const compression = require("compression");
const request = require("request");
const memCache = require("memory-cache");

const _bucketAddress = "";
const port = 4101;

const app = express();
app.use(compression);

const cache = {
    getCache: () => {
        return (req, res, next) => {
            const key = "express_" + req.originalUrl;
            const cached = memCache.get(key);
            if (cached) {
                res.type(cached.headers['content-type']);
                res.send(cached.body);
            } else {
                next();
            }
        }
    },
    handleResponse: (req, res, url) => {
        request(url, (error, response) => {
            const key = "express_" + req.originalUrl;
            memCache.put(key, response, 120000);
        }).pipe(res);
    }
};

/* Serve from bucket */
// static files
app.all("*.(js|css|ttf|svg|png|jpg|jpeg|ico|woff2|woff|txt|html)", cache.getCache(), (req,res) => {
    const url = _bucketAddress + req.url;
    cache.handleResponse(req, res, url);
});

// application paths
app.all("*", cache.getCache(), (req, res) => {
    cache.handleResponse(req, res, _bucketAddress);
});

// start server
app.listen(port, () => {
    console.log("Express server for " + app.name + " listening on port " + port);
});