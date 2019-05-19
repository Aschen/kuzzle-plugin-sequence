 Feature: Sequence controller

   Scenario: Begin new sequence
    When I call the plugin route "sequence":"begin"
    Then I should receive an object result containing a property "id"
    And I should receive an object result containing a property "actions"
    And I should receive an object result containing a property "expiresAt"

   Scenario: Rollback action create
    Given a collection "kuzzle":"riders"
    When I start a new sequence
    And I create the document 'liia' with '{ "lazimpat": "panipokari" }'
    And I rollback the sequence
    Then The document "liia" does not exists

   Scenario: Rollback action delete
    Given a collection "kuzzle":"riders"
    And I create the document 'liia' with '{ "lazimpat": "panipokari" }'
    When I start a new sequence
    And I delete the document "liia"
    And I rollback the sequence
    Then The document "liia" exists

   Scenario: Rollback action update
    Given a collection "kuzzle":"riders"
    And I create the document 'liia' with '{ "lazimpat": "panipokari" }'
    When I start a new sequence
    And I update the document 'liia' with '{ "lazimpat": "efik" }'
    And I rollback the sequence
    Then The document "liia" has a property "lazimpat" with string value 'panipokari'

   Scenario: Rollback action replace 
    Given a collection "kuzzle":"riders"
    And I create the document 'liia' with '{ "lazimpat": "panipokari" }'
    When I start a new sequence
    And I replace the document 'liia' with '{ "thamel": "trekkers home" }'
    And I rollback the sequence
    Then The document "liia" has a property "lazimpat" with string value 'panipokari'

   Scenario: Rollback action createOrReplace (create)
    Given a collection "kuzzle":"riders"
    When I start a new sequence
    And I createOrReplace the document 'liia' with '{ "lazimpat": "panipokari" }'
    And I rollback the sequence
    Then The document "liia" does not exists

   Scenario: Rollback action createOrReplace (replace)
    Given a collection "kuzzle":"riders"
    And I create the document 'liia' with '{ "lazimpat": "panipokari" }'
    When I start a new sequence
    And I createOrReplace the document 'liia' with '{ "lazimpat": "efik" }'
    And I rollback the sequence
    Then The document "liia" has a property "lazimpat" with string value 'panipokari'
