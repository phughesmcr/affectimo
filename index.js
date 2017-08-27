/**
 * affectimo
 * v1.0.0
 *
 * Analyse the affect (sentiment / valence) and intensity (arousal) of a string.
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
 * (C) 2017 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const affectimo = require('affectimo');
 * const opts = {
 *  'encoding': 'binary',
 *  'max': Number.POSITIVE_INFINITY,
 *  'min': Number.NEGATIVE_INFINITY,
 *  'nGrams': true,
 *  'output': 'lex',
 *  'places': 9,
 *  'sortBy': 'freq',
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

'use strict'
;(function() {
  const global = this;
  const previous = global.affectimo;

  let lexHelpers = global.lexHelpers;
  let lexicon = global.lexicon;
  let simplengrams = global.simplengrams;
  let tokenizer = global.tokenizer;

  if (typeof lexicon === 'undefined') {
    if (typeof require !== 'undefined') {
      lexHelpers = require('lex-helpers');
      lexicon = require('./data/lexicon.json');
      simplengrams = require('simplengrams');
      tokenizer = require('happynodetokenizer');
    } else throw new Error('wellbeing_analysis required modules not found!');
  }

  const arr2string = lexHelpers.arr2string;
  const calcLex = lexHelpers.calcLex;
  const getMatches = lexHelpers.getMatches;
  const prepareMatches = lexHelpers.prepareMatches;

  /**
   * @function doLex
   * @param  {Object} matches   lexical matches object
   * @param  {number} places    decimal places limit
   * @param  {string} encoding  type of lexical encoding
   * @param  {number} wordcount total word count
   * @return {Object} lexical values object
   */
  const doLex = (matches, places, encoding, wordcount) => {
    const lex = {};
    lex.AFFECT = calcLex(matches.AFFECT, 5.037104721, places, encoding,
        wordcount);
    lex.INTENSITY = calcLex(matches.INTENSITY, 2.399762631, places, encoding,
        wordcount);
    return lex;
  };

  /**
   * @function doMatches
   * @param  {Object} matches   lexical matches object
   * @param  {string} sortBy    how to sort arrays
   * @param  {number} wordcount total word count
   * @param  {number} places    decimal places limit
   * @param  {string} encoding  type of lexical encoding
   * @return {Object} sorted matches object
   */
  const doMatches = (matches, sortBy, wordcount, places, encoding) => {
    const match = {};
    match.AFFECT = prepareMatches(matches.AFFECT, sortBy, wordcount, places,
        encoding);
    match.INTENSITY = prepareMatches(matches.INTENSITY, sortBy, wordcount,
        places, encoding);
    return match;
  };

  /**
  * Analyse the affect and intensity of a string
  * @function affectimo
  * @param  {string} str    input string
  * @param  {Object} opts   options object
  * @return {Object} object with 'AFFECT' and 'INTENSITY' keys
  */
  const affectimo = (str, opts) => {
    // no string return null
    if (!str) {
      console.error('affectimo: no string found. Returning null.');
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
        'nGrams': true,
        'output': 'lex',
        'places': 9,
        'sortBy': 'freq',
        'wcGrams': false,
      };
    }
    opts.encoding = opts.encoding || 'binary';
    opts.max = opts.max || Number.POSITIVE_INFINITY;
    opts.min = opts.min || Number.NEGATIVE_INFINITY;
    opts.nGrams = opts.nGrams || true;
    opts.output = opts.output || 'lex';
    opts.places = opts.places || 9;
    opts.sortBy = opts.sortBy || 'freq';
    opts.wcGrams = opts.wcGrams || false;
    const encoding = opts.encoding;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // convert our string to tokens
    let tokens = tokenizer(str);
    // if there are no tokens return null
    if (!tokens) {
      console.warn('affectimo: no tokens found. Returned null.');
      return null;
    }
    // get wordcount before we add ngrams
    let wordcount = tokens.length;
    // get n-grams
    if (opts.nGrams) {
      const bigrams = arr2string(simplengrams(str, 2));
      const trigrams = arr2string(simplengrams(str, 3));
      tokens = tokens.concat(bigrams, trigrams);
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams) wordcount = tokens.length;
    // get matches from array
    const matches = getMatches(tokens, lexicon, opts.min, opts.max);
    // calculate lexical useage
    if (output === 'matches') {
      // return matches
      return doMatches(matches, sortBy, wordcount, places, encoding);
    } else if (output === 'full') {
      // return full
      const full = {};
      full.matches = doMatches(matches, sortBy, wordcount, places, encoding);
      full.values = doLex(matches, places, encoding, wordcount);
      return full;
    } else {
      if (output !== 'lex') {
        console.warn('affectimo: output option ("' + output +
            '") is invalid, defaulting to "lex".');
      }
      // default to lexical values
      return doLex(matches, places, encoding, wordcount);
    }
  };

  affectimo.noConflict = function() {
    global.affectimo = previous;
    return affectimo;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = affectimo;
    }
    exports.affectimo = affectimo;
  } else {
    global.affectimo = affectimo;
  }
}).call(this);
