import _ from 'lodash';
import S from 'string';

export default class QueryParam {
  constructor(param, value, options) {
    let operator = _.first(param.match(/\$.+$/)) || '$eq';

    this.param = param.replace(operator, '');
    this.value = value;
    this.options = _.assign({
      type: String,
      paths: [param],
      bindTo: 'filter',
      multiple: true,
      separator: ',',
      minlength: false,
      maxlength: false,
      lowercase: false,
      uppercase: false,
      normalize: false,
      required: false,
      regex: false,
      match: false,
      enum: false,
      min: false,
      max: false,
      trim: true,
      operator: operator,
      // allowQueryOperator: false
    }, options);

    this.validators = [];

    this.evaluate();
  }

  default(value, def) {
    if (!value) {
      return typeof def === 'function' ? def.call(this) : def;
    }
    return value;
  }

  required(value, required) {
    if (required) {
      let validator = value => {
        return value !== null && value !== undefined && value !== '';
      }

      this.validators.unshift(validator);
    }
    return value;
  }

  min(value, min) {
    let validator = v => v === null || v >= min;
    this.validators.push(validator);
    return value;
  }

  max(value, max) {
    let validator = v => v === null || v <= max;
    this.validators.push(validator);
    return value;
  }

  normalize(value) {
    if (value) {
      value = S(value).slugify().s.replace(/\-/g, ' ');
    }
    return value;
  }

  lowercase(value) {
    if (value && value.toUpperCase) {
      value = value.toLowerCase();
    }
    return value;
  }

  uppercase(value) {
    if (value && value.toLowerCase) {
      value = value.toUpperCase();
    }
    return value;
  }

  trim(value) {
    if (value && value.trim) {
      value = value.trim();
    }
    return value;
  }

  minlength(value, min) {
    let validator = v => v === undefined || v.length > min;
    this.validators.push(validator);
    return value;
  }

  maxlength(value, max) {
    let validator = v => v === undefined || v.length <= max;
    this.validators.push(validator);
    return value;
  }

  enum(value, values) {
    let validator = v => v === undefined || values.indexOf(v) !== -1;
    this.validators.push(validator);
    return value;
  }

  match(value, regExp) {
    let validator = v => {
      if (!regExp) return false;
      return v !== null && v !== '' ? regExp.test(v) : true;
    }

    this.validators.push(validator);
    return value;
  }

  // compose query
  compose(path = this.options.paths, value = this.value) {
    let options = this.options;
    let query = {};

    if (_.isNil(value)) {
      return query;
    }

    if (_.isArray(path) && path.length > 1) {
      query.$or = path.map(p => this.compose(p, value));
      return query;
    } else if (_.isArray(path)) {
      path = path[0];
    }

    if (_.isArray(value) && options.operator !== '$in' && options.operator !== '$nin') {
      options.operator = '$in';
    }

    if (options.operator === '$eq' || value instanceof RegExp && options.operator !== '$in') {
      query[path] = value;
    } else {
      query[path] = {};
      query[path][options.operator] = value;
    }

    return query;
  }

  // evaluate
  evaluate(value = this.value) {
    let options = this.options;

    if (options.multiple && value && value.indexOf && value.indexOf(options.separator) !== -1) {
      let values = value.split(options.separator).map(v => this.evaluate(v));
      this.value = values;
      return values;
    }

    _.forIn(this.options, (optionValue, option) => {
      if (optionValue !== false && this[option] && typeof this[option] === 'function') {
        value = this[option].call(this, value, optionValue);
      }
    });

    if (!_.isNil(value)) {
      value = options.type(value);
    }

    if (options.regex && !_.isNil(value)) {
      value = new RegExp(value, 'i');
    }

    this.value = value;
    return value;
  }

  // validate
  validate(value = this.value) {
    let success = true;

    if (_.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (!success) break;
        success = this.validate(value[i]);
      }

      return success;
    }

    for (let i = 0; i < this.validators.length; i++) {
      if (!success) break;
      let validator = this.validators[i];

      if (typeof validator === 'function') {
        if (!validator.call(this, value)) {
          success = false;
        }
      }
    }

    return success;
  }
}
