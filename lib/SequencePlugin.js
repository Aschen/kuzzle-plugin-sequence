const 
  SequenceService = require('./SequenceService');

function getProperty(document, path) {
  if (!document) {
    return document;
  }

  const names = path.split('.');

  if (names.length === 1) {
    return document[names[0]];
  }

  return getProperty(document[names[0]], names.slice(1).join('.'));
}

class SequencePlugin {
  constructor () {
    this.defaultConfig = {
      ttl: 60,
      redisPrefix: 'sequencePlugin/sequences'
    };

    this.controllers = {
      sequence: {
        begin: 'sequenceBegin',
        rollback: 'sequenceRollback',
        get: 'sequenceGet'
      }
    };

    this.pipes = {
      'document:afterCreate': req => this.sequenceService.registerAction(req),
      'document:beforeUpdate': req => this.sequenceService.registerAction(req),
      'document:beforeReplace': req => this.sequenceService.registerAction(req),
      'document:beforeCreateOrReplace': req => this.sequenceService.registerAction(req),
      'document:beforeDelete': req => this.sequenceService.registerAction(req)
    };
  }

  init (config, context) {
    this.config = { ...this.defaultConfig, ...config };
    this.context = context;

    this.sdk = this.context.accessors.sdk;

    this.sequenceService = new SequenceService(this.config, this.context);
  }

  async sequenceBegin () {
    const sequence = await this.sequenceService.begin();

    return sequence.serialize();
  }

  async sequenceRollback (request) {
    const sequenceId = this._stringArg(request, 'sequenceId');

    await this.sequenceService.rollback(sequenceId);

    return true;
  }

  async sequenceGet (request) {
    const sequenceId = this._stringArg(request, 'sequenceId');
    
    const sequence = await this.sequenceService.Sequence.get(sequenceId);
    
    return sequence.serialize();
  }

  /**
   * Extracts a string parameter from the request input args
   *
   * @param {KuzzleRequest} request
   * @param {string} paramPath - Path of the parameter to extract (eg: 'foo' or 'foo.bar' for nested params)
   * @param {?string} defaultValue
   * @returns {string}
   */
  _stringArg(request, paramPath, defaultValue = null) {
    const stringParam = getProperty(request.input.args, paramPath) || defaultValue;

    if (!stringParam) {
      throw new this.context.errors.BadRequestError(`Missing arg "${paramPath}"`);
    }

    if (typeof stringParam !== 'string') {
      throw new this.context.errors.BadRequestError(`Invalid string arg "${paramPath}" value "${stringParam}"`);
    }

    return stringParam;
  }

}

module.exports = SequencePlugin;