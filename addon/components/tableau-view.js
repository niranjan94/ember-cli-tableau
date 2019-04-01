import Component from '@ember/component';
import layout from '../templates/components/tableau-view';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { merge } from '@ember/polyfills';
import { later } from '@ember/runloop';
import loadScript from '../utils/load-script';
import { Promise as EmberPromise } from 'rsvp';

const scriptVersionRegex = /tableau-[\d.]+min.js/gm;

/**
 * Make a simple GET Request and return the response as string.
 *
 * @param scriptUrl
 * @return {Promise}
 * @private
 */
function _makeGetRequest(scriptUrl) {
  return new EmberPromise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', scriptUrl, true);
    xhr.responseType = 'text';
    xhr.onload = function () {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          return resolve(xhr.responseText);
        }
      }
      reject(...arguments);
    };
    xhr.onerror = function() {
      reject(...arguments);
    };
    xhr.send(null);
  });
}

/**
 * Parse the base script and get the final match.
 *
 * @param baseScript
 * @return {*}
 * @private
 */
function _getLatestVersionFromBaseScript(baseScript) {
  let m;
  let recentMatch = null;
  while ((m = scriptVersionRegex.exec(baseScript)) !== null) {
    if (m.index === scriptVersionRegex.lastIndex) {
      scriptVersionRegex.lastIndex++;
    }
    m.forEach((match) => {
      recentMatch = match;
    });
  }
  return recentMatch;
}

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

  async didInsertElement() {
    this._super(...arguments);
    this.set('_isLoading', true);
    if (!this.get('_config.tableau.eagerLoad')) {
      const baseScript = await _makeGetRequest(`${this.get('_server')}/javascripts/api/tableau-2.min.js`);
      const latestVersion = _getLatestVersionFromBaseScript(baseScript) || "tableau-2.min.js`";
      await loadScript(`${this.get('_server')}/javascripts/api/${latestVersion}`);
    }
    this._dispose();
    const viewPath = this.get('viewPath') || `${this.get('workbook')}/${this.get('view')}`;
    let url = `${this.get('_server')}/views/${viewPath}`;
    if (this.get('token')) {
      url = `${this.get('_server')}/trusted/${this.get('token')}/views/${viewPath}`;
    }
    this.set(
      '_vizInstance',
      new window.tableau.Viz(
        this.get('element'),
        url,
        this.get('_options')
      )
    );
    this.setProperties({
      _vizInstance: new window.tableau.Viz(
        this.get('element'),
        url,
        this.get('_options')
      ),
      _isLoading: false
    })
  },

  willDestroyElement() {
    this._super(...arguments);
    this._dispose();
  }
});
