import Component from '@ember/component';
import layout from '../templates/components/tableau-view';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';

export default Component.extend({
  layout,

  classNames: ['tableau-view'],

  _config: computed(function () {
    return getOwner(this).resolveRegistration('config:environment');
  }),

  _server: computed('_config', function () {
    let server = this.get('_config.tableau.server');
    if (server && server.endsWith('/')) {
      server = server.slice(0, -1);
    }
    return server;
  }),

  _dispose() {
    const vizInstance = this.get('_vizInstance');
    if (vizInstance) {
      vizInstance.dispose();
    }
  },

  didRender() {
    this._super(...arguments);
    this._dispose();

    const viewPath = this.get('viewPath') || `${this.get('workbook')}/${this.get('view')}`;

    let url = `${this.get('_server')}/views/${viewPath}`;

    if (this.get('token')) {
      url = `${this.get('_server')}/trusted/${this.get('token')}/views/${viewPath}`;
    }

    this.set(
      '_vizInstance',
      new tableau.Viz(
        this.get('element'),
        url,
        this.get('options')
      )
    );
  },

  willDestroyElement() {
    this._super(...arguments);
    this._dispose();
  }
});
