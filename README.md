# affectimo

Analyse the affect (sentiment / valence) and intensity (arousal) of a string.

## Usage
```Javascript
const affectimo = require('affectimo');
const opts = {
  'threshold': -0.98,
  'encoding': 'binary',    // 'binary' (default), or 'frequency' - type of word encoding to use.
  'bigrams': true,
  'trigrams': true
}
const str = "A big long string of text...";
const affect = affectimo(str, opts);
console.log(affect)
```

## Options (opts)

### 'threshold'

Lexical weights run from a maximum of 0.91 to a minimum of -0.98. Therefore a "threshold" value of -0.98 will include all words in the lexicon and 0.91 will include none.

### 'encoding'

Valid options: 'binary' (default), or 'frequency'.

'binary' calculates the lexical value as simply a sum of weights, i.e. weight[1] + weight[2] + etc...

'frequency' calculates the lexical value as (word frequency / total wordcount) * word weight

Unless you have a specific need for frequency encoding, we recommend you use binary only.

### 'bigrams' and 'trigrams'

The lexicon includes strings that are between one and three words in length. By default we will match against these using bi-grams and tri-grams, however you may want to disable these when analysing very long strings to save processing time and memory use.

## Output
```Javascript
{
  'AFFECT': 5.34,
  'INTENSITY': 2.83
}
```

### Affect
Range: 1 = very negative, 5 = neutral, 9 = very positive.

### Intensity
Range: 1 = neutral/objective, to 9 = very high intensity.

### Errors or No Matches
If there is no input string or no matches in the lexicon, affectimo will return null

## Acknowledgements

### References
Sedoc J., Preotiuc-Pietro D. & Ungar, L. (2017). Predicting Emotional Word Ratings using Distributional Representations and Signed Clustering. Proceedings of the 14th Conference of the European Chapter of the Association for Computational Linguistics, EACL.

### Lexicon
Using the affect/intensity lexicon data from http://www.wwbp.org/lexica.html

Used under the [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)

# Licence
(C) 2017 [P. Hughes](www.phugh.es)

[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
