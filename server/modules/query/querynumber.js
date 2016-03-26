import QueryParam from './queryparam';

export default class QueryNumber extends QueryParam {
  constructor(param, value, options) {
    value = Number(value);
    super(param, value, options);
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

}
