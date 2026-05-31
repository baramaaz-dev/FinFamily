/**
 * @typedef {Object} Person
 * @property {string} id
 * @property {string} name
 * @property {string} [relation]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Portfolio
 * @property {string} id
 * @property {string} name
 * @property {'cash_usd'|'cash_syp'|'gold'|'project'} type
 * @property {string} [description]
 */

/**
 * @typedef {Object} PortfolioMember
 * @property {string} portfolio_id
 * @property {string} person_id
 * @property {number} share_numerator
 * @property {number} share_denominator
 * @property {string} [joined_date]
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} portfolio_id
 * @property {'income'|'expense'|'transfer'} type
 * @property {number} amount
 * @property {'USD'|'SYP'} currency
 * @property {number} [exchange_rate]
 * @property {string} [category]
 * @property {string} date
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Property
 * @property {string} id
 * @property {string} name
 * @property {'residential'|'commercial'|'land'} type
 * @property {string} [location]
 * @property {string} [purchase_date]
 * @property {number} [estimated_value]
 * @property {'rented'|'vacant'} status
 */

/**
 * @typedef {Object} PropertyOwner
 * @property {string} property_id
 * @property {string} person_id
 * @property {number} share_numerator
 * @property {number} share_denominator
 * @property {'إرث'|'شراء'|'هبة'|'وصية'|'شراكة'} ownership_basis
 */

/**
 * @typedef {Object} Lease
 * @property {string} id
 * @property {string} property_id
 * @property {string} tenant_name
 * @property {number} rent_amount
 * @property {'USD'|'SYP'} currency
 * @property {'monthly'|'annual'} frequency
 * @property {string} start_date
 * @property {string} [end_date]
 */

/**
 * @typedef {Object} ExchangeRate
 * @property {string} id
 * @property {number} rate
 * @property {string} date
 * @property {string} [notes]
 */
