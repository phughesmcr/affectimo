/**
 * affectimo
 * v0.2.0
 *
 * Analyse the affect (sentiment / valence) and intensity (arousal) of a string.
 *
 * Help me make this better:
 * https://github.com/phugh/affectimo
 *
 * Based on this paper:
 * Sedoc J., Preotiuc-Pietro D. & Ungar, L. (2017). Predicting Emotional Word Ratings using Distributional Representations and Signed Clustering. Proceedings of the 14th Conference of the European Chapter of the Association for Computational Linguistics, EACL.
 *
 * Using the affect/intensity lexicon data from http://www.wwbp.org/lexica.html
 * Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence
 *
 * (C) 2017 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const affectimo = require('affectimo');
 * const opts = {
 *   'threshold': -0.98
 *   'bigrams': true,
 *   'trigrams': true
 * }
 * const text = "A big long string of text...";
 * const ai = affectimo(text, opts);
 * console.log(ai)
 *
 * Affect range: 1 = very negative, 5 = neutral, 9 = very positive
 * Intensity range: 1 = neutral/objective to 9 = very high
 * If there are no lexicon matches {'AFFECT': 0, 'INTENSITY': 0} will be returned
 *
 * Lexical weights run from a maximum of 0.91 to a minimum of -0.98
 * therefore a "threshold" value of -0.98 will include all words in the lexicon
 *
 * @param {string} str  input string
 * @param {Object} opts  minimum lexical weight threshold for matches (0.91 to -0.98)
 * @return {Object} object with 'AFFECT' and 'INTENSITY' keys
 */

'use strict'
;(function () {
  const root = this
  const previous = root.affectimo

  let tokenizer = root.tokenizer
  let lexicon = root.lexicon
  let natural = root.natural

  if (typeof tokenizer === 'undefined') {
    const hasRequire = typeof require !== 'undefined'
    if (hasRequire) {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
      natural = require('natural')
    } else throw new Error('affectimo required happynodetokenizer and ./data/lexicon.json')
  }

    /**
  * @function getBigrams
  * @param  {string} str input string
  * @return {Array} array of bigram strings
  */
  const getBigrams = str => {
    const NGrams = natural.NGrams
    const bigrams = NGrams.bigrams(str)
    const result = []
    const len = bigrams.length
    let i = 0
    for (i; i < len; i++) {
      result.push(bigrams[i].join(' '))
    }
    return result
  }

  /**
  * @function getTrigrams
  * @param  {string} str input string
  * @return {Array} array of trigram strings
  */
  const getTrigrams = str => {
    const NGrams = natural.NGrams
    const trigrams = NGrams.trigrams(str)
    const result = []
    const len = trigrams.length
    let i = 0
    for (i; i < len; i++) {
      result.push(trigrams[i].join(' '))
    }
    return result
  }

  /**
  * @function getMatches
  * @param  {Array} arr token array
  * @return {Object}  object of matches
  */
  const getMatches = (arr, min) => {
    const matches = {}
    // loop through the lexicon categories
    let category
    for (category in lexicon) {
      if (!lexicon.hasOwnProperty(category)) continue
      let match = []
      // loop through words in category
      let data = lexicon[category]
      let key
      for (key in data) {
        if (!data.hasOwnProperty(key)) continue
        // if word from input matches word from lexicon push weight to matches
        let weight = data[key]
        if (arr.indexOf(key) > -1 && weight > min) {
          match.push(weight)
        }
      }
      matches[category] = match
    }
    // return matches object
    return matches
  }

  /**
  * @function calcLex
  * @param  {Object} obj  matches object
  * @param  {number} int  intercept value
  * @return {number} lexical value
  */
  const calcLex = (obj, int) => {
    // loop through the matches and add up the weights
    let lex = 0
    let key
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      lex += Number(obj[key]) // lex += weight
    }
    // add the intercept value
    lex += int
    // return final lexical value + intercept
    return lex
  }

  /**
  * @function affectimo
  * @param  {string} str  input string
  * @param  {number} min  minimum lexical weight threshold for matches (0.91 to -0.98)
  * @return {Object}  object of lexical values
  */
  const affectimo = (str, opts) => {
    // make sure there is input before proceeding
    if (str == null) return null
    // make sure we're working with a string
    if (typeof str !== 'string') str = str.toString()
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim()
    // option defaults
    if (opts == null) {
      opts = {
        'threshold': -999,    // minimum weight threshold
        'bigrams': true,      // match bigrams?
        'trigrams': true      // match trigrams?
      }
    }
    opts.threshold = opts.threshold || -999
    // convert our string to tokens
    let tokens = tokenizer(str)
    // if no tokens return 0
    if (tokens == null) return {AFFECT: 0, INTENSITY: 0}
    // handle bigrams if wanted
    if (opts.bigrams) {
      const bigrams = getBigrams(str)
      tokens = tokens.concat(bigrams)
    }
    // handle trigrams if wanted
    if (opts.trigrams) {
      const trigrams = getTrigrams(str)
      tokens = tokens.concat(trigrams)
    }
    // get matches from array
    const matches = getMatches(tokens, opts.threshold)
    // calculate lexical useage
    const lex = {}
    lex.AFFECT = calcLex(matches.AFFECT, 5.037104721)
    lex.INTENSITY = calcLex(matches.INTENSITY, 2.399762631)
    // return lexical value
    return lex
  }

  affectimo.noConflict = function () {
    root.affectimo = previous
    return affectimo
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = affectimo
    }
    exports.affectimo = affectimo
  } else {
    root.affectimo = affectimo
  }
}).call(this)
