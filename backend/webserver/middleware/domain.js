'use strict';

const emailAddresses = require('email-addresses');
const Domain = require('mongoose').model('Domain');
const dbHelper = require('../../helpers').db;

module.exports = {
  load,
  loadFromDomainIdParameter,
  requireAdministrator,
  requireDomainInfo,
  checkUpdateParameters
};

/**
 * Load middleware. Load a domain from its UUID and push it into the request (req.domain) for later use.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function load(req, res, next) {
  if (!dbHelper.isValidObjectId(req.params.uuid)) {
    return res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'domainID is not a valid ObjectId' }});
  }

  Domain.loadFromID(req.params.uuid, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.status(404).end();
    }
    req.domain = domain;

    return next();
  });
}

function loadFromDomainIdParameter(req, res, next) {
  const id = req.query.domain_id;

  if (!id) {
    return res.status(400).json({ error: { code: 400, message: 'Missing parameter', details: 'The domain_id parameter is mandatory'}});
  }

  if (!dbHelper.isValidObjectId(id)) {
    return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'domainID is not a valid ObjectId' }});
  }

  Domain.loadFromID(id, function(err, domain) {
    if (err) {
      return next(err);
    }
    if (!domain) {
      return res.status(404).json({ error: { code: 404, message: 'Not found', details: 'The domain ' + id + ' could not be found'}});
    }
    req.domain = domain;

    return next();
  });
}

/**
 * Require an domain information middleware.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function requireDomainInfo(req, res, next) {
  let details;

  if (!req.body.name) {
    details = 'Domain does not have name';
  } else if (!req.body.company_name) {
    details = 'Domain does not have company name';
  }

  if (details) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details
      }
    });
  }

  next();
}

/**
 * Require an administrator with well-formed middleware.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function requireAdministrator(req, res, next) {
  const administrator = req.body.administrator;
  let details;

  if (!administrator) {
    details = 'An administrator is required';
  } else if (!administrator.email) {
    details = 'Administrator does not have any email address';
  } else if (!administrator.password) {
    details = 'Administrator does not have password';
  } else if (!_isValidEmail(administrator.email)) {
    details = 'Administrator email is not valid';
  }

  if (details) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details
      }
    });
  }

  next();
}

/**
 * Middleware checks parameters for update domain API.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function checkUpdateParameters(req, res, next) {
  if (!req.body.company_name) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Domain company name is required'
      }
    });
  }

  next();
}

function _isValidEmail(email) {
  return emailAddresses.parseOneAddress(email) !== null;
}
