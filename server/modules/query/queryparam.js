import {Types} from 'mongoose';
import _ from 'lodash';

export default class QueryParam {
  constructor(param, value, options) {
    this.param = param;
    this.value = value;
    this.options = options;
    this.validators = [];
    this._paths = [];
    this.bindTo = 'search';

    if (value && value.indexOf && value.indexOf(',') !== -1) {
      this.value = value.split(',').map(v => v.trim && v.trim() || v);
    }

    this.value = this.evaluate(this.value);
  }

  paths(value, paths) {
    this._paths = paths;
    return value;
  }

  getPaths() {
    return this._paths;
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

  evaluate(value = this.value) {
    if (Array.isArray(value)) {
      value = value.map(v => this.evaluate(v));
      return value;
    }

    for (let i in this.options) {
      if (this[i] && typeof this[i] === 'function') {
        value = this[i].call(this, value, this.options[i]);
      } else {
        this[i] = this.options[i];
      }
    }

    if (this.options.regex && value) {
      value = new RegExp(value, 'i');
    }

    if (this.options.id && value) {
      value = Types.ObjectId(value);
    }

    return value;
  }

  validate(value = this.value) {
    let success = true;

    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        if (!success) break;
        success = this.validate(value[i]);
      }

      return success;
    }

    for (var i = 0; i < this.validators.length; i++) {
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
