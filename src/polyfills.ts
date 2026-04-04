// UAT compatibility: some JS engines do not support Object.hasOwn.
if (typeof Object.hasOwn !== "function") {
  Object.defineProperty(Object, "hasOwn", {
    value: (obj: object, prop: PropertyKey) =>
      Object.prototype.hasOwnProperty.call(obj, prop),
    configurable: true,
    writable: true,
  });
}
