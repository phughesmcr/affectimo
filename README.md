# affectimo

Analyse the affect (sentiment / valence) and intensity (arousal) of a string.

## Usage
```Javascript
const affectimo = require('affectimo');
const text = "A big long string of text...";
const opts = {
  'threshold': -0.98
  'bigrams': true,
  'trigrams': true
}
const affect = affectimo(text, opts);
console.log(affect)
```

## Options (opts)

### 'threshold'
Lexical weights run from a maximum of 0.91 to a minimum of -0.98
therefore a "threshold" value of -0.98 will include all words in the lexicon


### 'bigrams' and 'trigrams'
The lexicon includes bigrams and trigrams, however we recommend you disable these for long strings

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
If there is no input string, affectimo will return null

If there are no lexicon matches {'AFFECT': 0, 'INTENSITY': 0} will be returned

## Acknowledgements

### References
Sedoc J., Preotiuc-Pietro D. & Ungar, L. (2017). Predicting Emotional Word Ratings using Distributional Representations and Signed Clustering. Proceedings of the 14th Conference of the European Chapter of the Association for Computational Linguistics, EACL.

### Lexicon
Using the affect/intensity lexicon data from http://www.wwbp.org/lexica.html

Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence

# Licence
(C) 2017 [P. Hughes](www.phugh.es)

[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
