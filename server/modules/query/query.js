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
    let promises = [];

    let _params = {
      q: {
        type: String,
        trim: true,
        regex: true,
        paths: {name: 'name'}
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
        lowercase: true,
        default: 'name'
      },
      order: {
        type: String,
        default: 'asc'
      }
    };

    let _options = {
      q: 'q',
      page: 'page',
      limit: 'limit',
      sort: 'sort',
      order: 'order'
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
      let pathsLength = Object.keys(paths).length;

      if (!instance.validate()) {
        return res.status(400).send('Wrong value for ' + param);
      }

      if (param === 'sort') {
        req.options.sort = {};
        req.options.sort[value] = instances.order.value === 'desc' ? -1 : 1;
      } else if (param === 'limit') {
        req.options.limit = value;
      } else if (param === 'page') {
        req.options.skip = instances.limit.value * (value - 1);
      } else if (param !== 'order') {
        if (!pathsLength) {
          paths[param] = param;
          pathsLength = 1;
        }
        if (value === undefined || value === null || value === '') {
          continue;
        }
        if (pathsLength > 1) {
          req.search.$or = [];
        }
        for (let i in paths) {
          let path = paths[i];
          let field = i;
          let array = field.indexOf('$') === 0;

          if (array) {
            field = field.slice(1);
          }

          if (path.indexOf('.') > 0) {
            let [model, pth] = path.split(/\.(.+)/);
            let query = {};
            query[pth] = value;

            let promise = mongoose.model(model)
              .find(query).select('_id').lean().then(ids => {
                if (pathsLength > 1 && ids.length) {
                  let op = {};
                  op[field] = {};
                  if (array) {
                    op[field].$elemMatch = {$in: ids};
                  } else {
                    op[field].$in = ids;
                  }
                  req.search.$or.push(op);
                } else if (ids.length) {
                  if (array) {
                    req.search[field] = {$elemMatch: {$in: ids}};
                  } else {
                    req.search[field] = {$in: ids};
                  }
                }
              });

            promises.push(promise);
          } else if (pathsLength > 1) {
            let op = {};
            op[path] = value;
            req.search.$or.push(op);
          } else {
            req.search[path] = value;
          }
        }
      }
    }

    Promise.all(promises).then(() => {
      next();
    }).catch(next);
  }
}
