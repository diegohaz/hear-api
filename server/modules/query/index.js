'use strict';

export default function({
  searchField = 'name',
  sortingField = 'name',
  querySorting = false,
  pageMax = 30,
  perPage = 30,
  perPageMax = 100
} = {}) {
  return function(req, res, next) {
    var query = req.query;

    var q = query.q ? new RegExp(query.q, 'i') : null;
    var page = +query.page || 1;
    var per_page = +query.per_page || perPage;
    var sort = querySorting && query.sort ? query.sort : null;

    if (page > pageMax) {
      return res.status(400).end('page out of range.');
    }

    if (per_page > perPageMax) {
      return res.status(400).end('per_page out of range.');
    }

    if (sort) {
      var fields = sort.split(',');
      sort = {};
      fields.forEach(field => {
        field = field.toLowerCase().trim();
             if (field.charAt(0) === '-') sort[field.slice(1)] = -1;
        else if (field.charAt(0) === '+') sort[field.slice(1)] = 1;
        else sort[field] = 1;
      });
    } else if (sortingField) {
      sort = {};
      sort[sortingField] = 1;
    }

    req.search = {};

    if (q) {
      req.search[searchField] = q;
    }

    req.options = {
      limit: per_page,
      skip: per_page * (page - 1),
      sort: sort
    };

    next();
  }
}