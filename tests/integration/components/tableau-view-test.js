import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | tableau-view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{tableau-view viewPath="DogsChallengeDashboard/DOGS"}}`);
    assert.equal(this.element.textContent.trim(), '');
  });
});
