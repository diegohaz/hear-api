import {Types} from 'mongoose';
import QueryParam from './queryparam';
import S from 'string';

export default class QueryString extends QueryParam {
  constructor(param, value, options) {
    if (value !== undefined) {
      value = String(value);
    }

    super(param, value, options);
  }

  normalize(value) {
    if (value) {
      value = S(value).slugify().s.replace(/\-/g, ' ');
    }
    return value;
  }

  lowercase(value) {
    if (value) {
      value = value.toLowerCase();
    }
    return value;
  }

  uppercase(value) {
    if (value) {
      value = value.toUpperCase();
    }
    return value;
  }

  trim(value) {
    if (value) {
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

}
