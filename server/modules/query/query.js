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
        regex: true
      },
      page: {
        type: Number,
        default: 1,
        max: 30,
        min: 1
      },
      limit: {
        type: Number,
        default: 30,
        max: 100,
        min: 1
      },
      sort: {
        type: String,
        trim: true,
        default: 'name'
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
      let {param, value} = instance;
      let paths = instance.getPaths();

      if (!instance.validate()) {
        return res.status(400).send('Wrong value for ' + param);
      }

      if (param === 'sort') {
        let fields = value.split(',');
        req.options.sort = {};
        fields.forEach(field => {
               if (field.charAt(0) === '-') req.options.sort[field.slice(1)] = -1;
          else if (field.charAt(0) === '+') req.options.sort[field.slice(1)] = 1;
          else req.options.sort[field] = 1;
        });
      } else if (param === 'limit') {
        req.options.limit = value;
      } else if (param === 'page') {
        req.options.skip = instances.limit.value * (value - 1);
      } else {
        if (!paths.length) paths.push(param);
        if (value === undefined || value === null || value === '') continue;
        if (paths.length > 1) req.search.$or = [];

        if (Array.isArray(value)) {
          value = {$in: value};
        }

        paths.forEach(path => {
          if (paths.length > 1) {
            let op = {};
            op[path] = value;
            req.search.$or.push(op);
          } else {
            req.search[path] = value;
          }
        });
      }
    }

    next();
  }
}
