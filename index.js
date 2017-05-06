/**
 * affectimo
 * v0.1.3
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
 * const text = "A big long string of text...";
 * let ai = affectimo(text);
 * console.log(ai)
 *
 * Affect range: 1 = very negative, 5 = neutral, 9 = very positive
 * Intensity range: 1 = neutral/objective to 9 = very high
 *
 * @param {string} str  input string
 * @return {Object} object with 'AFFECT' and 'INTENSITY' keys
 */

'use strict'
;(function () {
  const root = this
  const previous = root.affectimo

  const hasRequire = typeof require !== 'undefined'

  let tokenizer = root.tokenizer
  let lexicon = root.lexicon

  if (typeof _ === 'undefined') {
    if (hasRequire) {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
    } else throw new Error('affectimo required happynodetokenizer and ./data/lexicon.json')
  }

  // get number of times el appears in an array
  Array.prototype.indexesOf = function (el) {
    const idxs = []
    const len = this.length
    let i = len - 1
    for (i; i >= 0; i--) {
      if (this[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  /**
  * @function getMatches
  * @param  {Array} arr token array
  * @return {Object}  object of matches
  */
  const getMatches = (arr) => {
    const matches = {}
    // loop through the lexicon categories
    let cat // category
    for (cat in lexicon) {
      if (!lexicon.hasOwnProperty(cat)) continue
      let match = []
      // loop through words in category
      let data = lexicon[cat]
      let key
      for (key in data) {
        if (!data.hasOwnProperty(key)) continue
        // if word from input matches word from lexicon ...
        if (arr.indexOf(key) > -1) {
          let item
          let weight = data[key]
          let reps = arr.indexesOf(key).length // numbder of times the word appears in the input text
          if (reps > 1) { // if the word appears more than once, group all appearances in one array
            let words = []
            for (let i = 0; i < reps; i++) {
              words.push(key)
            }
            item = [words, weight]
          } else {
            item = [key, weight]
          }
          match.push(item)
        }
        matches[cat] = match
      }
    }
    // return matches object
    return matches
  }

  /**
  * @function calcLex
  * @param  {Object} obj  matches object
  * @param  {number} wc   word count
  * @param  {number} int  intercept value
  * @return {number} lexical value
  */
  const calcLex = (obj, wc, int) => {
    // loop through the matches and add up the weights
    let lex = 0
    let key
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      let weight = Number(obj[key][1])
      lex += weight
    }
    // add the intercept value
    lex += Number(int)
    // return final lexical value + intercept
    return Number(lex)
  }

  /**
  * @function affectimo
  * @param  {string} str  input string
  * @return {Object}  object of lexical values
  */
  const affectimo = (str) => {
    // make sure there is input before proceeding
    if (str == null) return {AFFECT: 0, INTENSITY: 0}
    // make sure we're working with a string
    if (typeof str !== 'string') str = str.toString()
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim()
    // convert our string to tokens
    const tokens = tokenizer(str)
    // if no tokens return 0
    if (tokens == null) return {AFFECT: 0, INTENSITY: 0}
    // get matches from array
    const matches = getMatches(tokens)
    // get wordcount
    const wordcount = tokens.length
    // calculate lexical useage
    const lex = {}
    lex.AFFECT = calcLex(matches.AFFECT, wordcount, 5.037104721).toFixed(2)
    lex.INTENSITY = calcLex(matches.INTENSITY, wordcount, 2.399762631).toFixed(2)
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
