/**
 * Minimal CJS mock for rou3 (ESM) so Jest can load @colyseus/better-call.
 * Only implements what the router uses: createRouter, addRoute, findRoute, findAllRoutes.
 */
"use strict";

function createRouter() {
  return { root: { key: "" }, static: Object.create(null), routes: [] };
}

function addRoute(ctx, method, path, data) {
  if (!ctx.routes) ctx.routes = [];
  ctx.routes.push({ method: (method || "").toUpperCase(), path: path || "/", data });
}

function findRoute(router, method, path) {
  const m = (method || "").toUpperCase();
  const list = router?.routes || [];
  const found = list.find((r) => r.method === m && r.path === path);
  return found ? { data: found.data, params: {} } : null;
}

function findAllRoutes(router, _method, _path) {
  return (router?.routes || []).map((r) => ({ data: r.data, params: {} }));
}

const NullProtoObj = function () {};
NullProtoObj.prototype = Object.create(null);

module.exports = {
  NullProtoObj,
  addRoute,
  createRouter,
  findAllRoutes,
  findRoute,
  removeRoute: function () {},
  routeToRegExp: function () {
    return /^.*$/;
  },
};
