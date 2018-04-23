/**
 * affectimo
 * v3.0.0
 *
 * Get the affect (sentiment or valence) and intensity (arousal) of a string.
 *
 * Help me make this better:
 * https://github.com/phugh/affectimo
 *
 * Based on this paper:
 * Preotiuc-Pietro, D., Schwartz, H.A., Park, G., Eichstaedt, J., Kern, M.,
 * Ungar, L., Shulman, E.P. (2016). Modelling Valence and Arousal in Facebook
 * Posts. Proceedings of the Workshop on Computational Approaches to
 * Subjectivity, Sentiment and Social Media Analysis (WASSA), NAACL.
 *
 * Using the affect/intensity lexicon data from http://www.wwbp.org/lexica.html
 * under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0
 * Unported licence.
 *
 * (C) 2018 P. Hughes. All rights reserved.
 * License : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const affectimo = require('affectimo');
 * const opts = {
 *  'encoding': 'binary',
 *  'max': Number.POSITIVE_INFINITY,
 *  'min': Number.NEGATIVE_INFINITY,
 *  'nGrams': [2, 3],
 *  'output': 'lex',
 *  'places': 9,
 *  'sortBy': 'freq',
 *  'logs': 3,
 *  'wcGrams': false,
 *  'locale': 'US',
 * }
 * const str = 'A big long string of text...';
 * const affect = affectimo(str, opts);
 * console.log(affect)
 *
 * Affect range: 1 = very negative, 5 = neutral, 9 = very positive
 * Intensity range: 1 = neutral/objective to 9 = very high
 *
 * See README.md for help.
 *
 * @param {string} str input string
 * @param {Object} opts options object
 * @return {Object} object with 'AFFECT' and 'INTENSITY' keys
 */

(function() {
  'use strict';

  // Lexicon data
  const lexicon = require('./data/lexicon.json');

  // External modules
  const async = require('async');
  const trans = require('british_american_translate');
  const simplengrams = require('simplengrams');
  const tokenizer = require('happynodetokenizer');
  const lexHelpers = require('lex-helpers');
  const arr2string = lexHelpers.arr2string;
  const doLex = lexHelpers.doLex;
  const doMatches = lexHelpers.doMatches;
  const getMatches = lexHelpers.getMatches;
  const itemCount = lexHelpers.itemCount;

  /**
  * Analyse the sentiment and intensity of a string
  * @function affectimo
  * @param  {string} str    input string
  * @param  {Object} opts   options object
  * @return {Object} object with 'AFFECT' and 'INTENSITY' keys
  */
  function affectimo(str, opts = {}) {
    // default options
    opts.encoding = (typeof opts.encoding !== 'undefined') ? opts.encoding : 'US';
    opts.locale = (typeof opts.logs !== 'undefined') ? opts.logs : 3;
    opts.logs = (typeof opts.logs !== 'undefined') ? opts.logs : 3;
    if (opts.suppressLog) opts.logs = 0;
    opts.max = (typeof opts.max !== 'undefined') ? opts.max : Number.POSITIVE_INFINITY;
    opts.min = (typeof opts.min !== 'undefined') ? opts.min : Number.NEGATIVE_INFINITY;
    if (typeof opts.max !== 'number' || typeof opts.min !== 'number') {
      // try to convert to a number
      opts.min = Number(opts.min);
      opts.max = Number(opts.max);
      // check it worked, or else default to infinity
      opts.max = (typeof opts.max !== 'number') ? opts.max : Number.POSITIVE_INFINITY;
      opts.min = (typeof opts.min !== 'number') ? opts.min : Number.NEGATIVE_INFINITY;
    }
    opts.nGrams = (typeof opts.nGrams !== 'undefined') ? opts.nGrams : [2, 3];
    if (!Array.isArray(opts.nGrams)) {
      if (opts.logs > 1) {
        console.warn('affectimo: nGrams option must be an array! ' + 
            'Defaulting to [2, 3].');
      }
      opts.nGrams = [2, 3];
    }
    opts.output = (typeof opts.output !== 'undefined') ? opts.output : 'lex';
    opts.places = (typeof opts.places !== 'undefined') ? opts.places : 9;
    opts.sortBy = (typeof opts.sortBy !== 'undefined') ? opts.sortBy : 'freq';
    opts.wcGrams = (typeof opts.wcGrams !== 'undefined') ? opts.wcGrams : false;
    // cache frequently used options
    const encoding = opts.encoding;
    const logs = opts.logs;
    const nGrams = opts.nGrams;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // no string return null
    if (!str) {
      if (logs > 1) console.warn('affectimo: no string found. Returning null.');
      return null;
    }
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // convert to lowercase and trim whitespace 
    str = str.toLowerCase().trim();
    // translalte US English to UK English if selected
    if (opts.locale === 'GB') str = trans.uk2us(str);
    // convert our string to tokens
    let tokens = tokenizer(str, {logs: opts.logs});
    // if there are no tokens return null
    if (!tokens) {
      if (logs > 1) console.warn('affectimo: no tokens found. Returned null.');
      return null;
    }
    // get wordcount before we add n-grams
    let wordcount = tokens.length;
    // get n-grams
    if (nGrams) {
      async.each(nGrams, function(n, callback) {
        if (wordcount < n) {
          callback(`affectimo: wordcount (${wordcount}) less than n-gram value (${n}). Ignoring.`);
        } else {
          tokens = [...arr2string(simplengrams(str, n, {logs: logs})), ...tokens];
          callback();
        }
      }, function(err) {
        if (err && logs > 0) console.error('affectimo: nGram error: ', err);        
      });
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams) wordcount = tokens.length;
    // get matches from array
    const matches = getMatches(itemCount(tokens), lexicon, opts.min, opts.max);
    // define intercept values (from Preotiuc-Pietro et al.)
    const ints = {
      AFFECT: 5.037104721,
      INTENSITY: 2.399762631,
    };
    // returns
    if (output.match(/matches/gi)) {
      // return matches
      return doMatches(matches, sortBy, wordcount, places, encoding);
    } else if (output.match(/full/gi)) {
      // return matches and values in one object
      async.parallel({
        matches: function(callback) {
          callback(null, doMatches(matches, sortBy, wordcount, places, 
              encoding));
        },
        values: function(callback) {
          callback(null, doLex(matches, ints, places, encoding, wordcount));
        },
      }, function(err, results) {
        if (err && logs > 0) console.error(err);
        return results;
      });
    } else {
      if (!output.match(/lex/gi) && logs > 1) {
          console.warn('affectimo: output option ("' + output +
              '") is invalid, defaulting to "lex".');
      }
      // default to lexical values
      return doLex(matches, ints, places, encoding, wordcount);
    }
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = affectimo;
    }
    exports.affectimo = affectimo;
  } else {
    global.affectimo = affectimo;
  }
})();
