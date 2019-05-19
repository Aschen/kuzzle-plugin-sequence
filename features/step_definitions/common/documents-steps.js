const
  _ = require('lodash'),
  should = require('should'),
  {
    When,
    Given,
    Then
  } = require('cucumber');

Given('a collection {string}:{string}', async function (index, collection) {
  await this.kuzzle.index.create(index);
  await this.kuzzle.collection.create(index, collection);

  this.props.index = index;
  this.props.collection = collection;
});

Given('an existing collection {string}:{string}', async function (index, collection) {
  if (!await this.kuzzle.index.exists(index)) {
    throw new Error(`Index ${index} does not exists`);
  }
  if (!await this.kuzzle.collection.exists(index, collection)) {
    throw new Error(`Collection ${index}:${collection} does not exists`);
  }

  this.props.index = index;
  this.props.collection = collection;
});

Given(/I (create|update|replace|createOrReplace) the document '(.*)' with '(.*)'/, async function (actionName, documentId, documentRaw) {
  const body = JSON.parse(documentRaw);

  await this.kuzzle.query({
    controller: 'document',
    action: actionName,
    index: this.props.index, 
    collection: this.props.collection, 
    body, 
    _id: documentId,
    sequenceId: this.props.sequenceId
  });
});

When('I delete the document {string}', async function (documentId) {
  await this.kuzzle.query({
    controller: 'document',
    action: 'delete',
    index: this.props.index, 
    collection: this.props.collection, 
    _id: documentId,
    sequenceId: this.props.sequenceId
  });
});

Then(/The document "(.*)" has (not )?a property "(.*)"( with string value '(.*)')?/, async function (documentId, not, propertyName, value) {
  const response = await this.kuzzle.document.get(this.props.index, this.props.collection, documentId);

  const property = _.get(response._source, propertyName);

  if (!not) {
    should(property).not.be.undefined();

    if (value) {
      should(property).be.eql(value);
    }  
  } else {
    should(property).be.undefined();
  }
});

Then(/The document "(.*)"( does not)? exists/, async function (documentId, mustNotExists) {
  try {
    await this.kuzzle.document.get(this.props.index, this.props.collection, documentId);

    if (mustNotExists) {
      throw new Error(`Document "${documentId}" exists`);
    }
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    if (!mustNotExists) {
      throw new Error(`Document "${documentId}" does not exists`);
    }
  }
});

