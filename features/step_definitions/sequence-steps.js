const
  should = require('should'),
  {
    Given,
    When
  } = require('cucumber');

When('I start a new sequence', async function () {
  const { result: sequence } = await this.kuzzle.query({
    controller: 'sequence/sequence',
    action: 'begin'
  });

  should(sequence.id).be.String();

  this.props.sequenceId = sequence.id;
});

When('I rollback the sequence', async function () {
  await this.kuzzle.query({
    controller: 'sequence/sequence',
    action: 'rollback',
    sequenceId: this.props.sequenceId
  });
});
