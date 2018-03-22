/**
 * affectimo
 * v2.1.1
 *
 * Get the sentiment (affect or valence) and intensity (arousal) of a string.
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
 * Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0
 * Unported licence
 *
 * (C) 2018 P. Hughes
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
 *  'suppressLog': false,
 *  'wcGrams': false,
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
  function affectimo(str, opts) {
    // no string return null
    if (!str) {
      if (!opts || !opts.suppressLog) {
        console.warn('affectimo: no string found. Returning null.');
      }
      return null;
    }
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim();
    // options defaults
    if (!opts || typeof opts !== 'object') {
      opts = {
        'encoding': 'binary',
        'max': Number.POSITIVE_INFINITY,
        'min': Number.NEGATIVE_INFINITY,
        'nGrams': [2, 3],
        'output': 'lex',
        'places': 9,
        'sortBy': 'freq',
        'suppressLog': false,
        'wcGrams': false,
      };
    }
    opts.encoding = opts.encoding || 'binary';
    opts.max = opts.max || Number.POSITIVE_INFINITY;
    opts.min = opts.min || Number.NEGATIVE_INFINITY;
    opts.nGrams = opts.nGrams || [2, 3];
    opts.output = opts.output || 'lex';
    opts.places = opts.places || 9;
    opts.sortBy = opts.sortBy || 'freq';
    opts.suppressLog = opts.suppressLog || false;
    opts.wcGrams = opts.wcGrams || false;
    if (!Array.isArray(opts.nGrams)) {
      if (!opts || !opts.suppressLog) {
        console.warn('affectimo: nGrams option must be an array! ' + 
            'Defaulting to [2, 3].');
      }
      opts.nGrams = [2, 3];
    }
    const encoding = opts.encoding;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // convert our string to tokens
    let tokens = tokenizer(str);
    // if there are no tokens return null
    if (!tokens) {
      if (!opts || !opts.suppressLog) {
        console.warn('affectimo: no tokens found. Returned null.');
      }
      return null;
    }
    // get wordcount before we add n-grams
    let wordcount = tokens.length;
    // get n-grams
    if (opts.nGrams) {
      async.each(opts.nGrams, function(n, callback) {
        if (wordcount > n) {
          tokens = tokens.concat(arr2string(simplengrams(str, n)));
        } else {
          if (!opts || !opts.suppressLog) {
            console.warn('affectimo: wordcount less than n-gram value "' + n +
                '". Ignoring.');
          }
        }
        callback();
      }, function(err) {
        if (err && !opts.suppressLog) {
          console.error('affectimo: nGram error: ', err);
        }
      });
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams) wordcount = tokens.length;
    // reduce tokens to count item
    tokens = itemCount(tokens);
    // get matches from array
    const matches = getMatches(tokens, lexicon, opts.min, opts.max);
    // define intercept values (defined in Preotiuc-Pietro et al.)
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
      let full;
      async.parallel({
        matches: function(callback) {
          callback(null, doMatches(matches, sortBy, wordcount, places, 
              encoding));
        },
        values: function(callback) {
          callback(null, doLex(matches, ints, places, encoding, wordcount));
        },
      }, function(err, results) {
        if (err) console.error(err);
        full = results;
      });
      return full;
    } else {
      if (!output.match(/lex/gi)) {
        if (!opts || !opts.suppressLog) {
          console.warn('affectimo: output option ("' + output +
              '") is invalid, defaulting to "lex".');
        }
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
