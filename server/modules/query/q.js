import _ from 'lodash';
import S from 'string';
import {SchemaTypes} from 'mongoose';

function normalize(value) {
  return S(value).slugify().s.replace(/\-/g, ' ');
}

export default function qPlugin(schema, options) {
  let paths = _.filter(schema.paths, {options: {q: true}});

  schema.add({
    _q: {type: [String], index: true}
  });

  paths.forEach(path => {
    schema.path(path.path).set(function(value) {
      let oldValue = this[path.path];

      if (value === oldValue) return value;

      if (path instanceof SchemaTypes.ObjectId) {
        value._q && value._q.forEach(_q => {
          oldValue && oldValue._q && this._q.pull(...oldValue._q);
          this._q.addToSet(_q);
        });
      } else if (path instanceof SchemaTypes.Array) {
        value.forEach((val, i) => {
          val._q && val._q.forEach(_q => {
            this._q.addToSet(_q);
          });
        });
      } else {
        oldValue && this._q.pull(normalize(oldValue));
        this._q.addToSet(normalize(value));
      }

      return value;
    });
  });
}
