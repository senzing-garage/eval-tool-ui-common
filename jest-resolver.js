module.exports = (request, options) => {
  // For Angular subpath imports (e.g. @angular/core/testing, @angular/common/http/testing),
  // resolve to fesm2022 bundles since Angular 21 uses package exports without physical subdirs
  if (request.startsWith('@angular/')) {
    const withoutPrefix = request.replace('@angular/', '');
    const parts = withoutPrefix.split('/');
    const pkg = parts[0];
    const subpath = parts.slice(1).join('/');
    if (subpath) {
      // Try exact subpath first (e.g. testing -> fesm2022/testing.mjs)
      try {
        return require.resolve(`@angular/${pkg}/fesm2022/${subpath}.mjs`, {
          paths: [options.basedir],
        });
      } catch {}
      // Try hyphenated form (e.g. http/testing -> fesm2022/http-testing.mjs)
      const hyphenated = parts.slice(1).join('-');
      try {
        return require.resolve(`@angular/${pkg}/fesm2022/${hyphenated}.mjs`, {
          paths: [options.basedir],
        });
      } catch {}
    }
  }
  return options.defaultResolver(request, options);
};
