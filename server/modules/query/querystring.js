import QueryParam from './queryparam';

export default class QueryString extends QueryParam {
  constructor(param, value, options) {
    if (value !== undefined) {
      value = String(value);
    }

    super(param, value, options);
  }

  lowercase() {
    if (this.value) {
      this.value.toLowerCase();
    }
  }

  uppercase() {
    if (this.value) {
      this.value.toUpperCase();
    }
  }

  trim() {
    if (this.value) {
      this.value.trim();
    }
  }

  minlength(min) {
    let validator = v => v === undefined || v.length > min;
    this.validators.push(validator);
  }

  maxlength(max) {
    let validator = v => v === undefined || v.length <= max;
    this.validators.push(validator);
  }

  enum(values) {
    let validator = v => v === undefined || values.indexOf(v) !== -1;
    this.validators.push(validator);
  }

  match(regExp) {
    let validator = v => {
      if (!regExp) return false;
      return v !== null && v !== '' ? regExp.test(v) : true;
    }

    this.validators.push(validator);
  }

}
