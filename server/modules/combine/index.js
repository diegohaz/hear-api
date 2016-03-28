import Promise from 'bluebird';
import mongoose from 'mongoose';

export default function combinePlugin(schema, options) {
  let path = options.path || 'name';

  schema.statics.create = function(doc) {
    if (Array.isArray(doc)) {
      let promises = doc.map(d => this.create(d));
      return Promise.all(promises);
    }

    let query = {};
    doc = new this(doc);
    query[path] = doc[path];

    return this.findOne(query).then(foundDoc => {
      if (foundDoc) return foundDoc;

      let newDoc = new this(doc);
      return newDoc.save();
    });
  }
}
