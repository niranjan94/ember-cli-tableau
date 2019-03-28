'use strict';

module.exports = {
  name: 'ember-cli-tableau',

  contentFor(type, config) {
    if (type === 'body-footer' && config.tableau && config.tableau.server && config.tableau.eagerLoad) {
      if (config.tableau.server.endsWith('/')) {
        config.tableau.server = config.tableau.server.slice(0, -1);
      }
      return `<script src="${config.tableau.server}/javascripts/api/tableau-2.min.js"></script>`;
    }
  }
};
