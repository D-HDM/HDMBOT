/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {'admin'|'super_admin'|'user'} role
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Message
 * @property {string} _id
 * @property {string} from
 * @property {string} to
 * @property {string} body
 * @property {'incoming'|'outgoing'} direction
 * @property {boolean} isGroup
 * @property {'pending'|'sent'|'delivered'|'read'|'failed'} status
 * @property {string} timestamp
 */

/**
 * @typedef {Object} Rule
 * @property {string} _id
 * @property {string} name
 * @property {boolean} enabled
 * @property {Object} trigger
 * @property {string} response
 * @property {Object} conditions
 * @property {number} priority
 */

/**
 * @typedef {Object} Command
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 * @property {string} response
 * @property {string[]} aliases
 * @property {boolean} enabled
 * @property {boolean} adminOnly
 */

// This file is for documentation and IDE IntelliSense; no actual exports needed.
export {};