const uuid = require('uuid/v4');

class Sequence {

  static key (sequenceId) {
    return `${this.config.redisPrefix}/${sequenceId}`;
  }

  static async get (sequenceId) {
    const sequence = JSON.parse(
      await this.sdk.ms.get(this.key(sequenceId))
    );

    return new this(sequence);
  }

  constructor (data) {
    if (data) {
      for (const key of Object.keys(data)) {
        this[key] = data[key];
      }
    } else {
      this.id = uuid();
      this.actions = [];
      this.expiresAt = 
        Math.round(Date.now() / 1000) + this.constructor.config.ttl;
    }
  }

  addAction (actionName, rollbackRequest) {
    this.actions.push({
      action: actionName,
      rollbackRequest
    });
  }

  async rollback () {
    // todo: Shrink array when rollback successfull 
    for (const { rollbackRequest } of this.actions.reverse()) {
      await this.constructor.sdk.query(rollbackRequest);
    }
  }

  save () {
    const remainingTTL = this.expiresAt - Math.round(Date.now() / 1000);

    return this.constructor.sdk.ms.set(
      this.constructor.key(this.id), 
      JSON.stringify(this.serialize()), 
      { ex: remainingTTL }
    );
  }

  delete () {
    return this.constructor.sdk.ms.del([this.constructor.key(this.id)]);
  }

  serialize () {
    return {
      id: this.id,
      actions: this.actions,
      expiresAt: this.expiresAt
    };
  }
}

module.exports = (config, sdk) => {
  Sequence.config = config;
  Sequence.sdk = sdk;

  return Sequence;
};