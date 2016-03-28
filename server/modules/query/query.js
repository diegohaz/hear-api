import _ from 'lodash';
import mongoose from 'mongoose';
import QueryString from './querystring';
import QueryNumber from './querynumber';

let Type = {};
Type.String = QueryString;
Type.Number = QueryNumber;

function mergeDefaults(defaults, overrides, options = {}) {
  overrides = _.clone(overrides);

  _.forIn(defaults, (properties, param) => {
    if (options[param] === false) return;
    param = options[param] ? options[param] : param;

    if (overrides[param]) {
      if (typeof overrides[param] === 'string') {
        let def = overrides[param];
        overrides[param] = {default: def};
      }
      overrides[param] = _.assign(properties, overrides[param]);
    } else {
      overrides[param] = properties;
    }
  });

  return overrides;
}

function instantiate(params, options, query) {
  params = _.clone(params);

  _.forIn(params, (properties, param) => {
    param = _.findKey(options, v => v === param) || param;
    let type = typeof properties === 'function' ?
                properties.name :
                (properties.type ? properties.type.name : 'String');

    params[param] = new Type[type](param, query[param], properties);
  });

  return params;
}

export default function query(params = {}, options = {}) {
  return function(req, res, next) {
    let _params = {
      q: {
        type: String,
        normalize: true,
        trim: true,
        regex: true,
        bindTo: 'search'
      },
      page: {
        type: Number,
        default: 1,
        max: 30,
        min: 1,
        bindTo: 'options'
      },
      limit: {
        type: Number,
        default: 30,
        max: 100,
        min: 1,
        bindTo: 'options'
      },
      sort: {
        type: String,
        trim: true,
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
    let instances = instantiate(params, options, req.query);

    req.search = {};
    req.options = {};

    for (let i in instances) {
      let instance = instances[i];
      let {param, value, bindTo: bind} = instance;
      let paths = instance.getPaths();

      req[bind] = req[bind] || {};

      if (!instance.validate()) {
        return res.status(400).send('Wrong value for ' + param);
      }

      if (param === 'sort') {
        let fields = value.split(',');
        req[bind].sort = {};
        fields.forEach(field => {
               if (field.charAt(0) === '-') req[bind].sort[field.slice(1)] = -1;
          else if (field.charAt(0) === '+') req[bind].sort[field.slice(1)] = 1;
          else req[bind].sort[field] = 1;
        });
      } else if (param === 'limit') {
        req[bind].limit = value;
      } else if (param === 'page') {
        req[bind].skip = instances.limit.value * (value - 1);
      } else {
        if (!paths.length) paths.push(param);
        if (value !== 0 && !value) continue;
        if (paths.length > 1) req[bind].$or = [];

        if (Array.isArray(value)) {
          value = {$in: value};
        }

        paths.forEach(path => {
          if (paths.length > 1) {
            let op = {};
            op[path] = value;
            req[bind].$or.push(op);
          } else {
            req[bind][path] = value;
          }
        });
      }
    }

    next();
  }
}
