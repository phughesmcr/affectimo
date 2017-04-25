/**
 * affectimo
 * v0.0.1
 *
 * Analyse the affect and intensity of a string.
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
 * Intensity range:  1 (neutral/objective post) to 9 (very high)
 *
 * @param {string} str  {input string}
 * @return {string} {A/I object}
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
    var idxs = []
    for (var i = this.length - 1; i >= 0; i--) {
      if (this[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  /**
  * @function getMatches
  * @param  {arr} arr       {token array}
  * @return {object} {object of matches}
  */
  const getMatches = (arr) => {
    let matches = {}

    // loop through the lexicon categories
    for (let cat in lexicon) {
      if (!lexicon.hasOwnProperty(cat)) continue
      let match = []

      // loop through words in category
      for (let key in lexicon[cat]) {
        if (!lexicon[cat].hasOwnProperty(key)) continue

        // if word from input matches word from lexicon ...
        if (arr.indexOf(key) > -1) {
          let item
          let weight = lexicon[cat][key]
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
  * @param  {object} obj      {matches object}
  * @param  {number} wc       {wordcount}
  * @param  {number} int      {intercept value}
  * @return {number} {lexical value}
  */
  const calcLex = (obj, wc, int) => {
    let counts = []   // number of matched objects
    let weights = []  // weights of matched objects

    // loop through the matches and get the word frequency (counts) and weights
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      if (Array.isArray(obj[key][0])) { // if the first item in the match is an array, the item is a duplicate
        counts.push(obj[key][0].length) // for duplicate matches
      } else {
        counts.push(1)                  // for non-duplicates
      }
      weights.push(obj[key][1])         // corresponding weight
    }

    // calculate lexical usage value
    let sums = []
    counts.forEach(function (a, b) {
      // weight + weight + weight etc
      let sum = weights[b]
      sums.push(sum)
    })

    // get sum of values
    let lex
    lex = sums.reduce(function (a, b) { return a + b }, 0)

    // add the intercept value
    lex = Number(lex) + Number(int)

    // return final lexical value
    return lex
  }

  const affectimo = (str) => {
    // make sure there is input before proceeding
    if (str == null) return null

    // make sure we're working with a string
    if (typeof str !== 'string') str = str.toString()

    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim()

    // convert our string to tokens
    const tokens = tokenizer(str)

    // if no tokens return 0
    if (tokens == null) {
      let lex = {
        'AFFECT': 0,
        'INTENSITY': 0
      }
      return lex
    }

    // get matches from array
    const matches = getMatches(tokens)

    // get wordcount
    const wordcount = tokens.length

    // calculate lexical useage
    let lex = {}
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
