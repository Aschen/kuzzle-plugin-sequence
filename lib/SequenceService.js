function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class SequenceService {
  constructor (config, context) {
    this.config = config;

    this.context = context;

    this.sdk = this.context.accessors.sdk;

    this.Sequence = require('./Sequence')(this.config, this.sdk);
  }

  async begin () {
    const sequence = new this.Sequence();

    await sequence.save();

    return sequence;
  }

  async rollback (sequenceId) {
    const sequence = await this.Sequence.get(sequenceId);

    await sequence.rollback();

    await sequence.delete();

    return true;
  }

  async registerAction (request) {
    const
      action = capitalize(request.input.action), 
      sequenceId = request.input.args.sequenceId;

    if (!sequenceId) {
      return request;
    }

    const sequence = await this.Sequence.get(sequenceId);
    
    await this[`_register${action}`](request, sequence);

    return request;
  }

  async _registerCreate (request, sequence, documentId) {
    const
      _id = documentId || request.result._id, 
      { 
        index,
        collection  
      } = request.input.resource;
    
    const rollbackRequest = {
      controller: 'document',
      action: 'delete',
      index,
      collection,
      _id
    };

    sequence.addAction('create', rollbackRequest);

    await sequence.save();
  }

  async _registerDelete (request, sequence) {
    const
      { 
        index,
        collection,
        _id
      } = request.input.resource;

    const document = await this.sdk.document.get(index, collection, _id);

    const rollbackRequest = {
      controller: 'document',
      action: 'create',
      index,
      collection,
      _id,
      body: document._source
    };

    sequence.addAction('delete', rollbackRequest);

    await sequence.save();
  }

  async _registerUpdate (request, sequence) {
    const
      { 
        body,
        resource: {
          index,
          collection,
          _id
        }
      } = request.input;
    
    const document = await this.sdk.document.get(index, collection, _id);
    
    const updateBody = {};

    // new introduced fields can not be unset
    for (const key of Object.keys(body)) {
      updateBody[key] = document._source[key] || null;
    }

    const rollbackRequest = {
      controller: 'document',
      action: 'update',
      index,
      collection,
      _id,
      body: updateBody
    };

    sequence.addAction('update', rollbackRequest);

    await sequence.save();
  }

  async _registerReplace (request, sequence) {
    const
      { 
        index,
        collection,
        _id
      } = request.input.resource;
    
    const document = await this.sdk.document.get(index, collection, _id);
    
    const rollbackRequest = {
      controller: 'document',
      action: 'replace',
      index,
      collection,
      _id,
      body: document._source
    };

    sequence.addAction('replace', rollbackRequest);

    await sequence.save();
  }

  async _registerCreateOrReplace (request, sequence) {
    const
      { 
        index,
        collection,
        _id
      } = request.input.resource;

    if (await this.sdk.document.exists(index, collection, _id)) {
      await this._registerReplace(request, sequence);
    } else {
      await this._registerCreate(request, sequence, _id);
    }
  }
}

module.exports = SequenceService;