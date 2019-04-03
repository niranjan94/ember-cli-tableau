import Component from '@ember/component';
import layout from '../templates/components/tableau-view';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { merge } from '@ember/polyfills';
import { later } from '@ember/runloop';
import loadScript from '../utils/load-script';
import { Promise as EmberPromise } from 'rsvp';

const scriptTagRegex =  /src="([\w/\-.:]+)"/;

export default Component.extend({
  layout,

  classNames: ['tableau-view'],
  classNameBindings: ['_isLoading:loading'],

  _resizeRetryCount: 0,
  _isLoading: true,

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
      onFirstVizSizeKnown: (e) => {
        later(() => {
          this._resize(this.$().width(), this.$().height());
        }, 2000);
        if (this.get('onFirstVizSizeKnown')) {
          this.get('onFirstVizSizeKnown')(e);
        }
      },
      onFirstInteractive: (e) => {
        this._addEvents();
        if (this.get('onFirstInteractive')) {
          this.get('onFirstInteractive')(e);
        }
      }
    };
    merge(options, this.get('options') || {});
    return options;
  }),

  /**
   * Resize the tableau frame according to the holding element.
   *
   * @param width
   * @param height
   * @private
   */
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

  /**
   * Add certain tableau events to the created view.
   * @private
   */
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

  /**
   * Cleanup the tableau view from the element.
   *
   * @private
   */
  _dispose() {
    const vizInstance = this.get('_vizInstance');
    if (vizInstance) {
      vizInstance.dispose();
    }
  },

  /**
   * Load the tableau view into the element. Also, load tableau server library if not loaded already.
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadTableauView() {
    this.set('_isLoading', true);
    if (!this.get('_config.tableau.eagerLoad') && (!window.tableau || !window.tableau.Viz)) {
      await new EmberPromise(async(resolve, reject) => {
        try {
          // Async-loaded scripts cannot make calls to document.write to load other scripts.
          // So, a Hack to catch the call to document.write and get the url from there and then use that url to
          // load the script directly.
          window.document._writeFn = window.document.write;
          window.document.write = async (url) => {
            // Restore the original document function ASAP.
            window.document.write = window.document._writeFn;
            await loadScript(scriptTagRegex.exec(url)[1]);
            resolve()
          };
          await loadScript(`${this.get('_server')}/javascripts/api/tableau-2.min.js`);
        } catch (e) {
          reject(e);
        }
      });
    }
    this._dispose();
    const viewPath = this.get('viewPath') || `${this.get('workbook')}/${this.get('view')}`;
    let url = `${this.get('_server')}/views/${viewPath}`;
    if (this.get('token')) {
      url = `${this.get('_server')}/trusted/${this.get('token')}/views/${viewPath}`;
    }
    const _vizInstance = new window.tableau.Viz(
      this.get('element'),
      url,
      this.get('_options')
    );
    this.setProperties({
      _vizInstance,
      _isLoading: false
    });
  },

  /**
   * If any attributes are updated, ensure tableau view is reloaded.
   */
  didReceiveAttrs() {
    this._super(...arguments);
    if (this.get('element')) {
      this._loadTableauView();
    }
  },

  /**
   * Load the tableau div on element insert.
   */
  didInsertElement() {
    this._super(...arguments);
    this._loadTableauView();
  },

  /**
   * Cleanup the tableau view before destroying the element.
   */
  willDestroyElement() {
    this._super(...arguments);
    this._dispose();
  }
});
