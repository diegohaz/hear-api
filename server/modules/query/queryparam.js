import _ from 'lodash';

export default class QueryParam {
  constructor(param, value, options) {
    this.param = param;
    this.value = value;
    this.validators = [];
    this._regex = false;
    this._paths = {};

    for (let i in options) {
      if (this[i] && typeof this[i] === 'function') {
        this[i].call(this, options[i]);
      }
    }

    if (this._regex && this.value) {
      this.value = new RegExp(this.value, 'i');
    }
  }

  regex(regex) {
    this._regex = true;
  }

  paths(paths) {
    this._paths = paths;
  }

  getPaths() {
    return this._paths;
  }

  default(value) {
    if (!this.value) {
      this.value = typeof value === 'function' ? value.call(this) : value;
    }
  }

  required(required) {
    if (required) {
      let validator = value => {
        return value !== null && value !== undefined && value !== '';
      }

      this.validators.unshift(validator);
    }
  }

  validate() {
    let success = true;

    for (var i = 0; i < this.validators.length; i++) {
      if (!success) break;
      let validator = this.validators[i];

      if (typeof validator === 'function') {
        if (!validator.call(this, this.value)) {
          success = false;
        }
      }
    }

    return success;
  }
}
