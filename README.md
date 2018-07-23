ember-cli-tableau
==============================================================================

Embed Tableau views in your Ember.js projects.

Installation
------------------------------------------------------------------------------

```
ember install ember-cli-tableau
```


Usage
------------------------------------------------------------------------------

Add the following to your `config/environment.js` file to ensure the addon knows which your Tableau server is.

```js
ENV.tableau = {
  server: 'https://public.tableau.com'
};
```

You can now use the `tableau-view` component in your templates in either of the following ways.

```handlebars

{{!-- with workbook name and view name from a public view --}}
{{tableau-view workbook='MyAwesomeWorkbook' view='MyCoolView'}}

{{!-- with direct path to the view a public view --}}
{{tableau-view viewPath='MyAwesomeWorkbook/MyCoolView'}}

{{!-- with workbook name and view name from a private view using token obtained via trusted machine authentication --}}
{{tableau-view token='TrustedAuthTokenXyz' workbook='MyAwesomeWorkbook' view='MyCoolView'}}

{{!-- with direct path to the view from a private view using token obtained via trusted machine authentication --}}
{{tableau-view token='TrustedAuthTokenXyz' viewPath='MyAwesomeWorkbook/MyCoolView'}}
```

Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd ember-cli-tableau`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
