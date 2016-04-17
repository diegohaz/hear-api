import _ from 'lodash';
import QueryParam from './query-param';

function mergeDefaults(defaults, overrides, options = {}) {
  overrides = _.clone(overrides);

  _.forIn(overrides, (properties, param) => {
    if (typeof properties === 'string') {
      overrides[param] = {default: properties};
    } else if (typeof properties === 'function') {
      overrides[param] = {type: properties};
    }
  });

  _.forIn(defaults, (properties, param) => {
    if (options[param] === false) return;
    param = options[param] ? options[param] : param;

    if (overrides[param]) {
      overrides[param] = _.assign(properties, overrides[param]);
    } else {
      overrides[param] = properties;
    }
  });

  return overrides;
}

function instantiate(params, values, queryOptions) {
  params = _.clone(params);

  _.forIn(params, (options, param) => {
    param = _.findKey(queryOptions, v => v === param) || param;
    params[param] = new QueryParam(param, values[param], options);
  });

  return params;
}

export default function query(params = {}, options = {}) {
  return function(req, res, next) {
    let _params = {
      q: {
        type: String,
        normalize: true,
        regex: true,
        paths: ['_q']
      },
      page: {
        type: Number,
        default: 1,
        multiple: false,
        max: 30,
        min: 1,
        bindTo: 'options'
      },
      limit: {
        type: Number,
        default: 30,
        multiple: false,
        max: 100,
        min: 1,
        bindTo: 'options'
      },
      sort: {
        type: String,
        default: 'name',
        bindTo: 'options'
      }
    };

    let _options = {
      q: 'q',
      page: 'page',
      limit: 'limit',
      sort: 'sort'
    };

    options = _.merge(_options, options);
    params = mergeDefaults(_params, params, options);
    let instances = instantiate(params, req.query, options);

    for (let i in instances) {
      let instance = instances[i];
      let {param, value, options: {bindTo: bind}} = instance;

      req[bind] = req[bind] || {};

      if (!instance.validate()) {
        return res.status(400).send('Missing or wrong value for ' + param);
      }

      if (param === 'sort') {
        let fields = _.isArray(value) ? value : [value];
        req[bind].sort = {};
        for (let i = 0; i < fields.length; i++) {
          let field = fields[i];
               if (field.charAt(0) === '-') req[bind].sort[field.slice(1)] = -1;
          else if (field.charAt(0) === '+') req[bind].sort[field.slice(1)] = 1;
          else req[bind].sort[field] = 1;
        }
      } else if (param === 'limit') {
        req[bind].limit = value;
      } else if (param === 'page') {
        req[bind].skip = instances.limit.value * (value - 1);
      } else {
        req[bind] = _.assign(req[bind], instance.compose());
      }
    }

    next();
  }
}
