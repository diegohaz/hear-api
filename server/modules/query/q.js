import _ from 'lodash';
import S from 'string';
import {SchemaTypes} from 'mongoose';

function normalize(value) {
  return S(value).slugify().s.replace(/\-/g, ' ');
}

export default function qPlugin(schema, options) {
  let paths = _.filter(schema.paths, {options: {q: true}});

  schema.add({
    q: {type: [String], index: true}
  });

  paths.forEach(path => {
    schema.path(path.path).set(function(value) {
      let oldValue = this[path.path];

      if (value === oldValue) return value;

      if (path instanceof SchemaTypes.ObjectId) {
        value.q && value.q.forEach(q => {
          oldValue && oldValue.q && this.q.pull(...oldValue.q);
          this.q.addToSet(q);
        });
      } else if (path instanceof SchemaTypes.Array) {
        value.forEach((val, i) => {
          val.q && val.q.forEach(q => {
            this.q.addToSet(q);
          });
        });
      } else {
        oldValue && this.q.pull(normalize(oldValue));
        this.q.addToSet(normalize(value));
      }

      return value;
    });
  });
}
