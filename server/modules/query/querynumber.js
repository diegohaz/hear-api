import QueryParam from './queryparam';

export default class QueryNumber extends QueryParam {
  constructor(param, value, options) {
    value = Number(value);
    super(param, value, options);
  }

  min(value) {
    let validator = v => v === null || v >= value;
    this.validators.push(validator);
  }

  max(value) {
    let validator = v => v === null || v <= value;
    this.validators.push(validator);
  }

}
