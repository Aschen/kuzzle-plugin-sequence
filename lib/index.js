'use strict';

let SequencePluginClass;

try {
  // Try to load the es5 compat version
  SequencePluginClass = require('../build/SequencePlugin');
} catch (error) {
  // Falling back to es6 version
  SequencePluginClass = require('./SequencePlugin');
}

module.exports = SequencePluginClass;