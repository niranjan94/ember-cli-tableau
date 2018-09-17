import Component from '@ember/component';
import layout from '../templates/components/tableau-view';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { merge } from '@ember/polyfills';
import { next, later } from '@ember/runloop';

export default Component.extend({
  layout,

  classNames: ['tableau-view'],

  _resizeRetryCount: 0,

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

  _options: computed('options', function () {
    const options = {
      onFirstVizSizeKnown: () => {
        later(() => {
          this._resize(this.$().width(), this.$().height());
        }, 2000);
      },
      onFirstInteractive: () => {
        this._addEvents();
      }
    };
    merge(options, this.get('options') || {});
    return options;
  }),

  _resize(width, height) {
    const viz = this.get('_vizInstance');
    const retryCount = this.get('_resizeRetryCount');
    if (!viz || retryCount >= 2) {
      return;
    }
    try {
      viz.setFrameSize(width, height);
      try {
        const sheet = viz.getWorkbook().getActiveSheet();
        sheet.changeSizeAsync(
          {"behavior": "EXACTLY", "maxSize": { "height": height - 80, "width": width }})
          .then(viz.setFrameSize(width, height));
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      this.set('_resizeRetryCount', retryCount + 1);
      later(() => {
        this._resize(width, height);
      }, 1500);
    }
  },

  _addEvents() {
    const viz = this.get('_vizInstance');
    if (!viz) {
      return;
    }
    viz.addEventListener('tabSwitch', () => {
      later(() => {
        this._resize(this.$().width(), this.$().height());
      }, 500);
    });
  },

  _dispose() {
    const vizInstance = this.get('_vizInstance');
    if (vizInstance) {
      vizInstance.dispose();
    }
  },

  didInsertElement() {
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
        this.get('_options')
      )
    );
  },

  willDestroyElement() {
    this._super(...arguments);
    this._dispose();
  }
});
