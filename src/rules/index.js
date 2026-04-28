'use strict';

module.exports = [
  require('./expensive-resource-class'),
  require('./macos-executor'),
  require('./docker-no-pin'),
  require('./missing-cache'),
  require('./orb-no-pin'),
  require('./missing-no-output-timeout'),
  require('./secret-echo'),
  require('./wide-filters'),
];
